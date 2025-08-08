import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({ 
        message: 'If an account with that email exists, we have sent a password reset link.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // In a real application, you would send an email here
    // For now, we'll just log the reset link
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    console.log('🔐 Password Reset Request');
    console.log(`📧 Email: ${email}`);
    console.log(`🔗 Reset Link: ${resetUrl}`);
    console.log('⏰ Expires: 1 hour from now');
    console.log('📝 In production, this would be sent via email');

    // TODO: Replace with actual email sending service
    // await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.',
      // In development, include the reset link for testing
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });

  } catch (error) {
    console.error('Failed to process forgot password request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
