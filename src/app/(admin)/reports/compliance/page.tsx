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
  Shield,
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

interface ComplianceReportData {
  pharmacy: Pharmacy;
  date: string;
  morningReading: {
    timestamp: string;
    temperature: number;
    humidity: number;
    status: 'compliant' | 'warning' | 'critical';
    sensorCount: number;
  };
  eveningReading: {
    timestamp: string;
    temperature: number;
    humidity: number;
    status: 'compliant' | 'warning' | 'critical';
    sensorCount: number;
  };
  dailyCompliance: number;
  excursions: number;
  notes?: string;
}

export default function ComplianceReportsPage() {
  const { data: session } = useSession();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ComplianceReportData[]>([]);
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
    if (!selectedPharmacy || !startDate || !endDate) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: selectedPharmacy,
          startDate,
          endDate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch compliance data');
      }

      const data = await response.json();
      setReportData(data.reports || []);
    } catch (err: any) {
      setError(err.message);
      // Generate sample data for demo
      setReportData(generateSampleComplianceData());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleComplianceData = (): ComplianceReportData[] => {
    const pharmacy = pharmacies.find(p => p.id === selectedPharmacy);
    if (!pharmacy) return [];

    const reports: ComplianceReportData[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      // Generate 10am reading
      const morningTemp = Math.round((Math.random() * 3 + 21) * 10) / 10;
      const morningHumidity = Math.round((Math.random() * 15 + 45) * 10) / 10;
      const morningStatus = morningTemp >= 20 && morningTemp <= 25 ? 'compliant' :
                           morningTemp >= 18 && morningTemp <= 27 ? 'warning' : 'critical';

      // Generate 5pm reading
      const eveningTemp = Math.round((Math.random() * 3 + 21) * 10) / 10;
      const eveningHumidity = Math.round((Math.random() * 15 + 45) * 10) / 10;
      const eveningStatus = eveningTemp >= 20 && eveningTemp <= 25 ? 'compliant' :
                           eveningTemp >= 18 && eveningTemp <= 27 ? 'warning' : 'critical';

      const excursions = Math.floor(Math.random() * 2);
      const dailyCompliance = morningStatus === 'compliant' && eveningStatus === 'compliant' && excursions === 0 ? 100 :
                             morningStatus !== 'critical' && eveningStatus !== 'critical' ? 85 : 60;

      reports.push({
        pharmacy,
        date: dateStr,
        morningReading: {
          timestamp: `${dateStr}T10:00:00`,
          temperature: morningTemp,
          humidity: morningHumidity,
          status: morningStatus,
          sensorCount: Math.floor(Math.random() * 3) + 8
        },
        eveningReading: {
          timestamp: `${dateStr}T17:00:00`,
          temperature: eveningTemp,
          humidity: eveningHumidity,
          status: eveningStatus,
          sensorCount: Math.floor(Math.random() * 3) + 8
        },
        dailyCompliance,
        excursions,
        notes: excursions > 0 ? 'Temperature excursion detected during day' : undefined
      });
    }

    return reports;
  };

  const generateReport = async (action: 'download' | 'email') => {
    if (!selectedPharmacy || !startDate || !endDate) return;
    if (action === 'email' && !emailTo) return;

    setGenerating(true);

    try {
      const response = await fetch('/api/reports/compliance/generate', {
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
        throw new Error('Failed to generate compliance report');
      }

      if (action === 'download') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Compliance_Report_${selectedPharmacy}_${startDate}_${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert(data.message || 'Compliance report emailed successfully');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
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
          Compliance Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Generate compliance reports with 10am and 5pm temperature readings
        </p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Compliance Report Configuration
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
          <div className="flex items-end">
            <button
              onClick={fetchReportData}
              disabled={!selectedPharmacy || !startDate || !endDate || loading}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Loading...' : 'Generate Data'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Compliance Monitoring Schedule
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                This report shows temperature readings taken at <strong>10:00 AM</strong> and <strong>5:00 PM</strong> daily
                for compliance verification. Each reading includes temperature, humidity, and compliance status.
              </p>
            </div>
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
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(reportData.reduce((sum, r) => sum + r.dailyCompliance, 0) / reportData.length)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Compliance</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reportData.length * 2}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Readings</div>
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
                  <div className="text-sm text-gray-600 dark:text-gray-400">Days Monitored</div>
                </div>
              </div>
            </div>
          </div>

          {/* Report Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Generate Compliance Report
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
                  placeholder="compliance@example.com"
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

          {/* Compliance Report Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Compliance Data - {selectedPharmacyData?.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Daily 10am and 5pm temperature readings from {startDate} to {endDate}
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
                      10:00 AM Reading
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      5:00 PM Reading
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Daily Compliance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Excursions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Notes
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(report.morningReading.status)}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {report.morningReading.temperature}°C
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(report.morningReading.status)}`}>
                              {report.morningReading.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Humidity: {report.morningReading.humidity}% | Sensors: {report.morningReading.sensorCount}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(report.eveningReading.status)}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {report.eveningReading.temperature}°C
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(report.eveningReading.status)}`}>
                              {report.eveningReading.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Humidity: {report.eveningReading.humidity}% | Sensors: {report.eveningReading.sensorCount}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                report.dailyCompliance >= 95 ? 'bg-green-600' :
                                report.dailyCompliance >= 85 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${report.dailyCompliance}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {report.dailyCompliance}%
                          </span>
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {report.notes || '—'}
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
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Compliance Data</h3>
          <p className="text-gray-600 dark:text-gray-400">
            No compliance data available for the selected pharmacy and date range. Ensure sensors are configured for 10am and 5pm readings.
          </p>
        </div>
      )}
    </div>
  );
}