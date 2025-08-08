import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Dynamic database API for all tables
export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { table } = params;
    
    // Validate table name to prevent injection
    const allowedTables = ['pharmacy', 'sensorAssignment', 'user', 'sensor', 'alert', 'reading', 'auditLog', 'userPharmacy'];
    if (!allowedTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    let records;
    
    // Get records with appropriate includes for relations
    switch (table) {
      case 'pharmacy':
        records = await prisma.pharmacy.findMany({
          include: {
            _count: {
              select: {
                userPharmacies: true,
                sensorAssignments: true,
                sensors: true,
                alerts: true
              }
            }
          },
          orderBy: { name: 'asc' }
        });
        break;
        
      case 'sensorAssignment':
        records = await prisma.sensorAssignment.findMany({
          include: {
            pharmacy: {
              select: { name: true, code: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        break;
        
      case 'user':
        records = await prisma.user.findMany({
          include: {
            _count: {
              select: {
                userPharmacies: true
              }
            }
          },
          orderBy: { email: 'asc' }
        });
        break;
        
      case 'sensor':
        records = await prisma.sensor.findMany({
          include: {
            pharmacy: {
              select: { name: true, code: true }
            },
            _count: {
              select: {
                readings: true,
                alerts: true
              }
            }
          },
          orderBy: { name: 'asc' }
        });
        break;
        
      case 'alert':
        records = await prisma.alert.findMany({
          include: {
            sensor: {
              select: { name: true, location: true }
            },
            pharmacy: {
              select: { name: true, code: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        break;
        
      case 'reading':
        records = await prisma.reading.findMany({
          include: {
            sensor: {
              select: { name: true, location: true }
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 1000 // Limit to recent readings
        });
        break;
        
      case 'auditLog':
        records = await prisma.auditLog.findMany({
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 500 // Limit to recent logs
        });
        break;
        
      case 'userPharmacy':
        records = await prisma.userPharmacy.findMany({
          include: {
            user: {
              select: { name: true, email: true }
            },
            pharmacy: {
              select: { name: true, code: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        break;
        
      default:
        return NextResponse.json({ error: 'Table not supported' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      records,
      count: records.length,
      table
    });

  } catch (error) {
    console.error(`Database API error for table ${params.table}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${params.table} records: ${error.message}` },
      { status: 500 }
    );
  }
}

// CREATE new record
export async function POST(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { table } = params;
    const data = await request.json();
    
    // Remove id if it's empty (for auto-generation)
    if (data.id === '') {
      delete data.id;
    }
    
    // Remove computed fields
    delete data._count;
    delete data.pharmacy;
    delete data.sensor;
    delete data.user;
    
    let record;
    
    switch (table) {
      case 'pharmacy':
        record = await prisma.pharmacy.create({
          data: {
            name: data.name,
            code: data.code,
            licenseNumber: data.licenseNumber || null,
            address: data.address || null,
            phone: data.phone || null,
            fax: data.fax || null,
            npi: data.npi || null,
            ncpdp: data.ncpdp || null,
            dea: data.dea || null
          }
        });
        break;
        
      case 'sensorAssignment':
        record = await prisma.sensorAssignment.create({
          data: {
            sensorPushId: data.sensorPushId,
            sensorName: data.sensorName,
            pharmacyId: data.pharmacyId,
            locationType: data.locationType || 'other',
            isActive: data.isActive !== undefined ? data.isActive : true,
            assignedBy: data.assignedBy || session.user.id
          }
        });
        break;
        
      case 'user':
        record = await prisma.user.create({
          data: {
            name: data.name || null,
            email: data.email,
            role: data.role || 'viewer',
            hashedPassword: data.hashedPassword || null,
            emailVerified: data.emailVerified ? new Date(data.emailVerified) : null,
            image: data.image || null
          }
        });
        break;
        
      case 'sensor':
        record = await prisma.sensor.create({
          data: {
            sensorPushId: data.sensorPushId || null,
            name: data.name,
            location: data.location,
            pharmacyId: data.pharmacyId,
            minTemp: parseFloat(data.minTemp) || 36.0,
            maxTemp: parseFloat(data.maxTemp) || 46.4,
            isActive: data.isActive !== undefined ? data.isActive : true
          }
        });
        break;
        
      case 'alert':
        record = await prisma.alert.create({
          data: {
            sensorId: data.sensorId,
            pharmacyId: data.pharmacyId,
            type: data.type,
            severity: data.severity,
            message: data.message,
            resolved: data.resolved !== undefined ? data.resolved : false,
            resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : null
          }
        });
        break;
        
      default:
        return NextResponse.json({ error: 'Table not supported for creation' }, { status: 400 });
    }

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `CREATE_${table.toUpperCase()}`,
        resource: `${table}:${record.id}`,
        metadata: JSON.stringify(data)
      }
    });

    return NextResponse.json({
      success: true,
      record,
      message: `${table} record created successfully`
    });

  } catch (error) {
    console.error(`Database creation error for table ${params.table}:`, error);
    return NextResponse.json(
      { error: `Failed to create ${params.table} record: ${error.message}` },
      { status: 500 }
    );
  }
}

// UPDATE existing record
export async function PUT(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { table } = params;
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ error: 'Record ID is required for update' }, { status: 400 });
    }
    
    // Remove computed fields
    delete data._count;
    delete data.pharmacy;
    delete data.sensor;
    delete data.user;
    delete data.createdAt; // Don't update creation timestamp
    
    let record;
    
    switch (table) {
      case 'pharmacy':
        record = await prisma.pharmacy.update({
          where: { id: data.id },
          data: {
            name: data.name,
            code: data.code,
            licenseNumber: data.licenseNumber || null,
            address: data.address || null,
            phone: data.phone || null,
            fax: data.fax || null,
            npi: data.npi || null,
            ncpdp: data.ncpdp || null,
            dea: data.dea || null
          }
        });
        break;
        
      case 'sensorAssignment':
        record = await prisma.sensorAssignment.update({
          where: { id: data.id },
          data: {
            sensorPushId: data.sensorPushId,
            sensorName: data.sensorName,
            pharmacyId: data.pharmacyId,
            locationType: data.locationType,
            isActive: data.isActive
          }
        });
        break;
        
      case 'user':
        record = await prisma.user.update({
          where: { id: data.id },
          data: {
            name: data.name || null,
            email: data.email,
            role: data.role,
            emailVerified: data.emailVerified ? new Date(data.emailVerified) : null,
            image: data.image || null
          }
        });
        break;
        
      case 'sensor':
        record = await prisma.sensor.update({
          where: { id: data.id },
          data: {
            sensorPushId: data.sensorPushId || null,
            name: data.name,
            location: data.location,
            pharmacyId: data.pharmacyId,
            minTemp: parseFloat(data.minTemp),
            maxTemp: parseFloat(data.maxTemp),
            isActive: data.isActive
          }
        });
        break;
        
      case 'alert':
        record = await prisma.alert.update({
          where: { id: data.id },
          data: {
            type: data.type,
            severity: data.severity,
            message: data.message,
            resolved: data.resolved,
            resolvedAt: data.resolved && !data.resolvedAt ? new Date() : (data.resolvedAt ? new Date(data.resolvedAt) : null)
          }
        });
        break;
        
      default:
        return NextResponse.json({ error: 'Table not supported for update' }, { status: 400 });
    }

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `UPDATE_${table.toUpperCase()}`,
        resource: `${table}:${data.id}`,
        metadata: JSON.stringify(data)
      }
    });

    return NextResponse.json({
      success: true,
      record,
      message: `${table} record updated successfully`
    });

  } catch (error) {
    console.error(`Database update error for table ${params.table}:`, error);
    return NextResponse.json(
      { error: `Failed to update ${params.table} record: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { table } = params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }
    
    let record;
    
    switch (table) {
      case 'pharmacy':
        record = await prisma.pharmacy.delete({
          where: { id }
        });
        break;
        
      case 'sensorAssignment':
        record = await prisma.sensorAssignment.delete({
          where: { id }
        });
        break;
        
      case 'user':
        record = await prisma.user.delete({
          where: { id }
        });
        break;
        
      case 'sensor':
        record = await prisma.sensor.delete({
          where: { id }
        });
        break;
        
      case 'alert':
        record = await prisma.alert.delete({
          where: { id }
        });
        break;
        
      default:
        return NextResponse.json({ error: 'Table not supported for deletion' }, { status: 400 });
    }

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `DELETE_${table.toUpperCase()}`,
        resource: `${table}:${id}`,
        metadata: JSON.stringify(record)
      }
    });

    return NextResponse.json({
      success: true,
      message: `${table} record deleted successfully`
    });

  } catch (error) {
    console.error(`Database deletion error for table ${params.table}:`, error);
    return NextResponse.json(
      { error: `Failed to delete ${params.table} record: ${error.message}` },
      { status: 500 }
    );
  }
}
