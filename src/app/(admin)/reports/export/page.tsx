"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Download,
  FileText,
  Calendar,
  Building2,
  Filter,
  RefreshCw
} from 'lucide-react';

export default function ReportsExportPage() {
  const { data: session } = useSession();
  const [selectedReportType, setSelectedReportType] = useState('daily');
  const [selectedPharmacy, setSelectedPharmacy] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [exportFormat, setExportFormat] = useState('pdf');

  const reportTypes = [
    { value: 'daily', label: 'Daily Temperature Reports' },
    { value: 'compliance', label: 'Compliance Reports' },
    { value: 'alerts', label: 'Alert History Reports' },
    { value: 'sensor', label: 'Sensor Status Reports' },
    { value: 'audit', label: 'Audit Trail Reports' }
  ];

  const pharmacies = [
    { value: 'all', label: 'All Pharmacies' },
    { value: 'pharm_1', label: 'Georgies Family Pharmacy' },
    { value: 'pharm_2', label: 'Georgies Specialty Pharmacy' },
    { value: 'pharm_3', label: 'Georgies Parlin Pharmacy' },
    { value: 'pharm_4', label: 'Georgies Outpatient Pharmacy' }
  ];

  const handleExport = async () => {
    // In a real app, this would trigger the export process
    console.log('Exporting report:', {
      type: selectedReportType,
      pharmacy: selectedPharmacy,
      dateRange,
      format: exportFormat
    });
    
    // Simulate export process
    alert(`Exporting ${selectedReportType} report as ${exportFormat.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Export Reports</h1>
          <p className="text-gray-600 mt-1">
            Generate and download reports in various formats
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Export Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pharmacy Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pharmacy
            </label>
            <select
              value={selectedPharmacy}
              onChange={(e) => setSelectedPharmacy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pharmacies.map(pharmacy => (
                <option key={pharmacy.value} value={pharmacy.value}>
                  {pharmacy.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Export Format */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="mr-2"
                />
                PDF
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="mr-2"
                />
                Excel
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="mr-2"
                />
                CSV
              </label>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleExport}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Recent Exports */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Exports</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <p>No recent exports found</p>
            <p className="text-sm">Exported reports will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}