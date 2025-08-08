"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Database, 
  Play,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  Download
} from 'lucide-react';

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

export default function RawSQLQueryPage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedQueries, setSavedQueries] = useState<string[]>([]);

  const commonQueries = [
    {
      name: 'All Pharmacies with Sensor Counts',
      query: `SELECT 
  p.name,
  p.code,
  COUNT(sa.id) as sensor_count,
  COUNT(CASE WHEN sa.isActive = 1 THEN 1 END) as active_sensors
FROM Pharmacy p
LEFT JOIN SensorAssignment sa ON p.id = sa.pharmacyId
GROUP BY p.id, p.name, p.code
ORDER BY p.name;`
    },
    {
      name: 'Recent Alerts by Pharmacy',
      query: `SELECT 
  p.name as pharmacy_name,
  a.type,
  a.severity,
  a.message,
  a.resolved,
  a.createdAt
FROM Alert a
JOIN Pharmacy p ON a.pharmacyId = p.id
ORDER BY a.createdAt DESC
LIMIT 50;`
    },
    {
      name: 'Sensor Assignment Summary',
      query: `SELECT 
  p.name as pharmacy_name,
  sa.locationType,
  COUNT(*) as sensor_count,
  COUNT(CASE WHEN sa.isActive = 1 THEN 1 END) as active_count
FROM SensorAssignment sa
JOIN Pharmacy p ON sa.pharmacyId = p.id
GROUP BY p.name, sa.locationType
ORDER BY p.name, sa.locationType;`
    },
    {
      name: 'User Pharmacy Assignments',
      query: `SELECT 
  u.email,
  u.role,
  p.name as pharmacy_name,
  up.createdAt as assigned_date
FROM UserPharmacy up
JOIN User u ON up.userId = u.id
JOIN Pharmacy p ON up.pharmacyId = p.id
ORDER BY u.email, p.name;`
    },
    {
      name: 'Database Schema Info',
      query: `SELECT 
  name as table_name,
  type
FROM sqlite_master 
WHERE type IN ('table', 'view')
ORDER BY name;`
    }
  ];

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(data.error || 'Query execution failed');
      }

      setResult({
        columns: data.columns || [],
        rows: data.rows || [],
        rowCount: data.rowCount || 0,
        executionTime
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCommonQuery = (queryText: string) => {
    setQuery(queryText);
    setResult(null);
    setError(null);
  };

  const exportResults = () => {
    if (!result) return;

    const csvContent = [
      result.columns.join(','),
      ...result.rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Raw SQL Query
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Execute raw SQL queries directly against the database
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={executeQuery}
            disabled={loading || !query.trim()}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4 mr-2" />
            {loading ? 'Executing...' : 'Execute Query'}
          </button>
          {result && (
            <button
              onClick={exportResults}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <div>
            <h3 className="text-yellow-800 font-medium">Database Access Warning</h3>
            <p className="text-yellow-700 text-sm mt-1">
              You have direct access to the database. Be careful with UPDATE, DELETE, and DROP statements. 
              Always backup important data before making changes.
            </p>
          </div>
        </div>
      </div>

      {/* Common Queries */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Common Queries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {commonQueries.map((item, index) => (
            <button
              key={index}
              onClick={() => loadCommonQuery(item.query)}
              className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="font-medium text-gray-900 dark:text-white text-sm">{item.name}</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                {item.query.split('\n')[0].substring(0, 50)}...
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Query Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SQL Query Editor</h3>
        </div>
        <div className="p-6">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-red-800 font-medium">Query Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Query Results</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>{result.rowCount} rows</span>
                <span>{result.executionTime}ms</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>
          
          {result.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {result.columns.map((column, index) => (
                      <th
                        key={index}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {result.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {cell === null ? (
                            <span className="text-gray-400 italic">null</span>
                          ) : (
                            <span className="max-w-xs truncate block">{cell.toString()}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-600 dark:text-gray-400">
              Query executed successfully but returned no results.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
