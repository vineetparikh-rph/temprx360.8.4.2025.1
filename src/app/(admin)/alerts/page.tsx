"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Thermometer,
  Wifi,
  WifiOff,
  Battery,
  RefreshCw,
  X,
  MessageSquare,
  Building2,
  Calendar
} from 'lucide-react';
import Button from '@/components/ui/button/Button';

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  currentValue?: number;
  thresholdValue?: number;
  location?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedNote?: string;
  createdAt: string;
  updatedAt: string;
  pharmacy: {
    id: string;
    name: string;
    code: string;
  };
}

export default function ActiveAlertsPage() {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('active');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [resolvingAlert, setResolvingAlert] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState<string>('');
  const [showResolveModal, setShowResolveModal] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, [filter, severityFilter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'active') params.append('resolved', 'false');
      if (filter === 'resolved') params.append('resolved', 'true');
      if (severityFilter !== 'all') params.append('severity', severityFilter);

      const response = await fetch(`/api/alerts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const data = await response.json();
      setAlerts(data.alerts);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerSensorCheck = async () => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_sensors' })
      });

      if (response.ok) {
        await fetchAlerts(); // Refresh alerts
      }
    } catch (err) {
      console.error('Failed to trigger sensor check:', err);
    }
  };

  const resolveAlert = async (alertId: string) => {
    setResolvingAlert(alertId);
    try {
      const response = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          note: resolveNote || 'Resolved by user'
        })
      });

      if (response.ok) {
        await fetchAlerts(); // Refresh alerts
        setShowResolveModal(null);
        setResolveNote('');
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setResolvingAlert(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'temperature_high':
      case 'temperature_low':
        return <Thermometer className="h-5 w-5" />;
      case 'offline':
        return <WifiOff className="h-5 w-5" />;
      case 'battery_low':
        return <Battery className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Temperature Alerts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage temperature monitoring alerts
          </p>
        </div>
        <Button
          onClick={triggerSensorCheck}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Check Sensors
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="active">Active Alerts</option>
              <option value="resolved">Resolved Alerts</option>
              <option value="all">All Alerts</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No alerts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'active' ? 'All systems are operating normally' : 'No alerts match your filters'}
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border p-6 ${
                alert.resolved ? 'border-gray-200' : getSeverityColor(alert.severity).split(' ')[2]
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                    {getTypeIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {alert.message}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      {alert.resolved && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          RESOLVED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {alert.pharmacy.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(alert.createdAt)}
                      </div>
                      {alert.location && (
                        <div className="capitalize">
                          📍 {alert.location}
                        </div>
                      )}
                    </div>

                    {(alert.currentValue !== undefined || alert.thresholdValue !== undefined) && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {alert.currentValue !== undefined && (
                          <span>Current: {alert.currentValue.toFixed(1)}°C</span>
                        )}
                        {alert.thresholdValue !== undefined && (
                          <span className="ml-4">Threshold: {alert.thresholdValue.toFixed(1)}°C</span>
                        )}
                      </div>
                    )}

                    {alert.resolved && alert.resolvedNote && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-800">
                        <strong>Resolution:</strong> {alert.resolvedNote}
                        {alert.resolvedAt && (
                          <div className="text-xs mt-1">
                            Resolved on {formatDateTime(alert.resolvedAt)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!alert.resolved && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowResolveModal(alert.id)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Resolve Alert</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resolution Note (Optional)
              </label>
              <textarea
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="Add a note about how this alert was resolved..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => resolveAlert(showResolveModal)}
                disabled={resolvingAlert === showResolveModal}
                className="flex-1"
              >
                {resolvingAlert === showResolveModal ? 'Resolving...' : 'Resolve Alert'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResolveModal(null);
                  setResolveNote('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}