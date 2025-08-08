// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Fetch all users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        userPharmacies: {
          include: {
            pharmacy: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const pharmacies = await prisma.pharmacy.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      users,
      pharmacies,
      totalCount: users.length
    });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users: ' + error.message }, 
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.email || !data.name || !data.password || !data.role) {
      return NextResponse.json({ 
        error: 'Email, name, password, and role are required' 
      }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        hashedPassword: hashedPassword
      }
    });

    // Create pharmacy assignments if provided
    if (data.pharmacyIds && data.pharmacyIds.length > 0) {
      const pharmacyAssignments = data.pharmacyIds.map((pharmacyId: string) => ({
        userId: user.id,
        pharmacyId: pharmacyId
      }));

      await prisma.userPharmacy.createMany({
        data: pharmacyAssignments
      });
    }

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_USER',
        resource: `user:${user.id}`,
        metadata: JSON.stringify({
          userEmail: user.email,
          userName: user.name,
          userRole: user.role,
          pharmacyCount: data.pharmacyIds?.length || 0
        })
      }
    });

    return NextResponse.json({
      user: {
        ...user,
        hashedPassword: undefined // Don't return password hash
      },
      message: `User "${user.name}" created successfully`
    });

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create user: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const data = await request.json();
    const { id, pharmacyIds, password, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Prepare update data
    const userUpdateData: any = { ...updateData };
    
    // Hash new password if provided
    if (password) {
      userUpdateData.hashedPassword = await bcrypt.hash(password, 12);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: userUpdateData
    });

    // Update pharmacy assignments if provided
    if (pharmacyIds !== undefined) {
      // Remove existing assignments
      await prisma.userPharmacy.deleteMany({
        where: { userId: id }
      });

      // Create new assignments
      if (pharmacyIds.length > 0) {
        const pharmacyAssignments = pharmacyIds.map((pharmacyId: string) => ({
          userId: id,
          pharmacyId: pharmacyId
        }));

        await prisma.userPharmacy.createMany({
          data: pharmacyAssignments
        });
      }
    }

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_USER',
        resource: `user:${user.id}`,
        metadata: JSON.stringify({
          userEmail: user.email,
          changes: updateData,
          pharmacyCount: pharmacyIds?.length || 0
        })
      }
    });

    return NextResponse.json({
      user: {
        ...user,
        hashedPassword: undefined // Don't return password hash
      },
      message: `User "${user.name}" updated successfully`
    });

  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
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
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json({ 
        error: 'Cannot delete your own account' 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (this will cascade delete pharmacy assignments)
    await prisma.user.delete({
      where: { id }
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_USER',
        resource: `user:${id}`,
        metadata: JSON.stringify({
          userEmail: user.email,
          userName: user.name,
          userRole: user.role
        })
      }
    });

    return NextResponse.json({
      message: `User "${user.name}" deleted successfully`
    });

  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user: ' + error.message },
      { status: 500 }
    );
  }
}
