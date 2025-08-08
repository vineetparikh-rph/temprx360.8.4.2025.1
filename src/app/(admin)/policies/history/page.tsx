"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  FileText,
  Mail,
  Download,
  Calendar,
  Building2,
  User,
  Clock,
  RefreshCw,
  Eye,
  Search,
  Filter,
  CheckCircle
} from 'lucide-react';

interface ReportHistoryEntry {
  id: string;
  reportType: 'daily' | 'compliance';
  action: 'generated' | 'emailed';
  pharmacyName: string;
  pharmacyId: string;
  dateRange: string;
  emailTo?: string;
  timestamp: string;
  fileSize?: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

export default function PolicyHistoryPage() {
  const { data: session } = useSession();
  const [historyEntries, setHistoryEntries] = useState<ReportHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterReportType, setFilterReportType] = useState<string>('all');
  const [filterPharmacy, setFilterPharmacy] = useState<string>('all');

  useEffect(() => {
    fetchReportHistory();
  }, []);

  const fetchReportHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/history');
      if (!response.ok) {
        throw new Error('Failed to fetch report history');
      }
      const data = await response.json();
      setHistoryEntries(data.history || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      // For demo purposes, show sample data if API fails
      setHistoryEntries(generateSampleReportHistory());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleReportHistory = (): ReportHistoryEntry[] => {
    const pharmacies = [
      'Georgies Family Pharmacy',
      'Georgies Specialty Pharmacy',
      'Georgies Parlin Pharmacy',
      'Georgies Outpatient Pharmacy'
    ];

    const reportTypes = ['daily', 'compliance'] as const;
    const entries: ReportHistoryEntry[] = [];

    for (let i = 0; i < 20; i++) {
      const pharmacy = pharmacies[i % pharmacies.length];
      const reportType = reportTypes[i % reportTypes.length];
      const action = Math.random() > 0.5 ? 'generated' : 'emailed';
      const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

      // Generate realistic date ranges
      const startDate = new Date(timestamp.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      const dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

      entries.push({
        id: `report_${i + 1}`,
        reportType,
        action,
        pharmacyName: pharmacy,
        pharmacyId: `pharm_${i % pharmacies.length + 1}`,
        dateRange,
        emailTo: action === 'emailed' ? `manager${i + 1}@georgiesrx.com` : undefined,
        timestamp: timestamp.toISOString(),
        fileSize: reportType === 'daily' ? `${Math.floor(Math.random() * 200) + 300} KB` : `${Math.floor(Math.random() * 150) + 200} KB`,
        status: Math.random() > 0.1 ? 'success' : 'failed',
        errorMessage: Math.random() > 0.9 ? 'Email delivery failed' : undefined
      });
    }

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getActionIcon = (action: string, reportType?: string) => {
    if (action === 'emailed') {
      return <Mail className="h-4 w-4 text-green-600" />;
    }

    switch(reportType) {
      case 'daily': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'compliance': return <CheckCircle className="h-4 w-4 text-purple-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredEntries = historyEntries.filter(entry => {
    const matchesSearch = entry.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.dateRange.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (entry.emailTo && entry.emailTo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = filterAction === 'all' || entry.action === filterAction;
    const matchesReportType = filterReportType === 'all' || entry.reportType === filterReportType;
    const matchesPharmacy = filterPharmacy === 'all' || entry.pharmacyId === filterPharmacy;

    return matchesSearch && matchesAction && matchesReportType && matchesPharmacy;
  });

  const uniquePharmacies = Array.from(new Set(historyEntries.map(entry => entry.pharmacyName)))
    .map(name => {
      const entry = historyEntries.find(e => e.pharmacyName === name);
      return { id: entry?.pharmacyId || '', name };
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Policy History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track when reports were generated or emailed
          </p>
        </div>
        <button
          onClick={fetchReportHistory}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Report Type Filter */}
          <select
            value={filterReportType}
            onChange={(e) => setFilterReportType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Report Types</option>
            <option value="daily">Daily Reports</option>
            <option value="compliance">Compliance Reports</option>
          </select>

          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="generated">Generated</option>
            <option value="emailed">Emailed</option>
          </select>

          {/* Pharmacy Filter */}
          <select
            value={filterPharmacy}
            onChange={(e) => setFilterPharmacy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Pharmacies</option>
            {uniquePharmacies.map(pharmacy => (
              <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>
            ))}
          </select>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Filter className="h-4 w-4 mr-2" />
            {filteredEntries.length} of {historyEntries.length} entries
          </div>
        </div>
      </div>

      {/* History Table */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">
              API not available - showing sample data. {error}
            </span>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Report Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pharmacy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Size
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getActionIcon('generated', entry.reportType)}
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {entry.reportType} Report
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getActionIcon(entry.action)}
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {entry.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {entry.pharmacyName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {entry.dateRange}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.emailTo ? (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {entry.emailTo}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                      {entry.errorMessage && (
                        <div className="text-xs text-red-600 mt-1">
                          {entry.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {entry.fileSize || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No report history found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || filterAction !== 'all' || filterReportType !== 'all' || filterPharmacy !== 'all'
                ? 'No entries match your current filters.'
                : 'No reports have been generated or emailed yet.'}
            </p>
            {(searchTerm || filterAction !== 'all' || filterReportType !== 'all' || filterPharmacy !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterAction('all');
                  setFilterReportType('all');
                  setFilterPharmacy('all');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {historyEntries.filter(e => e.reportType === 'daily').length}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Daily Reports</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {historyEntries.filter(e => e.reportType === 'compliance').length}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Compliance Reports</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {historyEntries.filter(e => e.action === 'emailed').length}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Reports Emailed</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {historyEntries.length}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Total Actions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}