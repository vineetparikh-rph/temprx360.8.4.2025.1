"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  RefreshCw,
  Building2,
  Cpu,
  Thermometer,
  Users,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react';

interface DatabaseRecord {
  id: string;
  [key: string]: any;
}

interface TableSchema {
  name: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
    relation?: string;
  }[];
}

export default function DatabaseAdminPage() {
  const { data: session } = useSession();
  const [selectedTable, setSelectedTable] = useState('pharmacy');
  const [records, setRecords] = useState<DatabaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DatabaseRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const tables: TableSchema[] = [
    {
      name: 'pharmacy',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'code', type: 'string', required: true },
        { name: 'licenseNumber', type: 'string', required: false },
        { name: 'address', type: 'string', required: false },
        { name: 'phone', type: 'string', required: false },
        { name: 'fax', type: 'string', required: false },
        { name: 'npi', type: 'string', required: false },
        { name: 'ncpdp', type: 'string', required: false },
        { name: 'dea', type: 'string', required: false },
        { name: 'createdAt', type: 'datetime', required: false }
      ]
    },
    {
      name: 'sensorAssignment',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'sensorPushId', type: 'string', required: true },
        { name: 'sensorName', type: 'string', required: true },
        { name: 'pharmacyId', type: 'string', required: true, relation: 'pharmacy' },
        { name: 'locationType', type: 'string', required: true },
        { name: 'isActive', type: 'boolean', required: true },
        { name: 'assignedBy', type: 'string', required: false },
        { name: 'createdAt', type: 'datetime', required: false },
        { name: 'updatedAt', type: 'datetime', required: false }
      ]
    },
    {
      name: 'user',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string', required: false },
        { name: 'email', type: 'string', required: true },
        { name: 'role', type: 'string', required: true },
        { name: 'hashedPassword', type: 'string', required: false },
        { name: 'emailVerified', type: 'datetime', required: false },
        { name: 'image', type: 'string', required: false },
        { name: 'createdAt', type: 'datetime', required: false }
      ]
    },
    {
      name: 'sensor',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'sensorPushId', type: 'string', required: false },
        { name: 'name', type: 'string', required: true },
        { name: 'location', type: 'string', required: true },
        { name: 'pharmacyId', type: 'string', required: true, relation: 'pharmacy' },
        { name: 'minTemp', type: 'float', required: true },
        { name: 'maxTemp', type: 'float', required: true },
        { name: 'isActive', type: 'boolean', required: true },
        { name: 'createdAt', type: 'datetime', required: false }
      ]
    },
    {
      name: 'alert',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'sensorId', type: 'string', required: true, relation: 'sensor' },
        { name: 'pharmacyId', type: 'string', required: true, relation: 'pharmacy' },
        { name: 'type', type: 'string', required: true },
        { name: 'severity', type: 'string', required: true },
        { name: 'message', type: 'string', required: true },
        { name: 'resolved', type: 'boolean', required: true },
        { name: 'createdAt', type: 'datetime', required: false },
        { name: 'resolvedAt', type: 'datetime', required: false }
      ]
    }
  ];

  useEffect(() => {
    fetchRecords();
  }, [selectedTable]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/database/${selectedTable}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${selectedTable} records`);
      }
      const data = await response.json();
      setRecords(data.records || []);
    } catch (err: any) {
      setError(err.message);
      console.error(`Failed to fetch ${selectedTable}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (record: DatabaseRecord) => {
    try {
      const method = record.id && !isCreating ? 'PUT' : 'POST';
      const response = await fetch(`/api/database/${selectedTable}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });

      if (!response.ok) {
        throw new Error(`Failed to save ${selectedTable} record`);
      }

      await fetchRecords();
      setEditingRecord(null);
      setIsCreating(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const response = await fetch(`/api/database/${selectedTable}?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${selectedTable} record`);
      }

      await fetchRecords();
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startCreating = () => {
    const newRecord: DatabaseRecord = { id: '' };
    const schema = tables.find(t => t.name === selectedTable);
    
    if (schema) {
      schema.fields.forEach(field => {
        if (field.name !== 'id' && field.name !== 'createdAt' && field.name !== 'updatedAt') {
          switch (field.type) {
            case 'boolean':
              newRecord[field.name] = false;
              break;
            case 'float':
              newRecord[field.name] = 0;
              break;
            default:
              newRecord[field.name] = '';
          }
        }
      });
    }
    
    setEditingRecord(newRecord);
    setIsCreating(true);
  };

  const filteredRecords = records.filter(record => {
    if (!searchTerm) return true;
    return Object.values(record).some(value => 
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const currentSchema = tables.find(t => t.name === selectedTable);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Database Administration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Direct access to Prisma database - edit all data at the source
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchRecords}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={startCreating}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Table Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Table</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {tables.map(table => (
            <button
              key={table.name}
              onClick={() => setSelectedTable(table.name)}
              className={`flex items-center p-3 rounded-lg border ${
                selectedTable === table.name
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {table.name === 'pharmacy' && <Building2 className="h-4 w-4 mr-2" />}
              {table.name === 'sensorAssignment' && <Thermometer className="h-4 w-4 mr-2" />}
              {table.name === 'user' && <Users className="h-4 w-4 mr-2" />}
              {table.name === 'sensor' && <Cpu className="h-4 w-4 mr-2" />}
              {table.name === 'alert' && <AlertTriangle className="h-4 w-4 mr-2" />}
              <span className="capitalize">{table.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedTable.charAt(0).toUpperCase() + selectedTable.slice(1)} Records
            </h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredRecords.length} records
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-600 mt-2">Loading records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {currentSchema?.fields.map(field => (
                    <th
                      key={field.name}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {currentSchema?.fields.map(field => (
                      <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {editingRecord?.id === record.id ? (
                          <EditField
                            field={field}
                            value={editingRecord[field.name]}
                            onChange={(value) => setEditingRecord({
                              ...editingRecord,
                              [field.name]: value
                            })}
                          />
                        ) : (
                          <DisplayField field={field} value={record[field.name]} />
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingRecord?.id === record.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSave(editingRecord)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingRecord(null);
                              setIsCreating(false);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingRecord(record)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {/* New Record Row */}
                {editingRecord && isCreating && (
                  <tr className="bg-blue-50 dark:bg-blue-900/20">
                    {currentSchema?.fields.map(field => (
                      <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <EditField
                          field={field}
                          value={editingRecord[field.name]}
                          onChange={(value) => setEditingRecord({
                            ...editingRecord,
                            [field.name]: value
                          })}
                        />
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave(editingRecord)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingRecord(null);
                            setIsCreating(false);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for editing fields
function EditField({ field, value, onChange }: {
  field: { name: string; type: string; required: boolean; relation?: string };
  value: any;
  onChange: (value: any) => void;
}) {
  if (field.name === 'id' || field.name === 'createdAt' || field.name === 'updatedAt') {
    return <span className="text-gray-500">{value || 'Auto-generated'}</span>;
  }

  switch (field.type) {
    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-gray-300"
        />
      );
    case 'float':
      return (
        <input
          type="number"
          step="0.1"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          required={field.required}
        />
      );
    case 'datetime':
      return (
        <input
          type="datetime-local"
          value={value ? new Date(value).toISOString().slice(0, 16) : ''}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
      );
    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          required={field.required}
          placeholder={field.relation ? `${field.relation} ID` : field.name}
        />
      );
  }
}

// Helper component for displaying fields
function DisplayField({ field, value }: {
  field: { name: string; type: string };
  value: any;
}) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">null</span>;
  }

  switch (field.type) {
    case 'boolean':
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'true' : 'false'}
        </span>
      );
    case 'datetime':
      return <span>{new Date(value).toLocaleString()}</span>;
    case 'float':
      return <span>{parseFloat(value).toFixed(1)}</span>;
    default:
      return <span className="max-w-xs truncate">{value.toString()}</span>;
  }
}
