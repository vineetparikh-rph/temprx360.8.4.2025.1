"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  LineChart,
  RefreshCw
} from 'lucide-react';

interface TrendData {
  date: string;
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
  excursions: number;
  compliance: number;
  pharmacyName: string;
}

export default function TrendsPage() {
  const { data: session } = useSession();
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [selectedPharmacy, setSelectedPharmacy] = useState('all');

  useEffect(() => {
    fetchTrendData();
  }, [selectedPeriod, selectedPharmacy]);

  const fetchTrendData = async () => {
    setLoading(true);
    try {
      // Generate sample trend data
      const data = generateSampleTrendData();
      setTrendData(data);
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleTrendData = (): TrendData[] => {
    const pharmacies = ['Georgies Family Pharmacy', 'Georgies Specialty Pharmacy', 'Georgies Parlin Pharmacy', 'Georgies Outpatient Pharmacy'];
    const data: TrendData[] = [];
    const days = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      pharmacies.forEach(pharmacy => {
        if (selectedPharmacy === 'all' || selectedPharmacy === pharmacy) {
          data.push({
            date: date.toISOString().split('T')[0],
            avgTemp: Math.round((Math.random() * 3 + 21) * 10) / 10,
            minTemp: Math.round((Math.random() * 2 + 19) * 10) / 10,
            maxTemp: Math.round((Math.random() * 2 + 23) * 10) / 10,
            excursions: Math.floor(Math.random() * 3),
            compliance: Math.round((Math.random() * 10 + 90) * 10) / 10,
            pharmacyName: pharmacy
          });
        }
      });
    }

    return data.sort((a, b) => a.date.localeCompare(b.date));
  };

  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 0;
    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previous = values.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
    return ((recent - previous) / previous) * 100;
  };

  const avgTemps = trendData.map(d => d.avgTemp);
  const compliances = trendData.map(d => d.compliance);
  const excursions = trendData.map(d => d.excursions);

  const tempTrend = calculateTrend(avgTemps);
  const complianceTrend = calculateTrend(compliances);
  const excursionTrend = calculateTrend(excursions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Temperature Trends
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyze temperature patterns and compliance trends over time
          </p>
        </div>
        <button
          onClick={fetchTrendData}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Period:
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Pharmacy:
            </label>
            <select
              value={selectedPharmacy}
              onChange={(e) => setSelectedPharmacy(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Pharmacies</option>
              <option value="Georgies Family Pharmacy">Family Pharmacy</option>
              <option value="Georgies Specialty Pharmacy">Specialty Pharmacy</option>
              <option value="Georgies Parlin Pharmacy">Parlin Pharmacy</option>
              <option value="Georgies Outpatient Pharmacy">Outpatient Pharmacy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Temperature Trend</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {avgTemps.length > 0 ? avgTemps[avgTemps.length - 1].toFixed(1) : '0.0'}°C
              </div>
            </div>
            <div className={`flex items-center ${tempTrend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {tempTrend >= 0 ? <TrendingUp className="h-5 w-5 mr-1" /> : <TrendingDown className="h-5 w-5 mr-1" />}
              <span className="text-sm font-medium">{Math.abs(tempTrend).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Compliance Trend</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {compliances.length > 0 ? compliances[compliances.length - 1].toFixed(1) : '0.0'}%
              </div>
            </div>
            <div className={`flex items-center ${complianceTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {complianceTrend >= 0 ? <TrendingUp className="h-5 w-5 mr-1" /> : <TrendingDown className="h-5 w-5 mr-1" />}
              <span className="text-sm font-medium">{Math.abs(complianceTrend).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Excursions Trend</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {excursions.length > 0 ? excursions[excursions.length - 1] : 0}
              </div>
            </div>
            <div className={`flex items-center ${excursionTrend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {excursionTrend >= 0 ? <TrendingUp className="h-5 w-5 mr-1" /> : <TrendingDown className="h-5 w-5 mr-1" />}
              <span className="text-sm font-medium">{Math.abs(excursionTrend).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Temperature Trends</h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Temperature trend chart would be displayed here</p>
              <p className="text-sm">Integration with charting library needed</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compliance Trends</h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Compliance trend chart would be displayed here</p>
              <p className="text-sm">Integration with charting library needed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Trend Data */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Data</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pharmacy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Avg Temp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Compliance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Excursions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {trendData.slice(-10).map((data, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(data.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {data.pharmacyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {data.avgTemp.toFixed(1)}°C
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      data.compliance >= 95 ? 'bg-green-100 text-green-800' :
                      data.compliance >= 90 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {data.compliance.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      data.excursions === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {data.excursions}
                    </span>
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