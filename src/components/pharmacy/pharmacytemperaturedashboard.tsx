"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AlertTriangle, Thermometer, RefrigeratorIcon, Clock, Calendar, Building2, Wifi, WifiOff, Battery } from 'lucide-react';

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

interface UserPharmacy {
  id: string;
  name: string;
  code: string;
}

export default function PharmacyTemperatureDashboard() {
  const { data: session } = useSession();
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [userPharmacies, setUserPharmacies] = useState<UserPharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch sensor data from database-driven API
  useEffect(() => {
    fetchSensorData();
  }, [selectedDate]);

  // Auto-select first pharmacy when user pharmacies load
  useEffect(() => {
    if (userPharmacies.length > 0 && !selectedPharmacy) {
      setSelectedPharmacy(userPharmacies[0].code);
    }
  }, [userPharmacies, selectedPharmacy]);

  const fetchSensorData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sensors');
      if (!response.ok) {
        throw new Error('Failed to fetch sensor data');
      }
      
      const data = await response.json();
      
      // Set user pharmacies from API response
      if (data.userPharmacies) {
        setUserPharmacies(data.userPharmacies);
      }
      
      // Filter sensors based on selected pharmacy if one is selected
      let filteredSensors = data.sensors;
      if (selectedPharmacy) {
        filteredSensors = data.sensors.filter((sensor: Sensor) => 
          sensor.pharmacy?.code === selectedPharmacy
        );
      }
      
      setSensors(filteredSensors);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch sensors:', err);
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchSensorData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedPharmacy]);

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
      case 'refrigerator': return <RefrigeratorIcon className="h-6 w-6 text-blue-600" />;
      case 'freezer': return <RefrigeratorIcon className="h-6 w-6 text-cyan-600" />;
      default: return <Thermometer className="h-6 w-6 text-green-600" />;
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

  const currentPharmacy = userPharmacies.find(p => p.code === selectedPharmacy);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sensor data...</p>
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
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show message if user has no assigned pharmacies
  if (userPharmacies.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <Building2 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-blue-800 font-semibold">No Pharmacies Assigned</h3>
        <p className="text-blue-700 mt-1">
          You are not assigned to any pharmacies. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Pharmacy Selector and Date Picker */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">TempRx360 - Temperature Monitoring</h1>
          <p className="text-gray-600 mt-1">
            {currentPharmacy?.name || 'All Pharmacies'} - Live sensor data
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Pharmacy Selector - only show if user has multiple pharmacies */}
          {userPharmacies.length > 1 && (
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <select
                value={selectedPharmacy}
                onChange={(e) => setSelectedPharmacy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All My Pharmacies</option>
                {userPharmacies.map(pharmacy => (
                  <option key={pharmacy.code} value={pharmacy.code}>
                    {pharmacy.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Picker */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Last Update */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* No Sensors Message */}
      {sensors.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Thermometer className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-blue-800 font-semibold">No Sensors Found</h3>
          <p className="text-blue-700 mt-1">
            {selectedPharmacy 
              ? `No sensors are assigned to ${currentPharmacy?.name}. Contact your administrator to assign sensors.`
              : 'No sensors are assigned to your pharmacies. Contact your administrator to assign sensors.'
            }
          </p>
        </div>
      )}

      {/* Temperature Status Cards */}
      {sensors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sensors.map(sensor => (
            <div key={sensor.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(sensor.location)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{sensor.name}</h3>
                    {sensor.pharmacy && (
                      <p className="text-xs text-gray-500">{sensor.pharmacy.name}</p>
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
              <div className="text-center text-xs text-gray-500">
                Last reading: {sensor.lastReading ? new Date(sensor.lastReading).toLocaleString() : 'Never'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{sensors.length}</div>
          <div className="text-sm text-gray-600">Active Sensors</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {sensors.filter(s => s.status === 'warning').length}
          </div>
          <div className="text-sm text-gray-600">Warnings</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {sensors.filter(s => s.status === 'critical' || s.status === 'offline').length}
          </div>
          <div className="text-sm text-gray-600">Critical/Offline</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {userPharmacies.length}
          </div>
          <div className="text-sm text-gray-600">My Pharmacies</div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchSensorData}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
}