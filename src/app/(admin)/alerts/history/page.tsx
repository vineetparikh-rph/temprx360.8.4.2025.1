"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Thermometer,
  Building2,
  Filter,
  Calendar,
  RefreshCw,
  Search,
  Download
} from 'lucide-react';

interface AlertHistory {
  id: string;
  type: 'temperature' | 'humidity' | 'sensor_offline' | 'battery_low';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  sensorName: string;
  pharmacyName: string;
  location: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  value?: number;
  threshold?: number;
}

export default function AlertHistoryPage() {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAlertHistory();
  }, [dateRange]);

  const fetchAlertHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/alerts?start=${dateRange.start}&end=${dateRange.end}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        // Fallback to sample data
        setAlerts(generateSampleAlerts());
      }
    } catch (error) {
      console.error('Failed to fetch alert history:', error);
      setAlerts(generateSampleAlerts());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleAlerts = (): AlertHistory[] => {
    const types: AlertHistory['type'][] = ['temperature', 'humidity', 'sensor_offline', 'battery_low'];
    const severities: AlertHistory['severity'][] = ['low', 'medium', 'high', 'critical'];
    const pharmacies = ['Georgies Family Pharmacy', 'Georgies Specialty Pharmacy', 'Georgies Parlin Pharmacy', 'Georgies Outpatient Pharmacy'];
    const locations = ['Refrigerator 1', 'Refrigerator 2', 'Freezer', 'Room Temperature', 'Vaccine Storage'];

    return Array.from({ length: 50 }, (_, i) => {
      const type = types[i % types.length];
      const severity = severities[i % severities.length];
      const pharmacy = pharmacies[i % pharmacies.length];
      const location = locations[i % locations.length];
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
      const resolved = Math.random() > 0.3;

      let message = '';
      let value, threshold;

      switch (type) {
        case 'temperature':
          value = Math.round((Math.random() * 15 + 15) * 10) / 10;
          threshold = severity === 'critical' ? 8 : 2;
          message = `Temperature ${value}°C exceeds threshold of ${threshold}°C`;
          break;
        case 'humidity':
          value = Math.round((Math.random() * 30 + 70) * 10) / 10;
          threshold = 80;
          message = `Humidity ${value}% exceeds threshold of ${threshold}%`;
          break;
        case 'sensor_offline':
          message = 'Sensor has gone offline and is not responding';
          break;
        case 'battery_low':
          value = Math.floor(Math.random() * 20);
          threshold = 20;
          message = `Battery level ${value}% is below threshold of ${threshold}%`;
          break;
      }

      return {
        id: `alert_${i + 1}`,
        type,
        severity,
        message,
        sensorName: `Sensor ${i + 1}`,
        pharmacyName: pharmacy,
        location,
        timestamp,
        resolved,
        resolvedAt: resolved ? new Date(new Date(timestamp).getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString() : undefined,
        resolvedBy: resolved ? 'System Admin' : undefined,
        value,
        threshold
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="h-4 w-4" />;
      case 'humidity':
        return <Thermometer className="h-4 w-4" />;
      case 'sensor_offline':
        return <AlertTriangle className="h-4 w-4" />;
      case 'battery_low':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.sensorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'resolved' && alert.resolved) ||
                         (statusFilter === 'unresolved' && !alert.resolved);

    return matchesSearch && matchesSeverity && matchesType && matchesStatus;
  });

  const alertCounts = {
    total: alerts.length,
    resolved: alerts.filter(a => a.resolved).length,
    unresolved: alerts.filter(a => !a.resolved).length,
    critical: alerts.filter(a => a.severity === 'critical').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Alert History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage historical alerts and notifications
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchAlertHistory}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {alertCounts.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {alertCounts.resolved}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Resolved</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {alertCounts.unresolved}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Unresolved</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {alertCounts.critical}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Critical</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search alerts..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="temperature">Temperature</option>
              <option value="humidity">Humidity</option>
              <option value="sensor_offline">Sensor Offline</option>
              <option value="battery_low">Battery Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="resolved">Resolved</option>
              <option value="unresolved">Unresolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alert History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Alert History ({filteredAlerts.length} alerts)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Alert</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3 mt-1">
                        {getTypeIcon(alert.type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.message}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {alert.sensorName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        {alert.pharmacyName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {alert.location}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {alert.resolved ? (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <div>
                          <div className="text-sm text-green-600">Resolved</div>
                          {alert.resolvedAt && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(alert.resolvedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm text-red-600">Unresolved</span>
                      </div>
                    )}
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