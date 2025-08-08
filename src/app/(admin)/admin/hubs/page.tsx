"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Cpu,
  Plus,
  Search,
  Filter,
  Building2,
  Wifi,
  Battery,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit,
  Trash2,
  RefreshCw,
  Thermometer
} from 'lucide-react';

interface Hub {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  pharmacyName: string;
  pharmacyId: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastSeen: string;
  signalStrength: number;
  batteryLevel: number;
  connectedSensors: number;
  maxSensors: number;
  firmwareVersion: string;
  ipAddress: string;
  location: string;
}

export default function AllHubsPage() {
  const { data: session } = useSession();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pharmacyFilter, setPharmacyFilter] = useState('all');

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/hubs');
      if (response.ok) {
        const data = await response.json();
        setHubs(data.hubs || []);
      } else {
        // Fallback to sample data
        setHubs(generateSampleHubs());
      }
    } catch (error) {
      console.error('Failed to fetch hubs:', error);
      setHubs(generateSampleHubs());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleHubs = (): Hub[] => {
    const pharmacies = [
      { id: 'pharm_1', name: 'Georgies Family Pharmacy' },
      { id: 'pharm_2', name: 'Georgies Specialty Pharmacy' },
      { id: 'pharm_3', name: 'Georgies Parlin Pharmacy' },
      { id: 'pharm_4', name: 'Georgies Outpatient Pharmacy' }
    ];

    const hubModels = ['TempHub Pro 2.0', 'TempHub Standard', 'TempHub Mini'];
    const locations = ['Main Storage', 'Backup Storage', 'Vaccine Area', 'Dispensing Area'];

    const hubs: Hub[] = [];

    pharmacies.forEach((pharmacy, pharmIndex) => {
      const hubCount = Math.floor(Math.random() * 3) + 2; // 2-4 hubs per pharmacy

      for (let i = 0; i < hubCount; i++) {
        const isOnline = Math.random() > 0.15;
        const connectedSensors = Math.floor(Math.random() * 6) + 2;

        hubs.push({
          id: `hub_${pharmIndex}_${i}`,
          name: `Hub ${String.fromCharCode(65 + i)}`, // Hub A, Hub B, etc.
          serialNumber: `TH${(pharmIndex + 1).toString().padStart(2, '0')}${(i + 1).toString().padStart(3, '0')}`,
          model: hubModels[Math.floor(Math.random() * hubModels.length)],
          pharmacyName: pharmacy.name,
          pharmacyId: pharmacy.id,
          status: isOnline ? (Math.random() > 0.9 ? 'maintenance' : 'online') : 'offline',
          lastSeen: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
          signalStrength: Math.floor(Math.random() * 30) + 70,
          batteryLevel: Math.floor(Math.random() * 40) + 60,
          connectedSensors,
          maxSensors: 8,
          firmwareVersion: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 200) + 50}`,
          location: locations[Math.floor(Math.random() * locations.length)]
        });
      }
    });

    return hubs;
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

  const getSignalIcon = (strength: number) => {
    if (strength >= 80) return <Wifi className="h-4 w-4 text-green-600" />;
    if (strength >= 60) return <Wifi className="h-4 w-4 text-yellow-600" />;
    return <Wifi className="h-4 w-4 text-red-600" />;
  };

  const getBatteryColor = (level: number) => {
    if (level >= 80) return 'text-green-600';
    if (level >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredHubs = hubs.filter(hub => {
    const matchesSearch = hub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hub.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hub.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || hub.status === statusFilter;
    const matchesPharmacy = pharmacyFilter === 'all' || hub.pharmacyId === pharmacyFilter;

    return matchesSearch && matchesStatus && matchesPharmacy;
  });

  const uniquePharmacies = Array.from(new Set(hubs.map(hub => ({
    id: hub.pharmacyId,
    name: hub.pharmacyName
  }))));

  const onlineCount = hubs.filter(h => h.status === 'online').length;
  const offlineCount = hubs.filter(h => h.status === 'offline').length;
  const totalSensors = hubs.reduce((sum, h) => sum + h.connectedSensors, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            All Hubs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and monitor all temperature monitoring hubs
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchHubs}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Hub
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{hubs.length}</div>
          <div className="text-sm text-gray-600">Total Hubs</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{onlineCount}</div>
          <div className="text-sm text-gray-600">Online</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{offlineCount}</div>
          <div className="text-sm text-gray-600">Offline</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{totalSensors}</div>
          <div className="text-sm text-gray-600">Connected Sensors</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search hubs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
              <option value="error">Error</option>
            </select>
            <select
              value={pharmacyFilter}
              onChange={(e) => setPharmacyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Pharmacies</option>
              {uniquePharmacies.map(pharmacy => (
                <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hubs Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hub Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pharmacy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sensors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Signal/Battery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading hubs...
                  </td>
                </tr>
              ) : filteredHubs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No hubs found
                  </td>
                </tr>
              ) : (
                filteredHubs.map((hub) => (
                  <tr key={hub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Cpu className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{hub.name}</div>
                          <div className="text-sm text-gray-500">{hub.serialNumber}</div>
                          <div className="text-xs text-gray-400">{hub.model}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{hub.pharmacyName}</div>
                      <div className="text-sm text-gray-500">{hub.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(hub.status)}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(hub.status)}`}>
                          {hub.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Last seen: {new Date(hub.lastSeen).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Thermometer className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {hub.connectedSensors}/{hub.maxSensors}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">sensors</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          {getSignalIcon(hub.signalStrength)}
                          <span className="ml-1 text-xs text-gray-600">{hub.signalStrength}%</span>
                        </div>
                        <div className="flex items-center">
                          <Battery className={`h-4 w-4 mr-1 ${getBatteryColor(hub.batteryLevel)}`} />
                          <span className={`text-xs ${getBatteryColor(hub.batteryLevel)}`}>
                            {hub.batteryLevel}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}