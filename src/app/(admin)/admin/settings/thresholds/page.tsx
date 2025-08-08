"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Thermometer, 
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Settings,
  Building2,
  Plus,
  Trash2
} from 'lucide-react';

interface ThresholdSetting {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  location: string;
  minTemp: number;
  maxTemp: number;
  criticalMinTemp: number;
  criticalMaxTemp: number;
  alertDelay: number; // minutes
  isActive: boolean;
}

export default function TemperatureThresholdsPage() {
  const { data: session } = useSession();
  const [thresholds, setThresholds] = useState<ThresholdSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    setLoading(true);
    try {
      // Generate sample threshold data
      const data = generateSampleThresholds();
      setThresholds(data);
    } catch (error) {
      console.error('Failed to fetch thresholds:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleThresholds = (): ThresholdSetting[] => {
    const pharmacies = [
      'Georgies Family Pharmacy',
      'Georgies Specialty Pharmacy', 
      'Georgies Parlin Pharmacy',
      'Georgies Outpatient Pharmacy'
    ];

    const locations = [
      'Main Refrigerator',
      'Backup Refrigerator', 
      'Vaccine Freezer',
      'Insulin Storage',
      'Room Temperature Storage'
    ];

    const thresholds: ThresholdSetting[] = [];
    
    pharmacies.forEach((pharmacy, pharmIndex) => {
      locations.forEach((location, locIndex) => {
        // Different thresholds for different storage types
        let minTemp, maxTemp, criticalMin, criticalMax;
        
        if (location.includes('Freezer')) {
          minTemp = -25; maxTemp = -15; criticalMin = -30; criticalMax = -10;
        } else if (location.includes('Refrigerator') || location.includes('Insulin')) {
          minTemp = 2; maxTemp = 8; criticalMin = 0; criticalMax = 10;
        } else {
          minTemp = 15; maxTemp = 25; criticalMin = 10; criticalMax = 30;
        }

        thresholds.push({
          id: `threshold_${pharmIndex}_${locIndex}`,
          pharmacyId: `pharm_${pharmIndex + 1}`,
          pharmacyName: pharmacy,
          location,
          minTemp,
          maxTemp,
          criticalMinTemp: criticalMin,
          criticalMaxTemp: criticalMax,
          alertDelay: Math.floor(Math.random() * 10) + 5, // 5-15 minutes
          isActive: Math.random() > 0.1
        });
      });
    });

    return thresholds;
  };

  const updateThreshold = (id: string, field: keyof ThresholdSetting, value: any) => {
    setThresholds(prev => prev.map(threshold => 
      threshold.id === id ? { ...threshold, [field]: value } : threshold
    ));
  };

  const saveThresholds = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Temperature thresholds saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save thresholds. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const addNewThreshold = () => {
    const newThreshold: ThresholdSetting = {
      id: `threshold_new_${Date.now()}`,
      pharmacyId: '',
      pharmacyName: '',
      location: '',
      minTemp: 2,
      maxTemp: 8,
      criticalMinTemp: 0,
      criticalMaxTemp: 10,
      alertDelay: 5,
      isActive: true
    };
    
    setThresholds(prev => [...prev, newThreshold]);
  };

  const removeThreshold = (id: string) => {
    setThresholds(prev => prev.filter(threshold => threshold.id !== id));
  };

  const groupedThresholds = thresholds.reduce((acc, threshold) => {
    if (!acc[threshold.pharmacyName]) {
      acc[threshold.pharmacyName] = [];
    }
    acc[threshold.pharmacyName].push(threshold);
    return acc;
  }, {} as Record<string, ThresholdSetting[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Temperature Thresholds
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure temperature alert thresholds for different storage locations
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchThresholds}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={addNewThreshold}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Threshold
          </button>
          <button
            onClick={saveThresholds}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            )}
            <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </span>
          </div>
        </div>
      )}

      {/* Threshold Settings by Pharmacy */}
      {Object.entries(groupedThresholds).map(([pharmacyName, pharmacyThresholds]) => (
        <div key={pharmacyName} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {pharmacyName}
              </h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-300">Location</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-300">Normal Range (°C)</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-300">Critical Range (°C)</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-300">Alert Delay (min)</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pharmacyThresholds.map((threshold) => (
                    <tr key={threshold.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3">
                        <input
                          type="text"
                          value={threshold.location}
                          onChange={(e) => updateThreshold(threshold.id, 'location', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Storage location"
                        />
                      </td>
                      <td className="py-3">
                        <div className="flex space-x-1">
                          <input
                            type="number"
                            value={threshold.minTemp}
                            onChange={(e) => updateThreshold(threshold.id, 'minTemp', parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                            step="0.1"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="number"
                            value={threshold.maxTemp}
                            onChange={(e) => updateThreshold(threshold.id, 'maxTemp', parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                            step="0.1"
                          />
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex space-x-1">
                          <input
                            type="number"
                            value={threshold.criticalMinTemp}
                            onChange={(e) => updateThreshold(threshold.id, 'criticalMinTemp', parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                            step="0.1"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="number"
                            value={threshold.criticalMaxTemp}
                            onChange={(e) => updateThreshold(threshold.id, 'criticalMaxTemp', parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                            step="0.1"
                          />
                        </div>
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          value={threshold.alertDelay}
                          onChange={(e) => updateThreshold(threshold.id, 'alertDelay', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="1"
                        />
                      </td>
                      <td className="py-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={threshold.isActive}
                            onChange={(e) => updateThreshold(threshold.id, 'isActive', e.target.checked)}
                            className="mr-2"
                          />
                          <span className={`text-sm ${threshold.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                            {threshold.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => removeThreshold(threshold.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
