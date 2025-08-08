"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  AlertTriangle,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  Shield
} from 'lucide-react';

interface Pharmacy {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  fax?: string;
  email?: string;
  npi?: string;
  ncpdp?: string;
  dea?: string;
  licenseNumber?: string;
  pharmacistInCharge?: string;
  picLicense?: string;
  picPhone?: string;
  picEmail?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    userPharmacies: number;
    sensorAssignments: number;
  };
}

const emptyPharmacy: Partial<Pharmacy> = {
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  fax: '',
  email: '',
  npi: '',
  ncpdp: '',
  dea: '',
  licenseNumber: '',
  pharmacistInCharge: '',
  picLicense: '',
  picPhone: '',
  picEmail: ''
};

export default function AdminPharmacyManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<Partial<Pharmacy>>(emptyPharmacy);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Fetch pharmacies
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchPharmacies();
    }
  }, [session]);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pharmacies');
      if (!response.ok) {
        throw new Error('Failed to fetch pharmacies');
      }
      
      const data = await response.json();
      setPharmacies(data.pharmacies);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch pharmacies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = '/api/admin/pharmacies';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? { ...editingPharmacy, id: editingPharmacy.id }
        : editingPharmacy;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save pharmacy');
      }

      await fetchPharmacies();
      setShowModal(false);
      setEditingPharmacy(emptyPharmacy);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pharmacy: Pharmacy) => {
    setEditingPharmacy(pharmacy);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (pharmacy: Pharmacy) => {
    if (!confirm(`Are you sure you want to delete "${pharmacy.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/pharmacies?id=${pharmacy.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete pharmacy');
      }

      await fetchPharmacies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditingPharmacy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading pharmacy management...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'admin') {
    return null;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-red-800 font-semibold">Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button 
              onClick={fetchPharmacies}
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pharmacy Management</h1>
          <p className="text-gray-600 mt-1">Manage pharmacy locations and information</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchPharmacies}
            className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => {
              setEditingPharmacy(emptyPharmacy);
              setIsEditing(false);
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Pharmacy
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">{pharmacies.length}</div>
          <div className="text-sm text-gray-600">Total Pharmacies</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">
            {pharmacies.filter(p => p.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="text-2xl font-bold text-purple-600">
            {pharmacies.reduce((sum, p) => sum + (p._count?.sensorAssignments || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Sensors</div>
        </div>
      </div>

      {/* Pharmacies Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Pharmacies</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pharmacy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Regulatory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sensors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pharmacies.map(pharmacy => (
                <tr key={pharmacy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pharmacy.name}</div>
                        <div className="text-sm text-gray-500">Code: {pharmacy.code}</div>
                        {pharmacy.address && (
                          <div className="text-xs text-gray-400 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {pharmacy.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pharmacy.phone && (
                      <div className="flex items-center mb-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {pharmacy.phone}
                      </div>
                    )}
                    {pharmacy.email && (
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {pharmacy.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pharmacy.npi && <div>NPI: {pharmacy.npi}</div>}
                    {pharmacy.dea && <div>DEA: {pharmacy.dea}</div>}
                    {pharmacy.ncpdp && <div>NCPDP: {pharmacy.ncpdp}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-lg font-semibold text-blue-600">
                      {pharmacy._count?.sensorAssignments || 0}
                    </div>
                    <div className="text-xs">sensors</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(pharmacy)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pharmacy)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                        disabled={pharmacy._count?.sensorAssignments! > 0 || pharmacy._count?.userPharmacies! > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? 'Edit Pharmacy' : 'Add New Pharmacy'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  Basic Information
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pharmacy Name *
                  </label>
                  <input
                    type="text"
                    value={editingPharmacy.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pharmacy Code *
                  </label>
                  <input
                    type="text"
                    value={editingPharmacy.code || ''}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={editingPharmacy.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={editingPharmacy.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={editingPharmacy.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={editingPharmacy.zipCode || ''}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Contact & Regulatory */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Information
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editingPharmacy.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fax
                  </label>
                  <input
                    type="tel"
                    value={editingPharmacy.fax || ''}
                    onChange={(e) => handleInputChange('fax', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingPharmacy.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <h4 className="font-medium text-gray-900 flex items-center mt-6">
                  <Shield className="h-4 w-4 mr-2" />
                  Regulatory Information
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NPI Number
                  </label>
                  <input
                    type="text"
                    value={editingPharmacy.npi || ''}
                    onChange={(e) => handleInputChange('npi', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NCPDP ID
                  </label>
                  <input
                    type="text"
                    value={editingPharmacy.ncpdp || ''}
                    onChange={(e) => handleInputChange('ncpdp', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DEA Number
                  </label>
                  <input
                    type="text"
                    value={editingPharmacy.dea || ''}
                    onChange={(e) => handleInputChange('dea', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={editingPharmacy.licenseNumber || ''}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Pharmacist Information */}
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Pharmacist in Charge
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pharmacist Name
                  </label>
                  <input
                    type="text"
                    value={editingPharmacy.pharmacistInCharge || ''}
                    onChange={(e) => handleInputChange('pharmacistInCharge', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIC License Number
                  </label>
                  <input
                    type="text"
                    value={editingPharmacy.picLicense || ''}
                    onChange={(e) => handleInputChange('picLicense', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIC Phone
                  </label>
                  <input
                    type="tel"
                    value={editingPharmacy.picPhone || ''}
                    onChange={(e) => handleInputChange('picPhone', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIC Email
                  </label>
                  <input
                    type="email"
                    value={editingPharmacy.picEmail || ''}
                    onChange={(e) => handleInputChange('picEmail', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editingPharmacy.name || !editingPharmacy.code}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update' : 'Create'} Pharmacy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}