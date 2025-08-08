import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PDFGenerator } from '@/lib/pdf-generator';
import { EmailService } from '@/lib/email-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch temperature readings for reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sensorIds = searchParams.get('sensorIds')?.split(',') || [];
    const pharmacyId = searchParams.get('pharmacyId');

    if (!startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Start date and end date are required' 
      }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      timestamp: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    if (sensorIds.length > 0) {
      where.sensorId = { in: sensorIds };
    }

    // For non-admin users, filter by their pharmacy access
    if (session.user.role !== 'admin') {
      const userPharmacies = await prisma.userPharmacy.findMany({
        where: { userId: session.user.id },
        select: { pharmacyId: true }
      });
      
      const pharmacyIds = userPharmacies.map(up => up.pharmacyId);
      
      // Get sensor assignments for user's pharmacies
      const assignments = await prisma.sensorAssignment.findMany({
        where: { pharmacyId: { in: pharmacyIds } },
        select: { sensorPushId: true }
      });
      
      const allowedSensorIds = assignments.map(a => a.sensorPushId);
      
      if (sensorIds.length > 0) {
        where.sensorId = { in: sensorIds.filter(id => allowedSensorIds.includes(id)) };
      } else {
        where.sensorId = { in: allowedSensorIds };
      }
    }

    // Get readings
    const readings = await prisma.reading.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: 10000 // Limit to prevent memory issues
    });

    // Get sensor assignments for additional info
    const sensorAssignments = await prisma.sensorAssignment.findMany({
      where: sensorIds.length > 0 ? { sensorPushId: { in: sensorIds } } : {},
      include: {
        pharmacy: true
      }
    });

    // Enrich readings with sensor and pharmacy info
    const enrichedReadings = readings.map(reading => {
      const assignment = sensorAssignments.find(a => a.sensorPushId === reading.sensorId);
      return {
        ...reading,
        sensorName: assignment?.sensorName || reading.sensorId,
        location: assignment?.locationType || 'unknown',
        pharmacy: assignment?.pharmacy.name || 'Unknown Pharmacy'
      };
    });

    // Calculate summary statistics
    const temperatures = readings.map(r => r.temperature);
    const summary = {
      totalReadings: readings.length,
      averageTemp: temperatures.length > 0 ? temperatures.reduce((a, b) => a + b, 0) / temperatures.length : 0,
      minTemp: temperatures.length > 0 ? Math.min(...temperatures) : 0,
      maxTemp: temperatures.length > 0 ? Math.max(...temperatures) : 0,
      alertsCount: 0, // Will be calculated separately
      compliancePercentage: 95 // Placeholder - would be calculated based on thresholds
    };

    // Get alerts for the same period
    const alerts = await prisma.alert.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        ...(sensorIds.length > 0 && { sensorId: { in: sensorIds } })
      }
    });

    summary.alertsCount = alerts.length;

    return NextResponse.json({
      readings: enrichedReadings,
      summary,
      alerts,
      sensorAssignments
    });

  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report data: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Generate and optionally email reports
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      action,
      startDate,
      endDate,
      sensorIds,
      reportTitle,
      format,
      emailTo,
      reportType
    } = body;

    if (action === 'generate') {
      // Get report data using the same logic as GET
      const searchParams = new URLSearchParams({
        startDate,
        endDate,
        ...(sensorIds && { sensorIds: sensorIds.join(',') })
      });

      // Fetch data (reuse GET logic)
      const reportResponse = await fetch(`${request.url}?${searchParams}`, {
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Cookie': request.headers.get('Cookie') || ''
        }
      });

      if (!reportResponse.ok) {
        throw new Error('Failed to fetch report data');
      }

      const reportData = await reportResponse.json();

      // Prepare data for PDF/CSV generation
      const formattedData = {
        title: reportTitle || 'Temperature Report',
        pharmacyName: reportData.sensorAssignments[0]?.pharmacy?.name || 'Multiple Pharmacies',
        startDate,
        endDate,
        readings: reportData.readings,
        summary: reportData.summary
      };

      let pdfBuffer: Buffer | undefined;
      let csvBuffer: Buffer | undefined;

      // Generate PDF if requested
      if (format === 'pdf' || format === 'both') {
        if (reportType === 'monthly') {
          pdfBuffer = PDFGenerator.generateMonthlyReport(formattedData);
        } else {
          pdfBuffer = PDFGenerator.generateCustomReport(formattedData);
        }
      }

      // Generate CSV if requested
      if (format === 'csv' || format === 'both') {
        csvBuffer = PDFGenerator.generateCSV(formattedData);
      }

      // Email if requested
      if (emailTo) {
        let emailSent = false;

        if (reportType === 'monthly') {
          emailSent = await EmailService.sendMonthlyReport(
            emailTo,
            formattedData.pharmacyName,
            formattedData.summary,
            pdfBuffer!
          );
        } else {
          emailSent = await EmailService.sendCustomReport(
            emailTo,
            formattedData.title,
            {
              startDate,
              endDate,
              sensorsCount: sensorIds?.length || 'All',
              totalReadings: formattedData.summary.totalReadings
            },
            pdfBuffer,
            csvBuffer
          );
        }

        return NextResponse.json({
          message: emailSent ? 'Report generated and emailed successfully' : 'Report generated but email failed',
          emailSent,
          reportData: formattedData.summary
        });
      }

      // Return file data for download
      const response = NextResponse.json({
        message: 'Report generated successfully',
        reportData: formattedData.summary
      });

      if (pdfBuffer && format === 'pdf') {
        response.headers.set('Content-Type', 'application/pdf');
        response.headers.set('Content-Disposition', `attachment; filename="${formattedData.title.replace(/\s+/g, '_')}.pdf"`);
        return new NextResponse(pdfBuffer, {
          headers: response.headers
        });
      }

      if (csvBuffer && format === 'csv') {
        response.headers.set('Content-Type', 'text/csv');
        response.headers.set('Content-Disposition', `attachment; filename="${formattedData.title.replace(/\s+/g, '_')}.csv"`);
        return new NextResponse(csvBuffer, {
          headers: response.headers
        });
      }

      return response;

    } else if (action === 'monthly_auto') {
      // Generate and email monthly reports automatically
      await generateMonthlyReports();

      return NextResponse.json({
        message: 'Monthly reports generated and sent successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// Helper function to generate monthly reports for all pharmacies
async function generateMonthlyReports(): Promise<void> {
  const pharmacies = await prisma.pharmacy.findMany({
    include: {
      userPharmacies: {
        include: {
          user: true
        }
      },
      sensorAssignments: true
    }
  });

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

  for (const pharmacy of pharmacies) {
    if (pharmacy.sensorAssignments.length === 0) continue;

    // Get 10 AM and 5 PM readings for the month
    const readings = await prisma.reading.findMany({
      where: {
        sensorId: { in: pharmacy.sensorAssignments.map(a => a.sensorPushId) },
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        OR: [
          { timestamp: { gte: new Date(0, 0, 0, 10, 0) } }, // 10 AM
          { timestamp: { gte: new Date(0, 0, 0, 17, 0) } }  // 5 PM
        ]
      },
      orderBy: { timestamp: 'asc' }
    });

    if (readings.length === 0) continue;

    // Calculate summary
    const temperatures = readings.map(r => r.temperature);
    const summary = {
      totalReadings: readings.length,
      averageTemp: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
      minTemp: Math.min(...temperatures),
      maxTemp: Math.max(...temperatures),
      alertsCount: 0,
      compliancePercentage: 95
    };

    // Prepare report data
    const reportData = {
      title: 'Monthly Compliance Report',
      pharmacyName: pharmacy.name,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      readings: readings.map(r => ({
        timestamp: r.timestamp.toISOString(),
        temperature: r.temperature,
        humidity: r.humidity,
        sensorName: pharmacy.sensorAssignments.find(a => a.sensorPushId === r.sensorId)?.sensorName || r.sensorId,
        location: pharmacy.sensorAssignments.find(a => a.sensorPushId === r.sensorId)?.locationType || 'unknown',
        pharmacy: pharmacy.name
      })),
      summary
    };

    // Generate PDF
    const pdfBuffer = PDFGenerator.generateMonthlyReport(reportData);

    // Email to all users with access to this pharmacy
    for (const userPharmacy of pharmacy.userPharmacies) {
      await EmailService.sendMonthlyReport(
        userPharmacy.user.email,
        pharmacy.name,
        summary,
        pdfBuffer
      );
    }
  }
}
