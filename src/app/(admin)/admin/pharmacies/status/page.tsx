"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Building2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Thermometer,
  Wifi,
  Battery,
  Clock,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';

interface PharmacyStatus {
  id: string;
  name: string;
  code: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastSeen: string;
  sensorsOnline: number;
  sensorsTotal: number;
  hubsOnline: number;
  hubsTotal: number;
  currentTemp: number;
  batteryLevel: number;
  signalStrength: number;
  alerts: number;
  complianceStatus: 'compliant' | 'warning' | 'critical';
}

export default function PharmacyStatusPage() {
  const { data: session } = useSession();
  const [pharmacyStatuses, setPharmacyStatuses] = useState<PharmacyStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPharmacyStatuses();
    const interval = setInterval(fetchPharmacyStatuses, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPharmacyStatuses = async () => {
    setLoading(true);
    try {
      // Generate sample status data
      const statuses = generateSampleStatuses();
      setPharmacyStatuses(statuses);
    } catch (error) {
      console.error('Failed to fetch pharmacy statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleStatuses = (): PharmacyStatus[] => {
    const pharmacies = [
      { name: 'Georgies Family Pharmacy', code: 'GFP001' },
      { name: 'Georgies Specialty Pharmacy', code: 'GSP002' },
      { name: 'Georgies Parlin Pharmacy', code: 'GPP003' },
      { name: 'Georgies Outpatient Pharmacy', code: 'GOP004' }
    ];

    return pharmacies.map((pharmacy, index) => {
      const isOnline = Math.random() > 0.2;
      const sensorsTotal = Math.floor(Math.random() * 5) + 8;
      const sensorsOnline = isOnline ? Math.floor(Math.random() * 2) + sensorsTotal - 1 : 0;
      const hubsTotal = Math.floor(Math.random() * 2) + 2;
      const hubsOnline = isOnline ? hubsTotal : 0;

      return {
        id: `pharm_${index + 1}`,
        name: pharmacy.name,
        code: pharmacy.code,
        status: isOnline ? (Math.random() > 0.8 ? 'maintenance' : 'online') : 'offline',
        lastSeen: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
        sensorsOnline,
        sensorsTotal,
        hubsOnline,
        hubsTotal,
        currentTemp: Math.round((Math.random() * 3 + 21) * 10) / 10,
        batteryLevel: Math.floor(Math.random() * 40) + 60,
        signalStrength: Math.floor(Math.random() * 30) + 70,
        alerts: Math.floor(Math.random() * 3),
        complianceStatus: sensorsOnline === sensorsTotal ? 'compliant' : sensorsOnline > sensorsTotal * 0.8 ? 'warning' : 'critical'
      };
    });
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

  const getComplianceColor = (status: string) => {
    switch(status) {
      case 'compliant': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredStatuses = pharmacyStatuses.filter(status => {
    const matchesSearch = status.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         status.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || status.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const onlineCount = pharmacyStatuses.filter(p => p.status === 'online').length;
  const offlineCount = pharmacyStatuses.filter(p => p.status === 'offline').length;
  const maintenanceCount = pharmacyStatuses.filter(p => p.status === 'maintenance').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pharmacy Status
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time monitoring of pharmacy system health and connectivity
          </p>
        </div>
        <button
          onClick={fetchPharmacyStatuses}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {onlineCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Online</div>
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
              <div className="text-sm text-gray-600 dark:text-gray-400">Offline</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {maintenanceCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Maintenance</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Thermometer className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {pharmacyStatuses.reduce((sum, p) => sum + p.sensorsOnline, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Sensors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search pharmacies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Pharmacy Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading pharmacy statuses...</p>
          </div>
        ) : filteredStatuses.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">No pharmacies found</p>
          </div>
        ) : (
          filteredStatuses.map((pharmacy) => (
            <div key={pharmacy.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Building2 className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {pharmacy.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {pharmacy.code.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(pharmacy.status)}`}>
                    {pharmacy.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Hubs Online</span>
                    <span className={`text-sm font-medium ${pharmacy.hubsOnline > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pharmacy.hubsOnline}/{pharmacy.totalHubs}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sensors Active</span>
                    <span className={`text-sm font-medium ${pharmacy.sensorsOnline > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pharmacy.sensorsOnline}/{pharmacy.totalSensors}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Last Update</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(pharmacy.lastUpdate).toLocaleString()}
                    </span>
                  </div>

                  {pharmacy.alerts > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</span>
                      <span className="text-sm font-medium text-red-600">
                        {pharmacy.alerts}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${getUptimeColor(pharmacy.uptime)}`}>
                      {pharmacy.uptime}% uptime
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}