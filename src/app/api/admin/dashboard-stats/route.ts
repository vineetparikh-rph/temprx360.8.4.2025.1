import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get counts from database
    const [
      totalPharmacies,
      totalUsers,
      totalSensorAssignments,
      activeAlerts,
      recentReadings
    ] = await Promise.all([
      prisma.pharmacy.count(),
      prisma.user.count(),
      prisma.sensorAssignment.count({ where: { isActive: true } }),
      prisma.alert.count({ where: { isResolved: false } }),
      prisma.reading.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    // Calculate system health based on recent activity
    let systemHealth = 'Good';
    if (activeAlerts > 10) {
      systemHealth = 'Critical';
    } else if (activeAlerts > 5) {
      systemHealth = 'Warning';
    } else if (recentReadings === 0) {
      systemHealth = 'No Data';
    }

    // For now, we'll use sensor assignments as a proxy for total sensors
    // In a real implementation, this would come from SensorPush API
    const totalSensors = totalSensorAssignments;
    
    // Estimate hubs (typically 1 hub per 10-15 sensors)
    const totalHubs = Math.max(1, Math.ceil(totalSensors / 12));

    return NextResponse.json({
      totalHubs,
      totalSensors,
      totalPharmacies,
      totalUsers,
      activeAlerts,
      systemHealth,
      recentReadings,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
