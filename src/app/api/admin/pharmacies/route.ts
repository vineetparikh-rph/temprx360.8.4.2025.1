// src/app/api/admin/pharmacies/route.ts - Updated
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

// GET - Fetch all pharmacies
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const pharmacies = await prisma.pharmacy.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            userPharmacies: true,
            sensorAssignments: true
          }
        }
      }
    });

    return NextResponse.json({
      pharmacies,
      totalCount: pharmacies.length
    });

  } catch (error) {
    console.error('Pharmacies API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pharmacies: ' + error.message }, 
      { status: 500 }
    );
  }
}

// POST - Create new pharmacy
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.code) {
      return NextResponse.json({ 
        error: 'Name and code are required' 
      }, { status: 400 });
    }

    // Check if code already exists
    const existingPharmacy = await prisma.pharmacy.findUnique({
      where: { code: data.code }
    });

    if (existingPharmacy) {
      return NextResponse.json({ 
        error: 'Pharmacy code already exists' 
      }, { status: 400 });
    }

    const pharmacy = await prisma.pharmacy.create({
      data: {
        name: data.name,
        code: data.code,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
        phone: data.phone || null,
        fax: data.fax || null,
        email: data.email || null,
        npi: data.npi || null,
        ncpdp: data.ncpdp || null,
        dea: data.dea || null,
        licenseNumber: data.licenseNumber || null,
        pharmacistInCharge: data.pharmacistInCharge || null,
        picLicense: data.picLicense || null,
        picPhone: data.picPhone || null,
        picEmail: data.picEmail || null,
        isActive: true
      }
    });

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_PHARMACY',
        resource: `pharmacy:${pharmacy.id}`,
        metadata: JSON.stringify({
          pharmacyName: pharmacy.name,
          pharmacyCode: pharmacy.code
        })
      }
    });

    return NextResponse.json({
      pharmacy,
      message: `Pharmacy "${pharmacy.name}" created successfully`
    });

  } catch (error) {
    console.error('Pharmacy creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create pharmacy: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT - Update pharmacy
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ 
        error: 'Pharmacy ID is required' 
      }, { status: 400 });
    }

    const pharmacy = await prisma.pharmacy.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_PHARMACY',
        resource: `pharmacy:${pharmacy.id}`,
        metadata: JSON.stringify({
          pharmacyName: pharmacy.name,
          updatedFields: Object.keys(updateData)
        })
      }
    });

    return NextResponse.json({
      pharmacy,
      message: `Pharmacy "${pharmacy.name}" updated successfully`
    });

  } catch (error) {
    console.error('Pharmacy update error:', error);
    return NextResponse.json(
      { error: 'Failed to update pharmacy: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete pharmacy
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'Pharmacy ID is required' 
      }, { status: 400 });
    }

    // Check if pharmacy has dependencies
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userPharmacies: true,
            sensorAssignments: true
          }
        }
      }
    });

    if (!pharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 });
    }

    if (pharmacy._count.userPharmacies > 0 || pharmacy._count.sensorAssignments > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete pharmacy with existing users or sensor assignments' 
      }, { status: 400 });
    }

    await prisma.pharmacy.delete({
      where: { id }
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_PHARMACY',
        resource: `pharmacy:${id}`,
        metadata: JSON.stringify({
          pharmacyName: pharmacy.name,
          pharmacyCode: pharmacy.code
        })
      }
    });

    return NextResponse.json({
      message: `Pharmacy "${pharmacy.name}" deleted successfully`
    });

  } catch (error) {
    console.error('Pharmacy deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete pharmacy: ' + error.message },
      { status: 500 }
    );
  }
}