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

    // Get report history from database
    // For now, we'll return sample data since we don't have a report history table yet
    const sampleHistory = [
      {
        id: 'report_1',
        reportType: 'daily',
        action: 'generated',
        pharmacyName: 'Georgies Family Pharmacy',
        pharmacyId: 'pharm_1',
        dateRange: '2024-01-15 - 2024-01-21',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: '345 KB',
        status: 'success'
      },
      {
        id: 'report_2',
        reportType: 'compliance',
        action: 'emailed',
        pharmacyName: 'Georgies Specialty Pharmacy',
        pharmacyId: 'pharm_2',
        dateRange: '2024-01-10 - 2024-01-16',
        emailTo: 'manager@georgiesrx.com',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: '278 KB',
        status: 'success'
      },
      {
        id: 'report_3',
        reportType: 'daily',
        action: 'generated',
        pharmacyName: 'Georgies Parlin Pharmacy',
        pharmacyId: 'pharm_3',
        dateRange: '2024-01-08 - 2024-01-14',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: '412 KB',
        status: 'success'
      },
      {
        id: 'report_4',
        reportType: 'compliance',
        action: 'emailed',
        pharmacyName: 'Georgies Outpatient Pharmacy',
        pharmacyId: 'pharm_4',
        dateRange: '2024-01-05 - 2024-01-11',
        emailTo: 'compliance@georgiesrx.com',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: '298 KB',
        status: 'failed',
        errorMessage: 'Email delivery failed - invalid address'
      },
      {
        id: 'report_5',
        reportType: 'daily',
        action: 'generated',
        pharmacyName: 'Georgies Family Pharmacy',
        pharmacyId: 'pharm_1',
        dateRange: '2024-01-01 - 2024-01-07',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: '389 KB',
        status: 'success'
      },
      {
        id: 'report_6',
        reportType: 'compliance',
        action: 'generated',
        pharmacyName: 'Georgies Specialty Pharmacy',
        pharmacyId: 'pharm_2',
        dateRange: '2023-12-25 - 2023-12-31',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: '256 KB',
        status: 'success'
      }
    ];

    return NextResponse.json({
      history: sampleHistory,
      totalCount: sampleHistory.length,
      dailyReports: sampleHistory.filter(h => h.reportType === 'daily').length,
      complianceReports: sampleHistory.filter(h => h.reportType === 'compliance').length,
      generatedCount: sampleHistory.filter(h => h.action === 'generated').length,
      emailedCount: sampleHistory.filter(h => h.action === 'emailed').length,
      successCount: sampleHistory.filter(h => h.status === 'success').length,
      failedCount: sampleHistory.filter(h => h.status === 'failed').length
    });

  } catch (error) {
    console.error('Report history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report history: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Log a new report action (generated or emailed)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { reportType, action, pharmacyId, pharmacyName, dateRange, emailTo, fileSize, status, errorMessage } = await request.json();

    if (!reportType || !action || !pharmacyId || !pharmacyName || !dateRange) {
      return NextResponse.json({ 
        error: 'Missing required fields: reportType, action, pharmacyId, pharmacyName, dateRange' 
      }, { status: 400 });
    }

    // In a real implementation, this would save to a ReportHistory table
    // For now, we'll just return success
    const historyEntry = {
      id: `report_${Date.now()}`,
      reportType,
      action,
      pharmacyId,
      pharmacyName,
      dateRange,
      emailTo,
      timestamp: new Date().toISOString(),
      fileSize,
      status: status || 'success',
      errorMessage,
      userId: session.user.id
    };

    return NextResponse.json({
      message: 'Report action logged successfully',
      entry: historyEntry
    });

  } catch (error) {
    console.error('Log report action error:', error);
    return NextResponse.json(
      { error: 'Failed to log report action: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
