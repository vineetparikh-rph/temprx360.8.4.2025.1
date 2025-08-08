// src/app/api/admin/pharmacies/route.ts - Fixed
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
            gateways: true
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
        email: data.email || null,
        faxNumber: data.faxNumber || null,
        licenseNumber: data.licenseNumber || null,
        deaNumber: data.deaNumber || null,
        npiNumber: data.npiNumber || null,
        ncpdpNumber: data.ncpdpNumber || null,
        ownerName: data.ownerName || null
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
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            userPharmacies: true,
            gateways: true
          }
        }
      }
    });

    if (!pharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 });
    }

    if (pharmacy._count.userPharmacies > 0 || pharmacy._count.gateways > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete pharmacy with existing users or gateways' 
      }, { status: 400 });
    }

    await prisma.pharmacy.delete({
      where: { id: parseInt(id) }
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