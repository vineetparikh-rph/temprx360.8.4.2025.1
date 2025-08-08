"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  TrendingUp, 
  Thermometer, 
  Building2, 
  Users, 
  AlertTriangle,
  Activity,
  Clock,
  BarChart3
} from 'lucide-react';

interface AnalyticsData {
  totalSensors: number;
  activeSensors: number;
  totalPharmacies: number;
  totalUsers: number;
  recentAlerts: number;
  sensorsByPharmacy: Array<{
    pharmacyName: string;
    sensorCount: number;
    activeCount: number;
  }>;
  last24Hours: Array<{
    pharmacy: string;
    sensors: Array<{
      name: string;
      currentTemp: number;
      status: string;
      lastReading: string;
    }>;
  }>;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch sensors data
      const sensorsResponse = await fetch('/api/sensors');
      const sensorsData = await sensorsResponse.json();
      
      // Fetch pharmacies data
      const pharmaciesResponse = await fetch('/api/admin/pharmacies');
      const pharmaciesData = await pharmaciesResponse.json();
      
      // Fetch users data (admin only)
      let usersData = { totalCount: 0 };
      if (session?.user?.role === 'admin') {
        const usersResponse = await fetch('/api/admin/users');
        usersData = await usersResponse.json();
      }

      // Process analytics data
      const analytics: AnalyticsData = {
        totalSensors: sensorsData.totalCount || 0,
        activeSensors: sensorsData.sensors?.filter((s: any) => s.status === 'normal').length || 0,
        totalPharmacies: pharmaciesData.totalCount || 0,
        totalUsers: usersData.totalCount || 0,
        recentAlerts: sensorsData.sensors?.filter((s: any) => s.status === 'alert').length || 0,
        sensorsByPharmacy: [],
        last24Hours: []
      };

      // Group sensors by pharmacy
      if (sensorsData.sensors) {
        const pharmacyGroups: { [key: string]: any[] } = {};
        sensorsData.sensors.forEach((sensor: any) => {
          const pharmacyName = sensor.pharmacy?.name || 'Unassigned';
          if (!pharmacyGroups[pharmacyName]) {
            pharmacyGroups[pharmacyName] = [];
          }
          pharmacyGroups[pharmacyName].push(sensor);
        });

        analytics.sensorsByPharmacy = Object.entries(pharmacyGroups).map(([pharmacyName, sensors]) => ({
          pharmacyName,
          sensorCount: sensors.length,
          activeCount: sensors.filter(s => s.status === 'normal').length
        }));

        // Last 24 hours data
        analytics.last24Hours = Object.entries(pharmacyGroups).map(([pharmacy, sensors]) => ({
          pharmacy,
          sensors: sensors.map(sensor => ({
            name: sensor.name,
            currentTemp: sensor.currentTemp || 0,
            status: sensor.status,
            lastReading: sensor.lastReading || 'Never'
          }))
        }));
      }

      setAnalyticsData(analytics);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Activity className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const isAdmin = session?.user?.role === 'admin';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <TrendingUp className="mr-3 h-8 w-8 text-blue-600" />
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isAdmin ? 'System-wide analytics and insights' : 'Analytics for your assigned pharmacies'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
              <Thermometer className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sensors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.totalSensors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
              <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sensors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.activeSensors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/20">
              <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pharmacies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.totalPharmacies}</p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/20">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.totalUsers}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sensors by Pharmacy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
              Sensors by Pharmacy
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analyticsData.sensorsByPharmacy.map((pharmacy, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {pharmacy.pharmacyName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {pharmacy.activeCount} of {pharmacy.sensorCount} active
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${pharmacy.sensorCount > 0 ? (pharmacy.activeCount / pharmacy.sensorCount) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {pharmacy.sensorCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
              System Status
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</span>
                <span className={`text-sm font-medium ${
                  analyticsData.recentAlerts > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {analyticsData.recentAlerts}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">System Health</span>
                <span className={`text-sm font-medium ${
                  analyticsData.activeSensors === analyticsData.totalSensors 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {analyticsData.totalSensors > 0 
                    ? Math.round((analyticsData.activeSensors / analyticsData.totalSensors) * 100)
                    : 0
                  }% Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last 24 Hours Sensor Data */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Clock className="mr-2 h-5 w-5 text-blue-600" />
            Last 24 Hours - Sensor Overview
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {analyticsData.last24Hours.map((pharmacyData, index) => (
              <div key={index}>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  {pharmacyData.pharmacy}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pharmacyData.sensors.map((sensor, sensorIndex) => (
                    <div key={sensorIndex} className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {sensor.name}
                        </span>
                        <div className={`h-2 w-2 rounded-full ${
                          sensor.status === 'normal' ? 'bg-green-400' : 
                          sensor.status === 'alert' ? 'bg-red-400' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {sensor.currentTemp ? `${sensor.currentTemp.toFixed(1)}°F` : 'No data'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Last reading: {sensor.lastReading}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
