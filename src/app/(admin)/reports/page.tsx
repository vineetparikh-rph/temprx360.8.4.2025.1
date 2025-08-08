"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Calendar,
  Download,
  Mail,
  FileText,
  BarChart3,
  Thermometer,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';

interface SensorAssignment {
  id: string;
  sensorPushId: string;
  sensorName: string;
  locationType: string;
  pharmacy: {
    id: string;
    name: string;
  };
}

interface ReportSummary {
  totalReadings: number;
  averageTemp: number;
  minTemp: number;
  maxTemp: number;
  alertsCount: number;
  compliancePercentage: number;
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [sensors, setSensors] = useState<SensorAssignment[]>([]);
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSensors();
    
    // Set default dates (last 7 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    setEmailTo(session?.user?.email || '');
  }, [session]);

  const fetchSensors = async () => {
    try {
      const response = await fetch('/api/sensors');
      if (response.ok) {
        const data = await response.json();
        setSensors(data.assignments || []);
      }
    } catch (err) {
      console.error('Failed to fetch sensors:', err);
    }
  };

  const generateReport = async (format: 'pdf' | 'csv' | 'both', email: boolean = false) => {
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    if (selectedSensors.length === 0) {
      setError('Please select at least one sensor');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          startDate,
          endDate,
          sensorIds: selectedSensors,
          reportTitle: reportTitle || `Temperature Report ${startDate} to ${endDate}`,
          format,
          emailTo: email ? emailTo : undefined,
          reportType: 'custom'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      if (email) {
        const result = await response.json();
        setReportData(result.reportData);
        alert(result.emailSent ? 'Report emailed successfully!' : 'Report generated but email failed');
      } else {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportTitle || 'Temperature_Report'}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const previewReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedSensors.length > 0 && { sensorIds: selectedSensors.join(',') })
      });

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      setReportData(data);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSensorToggle = (sensorId: string) => {
    setSelectedSensors(prev => 
      prev.includes(sensorId) 
        ? prev.filter(id => id !== sensorId)
        : [...prev, sensorId]
    );
  };

  const selectAllSensors = () => {
    setSelectedSensors(sensors.map(s => s.sensorPushId));
  };

  const clearSensorSelection = () => {
    setSelectedSensors([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Temperature Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate custom temperature reports with date range and sensor selection
        </p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Report Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Range */}
          <div className="space-y-4">
            <div>
              <Label>Report Title</Label>
              <Input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Custom Temperature Report"
              />
            </div>
            
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Email To (Optional)</Label>
              <Input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
          </div>

          {/* Sensor Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Select Sensors</Label>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAllSensors}
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearSensorSelection}
                >
                  Clear
                </Button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              {sensors.length === 0 ? (
                <p className="text-gray-500 text-sm">No sensors available</p>
              ) : (
                <div className="space-y-2">
                  {sensors.map((sensor) => (
                    <label
                      key={sensor.sensorPushId}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSensors.includes(sensor.sensorPushId)}
                        onChange={() => handleSensorToggle(sensor.sensorPushId)}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{sensor.sensorName}</div>
                        <div className="text-xs text-gray-500">
                          {sensor.pharmacy.name} • {sensor.locationType}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {selectedSensors.length} of {sensors.length} sensors selected
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={previewReport}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Preview Report
          </Button>
          
          <Button
            onClick={() => generateReport('pdf')}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Download PDF
          </Button>
          
          <Button
            onClick={() => generateReport('csv')}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
          
          <Button
            onClick={() => generateReport('pdf', true)}
            disabled={loading || !emailTo}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Email PDF
          </Button>
        </div>
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Report Preview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <Thermometer className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reportData.summary.totalReadings}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Readings
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reportData.summary.averageTemp.toFixed(1)}°C
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Average Temperature
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reportData.summary.alertsCount}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Alerts Generated
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Temperature Range:</strong> {reportData.summary.minTemp.toFixed(1)}°C to {reportData.summary.maxTemp.toFixed(1)}°C</p>
            <p><strong>Date Range:</strong> {startDate} to {endDate}</p>
            <p><strong>Sensors:</strong> {selectedSensors.length} selected</p>
          </div>
        </div>
      )}
    </div>
  );
}
