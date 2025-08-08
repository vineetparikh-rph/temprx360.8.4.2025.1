"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ChevronDownIcon,
  ChevronLeftIcon
} from '@/icons';
import { 
  AlertTriangle, 
  Thermometer, 
  RefrigeratorIcon, 
  Clock, 
  Calendar, 
  Building2, 
  Wifi, 
  WifiOff, 
  Battery,
  Cpu,
  MapPin,
  RefreshCw
} from 'lucide-react';

interface Sensor {
  id: string;
  name: string;
  location: string;
  currentTemp: number | null;
  humidity: number | null;
  lastReading: string | null;
  status: string;
  battery: number;
  signal: number;
  hubId?: string;
}

interface Hub {
  id: string;
  name: string;
  status: string;
  connectedSensors: Sensor[];
  lastSeen?: string;
}

interface Pharmacy {
  id: string;
  name: string;
  code: string;
  hubs: Hub[];
  directSensors: Sensor[];
  _count: {
    gateways: number;
    sensors: number;
    userPharmacies: number;
  };
}

export default function TemperatureMonitoringPage() {
  const { data: session, status } = useSession();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [expandedPharmacies, setExpandedPharmacies] = useState<Set<string>>(new Set());
  const [expandedHubs, setExpandedHubs] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (status === "loading") return; // Still loading
    
    if (!session) {
      // Redirect to sign in if not authenticated
      window.location.href = '/signin';
      return;
    }
    
    // Only fetch data if authenticated
    fetchRealSensorData();
  }, [session, status]);

  // Show loading while checking auth
  if (status === "loading") {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  // Show sign in prompt if not authenticated
  if (!session) {
    return <div className="flex justify-center items-center h-64">Redirecting to sign in...</div>;
  }

  const fetchRealSensorData = async () => {
    setLoading(true);
    try {
      // Fetch from your existing API endpoints
      const pharmaciesResponse = await fetch('/api/admin/pharmacies');

      if (!pharmaciesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const pharmaciesData = await pharmaciesResponse.json();

      // Debug logging
      console.log('Pharmacies Data:', pharmaciesData);

      // Process the real data into the expected format
      const processedPharmacies = processPharmacyData(
        pharmaciesData.pharmacies || []
      );

      console.log('Processed Pharmacies:', processedPharmacies);

      setPharmacies(processedPharmacies);
      setError(null);
      
      // Auto-expand first pharmacy
      if (processedPharmacies.length > 0) {
        setExpandedPharmacies(new Set([processedPharmacies[0].id]));
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch sensor data:', err);
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  const processPharmacyData = (pharmaciesData: any[]) => {
    // Convert pharmacy data to the expected format
    return pharmaciesData.map(pharmacy => ({
      id: pharmacy.id.toString(),
      name: pharmacy.name,
      code: pharmacy.code,
      hubs: [], // Will be populated when we add hub/sensor fetching
      directSensors: [],
      _count: pharmacy._count || { gateways: 0, sensors: 0, userPharmacies: 0 }
    }));
  };

  const togglePharmacy = (pharmacyId: string) => {
    const newExpanded = new Set(expandedPharmacies);
    if (newExpanded.has(pharmacyId)) {
      newExpanded.delete(pharmacyId);
    } else {
      newExpanded.add(pharmacyId);
    }
    setExpandedPharmacies(newExpanded);
  };

  const toggleHub = (hubId: string) => {
    const newExpanded = new Set(expandedHubs);
    if (newExpanded.has(hubId)) {
      newExpanded.delete(hubId);
    } else {
      newExpanded.add(hubId);
    }
    setExpandedHubs(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'normal': case 'online': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': case 'offline': return 'bg-red-100 text-red-800 border-red-200';
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

  // Calculate totals from real data
  const totalSensors = pharmacies.reduce((total, pharmacy) => {
    return total + (pharmacy._count?.sensors || 0);
  }, 0);

  const totalHubs = pharmacies.reduce((total, pharmacy) => {
    return total + (pharmacy._count?.gateways || 0);
  }, 0);

  // For now, assume all hubs are connected (you can improve this later)
  const connectedHubs = totalHubs;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading temperature monitoring data...</p>
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
            <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button 
              onClick={fetchRealSensorData}
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
          <h1 className="text-3xl font-bold text-gray-900">TempRx360 - Temperature Monitoring</h1>
          <p className="text-gray-600 mt-1">Real-time temperature monitoring organized by pharmacy and hub</p>
        </div>
        
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>

          <button
            onClick={fetchRealSensorData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{pharmacies.length}</div>
          <div className="text-sm text-gray-600">Pharmacies</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{totalHubs}</div>
          <div className="text-sm text-gray-600">Total Hubs</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalSensors}</div>
          <div className="text-sm text-gray-600">Total Sensors</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{connectedHubs}</div>
          <div className="text-sm text-gray-600">Connected Hubs</div>
        </div>
      </div>

      {/* No Data Message */}
      {pharmacies.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Thermometer className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-blue-800 font-semibold">No Sensor Data Available</h3>
          <p className="text-blue-700 mt-1">
            No sensors are currently assigned to pharmacies or no data is available for the selected date.
          </p>
        </div>
      )}

      {/* Pharmacy Cards */}
      <div className="space-y-4">
        {pharmacies.map(pharmacy => (
          <div key={pharmacy.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Pharmacy Header */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => togglePharmacy(pharmacy.id)}
            >
              <div className="flex items-center space-x-3">
                {expandedPharmacies.has(pharmacy.id) ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5 text-gray-500 rotate-180" />
                )}
                <Building2 className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{pharmacy.name}</h3>
                  <p className="text-sm text-gray-500">
                    {pharmacy._count?.gateways || 0} hubs • {pharmacy._count?.sensors || 0} sensors
                  </p>
                </div>
              </div>
            </div>

            {/* Expanded Pharmacy Content */}
            {expandedPharmacies.has(pharmacy.id) && (
              <div className="border-t border-gray-200 p-4">
                <div className="text-center text-gray-500 py-8">
                  <Cpu className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>Hub and sensor details will be displayed here</p>
                  <p className="text-sm mt-2">
                    This pharmacy has {pharmacy._count?.gateways || 0} gateway(s) and {pharmacy._count?.sensors || 0} sensor(s)
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}