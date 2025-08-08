"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Database, 
  Play, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  Mail
} from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';

interface DataStats {
  readings: {
    total: number;
    bySensor: number;
    oldestDate?: string;
    newestDate?: string;
  };
  alerts: {
    total: number;
    active: number;
    resolved: number;
    bySensor: number;
  };
  dataRange: {
    start?: string;
    end?: string;
    hasHistoricalData: boolean;
  };
}

export default function DataGeneratorPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DataStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailConfig, setEmailConfig] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchStats();
      fetchEmailConfig();
    }
  }, [session]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/generate-data');
      if (!response.ok) {
        throw new Error('Failed to fetch data stats');
      }
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailConfig = async () => {
    try {
      const response = await fetch('/api/admin/test-email');
      if (response.ok) {
        const data = await response.json();
        setEmailConfig(data);
        setTestEmail(session?.user?.email || '');
      }
    } catch (err) {
      console.error('Failed to fetch email config:', err);
    }
  };

  const generateData = async (type: 'sample' | 'full') => {
    setGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/generate-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate data');
      }

      const result = await response.json();
      console.log('Data generation result:', result);
      
      // Refresh stats
      await fetchStats();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const testEmailConfig = async () => {
    if (!testEmail) {
      setError('Please enter a test email address');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail })
      });

      const result = await response.json();

      if (result.success) {
        alert('Test email sent successfully! Check your inbox.');
      } else {
        throw new Error(result.error || 'Failed to send test email');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const testMonthlyReports = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/monthly-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send monthly reports');
      }

      const result = await response.json();
      console.log('Monthly reports result:', result);
      alert('Monthly reports sent successfully! Check the console for details.');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const clearData = async () => {
    if (!confirm('Are you sure you want to clear ALL generated data? This cannot be undone.')) {
      return;
    }

    setClearing(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/generate-data?confirm=true', {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear data');
      }

      // Refresh stats
      await fetchStats();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setClearing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (session?.user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Admin Access Required
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You need admin privileges to access this page.
        </p>
      </div>
    );
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Historical Data Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate realistic temperature data for testing and reports
          </p>
        </div>
        <Button
          onClick={fetchStats}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Current Data Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.readings.total.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Readings
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.alerts.active}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active Alerts
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.alerts.resolved}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Resolved Alerts
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.dataRange.hasHistoricalData ? '2019+' : 'Recent'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Data Range
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Range Info */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Data Range Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Oldest Reading:</span>
              <p className="font-medium">{formatDate(stats.dataRange.start)}</p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Newest Reading:</span>
              <p className="font-medium">{formatDate(stats.dataRange.end)}</p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Historical Data:</span>
              <p className="font-medium">
                {stats.dataRange.hasHistoricalData ? 'Available' : 'Not Generated'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Email Configuration */}
      {emailConfig && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Email Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status:</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                emailConfig.ready
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {emailConfig.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">SMTP Host:</p>
              <p className="text-sm font-medium">{emailConfig.host}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">From Address:</p>
              <p className="text-sm font-medium">{emailConfig.from}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">User:</p>
              <p className="text-sm font-medium">{emailConfig.user}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email to test"
              className="flex-1"
            />
            <Button
              onClick={testEmailConfig}
              disabled={generating || !testEmail}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              {generating ? 'Sending...' : 'Test Email'}
            </Button>
          </div>
        </div>
      )}

      {/* Generation Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sample Data */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sample Data
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Generate realistic temperature data for the last 7 days. Perfect for testing the alert system and UI.
          </p>
          <Button
            onClick={() => generateData('sample')}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2"
          >
            <Play className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate Sample Data'}
          </Button>
        </div>

        {/* Full Historical Data */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Database className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Full Historical Data
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Generate comprehensive temperature data from 2019 onwards. This will create millions of data points for realistic reports.
          </p>
          <Button
            onClick={() => generateData('full')}
            disabled={generating}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <Database className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate Full History'}
          </Button>
        </div>
      </div>

      {/* Monthly Reports Testing */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Mail className="h-6 w-6 text-purple-600 mr-3" />
          <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
            Monthly Reports
          </h3>
        </div>
        <p className="text-purple-700 dark:text-purple-300 mb-4">
          Test the monthly report generation and email system. This will generate reports for the current month and email them to pharmacy users.
        </p>
        <Button
          onClick={() => testMonthlyReports()}
          disabled={generating}
          variant="outline"
          className="border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          {generating ? 'Sending...' : 'Test Monthly Reports'}
        </Button>
      </div>

      {/* Clear Data */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Trash2 className="h-6 w-6 text-red-600 mr-3" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Clear All Data
          </h3>
        </div>
        <p className="text-red-700 dark:text-red-300 mb-4">
          This will permanently delete all generated temperature readings and alerts. This action cannot be undone.
        </p>
        <Button
          onClick={clearData}
          disabled={clearing}
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {clearing ? 'Clearing...' : 'Clear All Data'}
        </Button>
      </div>
    </div>
  );
}
