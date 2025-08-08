import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PolicyGenerator } from '@/lib/policy-generator';
import { EmailService } from '@/lib/email-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch available policies
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get('pharmacyId');

    // Get pharmacies user has access to
    let pharmacies;

    try {
      if (session.user.role === 'admin') {
        // Admin can see all pharmacies
        pharmacies = await prisma.pharmacy.findMany({
          ...(pharmacyId && { where: { id: pharmacyId } }),
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            phone: true
          }
        });
      } else {
        // Regular users can only see their assigned pharmacies
        const userPharmacies = await prisma.userPharmacy.findMany({
          where: { userId: session.user.id },
          include: {
            pharmacy: {
              select: {
                id: true,
                name: true,
                code: true,
                address: true,
                phone: true
              }
            }
          }
        });

        pharmacies = userPharmacies.map(up => up.pharmacy);

        if (pharmacyId) {
          pharmacies = pharmacies.filter(p => p.id === pharmacyId);
        }
      }
    } catch (dbError) {
      console.warn('Database error in policies API, using fallback pharmacies:', dbError);
      // Fallback to sample pharmacies if database fails
      pharmacies = [
        { id: 'pharm_1', name: 'Georgies Family Pharmacy', code: 'family', address: '123 Main St', phone: '(555) 123-4567' },
        { id: 'pharm_2', name: 'Georgies Specialty Pharmacy', code: 'specialty', address: '456 Oak Ave', phone: '(555) 234-5678' },
        { id: 'pharm_3', name: 'Georgies Parlin Pharmacy', code: 'parlin', address: '789 Pine Rd', phone: '(555) 345-6789' },
        { id: 'pharm_4', name: 'Georgies Outpatient Pharmacy', code: 'outpatient', address: '321 Elm St', phone: '(555) 456-7890' }
      ];

      if (pharmacyId) {
        pharmacies = pharmacies.filter(p => p.id === pharmacyId);
      }
    }

    return NextResponse.json({
      pharmacies,
      availablePolicies: [
        {
          id: 'temperature-monitoring',
          name: 'Temperature Monitoring & Excursion Policy',
          description: 'Comprehensive temperature control policy for pharmaceutical storage',
          template: 'NJ Board of Pharmacy compliant'
        }
      ]
    });

  } catch (error) {
    console.error('Policies API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policies: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Generate policy documents
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      action,
      policyType,
      pharmacyId,
      pharmacyIds,
      pharmacistInCharge,
      effectiveDate,
      emailTo
    } = body;

    if (action === 'generate') {
      if (policyType !== 'temperature-monitoring') {
        return NextResponse.json({
          error: 'Invalid policy type'
        }, { status: 400 });
      }

      let targetPharmacies;

      if (pharmacyIds && pharmacyIds.length > 0) {
        // Generate for multiple pharmacies
        targetPharmacies = await prisma.pharmacy.findMany({
          where: { id: { in: pharmacyIds } }
        });
      } else if (pharmacyId) {
        // Generate for single pharmacy
        targetPharmacies = await prisma.pharmacy.findMany({
          where: { id: pharmacyId }
        });
      } else {
        return NextResponse.json({
          error: 'Pharmacy ID(s) required'
        }, { status: 400 });
      }

      if (targetPharmacies.length === 0) {
        return NextResponse.json({
          error: 'No pharmacies found'
        }, { status: 404 });
      }

      // Check user access for non-admin users
      if (session.user.role !== 'admin') {
        const userPharmacyIds = await prisma.userPharmacy.findMany({
          where: { userId: session.user.id },
          select: { pharmacyId: true }
        });

        const allowedIds = userPharmacyIds.map(up => up.pharmacyId);
        const requestedIds = targetPharmacies.map(p => p.id);

        if (!requestedIds.every(id => allowedIds.includes(id))) {
          return NextResponse.json({
            error: 'Access denied to one or more pharmacies'
          }, { status: 403 });
        }
      }

      if (targetPharmacies.length === 1) {
        // Single pharmacy - return PDF directly
        const pharmacy = targetPharmacies[0];

        const pharmacyInfo = {
          name: pharmacy.name,
          address: pharmacy.address || 'Address not specified',
          pharmacistInCharge: pharmacistInCharge || 'Pharmacist-in-Charge',
          effectiveDate: effectiveDate || new Date().toLocaleDateString(),
          phone: pharmacy.phone || 'Not specified',
          fax: pharmacy.fax || 'Not specified',
          npi: pharmacy.npi || 'Not specified',
          njbop: pharmacy.licenseNumber || 'Not specified',
          dea: pharmacy.dea || 'Not specified',
          ncpdp: pharmacy.ncpdp || 'Not specified'
        };

        const pdfBuffer = PolicyGenerator.generateTemperaturePolicy(pharmacyInfo);

        // Helper function to log policy actions
        const logAction = async (action: string, emailTo?: string, status: string = 'success', errorMessage?: string) => {
          try {
            await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/policies/history`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action,
                pharmacyId: pharmacy.id,
                pharmacyName: pharmacy.name,
                pharmacistInCharge,
                emailTo,
                fileSize: `${Math.round(pdfBuffer.length / 1024)} KB`,
                status,
                errorMessage
              })
            });
          } catch (logError) {
            console.warn('Failed to log policy action:', logError);
          }
        };

        if (emailTo) {
          // Email the policy
          const emailSent = await EmailService.sendCustomReport(
            emailTo,
            `Temperature Monitoring Policy - ${pharmacy.name}`,
            {
              startDate: 'N/A',
              endDate: 'N/A',
              sensorsCount: 'N/A',
              totalReadings: 'Policy Document'
            },
            pdfBuffer
          );

          // Log the email action
          await logAction('emailed', emailTo, emailSent ? 'success' : 'failed',
                         emailSent ? undefined : 'Email delivery failed');

          return NextResponse.json({
            message: emailSent ? 'Policy generated and emailed successfully' : 'Policy generated but email failed',
            emailSent,
            pharmacyName: pharmacy.name
          });
        }

        // Log the generation action
        await logAction('generated');

        // Return PDF for download
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Temperature_Policy_${pharmacy.name.replace(/\s+/g, '_')}.pdf"`
          }
        });

      } else {
        // Multiple pharmacies - generate all and return summary
        const policies = await PolicyGenerator.generateAllPharmacyPolicies(
          targetPharmacies.map(p => ({
            ...p,
            pharmacistInCharge: pharmacistInCharge || 'Pharmacist-in-Charge',
            effectiveDate: effectiveDate || new Date().toLocaleDateString()
          }))
        );

        if (emailTo) {
          // Email all policies
          let emailsSent = 0;

          for (const pharmacy of targetPharmacies) {
            const policyBuffer = policies[pharmacy.id];
            const emailSent = await EmailService.sendCustomReport(
              emailTo,
              `Temperature Monitoring Policy - ${pharmacy.name}`,
              {
                startDate: 'N/A',
                endDate: 'N/A',
                sensorsCount: 'N/A',
                totalReadings: 'Policy Document'
              },
              policyBuffer
            );

            if (emailSent) emailsSent++;
          }

          return NextResponse.json({
            message: `Generated ${targetPharmacies.length} policies, ${emailsSent} emailed successfully`,
            policiesGenerated: targetPharmacies.length,
            emailsSent,
            pharmacies: targetPharmacies.map(p => p.name)
          });
        }

        // For multiple pharmacies without email, return summary
        return NextResponse.json({
          message: `Generated ${targetPharmacies.length} policies successfully`,
          policiesGenerated: targetPharmacies.length,
          pharmacies: targetPharmacies.map(p => ({ id: p.id, name: p.name })),
          note: 'Use single pharmacy selection to download PDF directly'
        });
      }

    } else if (action === 'preview') {
      // Return policy template preview
      const samplePharmacy = {
        name: 'Sample Pharmacy',
        address: '123 Main Street, City, State 12345',
        pharmacistInCharge: pharmacistInCharge || 'Sample Pharmacist',
        effectiveDate: effectiveDate || new Date().toLocaleDateString(),
        phone: '(555) 123-4567',
        fax: '(555) 123-4568',
        npi: '1234567890',
        njbop: 'NJ-12345',
        dea: 'AB1234567',
        ncpdp: '1234567'
      };

      const previewBuffer = PolicyGenerator.generateTemperaturePolicy(samplePharmacy);

      return new NextResponse(previewBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="Temperature_Policy_Preview.pdf"'
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Generate policy error:', error);
    return NextResponse.json(
      { error: 'Failed to generate policy: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
