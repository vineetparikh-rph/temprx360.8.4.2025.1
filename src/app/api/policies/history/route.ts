import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get policy history from database
    // For now, we'll return sample data since we don't have a policy history table yet
    const sampleHistory = [
      {
        id: 'hist_1',
        action: 'generated',
        pharmacyName: 'St. George\'s Family Pharmacy',
        pharmacyId: 'pharm_1',
        pharmacistInCharge: 'John Smith, PharmD',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: '245 KB',
        status: 'success'
      },
      {
        id: 'hist_2',
        action: 'emailed',
        pharmacyName: 'St. George\'s Specialty Pharmacy',
        pharmacyId: 'pharm_2',
        pharmacistInCharge: 'Sarah Johnson, PharmD',
        emailTo: 'sarah.johnson@georgiesrx.com',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: '248 KB',
        status: 'success'
      },
      {
        id: 'hist_3',
        action: 'generated',
        pharmacyName: 'St. George\'s Parlin Pharmacy',
        pharmacyId: 'pharm_3',
        pharmacistInCharge: 'Michael Brown, PharmD',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: '243 KB',
        status: 'success'
      },
      {
        id: 'hist_4',
        action: 'emailed',
        pharmacyName: 'St. George\'s Outpatient Pharmacy',
        pharmacyId: 'pharm_4',
        pharmacistInCharge: 'Lisa Davis, PharmD',
        emailTo: 'lisa.davis@georgiesrx.com',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: '250 KB',
        status: 'failed',
        errorMessage: 'Email delivery failed - invalid address'
      },
      {
        id: 'hist_5',
        action: 'generated',
        pharmacyName: 'St. George\'s Family Pharmacy',
        pharmacyId: 'pharm_1',
        pharmacistInCharge: 'John Smith, PharmD',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: '244 KB',
        status: 'success'
      }
    ];

    return NextResponse.json({
      history: sampleHistory,
      totalCount: sampleHistory.length,
      generatedCount: sampleHistory.filter(h => h.action === 'generated').length,
      emailedCount: sampleHistory.filter(h => h.action === 'emailed').length,
      successCount: sampleHistory.filter(h => h.status === 'success').length,
      failedCount: sampleHistory.filter(h => h.status === 'failed').length
    });

  } catch (error) {
    console.error('Policy history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policy history: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Log a new policy action (generated or emailed)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { action, pharmacyId, pharmacyName, pharmacistInCharge, emailTo, fileSize, status, errorMessage } = await request.json();

    if (!action || !pharmacyId || !pharmacyName || !pharmacistInCharge) {
      return NextResponse.json({ 
        error: 'Missing required fields: action, pharmacyId, pharmacyName, pharmacistInCharge' 
      }, { status: 400 });
    }

    // In a real implementation, this would save to a PolicyHistory table
    // For now, we'll just return success
    const historyEntry = {
      id: `hist_${Date.now()}`,
      action,
      pharmacyId,
      pharmacyName,
      pharmacistInCharge,
      emailTo,
      timestamp: new Date().toISOString(),
      fileSize,
      status: status || 'success',
      errorMessage,
      userId: session.user.id
    };

    return NextResponse.json({
      message: 'Policy action logged successfully',
      entry: historyEntry
    });

  } catch (error) {
    console.error('Log policy action error:', error);
    return NextResponse.json(
      { error: 'Failed to log policy action: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
