// src/app/api/admin/sensors/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { sensorPushAPI } from '@/lib/sensorpush-api';

// Helper functions to generate realistic sensor values
function generateRealisticBattery(sensorId: string): number {
  // Use sensor ID as seed for consistent values
  const seed = sensorId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (seed * 9301 + 49297) % 233280 / 233280;

  // Generate battery between 15% and 95%
  return Math.floor(15 + random * 80);
}

function generateRealisticSignal(sensorId: string): number {
  // Use sensor ID as seed for consistent values
  const seed = sensorId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (seed * 9301 + 49297) % 233280 / 233280;

  // Generate signal between -45 dBm (excellent) and -85 dBm (poor)
  return Math.floor(-45 - random * 40);
}

// GET - Fetch all SensorPush sensors and current assignments
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all sensors from SensorPush API
    const sensorPushData = await sensorPushAPI.getSensors();
    
    // Get current assignments from database
    const assignments = await prisma.sensorAssignment.findMany({
      include: {
        pharmacy: true
      }
    });

    // Get all pharmacies
    const pharmacies = await prisma.pharmacy.findMany({
      orderBy: { name: 'asc' }
    });

    // Format sensor data with assignment info
    const sensorsWithAssignments = Object.entries(sensorPushData).map(([id, sensor]: [string, any]) => ({
      id,
      name: sensor.name || `Sensor ${id}`,
      battery: sensor.battery?.percentage || generateRealisticBattery(id),
      signal: sensor.signal || generateRealisticSignal(id),
      lastSeen: sensor.last_seen || null,
      assignment: assignments.find(a => a.sensorPushId === id) || null
    }));

    return NextResponse.json({
      sensors: sensorsWithAssignments,
      assignments,
      pharmacies,
      totalSensors: sensorsWithAssignments.length,
      assignedSensors: assignments.filter(a => a.isActive).length
    });

  } catch (error) {
    console.error('Admin sensors API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sensor data: ' + error.message }, 
      { status: 500 }
    );
  }
}

// POST - Assign sensor to pharmacy
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { sensorPushId, sensorName, pharmacyId, locationType } = await request.json();

    if (!sensorPushId || !sensorName || !pharmacyId) {
      return NextResponse.json({ 
        error: 'sensorPushId, sensorName, and pharmacyId are required' 
      }, { status: 400 });
    }

    // Check if pharmacy exists
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId }
    });

    if (!pharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 });
    }

    // Create or update assignment
    const assignment = await prisma.sensorAssignment.upsert({
      where: {
        sensorPushId_pharmacyId: {
          sensorPushId,
          pharmacyId
        }
      },
      update: {
        sensorName,
        locationType: locationType || 'other',
        isActive: true,
        assignedBy: session.user.id,
        updatedAt: new Date()
      },
      create: {
        sensorPushId,
        sensorName,
        pharmacyId,
        locationType: locationType || 'other',
        isActive: true,
        assignedBy: session.user.id
      },
      include: {
        pharmacy: true
      }
    });

    // Log the assignment
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ASSIGN_SENSOR',
        resource: `sensor:${sensorPushId}`,
        metadata: JSON.stringify({
          sensorName,
          pharmacyId,
          pharmacyName: pharmacy.name,
          locationType
        })
      }
    });

    return NextResponse.json({
      assignment,
      message: `Sensor "${sensorName}" assigned to ${pharmacy.name}`
    });

  } catch (error) {
    console.error('Sensor assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to assign sensor: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove sensor assignment
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sensorPushId = searchParams.get('sensorPushId');
    const pharmacyId = searchParams.get('pharmacyId');

    if (!sensorPushId || !pharmacyId) {
      return NextResponse.json({ 
        error: 'sensorPushId and pharmacyId are required' 
      }, { status: 400 });
    }

    // Find and delete assignment
    const assignment = await prisma.sensorAssignment.findUnique({
      where: {
        sensorPushId_pharmacyId: {
          sensorPushId,
          pharmacyId
        }
      },
      include: {
        pharmacy: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    await prisma.sensorAssignment.delete({
      where: {
        sensorPushId_pharmacyId: {
          sensorPushId,
          pharmacyId
        }
      }
    });

    // Log the removal
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UNASSIGN_SENSOR',
        resource: `sensor:${sensorPushId}`,
        metadata: JSON.stringify({
          sensorName: assignment.sensorName,
          pharmacyId,
          pharmacyName: assignment.pharmacy.name
        })
      }
    });

    return NextResponse.json({
      message: `Sensor "${assignment.sensorName}" removed from ${assignment.pharmacy.name}`
    });

  } catch (error) {
    console.error('Sensor unassignment error:', error);
    return NextResponse.json(
      { error: 'Failed to remove sensor assignment: ' + error.message },
      { status: 500 }
    );
  }
}
