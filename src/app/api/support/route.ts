import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, issue } = await request.json();

    if (!name || !email || !issue) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // In a real application, you would send an email here
    // For now, we'll log the support request
    const supportRequest = {
      timestamp: new Date().toISOString(),
      user: {
        id: session.user.id,
        name: name,
        email: email,
        role: session.user.role,
        pharmacies: session.user.pharmacies?.map(p => p.name).join(', ') || 'None'
      },
      issue: issue,
      adminEmail: 'admin@georgiesrx.com'
    };

    console.log('📧 Support Request Submitted:');
    console.log('='.repeat(50));
    console.log(`To: admin@georgiesrx.com`);
    console.log(`From: ${email}`);
    console.log(`Subject: TempRx360 Support Request from ${name}`);
    console.log('');
    console.log('Support Request Details:');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Role: ${session.user.role}`);
    console.log(`Pharmacies: ${supportRequest.user.pharmacies}`);
    console.log(`Submitted: ${new Date().toLocaleString()}`);
    console.log('');
    console.log('Issue Description:');
    console.log(issue);
    console.log('='.repeat(50));

    // TODO: Replace with actual email sending service
    // Example with a service like SendGrid, Nodemailer, etc.:
    /*
    await sendEmail({
      to: 'admin@georgiesrx.com',
      from: 'noreply@temprx360.com',
      subject: `TempRx360 Support Request from ${name}`,
      html: `
        <h2>Support Request from TempRx360</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Role:</strong> ${session.user.role}</p>
        <p><strong>Pharmacies:</strong> ${supportRequest.user.pharmacies}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        
        <h3>Issue Description:</h3>
        <p>${issue.replace(/\n/g, '<br>')}</p>
        
        <hr>
        <p><small>This request was submitted through the TempRx360 dashboard.</small></p>
      `
    });
    */

    return NextResponse.json({ 
      message: 'Support request submitted successfully',
      requestId: `SR-${Date.now()}` // Simple request ID for tracking
    });

  } catch (error) {
    console.error('Failed to submit support request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
