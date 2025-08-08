// src/app/api/admin/sensors/sync/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import SensorPushAPI from '@/lib/sensorpush-api';

// POST - Sync gateways and sensors from SensorPush API
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Create SensorPush API instance with credentials
    const sensorPushAPI = new SensorPushAPI(
      process.env.SENSORPUSH_EMAIL!,
      process.env.SENSORPUSH_PASSWORD!
    );

    // Test SensorPush connection
    try {
      await sensorPushAPI.authenticate();
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to connect to SensorPush API: ' + error.message 
      }, { status: 500 });
    }

    // Fetch data from SensorPush
    const [gatewaysData, sensorsData] = await Promise.all([
      sensorPushAPI.getGateways(),
      sensorPushAPI.getSensors()
    ]);

    let syncStats = {
      gatewaysCreated: 0,
      gatewaysUpdated: 0,
      sensorsCreated: 0,
      sensorsUpdated: 0,
      errors: []
    };

    // Process gateways - convert SensorPush object format to array
    const gateways = Object.entries(gatewaysData).map(([id, gateway]: [string, any]) => ({
      id,
      name: gateway.name || `Gateway ${id}`,
      paired: gateway.paired || false,
      last_seen: gateway.last_seen,
      version: gateway.version
    }));

    // Sync gateways to database
    for (const spGateway of gateways) {
      try {
        const existingGateway = await prisma.gateway.findUnique({
          where: { gatewayId: spGateway.id }
        });

        // Try to infer pharmacy from gateway name
        const pharmacyId = await inferPharmacyFromName(spGateway.name);

        if (existingGateway) {
          await prisma.gateway.update({
            where: { id: existingGateway.id },
            data: {
              name: spGateway.name,
              lastSeen: spGateway.last_seen ? new Date(spGateway.last_seen) : null,
              updatedAt: new Date()
            }
          });
          syncStats.gatewaysUpdated++;
        } else if (pharmacyId) {
          await prisma.gateway.create({
            data: {
              gatewayId: spGateway.id,
              name: spGateway.name,
              lastSeen: spGateway.last_seen ? new Date(spGateway.last_seen) : null,
              pharmacyId: pharmacyId
            }
          });
          syncStats.gatewaysCreated++;
        } else {
          syncStats.errors.push(`Could not determine pharmacy for gateway: ${spGateway.name}`);
        }
      } catch (error) {
        syncStats.errors.push(`Gateway ${spGateway.id}: ${error.message}`);
      }
    }

    // Process sensors - convert SensorPush object format to array
    const sensors = Object.entries(sensorsData).map(([id, sensor]: [string, any]) => ({
      id,
      name: sensor.name || `Sensor ${id}`,
      deviceId: sensor.deviceId || id,
      active: sensor.active !== false,
      battery_voltage: sensor.battery_voltage,
      last_seen: sensor.last_seen
    }));

    // Sync sensors to database
    for (const spSensor of sensors) {
      try {
        const existingSensor = await prisma.sensor.findUnique({
          where: { sensorId: spSensor.id }
        });

        // Try to find which gateway this sensor belongs to
        const gateway = await findGatewayForSensor(spSensor, gateways);
        
        if (!gateway) {
          syncStats.errors.push(`Could not determine gateway for sensor: ${spSensor.name}`);
          continue;
        }

        const dbGateway = await prisma.gateway.findUnique({
          where: { gatewayId: gateway.id }
        });

        if (!dbGateway) {
          syncStats.errors.push(`Gateway ${gateway.id} not found in database for sensor: ${spSensor.name}`);
          continue;
        }

        const sensorData = {
          sensorId: spSensor.id,
          name: spSensor.name,
          lastReadingTemperature: null, // Will be updated when readings come in
          lastReadingHumidity: null,
          lastReadingTimestamp: spSensor.last_seen ? new Date(spSensor.last_seen) : null,
          gatewayId: dbGateway.id
        };

        if (existingSensor) {
          await prisma.sensor.update({
            where: { id: existingSensor.id },
            data: {
              name: sensorData.name,
              lastReadingTimestamp: sensorData.lastReadingTimestamp,
              updatedAt: new Date()
            }
          });
          syncStats.sensorsUpdated++;
        } else {
          await prisma.sensor.create({
            data: sensorData
          });
          syncStats.sensorsCreated++;
        }
      } catch (error) {
        syncStats.errors.push(`Sensor ${spSensor.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'SensorPush sync completed successfully',
      stats: syncStats,
      summary: {
        totalGateways: gateways.length,
        totalSensors: sensors.length,
        gatewaysInDB: syncStats.gatewaysCreated + syncStats.gatewaysUpdated,
        sensorsInDB: syncStats.sensorsCreated + syncStats.sensorsUpdated
      }
    });

  } catch (error) {
    console.error('SensorPush sync error:', error);
    return NextResponse.json({
      error: 'Failed to sync SensorPush data: ' + error.message
    }, { status: 500 });
  }
}

// GET - Get sync status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [gatewayCount, sensorCount] = await Promise.all([
      prisma.gateway.count(),
      prisma.sensor.count()
    ]);

    return NextResponse.json({
      currentStats: {
        gateways: gatewayCount,
        sensors: sensorCount
      },
      lastSync: null // Can add sync tracking later if needed
    });

  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json({
      error: 'Failed to get sync status: ' + error.message
    }, { status: 500 });
  }
}

// Helper function to infer pharmacy from gateway/sensor name
async function inferPharmacyFromName(deviceName: string): Promise<number | null> {
  const name = deviceName.toLowerCase();
  
  const pharmacies = await prisma.pharmacy.findMany();
  
  for (const pharmacy of pharmacies) {
    const code = pharmacy.code.toLowerCase();
    
    // Map SensorPush codes to pharmacy codes
    if ((name.includes('gsp') && code === 'specialty') ||
        (name.includes('gfp') && code === 'family') ||
        (name.includes('gpp') && code === 'parlin') ||
        (name.includes('gop') && code === 'outpatient')) {
      return pharmacy.id;
    }
    
    // Also check original matching logic as fallback
    if (name.includes(code) || 
        name.includes(pharmacy.name.toLowerCase()) || 
        (name.includes('parlin') && code === 'parlin') ||
        (name.includes('specialty') && code === 'specialty') ||
        (name.includes('family') && code === 'family') ||
        (name.includes('outpatient') && code === 'outpatient')) {
      return pharmacy.id;
    }
  }
  
  return null; // Return null to require manual assignment
}

// Helper function to find which gateway a sensor belongs to
async function findGatewayForSensor(sensor: any, gateways: any[]): Promise<any | null> {
  // Method 1: Check if sensor has gateway info in SensorPush data
  // This depends on what SensorPush API returns - you may need to adjust
  
  // Method 2: Use naming convention
  const sensorName = sensor.name.toLowerCase();
  const matchingGateway = gateways.find(g => 
    sensorName.includes(g.name.toLowerCase()) ||
    g.name.toLowerCase().includes(sensorName.split(' ')[0]) ||
    // Try to match by location keywords
    (sensorName.includes('parlin') && g.name.toLowerCase().includes('parlin')) ||
    (sensorName.includes('specialty') && g.name.toLowerCase().includes('specialty')) ||
    (sensorName.includes('family') && g.name.toLowerCase().includes('family')) ||
    (sensorName.includes('outpatient') && g.name.toLowerCase().includes('outpatient'))
  );
  
  if (matchingGateway) return matchingGateway;
  
  // Method 3: Try to infer from pharmacy matching
  const pharmacyFromSensor = await inferPharmacyFromName(sensor.name);
  if (pharmacyFromSensor) {
    // Find gateway assigned to the same pharmacy
    const gateway = gateways.find(async g => {
      const gatewayPharmacy = await inferPharmacyFromName(g.name);
      return gatewayPharmacy === pharmacyFromSensor;
    });
    if (gateway) return gateway;
  }
  
  // Method 4: Default to first gateway if only one exists
  if (gateways.length === 1) {
    return gateways[0];
  }
  
  return null; // Require manual assignment
}