import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { EmailService } from '@/lib/email-service';

// POST - Test email configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { testEmail } = await request.json();

    if (!testEmail) {
      return NextResponse.json({ 
        error: 'Test email address is required' 
      }, { status: 400 });
    }

    // Test SMTP configuration
    const configValid = await EmailService.testEmailConfig();
    
    if (!configValid) {
      return NextResponse.json({
        success: false,
        message: 'SMTP configuration test failed',
        configValid: false
      });
    }

    // Send test email
    const emailSent = await EmailService.sendTestEmail(testEmail);

    return NextResponse.json({
      success: emailSent,
      message: emailSent 
        ? 'Test email sent successfully! Check your inbox.' 
        : 'Failed to send test email. Check server logs for details.',
      configValid: true,
      emailSent
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test email: ' + (error as Error).message,
        configValid: false,
        emailSent: false
      },
      { status: 500 }
    );
  }
}

// GET - Get email configuration status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const hasSmtpConfig = !!(
      process.env.SMTP_HOST && 
      process.env.SMTP_USER && 
      process.env.SMTP_PASS
    );

    const configStatus = {
      configured: hasSmtpConfig,
      host: process.env.SMTP_HOST || 'Not configured',
      port: process.env.SMTP_PORT || 'Not configured',
      user: process.env.SMTP_USER || 'Not configured',
      from: process.env.SMTP_FROM || 'Not configured',
      secure: process.env.SMTP_SECURE === 'true'
    };

    if (hasSmtpConfig) {
      // Test the configuration
      const configValid = await EmailService.testEmailConfig();
      
      return NextResponse.json({
        ...configStatus,
        status: configValid ? 'Connected' : 'Connection Failed',
        ready: configValid
      });
    } else {
      return NextResponse.json({
        ...configStatus,
        status: 'Not Configured',
        ready: false,
        message: 'SMTP credentials not found in environment variables'
      });
    }

  } catch (error) {
    console.error('Email config status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get email config status: ' + (error as Error).message,
        configured: false,
        ready: false
      },
      { status: 500 }
    );
  }
}
