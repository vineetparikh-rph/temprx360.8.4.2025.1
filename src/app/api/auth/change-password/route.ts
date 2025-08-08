import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || !user.hashedPassword) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json({ 
        error: 'New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' 
      }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and mark as no longer requiring password change
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        hashedPassword: hashedNewPassword,
        mustChangePassword: false
      }
    });

    return NextResponse.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Failed to change password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
