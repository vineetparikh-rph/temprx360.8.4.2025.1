import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { runMonthlyReports, testMonthlyReports } from '@/lib/scheduler';

// POST - Trigger monthly reports
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { type } = await request.json();

    if (type === 'test') {
      // Test monthly reports with current month data
      await testMonthlyReports();
      
      return NextResponse.json({
        message: 'Test monthly reports sent successfully',
        type: 'test'
      });
      
    } else if (type === 'production') {
      // Send actual monthly reports for last month
      await runMonthlyReports();
      
      return NextResponse.json({
        message: 'Monthly reports sent successfully',
        type: 'production'
      });
      
    } else {
      return NextResponse.json({ 
        error: 'Invalid type. Use "test" or "production"' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Monthly reports error:', error);
    return NextResponse.json(
      { error: 'Failed to send monthly reports: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// GET - Get monthly reports status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // This would typically check the last run time from a database or log
    // For now, we'll return basic information
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextRun = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return NextResponse.json({
      status: 'configured',
      lastReportPeriod: {
        start: lastMonth.toISOString().split('T')[0],
        end: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      },
      nextScheduledRun: nextRun.toISOString().split('T')[0],
      description: 'Monthly reports are sent on the 1st of each month for the previous month'
    });

  } catch (error) {
    console.error('Monthly reports status error:', error);
    return NextResponse.json(
      { error: 'Failed to get status: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
