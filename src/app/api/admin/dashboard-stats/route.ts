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

    // Get counts from database using your actual schema
    const [
      totalPharmacies,
      totalUsers,
      totalGateways,
      totalSensors,
      connectedGateways
    ] = await Promise.all([
      prisma.pharmacy.count(),
      prisma.user.count(),
      prisma.gateway.count(),
      prisma.sensor.count(),
      prisma.gateway.count({
        where: {
          lastSeen: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Connected in last 24 hours
          }
        }
      })
    ]);

    // Calculate system health based on gateway connectivity
    let systemHealth = 'Good';
    const connectivityRatio = totalGateways > 0 ? connectedGateways / totalGateways : 0;
    
    if (connectivityRatio < 0.5) {
      systemHealth = 'Critical';
    } else if (connectivityRatio < 0.8) {
      systemHealth = 'Warning';
    } else if (totalSensors === 0) {
      systemHealth = 'No Data';
    }

    // For compatibility with your dashboard, use gateways as "hubs"
    const totalHubs = totalGateways;
    const connectedHubs = connectedGateways;

    return NextResponse.json({
      totalHubs,
      totalSensors,
      totalPharmacies,
      totalUsers,
      connectedHubs,
      systemHealth,
      lastUpdated: new Date().toISOString(),
      // Additional stats for detailed views
      stats: {
        gateways: {
          total: totalGateways,
          connected: connectedGateways,
          offline: totalGateways - connectedGateways
        },
        sensors: {
          total: totalSensors,
          // Could add sensor-specific stats here
        }
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats: ' + (error as Error).message },
      { status: 500 }
    );
  }
}