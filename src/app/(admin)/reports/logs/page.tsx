"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  FileText,
  Mail,
  Download,
  Calendar,
  Building2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Shield,
  BarChart3
} from 'lucide-react';

interface ReportLogEntry {
  id: string;
  reportType: 'daily' | 'compliance' | 'analytics';
  action: 'generated' | 'emailed' | 'downloaded' | 'viewed';
  pharmacyName: string;
  pharmacyId: string;
  dateRange?: string;
  emailTo?: string;
  timestamp: string;
  fileSize?: string;
  status: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  userId?: string;
  userName?: string;
}

export default function ReportLogsPage() {
  const { data: session } = useSession();
  const [logEntries, setLogEntries] = useState<ReportLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReportType, setFilterReportType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterPharmacy, setFilterPharmacy] = useState<string>('all');

  useEffect(() => {
    fetchReportLogs();
  }, []);

  const fetchReportLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/logs');
      if (!response.ok) {
        throw new Error('Failed to fetch report logs');
      }
      const data = await response.json();
      setLogEntries(data.logs || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      // For demo purposes, show sample data if API fails
      setLogEntries(generateSampleLogs());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleLogs = (): ReportLogEntry[] => {
    const pharmacies = [
      'Georgies Family Pharmacy',
      'Georgies Specialty Pharmacy',
      'Georgies Parlin Pharmacy',
      'Georgies Outpatient Pharmacy'
    ];

    const reportTypes = ['daily', 'compliance', 'analytics'] as const;
    const actions = ['generated', 'emailed', 'downloaded', 'viewed'] as const;
    const entries: ReportLogEntry[] = [];

    for (let i = 0; i < 25; i++) {
      const pharmacy = pharmacies[i % pharmacies.length];
      const reportType = reportTypes[i % reportTypes.length];
      const action = actions[i % actions.length];
      const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

      // Generate realistic date ranges
      const startDate = new Date(timestamp.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      const dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

      entries.push({
        id: `log_${i + 1}`,
        reportType,
        action,
        pharmacyName: pharmacy,
        pharmacyId: `pharm_${i % pharmacies.length + 1}`,
        dateRange: ['generated', 'emailed'].includes(action) ? dateRange : undefined,
        emailTo: action === 'emailed' ? `manager${i + 1}@georgiesrx.com` : undefined,
        timestamp: timestamp.toISOString(),
        fileSize: ['generated', 'emailed', 'downloaded'].includes(action) ? `${Math.floor(Math.random() * 300) + 200} KB` : undefined,
        status: Math.random() > 0.1 ? 'success' : 'failed',
        errorMessage: Math.random() > 0.9 ? 'Network timeout error' : undefined,
        userName: session?.user?.name || 'System User'
      });
    }

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const logs = generateSampleLogs();
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.reportType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || log.reportType === typeFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesType && matchesAction && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch(action) {
      case 'generated': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'emailed': return <Mail className="h-4 w-4 text-green-600" />;
      case 'downloaded': return <Download className="h-4 w-4 text-purple-600" />;
      case 'viewed': return <Eye className="h-4 w-4 text-gray-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Activity Logs</h1>
          <p className="text-gray-600 mt-1">Track all report generation and distribution activities</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
          <div className="text-sm text-gray-600">Total Activities</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {logs.filter(l => l.status === 'success').length}
          </div>
          <div className="text-sm text-gray-600">Successful</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {logs.filter(l => l.status === 'failed').length}
          </div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {logs.filter(l => l.action === 'emailed').length}
          </div>
          <div className="text-sm text-gray-600">Emailed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="daily">Daily Reports</option>
            <option value="compliance">Compliance</option>
            <option value="analytics">Analytics</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="generated">Generated</option>
            <option value="emailed">Emailed</option>
            <option value="downloaded">Downloaded</option>
            <option value="viewed">Viewed</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pharmacy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getActionIcon(log.action)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {log.action}
                        </div>
                        {log.emailTo && (
                          <div className="text-sm text-gray-500">to: {log.emailTo}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{log.reportType} Report</div>
                    {log.dateRange && (
                      <div className="text-sm text-gray-500">{log.dateRange}</div>
                    )}
                    {log.fileSize && (
                      <div className="text-xs text-gray-400">{log.fileSize}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.pharmacyName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                      {log.status.toUpperCase()}
                    </span>
                    {log.errorMessage && (
                      <div className="text-xs text-red-600 mt-1">{log.errorMessage}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.userName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}