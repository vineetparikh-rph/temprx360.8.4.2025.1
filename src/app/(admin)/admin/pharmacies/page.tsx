"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  Thermometer,
  MapPin,
  Phone,
  Mail,
  Plus,
  Settings,
  BarChart3,
  Activity,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye
} from 'lucide-react';

interface Pharmacy {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  licenseNumber: string;
  userCount: number;
  sensorCount: number;
  activeAlerts: number;
  lastActivity: string;
  status: 'active' | 'inactive' | 'warning';
}

export default function PharmaciesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchPharmacies();
  }, [session, status, router]);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pharmacies');
      if (!response.ok) {
        throw new Error('Failed to fetch pharmacies');
      }
      const data = await response.json();
      setPharmacies(data.pharmacies || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'inactive': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Building2 className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredPharmacies = pharmacies.filter(pharmacy => {
    if (filterStatus === 'all') return true;
    return pharmacy.status === filterStatus;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pharmacy Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage pharmacy locations, users, and monitoring systems
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/pharmacies/add"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Pharmacy
          </Link>
          <button
            onClick={fetchPharmacies}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/admin/pharmacies/assign"
          className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <Users className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">User Assignment</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Manage user access</div>
          </div>
        </Link>

        <Link
          href="/admin/pharmacies/status"
          className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <Activity className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">Status Monitor</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">System health overview</div>
          </div>
        </Link>

        <Link
          href="/admin/pharmacies/analytics"
          className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <BarChart3 className="h-6 w-6 text-purple-600 mr-3" />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">Analytics</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Performance metrics</div>
          </div>
        </Link>

        <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Building2 className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <div className="font-medium text-blue-900 dark:text-blue-100">{pharmacies.length} Total</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {pharmacies.filter(p => p.status === 'active').length} Active
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Pharmacies ({pharmacies.length})
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active ({pharmacies.filter(p => p.status === 'active').length})
        </button>
        <button
          onClick={() => setFilterStatus('warning')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'warning'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Warning ({pharmacies.filter(p => p.status === 'warning').length})
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Pharmacies Grid */}
      {filteredPharmacies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPharmacies.map(pharmacy => (
            <div key={pharmacy.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(pharmacy.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{pharmacy.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{pharmacy.code}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(pharmacy.status)}`}>
                  {pharmacy.status.toUpperCase()}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="truncate">{pharmacy.address}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{pharmacy.phone}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{pharmacy.userCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{pharmacy.sensorCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Sensors</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${pharmacy.activeAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {pharmacy.activeAlerts}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Alerts</div>
                </div>
              </div>

              {/* License Info */}
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                License: {pharmacy.licenseNumber}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Link
                  href={`/admin/pharmacies/${pharmacy.id}`}
                  className="flex-1 text-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  View Details
                </Link>
                <Link
                  href={`/admin/pharmacies/${pharmacy.id}/users`}
                  className="px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                >
                  <Users className="h-4 w-4" />
                </Link>
                <Link
                  href={`/admin/pharmacies/${pharmacy.id}/settings`}
                  className="px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pharmacies found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filterStatus === 'all' ? 'No pharmacies have been added yet.' : `No ${filterStatus} pharmacies found.`}
          </p>
          <Link
            href="/admin/pharmacies/add"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Pharmacy
          </Link>
        </div>
      )}
    </div>
  );
}