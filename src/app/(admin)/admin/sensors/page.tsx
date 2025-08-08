"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Thermometer, 
  Plus, 
  Search, 
  Filter,
  Building2,
  Cpu,
  Battery,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit,
  Trash2,
  RefreshCw,
  MapPin
} from 'lucide-react';

interface Sensor {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  pharmacyName: string;
  pharmacyId: string;
  hubName: string;
  hubId: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  currentTemp: number;
  batteryLevel: number;
  lastReading: string;
  location: string;
  alertsCount: number;
  calibrationDate: string;
  firmwareVersion: string;
}

export default function AllSensorsPage() {
  const { data: session } = useSession();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pharmacyFilter, setPharmacyFilter] = useState('all');

  useEffect(() => {
    fetchSensors();
  }, []);

  const fetchSensors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sensors');
      if (response.ok) {
        const data = await response.json();
        setSensors(data.sensors || []);
      } else {
        // Fallback to sample data
        setSensors(generateSampleSensors());
      }
    } catch (error) {
      console.error('Failed to fetch sensors:', error);
      setSensors(generateSampleSensors());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleSensors = (): Sensor[] => {
    const pharmacies = [
      { id: 'pharm_1', name: 'Georgies Family Pharmacy' },
      { id: 'pharm_2', name: 'Georgies Specialty Pharmacy' },
      { id: 'pharm_3', name: 'Georgies Parlin Pharmacy' },
      { id: 'pharm_4', name: 'Georgies Outpatient Pharmacy' }
    ];

    const sensorModels = ['TempSense Pro', 'TempSense Standard', 'TempSense Wireless'];
    const locations = [
      'Main Refrigerator', 'Backup Refrigerator', 'Vaccine Freezer', 
      'Insulin Storage', 'Room Temperature', 'Controlled Substances',
      'Compounding Area', 'Storage Room A', 'Storage Room B'
    ];
    
    const sensors: Sensor[] = [];
    
    pharmacies.forEach((pharmacy, pharmIndex) => {
      const sensorCount = Math.floor(Math.random() * 8) + 8; // 8-15 sensors per pharmacy
      
      for (let i = 0; i < sensorCount; i++) {
        const isOnline = Math.random() > 0.1;
        const hubIndex = Math.floor(i / 4); // 4 sensors per hub roughly
        
        sensors.push({
          id: `sensor_${pharmIndex}_${i}`,
          name: `Sensor ${i + 1}`,
          serialNumber: `TS${(pharmIndex + 1).toString().padStart(2, '0')}${(i + 1).toString().padStart(3, '0')}`,
          model: sensorModels[Math.floor(Math.random() * sensorModels.length)],
          pharmacyName: pharmacy.name,
          pharmacyId: pharmacy.id,
          hubName: `Hub ${String.fromCharCode(65 + hubIndex)}`,
          hubId: `hub_${pharmIndex}_${hubIndex}`,
          status: isOnline ? (Math.random() > 0.95 ? 'maintenance' : 'online') : 'offline',
          currentTemp: Math.round((Math.random() * 6 + 19) * 10) / 10,
          batteryLevel: Math.floor(Math.random() * 40) + 60,
          lastReading: new Date(Date.now() - Math.random() * 30 * 60 * 1000).toISOString(),
          location: locations[Math.floor(Math.random() * locations.length)],
          alertsCount: Math.floor(Math.random() * 3),
          calibrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          firmwareVersion: `v${Math.floor(Math.random() * 2) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`
        });
      }
    });
    
    return sensors;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'bg-green-100 text-green-800 border-green-200';
      case 'offline': return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'offline': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTempColor = (temp: number) => {
    if (temp >= 2 && temp <= 8) return 'text-green-600'; // Normal range
    if (temp >= 0 && temp <= 10) return 'text-yellow-600'; // Warning range
    return 'text-red-600'; // Critical range
  };

  const getBatteryColor = (level: number) => {
    if (level >= 80) return 'text-green-600';
    if (level >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredSensors = sensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sensor.status === statusFilter;
    const matchesPharmacy = pharmacyFilter === 'all' || sensor.pharmacyId === pharmacyFilter;
    
    return matchesSearch && matchesStatus && matchesPharmacy;
  });

  const uniquePharmacies = Array.from(new Set(sensors.map(sensor => ({ 
    id: sensor.pharmacyId, 
    name: sensor.pharmacyName 
  }))));

  const onlineCount = sensors.filter(s => s.status === 'online').length;
  const offlineCount = sensors.filter(s => s.status === 'offline').length;
  const alertsCount = sensors.reduce((sum, s) => sum + s.alertsCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            All Sensors
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and monitor all temperature sensors across all locations
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchSensors}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Sensor
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {onlineCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Online Sensors</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {offlineCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Offline Sensors</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {alertsCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Thermometer className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {sensors.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Sensors</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
