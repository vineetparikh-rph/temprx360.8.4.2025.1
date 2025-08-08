import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AlertService } from '@/lib/alert-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch alerts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get('pharmacyId');
    const resolved = searchParams.get('resolved');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');

    // Build where clause
    const where: any = {};
    
    if (pharmacyId) {
      where.pharmacyId = pharmacyId;
    }
    
    if (resolved !== null) {
      where.resolved = resolved === 'true';
    }
    
    if (severity) {
      where.severity = severity;
    }
    
    if (type) {
      where.type = type;
    }

    // For non-admin users, filter by their pharmacy access
    if (session.user.role !== 'admin') {
      const userPharmacies = await prisma.userPharmacy.findMany({
        where: { userId: session.user.id },
        select: { pharmacyId: true }
      });
      
      const pharmacyIds = userPharmacies.map(up => up.pharmacyId);
      where.pharmacyId = { in: pharmacyIds };
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: [
        { resolved: 'asc' },
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Get summary statistics
    const stats = await prisma.alert.groupBy({
      by: ['severity', 'resolved'],
      where: session.user.role !== 'admin' ? {
        pharmacyId: { in: where.pharmacyId?.in || [] }
      } : {},
      _count: true
    });

    return NextResponse.json({
      alerts,
      stats,
      totalCount: alerts.length
    });

  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts: ' + (error as Error).message }, 
      { status: 500 }
    );
  }
}

// POST - Manually create an alert or trigger alert check
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...alertData } = body;

    if (action === 'check_sensors') {
      // Trigger manual sensor check
      await AlertService.checkAllSensors();
      return NextResponse.json({ message: 'Sensor check completed' });
    }

    // Create manual alert (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const alert = await prisma.alert.create({
      data: {
        sensorId: alertData.sensorId,
        pharmacyId: alertData.pharmacyId,
        type: alertData.type || 'manual',
        severity: alertData.severity || 'medium',
        message: alertData.message,
        currentValue: alertData.currentValue,
        thresholdValue: alertData.thresholdValue,
        location: alertData.location
      },
      include: {
        pharmacy: true
      }
    });

    return NextResponse.json({
      alert,
      message: 'Alert created successfully'
    });

  } catch (error) {
    console.error('Create alert error:', error);
    return NextResponse.json(
      { error: 'Failed to create alert: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Resolve an alert
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { alertId, note } = await request.json();

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    // Check if user has access to this alert
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: { pharmacy: true }
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // For non-admin users, check pharmacy access
    if (session.user.role !== 'admin') {
      const hasAccess = await prisma.userPharmacy.findFirst({
        where: {
          userId: session.user.id,
          pharmacyId: alert.pharmacyId
        }
      });

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Resolve the alert
    await AlertService.resolveAlert(alertId, session.user.id, note);

    return NextResponse.json({
      message: 'Alert resolved successfully'
    });

  } catch (error) {
    console.error('Resolve alert error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve alert: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
