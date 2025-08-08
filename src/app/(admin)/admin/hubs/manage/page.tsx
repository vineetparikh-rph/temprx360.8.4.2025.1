"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Cpu, 
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  AlertTriangle,
  RefreshCw,
  Building2,
  MapPin,
  Wifi,
  Battery,
  Activity
} from 'lucide-react';

interface Hub {
  id: string;
  name: string;
  serialNumber: string;
  macAddress?: string;
  pharmacyId?: string;
  pharmacy?: {
    id: string;
    name: string;
  };
  location?: string;
  isActive: boolean;
  lastSeen?: string;
  firmwareVersion?: string;
  createdAt: string;
  _count?: {
    sensors: number;
  };
}

interface Pharmacy {
  id: string;
  name: string;
  code: string;
}

const emptyHub: Partial<Hub> = {
  name: '',
  serialNumber: '',
  macAddress: '',
  pharmacyId: '',
  location: '',
  firmwareVersion: ''
};

export default function HubManagePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingHub, setEditingHub] = useState<Partial<Hub>>(emptyHub);
  const [isEditing, setIsEditing] = useState(false);

  // Check admin access
  useEffect(() => {
    if (session && session.user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, router]);

  // Fetch hubs
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchHubs();
    }
  }, [session]);

  const fetchHubs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/hubs');
      if (!response.ok) {
        throw new Error('Failed to fetch hubs');
      }
      
      const data = await response.json();
      setHubs(data.hubs);
      setPharmacies(data.pharmacies);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch hubs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = '/api/admin/hubs';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? { ...editingHub, id: editingHub.id }
        : editingHub;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save hub');
      }

      await fetchHubs();
      setShowModal(false);
      setEditingHub(emptyHub);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hub: Hub) => {
    if (!confirm(`Are you sure you want to delete hub "${hub.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/hubs?id=${hub.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete hub');
      }

      await fetchHubs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openAddModal = () => {
    setEditingHub(emptyHub);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (hub: Hub) => {
    setEditingHub(hub);
    setIsEditing(true);
    setShowModal(true);
  };

  if (session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Cpu className="mr-3 h-8 w-8 text-blue-600" />
              Hub Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage sensor hubs and their assignments to pharmacies
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchHubs}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Hub
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading hubs...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Hubs ({hubs.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hub Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sensors
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {hubs.map((hub) => (
                  <tr key={hub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {hub.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          SN: {hub.serialNumber}
                        </div>
                        {hub.macAddress && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            MAC: {hub.macAddress}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {hub.pharmacy ? (
                        <div>
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <Building2 className="h-4 w-4 mr-1 text-blue-600" />
                            {hub.pharmacy.name}
                          </div>
                          {hub.location && (
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <MapPin className="h-3 w-3 mr-1" />
                              {hub.location}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          hub.isActive ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <span className={`text-sm ${
                          hub.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {hub.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {hub.firmwareVersion && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          FW: {hub.firmwareVersion}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {hub._count?.sensors || 0} sensors
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(hub)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20"
                          title="Edit Hub"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(hub)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                          title="Delete Hub"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {hubs.length === 0 && (
              <div className="text-center py-12">
                <Cpu className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hubs</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by adding your first hub.
                </p>
                <div className="mt-6">
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Hub
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Hub' : 'Add New Hub'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hub Name *
                </label>
                <input
                  type="text"
                  value={editingHub.name || ''}
                  onChange={(e) => setEditingHub({ ...editingHub, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter hub name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Serial Number *
                </label>
                <input
                  type="text"
                  value={editingHub.serialNumber || ''}
                  onChange={(e) => setEditingHub({ ...editingHub, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter serial number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  MAC Address
                </label>
                <input
                  type="text"
                  value={editingHub.macAddress || ''}
                  onChange={(e) => setEditingHub({ ...editingHub, macAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter MAC address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign to Pharmacy
                </label>
                <select
                  value={editingHub.pharmacyId || ''}
                  onChange={(e) => setEditingHub({ ...editingHub, pharmacyId: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select pharmacy (optional)</option>
                  {pharmacies.map((pharmacy) => (
                    <option key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editingHub.location || ''}
                  onChange={(e) => setEditingHub({ ...editingHub, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter location within pharmacy"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Firmware Version
                </label>
                <input
                  type="text"
                  value={editingHub.firmwareVersion || ''}
                  onChange={(e) => setEditingHub({ ...editingHub, firmwareVersion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter firmware version"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editingHub.name || !editingHub.serialNumber}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save Hub'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
