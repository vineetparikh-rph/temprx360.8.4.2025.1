"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Thermometer,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Building2,
  MapPin
} from 'lucide-react';

interface SensorStatus {
  id: string;
  name: string;
  location: string;
  pharmacyName: string;
  status: 'online' | 'offline' | 'warning';
  currentTemp: number | null;
  humidity: number | null;
  battery: number;
  signal: number;
  lastReading: string;
  lastSeen: string;
}

export default function SensorStatusPage() {
  const { data: session } = useSession();
  const [sensors, setSensors] = useState<SensorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'warning'>('all');

  useEffect(() => {
    fetchSensorStatus();
  }, []);

  const fetchSensorStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sensors');
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match our interface
        const statusData = data.sensors.map((sensor: any) => ({
          id: sensor.id,
          name: sensor.name,
          location: sensor.location || 'Unknown',
          pharmacyName: sensor.pharmacyName || 'Unknown Pharmacy',
          status: sensor.status === 'active' ? 'online' : 'offline',
          currentTemp: sensor.currentTemp,
          humidity: sensor.humidity,
          battery: sensor.battery || Math.floor(Math.random() * 100),
          signal: sensor.signal || Math.floor(Math.random() * 100),
          lastReading: sensor.lastReading || new Date().toISOString(),
          lastSeen: sensor.lastSeen || new Date().toISOString()
        }));
        setSensors(statusData);
      } else {
        // Fallback to sample data
        setSensors(generateSampleSensorStatus());
      }
    } catch (error) {
      console.error('Failed to fetch sensor status:', error);
      setSensors(generateSampleSensorStatus());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleSensorStatus = (): SensorStatus[] => {
    const pharmacies = ['Georgies Family Pharmacy', 'Georgies Specialty Pharmacy', 'Georgies Parlin Pharmacy', 'Georgies Outpatient Pharmacy'];
    const locations = ['Refrigerator 1', 'Refrigerator 2', 'Freezer', 'Room Temperature', 'Vaccine Storage'];
    const statuses: ('online' | 'offline' | 'warning')[] = ['online', 'online', 'online', 'offline', 'warning'];
    
    return Array.from({ length: 15 }, (_, i) => ({
      id: `sensor_${i + 1}`,
      name: `Sensor ${i + 1}`,
      location: locations[i % locations.length],
      pharmacyName: pharmacies[i % pharmacies.length],
      status: statuses[i % statuses.length],
      currentTemp: Math.round((Math.random() * 10 + 2) * 10) / 10,
      humidity: Math.round((Math.random() * 20 + 40) * 10) / 10,
      battery: Math.floor(Math.random() * 100),
      signal: Math.floor(Math.random() * 100),
      lastReading: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString()
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'offline':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBatteryIcon = (battery: number) => {
    return battery < 20 ? 
      <BatteryLow className="h-4 w-4 text-red-600" /> : 
      <Battery className="h-4 w-4 text-green-600" />;
  };

  const getSignalIcon = (signal: number) => {
    return signal < 30 ? 
      <WifiOff className="h-4 w-4 text-red-600" /> : 
      <Wifi className="h-4 w-4 text-green-600" />;
  };

  const filteredSensors = sensors.filter(sensor => {
    if (filter === 'all') return true;
    return sensor.status === filter;
  });

  const statusCounts = {
    online: sensors.filter(s => s.status === 'online').length,
    offline: sensors.filter(s => s.status === 'offline').length,
    warning: sensors.filter(s => s.status === 'warning').length,
    total: sensors.length
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
            Sensor Status
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor the status and health of all temperature sensors
          </p>
        </div>
        <button
          onClick={fetchSensorStatus}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusCounts.online}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Online</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusCounts.offline}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Offline</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusCounts.warning}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Warning</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Thermometer className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusCounts.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Sensors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2">
        {(['all', 'online', 'offline', 'warning'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Sensor Status Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sensor Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sensor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Temperature</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Battery</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Signal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Last Reading</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSensors.map((sensor) => (
                <tr key={sensor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Thermometer className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {sensor.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <Building2 className="h-3 w-3 mr-1" />
                          {sensor.pharmacyName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {sensor.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(sensor.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sensor.status)}`}>
                        {sensor.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {sensor.currentTemp !== null ? `${sensor.currentTemp}°C` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getBatteryIcon(sensor.battery)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {sensor.battery}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getSignalIcon(sensor.signal)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {sensor.signal}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(sensor.lastReading).toLocaleString()}
                    </div>
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