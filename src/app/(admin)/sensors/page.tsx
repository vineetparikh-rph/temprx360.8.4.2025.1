"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Thermometer, 
  RefrigeratorIcon, 
  Wifi, 
  WifiOff, 
  Battery, 
  AlertTriangle,
  RefreshCw,
  Settings,
  MapPin
} from 'lucide-react';

interface Sensor {
  id: string;
  name: string;
  location: string;
  pharmacy: {
    id: string;
    name: string;
    code: string;
  } | null;
  currentTemp: number | null;
  humidity: number | null;
  lastReading: string | null;
  status: string;
  battery: number;
  signal: number;
}

export default function AllSensorsPage() {
  const { data: session } = useSession();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchSensorData();
  }, []);

  const fetchSensorData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sensors');
      if (!response.ok) {
        throw new Error('Failed to fetch sensor data');
      }
      
      const data = await response.json();
      setSensors(data.sensors);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch sensors:', err);
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'offline': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (location: string) => {
    switch(location) {
      case 'refrigerator': return <RefrigeratorIcon className="h-5 w-5 text-blue-600" />;
      case 'freezer': return <RefrigeratorIcon className="h-5 w-5 text-cyan-600" />;
      default: return <Thermometer className="h-5 w-5 text-green-600" />;
    }
  };

  const getBatteryIcon = (battery: number) => {
    if (battery > 50) return <Battery className="h-4 w-4 text-green-500" />;
    if (battery > 20) return <Battery className="h-4 w-4 text-yellow-500" />;
    return <Battery className="h-4 w-4 text-red-500" />;
  };

  const getSignalIcon = (signal: number) => {
    if (signal > -70) return <Wifi className="h-4 w-4 text-green-500" />;
    if (signal > -85) return <Wifi className="h-4 w-4 text-yellow-500" />;
    return <WifiOff className="h-4 w-4 text-red-500" />;
  };

  const filteredSensors = sensors.filter(sensor => {
    if (filterStatus === 'all') return true;
    return sensor.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading sensors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-red-800 font-semibold">Error Loading Sensors</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button 
              onClick={fetchSensorData}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Sensors</h1>
          <p className="text-gray-600 mt-1">Monitor all temperature sensors across your pharmacies</p>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="normal">Normal</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="offline">Offline</option>
          </select>
          
          <button
            onClick={fetchSensorData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{sensors.length}</div>
          <div className="text-sm text-gray-600">Total Sensors</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {sensors.filter(s => s.status === 'normal').length}
          </div>
          <div className="text-sm text-gray-600">Normal</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {sensors.filter(s => s.status === 'warning').length}
          </div>
          <div className="text-sm text-gray-600">Warning</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {sensors.filter(s => s.status === 'critical' || s.status === 'offline').length}
          </div>
          <div className="text-sm text-gray-600">Critical/Offline</div>
        </div>
      </div>

      {/* Sensors Grid */}
      {filteredSensors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSensors.map(sensor => (
            <div key={sensor.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(sensor.location)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{sensor.name}</h3>
                    {sensor.pharmacy && (
                      <p className="text-xs text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {sensor.pharmacy.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(sensor.status)}`}>
                  {sensor.status.toUpperCase()}
                </div>
              </div>

              {/* Temperature Display */}
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {sensor.currentTemp ? `${sensor.currentTemp.toFixed(1)}°F` : 'No Data'}
                </div>
                {sensor.humidity && (
                  <div className="text-sm text-gray-500">
                    Humidity: {sensor.humidity.toFixed(1)}%
                  </div>
                )}
              </div>

              {/* Sensor Status Icons */}
              <div className="flex justify-center space-x-4 mb-4">
                <div className="flex items-center space-x-1" title={`Battery: ${sensor.battery}%`}>
                  {getBatteryIcon(sensor.battery)}
                  <span className="text-xs text-gray-600">{sensor.battery}%</span>
                </div>
                <div className="flex items-center space-x-1" title={`Signal: ${sensor.signal} dBm`}>
                  {getSignalIcon(sensor.signal)}
                  <span className="text-xs text-gray-600">{sensor.signal}</span>
                </div>
              </div>

              {/* Last Reading */}
              <div className="text-center text-xs text-gray-500 mb-3">
                Last reading: {sensor.lastReading ? new Date(sensor.lastReading).toLocaleString() : 'Never'}
              </div>

              {/* Action Button */}
              <div className="text-center">
                <button className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Thermometer className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-blue-800 font-semibold">No Sensors Found</h3>
          <p className="text-blue-700 mt-1">
            {filterStatus === 'all' 
              ? 'No sensors are available. Check your sensor configuration.'
              : `No sensors with "${filterStatus}" status found.`
            }
          </p>
        </div>
      )}

      {/* Last Update */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdate.toLocaleString()}
      </div>
    </div>
  );
}