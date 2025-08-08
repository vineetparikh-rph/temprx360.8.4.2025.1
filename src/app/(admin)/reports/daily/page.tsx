"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  Calendar,
  Building2,
  Download,
  Mail,
  FileText,
  Thermometer,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Pharmacy {
  id: string;
  name: string;
  code: string;
}

interface DailyReportData {
  pharmacy: Pharmacy;
  date: string;
  totalReadings: number;
  averageTemp: number;
  minTemp: number;
  maxTemp: number;
  averageHumidity: number;
  excursions: number;
  complianceRate: number;
  sensorsActive: number;
  sensorsTotal: number;
  readings: {
    timestamp: string;
    sensorName: string;
    location: string;
    temperature: number;
    humidity: number;
    status: 'normal' | 'warning' | 'critical';
  }[];
}

export default function DailyReportsPage() {
  const { data: session } = useSession();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [reportData, setReportData] = useState<DailyReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState('');

  // Calendar state
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const startCalendarRef = useRef<HTMLDivElement>(null);
  const endCalendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPharmacies();
  }, []);

  // Handle click outside calendar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (startCalendarRef.current && !startCalendarRef.current.contains(event.target as Node)) {
        setShowStartCalendar(false);
      }
      if (endCalendarRef.current && !endCalendarRef.current.contains(event.target as Node)) {
        setShowEndCalendar(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDateSelect = (day: number, isStartDate: boolean) => {
    const selectedDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const dateStr = selectedDate.toISOString().split('T')[0];

    if (isStartDate) {
      setStartDate(dateStr);
      setShowStartCalendar(false);
    } else {
      setEndDate(dateStr);
      setShowEndCalendar(false);
    }
  };

  // Debug logging
  console.log('Daily Reports - Pharmacies:', pharmacies);
  console.log('Daily Reports - Selected Pharmacy:', selectedPharmacy);
  console.log('Daily Reports - Start Date:', startDate);
  console.log('Daily Reports - End Date:', endDate);

  const fetchPharmacies = async () => {
    try {
      const response = await fetch('/api/admin/pharmacies');
      if (response.ok) {
        const data = await response.json();
        setPharmacies(data.pharmacies || []);
        if (data.pharmacies?.length > 0) {
          setSelectedPharmacy(data.pharmacies[0].id);
        }
      } else {
        // Fallback to sample pharmacies if API fails
        const samplePharmacies = [
          { id: 'pharm_1', name: 'Georgies Family Pharmacy', code: 'family' },
          { id: 'pharm_2', name: 'Georgies Specialty Pharmacy', code: 'specialty' },
          { id: 'pharm_3', name: 'Georgies Parlin Pharmacy', code: 'parlin' },
          { id: 'pharm_4', name: 'Georgies Outpatient Pharmacy', code: 'outpatient' }
        ];
        setPharmacies(samplePharmacies);
        setSelectedPharmacy(samplePharmacies[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch pharmacies:', error);
      // Fallback to sample pharmacies
      const samplePharmacies = [
        { id: 'pharm_1', name: 'Georgies Family Pharmacy', code: 'family' },
        { id: 'pharm_2', name: 'Georgies Specialty Pharmacy', code: 'specialty' },
        { id: 'pharm_3', name: 'Georgies Parlin Pharmacy', code: 'parlin' },
        { id: 'pharm_4', name: 'Georgies Outpatient Pharmacy', code: 'outpatient' }
      ];
      setPharmacies(samplePharmacies);
      setSelectedPharmacy(samplePharmacies[0].id);
    }
  };

  const fetchReportData = async () => {
    if (!selectedPharmacy || !startDate || !endDate) {
      console.log('Missing required fields:', { selectedPharmacy, startDate, endDate });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: selectedPharmacy,
          startDate,
          endDate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      setReportData(data.reports || []);
    } catch (err: any) {
      console.log('API failed, generating sample data:', err.message);
      setError(err.message);
      // Generate sample data for demo
      const sampleData = generateSampleDailyData();
      console.log('Generated sample data:', sampleData);
      setReportData(sampleData);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleDailyData = (): DailyReportData[] => {
    const pharmacy = pharmacies.find(p => p.id === selectedPharmacy);
    if (!pharmacy) return [];

    const reports: DailyReportData[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      reports.push({
        pharmacy,
        date: dateStr,
        totalReadings: Math.floor(Math.random() * 500) + 200,
        averageTemp: Math.round((Math.random() * 5 + 20) * 10) / 10,
        minTemp: Math.round((Math.random() * 3 + 18) * 10) / 10,
        maxTemp: Math.round((Math.random() * 3 + 23) * 10) / 10,
        averageHumidity: Math.round((Math.random() * 20 + 40) * 10) / 10,
        excursions: Math.floor(Math.random() * 3),
        complianceRate: Math.round((Math.random() * 10 + 90) * 10) / 10,
        sensorsActive: Math.floor(Math.random() * 3) + 8,
        sensorsTotal: 10,
        readings: generateSampleReadings(dateStr)
      });
    }

    return reports;
  };

  const generateSampleReadings = (date: string) => {
    const readings = [];
    const sensors = ['Refrigerator A', 'Refrigerator B', 'Freezer A', 'Room Temp', 'Vaccine Storage'];
    const locations = ['Main Storage', 'Backup Storage', 'Vaccine Area', 'Dispensing Area', 'Prep Room'];

    for (let i = 0; i < 20; i++) {
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      const timestamp = `${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;

      readings.push({
        timestamp,
        sensorName: sensors[i % sensors.length],
        location: locations[i % locations.length],
        temperature: Math.round((Math.random() * 5 + 20) * 10) / 10,
        humidity: Math.round((Math.random() * 20 + 40) * 10) / 10,
        status: Math.random() > 0.9 ? 'warning' : 'normal' as 'normal' | 'warning' | 'critical'
      });
    }

    return readings.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  };

  const generateReport = async (action: 'download' | 'email') => {
    if (!selectedPharmacy || !startDate || !endDate) return;
    if (action === 'email' && !emailTo) return;

    setGenerating(true);

    try {
      const response = await fetch('/api/reports/daily/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: selectedPharmacy,
          startDate,
          endDate,
          action,
          emailTo: action === 'email' ? emailTo : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      if (action === 'download') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Daily_Report_${selectedPharmacy}_${startDate}_${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert(data.message || 'Report emailed successfully');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const selectedPharmacyData = pharmacies.find(p => p.id === selectedPharmacy);

  // Calendar component
  const renderCalendar = (isStartDate: boolean) => {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const days = [];
    const today = new Date();
    const selectedDateStr = isStartDate ? startDate : endDate;
    const selectedDate = new Date(selectedDateStr);

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      const isToday = dayDate.toDateString() === today.toDateString();
      const isSelected = dayDate.toDateString() === selectedDate.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day, isStartDate)}
          className={`w-8 h-8 text-sm rounded-md hover:bg-blue-100 dark:hover:bg-blue-900 ${
            isSelected
              ? 'bg-blue-600 text-white'
              : isToday
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 z-50">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="font-medium text-gray-900 dark:text-white">
            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="w-8 h-8 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Daily Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Generate daily temperature monitoring reports for selected date ranges
        </p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Report Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pharmacy Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pharmacy
            </label>
            <select
              value={selectedPharmacy}
              onChange={(e) => setSelectedPharmacy(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Pharmacy</option>
              {pharmacies.map(pharmacy => (
                <option key={pharmacy.id} value={pharmacy.id}>
                  {pharmacy.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="relative" ref={startCalendarRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <button
              onClick={() => {
                setShowStartCalendar(!showStartCalendar);
                setShowEndCalendar(false);
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
            >
              <span>{formatDateForDisplay(startDate)}</span>
              <Calendar className="h-4 w-4 text-gray-400" />
            </button>
            {showStartCalendar && renderCalendar(true)}
          </div>

          {/* End Date */}
          <div className="relative" ref={endCalendarRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <button
              onClick={() => {
                setShowEndCalendar(!showEndCalendar);
                setShowStartCalendar(false);
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
            >
              <span>{formatDateForDisplay(endDate)}</span>
              <Calendar className="h-4 w-4 text-gray-400" />
            </button>
            {showEndCalendar && renderCalendar(false)}
          </div>

          {/* Generate Button */}
          <div className="flex items-end space-x-2">
            <button
              onClick={fetchReportData}
              disabled={!selectedPharmacy || !startDate || !endDate || loading}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Loading...' : 'Generate Data'}
            </button>

            <button
              onClick={() => {
                console.log('Generating sample data directly...');
                const sampleData = generateSampleDailyData();
                console.log('Sample data:', sampleData);
                setReportData(sampleData);
                setError('Using sample data for demonstration');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              title="Generate sample data"
            >
              Sample
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">
              API not available - showing sample data. {error}
            </span>
          </div>
        </div>
      )}

      {/* Report Data Display */}
      {reportData.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <Thermometer className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reportData.reduce((sum, r) => sum + r.totalReadings, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Readings</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(reportData.reduce((sum, r) => sum + r.complianceRate, 0) / reportData.length)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Compliance</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reportData.reduce((sum, r) => sum + r.excursions, 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Excursions</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reportData.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Days Covered</div>
                </div>
              </div>
            </div>
          </div>

          {/* Report Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Generate Report
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email To (Optional)
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2 flex space-x-3">
                <button
                  onClick={() => generateReport('download')}
                  disabled={generating || !selectedPharmacy || !startDate || !endDate}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {generating ? 'Generating...' : 'Download PDF'}
                </button>

                <button
                  onClick={() => generateReport('email')}
                  disabled={generating || !emailTo || !selectedPharmacy || !startDate || !endDate}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Report
                </button>
              </div>
            </div>
          </div>

          {/* Daily Report Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Daily Report Data - {selectedPharmacyData?.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {startDate} to {endDate}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Readings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Avg Temp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Min/Max
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Humidity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Excursions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Compliance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sensors
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.map((report, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(report.date).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {report.totalReadings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {report.averageTemp}°C
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-1">
                          <TrendingDown className="h-3 w-3 text-blue-500" />
                          <span>{report.minTemp}°C</span>
                          <span className="text-gray-400">/</span>
                          <TrendingUp className="h-3 w-3 text-red-500" />
                          <span>{report.maxTemp}°C</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {report.averageHumidity}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          report.excursions === 0
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {report.excursions}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                report.complianceRate >= 95 ? 'bg-green-600' :
                                report.complianceRate >= 90 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${report.complianceRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {report.complianceRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {report.sensorsActive}/{report.sensorsTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* No Data Message */}
      {reportData.length === 0 && !loading && selectedPharmacy && startDate && endDate && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Report Data</h3>
          <p className="text-gray-600 dark:text-gray-400">
            No data available for the selected pharmacy and date range. Try selecting different dates or check if sensors are active.
          </p>
        </div>
      )}
    </div>
  );
}