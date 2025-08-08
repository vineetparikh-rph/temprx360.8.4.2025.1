"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Thermometer, 
  Building2, 
  Wifi, 
  WifiOff, 
  Battery, 
  Settings,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';

interface Sensor {
  id: string;
  name: string;
  battery: number;
  signal: number;
  lastSeen: string | null;
  assignment: SensorAssignment | null;
}

interface SensorAssignment {
  id: string;
  sensorPushId: string;
  sensorName: string;
  pharmacyId: string;
  locationType: string;
  isActive: boolean;
  pharmacy: {
    id: string;
    name: string;
    code: string;
  };
}

interface Pharmacy {
  id: string;
  name: string;
  code: string;
}

export default function AdminSensorManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [assignments, setAssignments] = useState<SensorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [previewPharmacy, setPreviewPharmacy] = useState<string>('');

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Fetch sensor data
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchSensorData();
    }
  }, [session]);

  const fetchSensorData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sensors');
      if (!response.ok) {
        throw new Error('Failed to fetch sensor data');
      }
      
      const data = await response.json();
      setSensors(data.sensors);
      setPharmacies(data.pharmacies);
      setAssignments(data.assignments);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch sensors:', err);
    } finally {
      setLoading(false);
    }
  };

  const assignSensor = async (sensorId: string, sensorName: string, pharmacyId: string, locationType: string) => {
    try {
      const response = await fetch('/api/admin/sensors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensorPushId: sensorId,
          sensorName,
          pharmacyId,
          locationType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to assign sensor');
      }

      await fetchSensorData(); // Refresh data
      setAssignmentModal(false);
      setSelectedSensor(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const unassignSensor = async (sensorId: string, pharmacyId: string) => {
    try {
      const response = await fetch(`/api/admin/sensors?sensorPushId=${sensorId}&pharmacyId=${pharmacyId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to unassign sensor');
      }

      await fetchSensorData(); // Refresh data
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getAssignedSensors = (pharmacyCode: string) => {
    const pharmacy = pharmacies.find(p => p.code === pharmacyCode);
    if (!pharmacy) return [];
    
    return sensors.filter(sensor => 
      sensor.assignment?.pharmacyId === pharmacy.id && sensor.assignment?.isActive
    );
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading sensor management...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'admin') {
    return null; // Will redirect
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sensor Management</h1>
          <p className="text-gray-600 mt-1">Manage SensorPush device assignments across pharmacies</p>
        </div>
        <div className="flex space-x-3">
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
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">{sensors.length}</div>
          <div className="text-sm text-gray-600">Total Sensors</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">
            {sensors.filter(s => s.assignment?.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Assigned</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {sensors.filter(s => !s.assignment).length}
          </div>
          <div className="text-sm text-gray-600">Unassigned</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="text-2xl font-bold text-purple-600">{pharmacies.length}</div>
          <div className="text-sm text-gray-600">Pharmacies</div>
        </div>
      </div>

      {/* Pharmacy Preview */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Pharmacy Preview</h2>
          <select
            value={previewPharmacy}
            onChange={(e) => setPreviewPharmacy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select pharmacy to preview</option>
            {pharmacies.map(pharmacy => (
              <option key={pharmacy.id} value={pharmacy.code}>
                {pharmacy.name}
              </option>
            ))}
          </select>
        </div>
        
        {previewPharmacy && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">
              {pharmacies.find(p => p.code === previewPharmacy)?.name} - Assigned Sensors:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {getAssignedSensors(previewPharmacy).map(sensor => (
                <div key={sensor.id} className="border border-green-200 bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-green-900">{sensor.name}</div>
                      <div className="text-sm text-green-700 capitalize">
                        {sensor.assignment?.locationType}
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              ))}
            </div>
            {getAssignedSensors(previewPharmacy).length === 0 && (
              <p className="text-gray-500 italic">No sensors assigned to this pharmacy</p>
            )}
          </div>
        )}
      </div>

      {/* All Sensors Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All SensorPush Devices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sensor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sensors.map(sensor => (
                <tr key={sensor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Thermometer className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{sensor.name}</div>
                        <div className="text-sm text-gray-500">ID: {sensor.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {getBatteryIcon(sensor.battery)}
                        <span className="text-xs text-gray-600">{sensor.battery}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getSignalIcon(sensor.signal)}
                        <span className="text-xs text-gray-600">{sensor.signal}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sensor.assignment ? (
                      <div className="flex items-center">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="text-sm font-medium text-green-900">
                              {sensor.assignment.pharmacy.name}
                            </div>
                            <div className="text-xs text-green-700 capitalize">
                              {sensor.assignment.locationType}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSensor(sensor);
                          setAssignmentModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title={sensor.assignment ? 'Reassign' : 'Assign'}
                      >
                        {sensor.assignment ? <Settings className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                      {sensor.assignment && (
                        <button
                          onClick={() => unassignSensor(sensor.id, sensor.assignment!.pharmacyId)}
                          className="text-red-600 hover:text-red-900"
                          title="Unassign"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {assignmentModal && selectedSensor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assign Sensor</h3>
              <button
                onClick={() => {
                  setAssignmentModal(false);
                  setSelectedSensor(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sensor
                </label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedSensor.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pharmacy
                </label>
                <select
                  id="pharmacySelect"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={selectedSensor.assignment?.pharmacyId || ''}
                >
                  <option value="">Select pharmacy</option>
                  {pharmacies.map(pharmacy => (
                    <option key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Type
                </label>
                <select
                  id="locationSelect"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={selectedSensor.assignment?.locationType || 'other'}
                >
                  <option value="refrigerator">Refrigerator</option>
                  <option value="freezer">Freezer</option>
                  <option value="storage">Storage Room</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setAssignmentModal(false);
                  setSelectedSensor(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const pharmacySelect = document.getElementById('pharmacySelect') as HTMLSelectElement;
                  const locationSelect = document.getElementById('locationSelect') as HTMLSelectElement;
                  
                  if (pharmacySelect.value) {
                    assignSensor(
                      selectedSensor.id,
                      selectedSensor.name,
                      pharmacySelect.value,
                      locationSelect.value
                    );
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Assign Sensor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}