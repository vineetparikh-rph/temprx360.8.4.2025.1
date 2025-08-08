import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Raw SQL query execution endpoint
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 });
    }

    // Basic security checks
    const trimmedQuery = query.trim().toLowerCase();
    
    // Block potentially dangerous operations
    const dangerousPatterns = [
      /drop\s+table/i,
      /drop\s+database/i,
      /truncate\s+table/i,
      /alter\s+table.*drop/i,
      /delete\s+from.*where\s*$/i, // DELETE without WHERE clause
      /update.*set.*where\s*$/i,   // UPDATE without WHERE clause
    ];
    
    const isDangerous = dangerousPatterns.some(pattern => pattern.test(trimmedQuery));
    
    if (isDangerous) {
      return NextResponse.json({ 
        error: 'Potentially dangerous query detected. Please review your query for safety.' 
      }, { status: 400 });
    }

    // Execute the query
    let result;
    
    try {
      // Use Prisma's raw query execution
      if (trimmedQuery.startsWith('select') || trimmedQuery.startsWith('with')) {
        // For SELECT queries, use queryRaw
        result = await prisma.$queryRaw`${query}`;
      } else {
        // For INSERT, UPDATE, DELETE queries, use executeRaw
        const affectedRows = await prisma.$executeRaw`${query}`;
        result = { affectedRows };
      }
      
      // Format the result for display
      let columns: string[] = [];
      let rows: any[][] = [];
      let rowCount = 0;
      
      if (Array.isArray(result)) {
        // SELECT query result
        if (result.length > 0) {
          columns = Object.keys(result[0]);
          rows = result.map(row => columns.map(col => row[col]));
        }
        rowCount = result.length;
      } else if (typeof result === 'object' && 'affectedRows' in result) {
        // INSERT/UPDATE/DELETE result
        columns = ['Affected Rows'];
        rows = [[result.affectedRows]];
        rowCount = 1;
      }

      // Log the query execution
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'EXECUTE_SQL_QUERY',
          resource: 'database:query',
          metadata: JSON.stringify({
            query: query.substring(0, 500), // Truncate long queries
            rowCount,
            success: true
          })
        }
      });

      return NextResponse.json({
        success: true,
        columns,
        rows,
        rowCount,
        query: query.substring(0, 200) + (query.length > 200 ? '...' : '')
      });

    } catch (queryError: any) {
      // Log the failed query
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'EXECUTE_SQL_QUERY',
          resource: 'database:query',
          metadata: JSON.stringify({
            query: query.substring(0, 500),
            error: queryError.message,
            success: false
          })
        }
      });

      throw queryError;
    }

  } catch (error: any) {
    console.error('SQL query execution error:', error);
    
    // Return a more user-friendly error message
    let errorMessage = 'Failed to execute query';
    
    if (error.message.includes('SQLITE_ERROR')) {
      errorMessage = 'SQL syntax error: ' + error.message;
    } else if (error.message.includes('no such table')) {
      errorMessage = 'Table not found: ' + error.message;
    } else if (error.message.includes('no such column')) {
      errorMessage = 'Column not found: ' + error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve query history or schema information
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'schema') {
      // Get database schema information
      const tables = await prisma.$queryRaw`
        SELECT name, type, sql 
        FROM sqlite_master 
        WHERE type IN ('table', 'view') 
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `;

      return NextResponse.json({
        success: true,
        schema: tables
      });
    }

    if (action === 'history') {
      // Get recent query history from audit logs
      const queryHistory = await prisma.auditLog.findMany({
        where: {
          action: 'EXECUTE_SQL_QUERY',
          userId: session.user.id
        },
        orderBy: { timestamp: 'desc' },
        take: 20,
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      return NextResponse.json({
        success: true,
        history: queryHistory
      });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });

  } catch (error: any) {
    console.error('Database query API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request: ' + error.message },
      { status: 500 }
    );
  }
}
