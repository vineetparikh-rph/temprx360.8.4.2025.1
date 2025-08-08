import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { HistoricalDataGenerator } from '@/lib/historical-data-generator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Generate historical data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { type } = await request.json();

    if (type === 'sample') {
      // Generate sample data (last 7 days)
      await HistoricalDataGenerator.generateSampleData();
      
      return NextResponse.json({
        message: 'Sample data generated successfully',
        type: 'sample',
        period: 'Last 7 days'
      });
      
    } else if (type === 'full') {
      // Generate full historical data (2019 onwards)
      await HistoricalDataGenerator.generateHistoricalData();
      
      return NextResponse.json({
        message: 'Full historical data generated successfully',
        type: 'full',
        period: '2019 onwards'
      });
      
    } else {
      return NextResponse.json({ 
        error: 'Invalid type. Use "sample" or "full"' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Data generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate data: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// GET - Get data generation status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get statistics about existing data
    const readingStats = await prisma.reading.groupBy({
      by: ['sensorId'],
      _count: true,
      _min: { timestamp: true },
      _max: { timestamp: true }
    });

    const alertStats = await prisma.alert.groupBy({
      by: ['sensorId'],
      _count: true,
      _min: { createdAt: true },
      _max: { createdAt: true }
    });

    const totalReadings = await prisma.reading.count();
    const totalAlerts = await prisma.alert.count();
    const activeAlerts = await prisma.alert.count({
      where: { resolved: false }
    });

    const oldestReading = await prisma.reading.findFirst({
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true }
    });

    const newestReading = await prisma.reading.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true }
    });

    return NextResponse.json({
      readings: {
        total: totalReadings,
        bySensor: readingStats.length,
        oldestDate: oldestReading?.timestamp,
        newestDate: newestReading?.timestamp
      },
      alerts: {
        total: totalAlerts,
        active: activeAlerts,
        resolved: totalAlerts - activeAlerts,
        bySensor: alertStats.length
      },
      dataRange: {
        start: oldestReading?.timestamp,
        end: newestReading?.timestamp,
        hasHistoricalData: oldestReading ? new Date(oldestReading.timestamp).getFullYear() <= 2019 : false
      }
    });

  } catch (error) {
    console.error('Data status error:', error);
    return NextResponse.json(
      { error: 'Failed to get data status: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Clear all generated data
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== 'true') {
      return NextResponse.json({ 
        error: 'Confirmation required. Add ?confirm=true to the URL' 
      }, { status: 400 });
    }

    // Delete all readings and alerts
    const deletedAlerts = await prisma.alert.deleteMany({});
    const deletedReadings = await prisma.reading.deleteMany({});

    return NextResponse.json({
      message: 'All generated data cleared successfully',
      deleted: {
        readings: deletedReadings.count,
        alerts: deletedAlerts.count
      }
    });

  } catch (error) {
    console.error('Data deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to clear data: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
