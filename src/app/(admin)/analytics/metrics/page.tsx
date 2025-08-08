"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Target,
  Activity,
  Zap
} from 'lucide-react';

interface MetricData {
  pharmacyName: string;
  totalSensors: number;
  activeSensors: number;
  avgTemp: number;
  complianceRate: number;
  excursionsToday: number;
  excursionsWeek: number;
  uptimePercentage: number;
  lastReading: string;
}

export default function MetricsPage() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Generate sample metrics data
      const data = generateSampleMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleMetrics = (): MetricData[] => {
    const pharmacies = [
      'Georgies Family Pharmacy',
      'Georgies Specialty Pharmacy',
      'Georgies Parlin Pharmacy',
      'Georgies Outpatient Pharmacy'
    ];

    return pharmacies.map(pharmacy => ({
      pharmacyName: pharmacy,
      totalSensors: Math.floor(Math.random() * 5) + 8,
      activeSensors: Math.floor(Math.random() * 3) + 7,
      avgTemp: Math.round((Math.random() * 3 + 21) * 10) / 10,
      complianceRate: Math.round((Math.random() * 10 + 90) * 10) / 10,
      excursionsToday: Math.floor(Math.random() * 3),
      excursionsWeek: Math.floor(Math.random() * 8) + 2,
      uptimePercentage: Math.round((Math.random() * 5 + 95) * 10) / 10,
      lastReading: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString()
    }));
  };

  const totalSensors = metrics.reduce((sum, m) => sum + m.totalSensors, 0);
  const activeSensors = metrics.reduce((sum, m) => sum + m.activeSensors, 0);
  const avgCompliance = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.complianceRate, 0) / metrics.length : 0;
  const totalExcursions = metrics.reduce((sum, m) => sum + (selectedPeriod === 'today' ? m.excursionsToday : m.excursionsWeek), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            System Metrics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time performance metrics and system health indicators
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Time Period:
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Thermometer className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeSensors}/{totalSensors}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Sensors</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {avgCompliance.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Compliance</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalExcursions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Excursions {selectedPeriod === 'today' ? 'Today' : 'This Week'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.length > 0 ? (metrics.reduce((sum, m) => sum + m.uptimePercentage, 0) / metrics.length).toFixed(1) : '0.0'}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">System Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pharmacy Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pharmacy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sensors</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Avg Temp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Compliance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Excursions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Uptime</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Last Reading</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {metrics.map((metric, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {metric.pharmacyName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      metric.activeSensors === metric.totalSensors
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {metric.activeSensors}/{metric.totalSensors}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {metric.avgTemp}°C
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            metric.complianceRate >= 95 ? 'bg-green-600' :
                            metric.complianceRate >= 90 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${metric.complianceRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {metric.complianceRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      (selectedPeriod === 'today' ? metric.excursionsToday : metric.excursionsWeek) === 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedPeriod === 'today' ? metric.excursionsToday : metric.excursionsWeek}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <span className={`${metric.uptimePercentage >= 99 ? 'text-green-600' : metric.uptimePercentage >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {metric.uptimePercentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(metric.lastReading).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sensor Connectivity</span>
              <span className="text-sm font-medium text-green-600">
                {((activeSensors / totalSensors) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Data Collection Rate</span>
              <span className="text-sm font-medium text-green-600">98.7%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Alert Response Time</span>
              <span className="text-sm font-medium text-blue-600">&lt; 2 min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">System Load</span>
              <span className="text-sm font-medium text-yellow-600">Moderate</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compliance Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Excellent (95-100%)</span>
              <span className="text-sm font-medium text-green-600">
                {metrics.filter(m => m.complianceRate >= 95).length} pharmacies
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Good (90-94%)</span>
              <span className="text-sm font-medium text-yellow-600">
                {metrics.filter(m => m.complianceRate >= 90 && m.complianceRate < 95).length} pharmacies
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Needs Attention (&lt;90%)</span>
              <span className="text-sm font-medium text-red-600">
                {metrics.filter(m => m.complianceRate < 90).length} pharmacies
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Overall Average</span>
              <span className="text-sm font-medium text-blue-600">
                {avgCompliance.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}