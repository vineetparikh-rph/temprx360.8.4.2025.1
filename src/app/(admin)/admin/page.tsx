"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  Thermometer, 
  Wifi, 
  Users, 
  BarChart3,
  Settings,
  Plus,
  Eye,
  Activity,
  Database,
  Shield,
  Network,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Battery,
  Signal
} from 'lucide-react';

interface AdminStats {
  totalHubs: number;
  totalSensors: number;
  totalPharmacies: number;
  totalUsers: number;
  activeAlerts: number;
  systemHealth: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchStats();
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const managementSections = [
    {
      title: "Hub Management",
      description: "Manage SensorPush hubs and connectivity",
      icon: <Network className="h-8 w-8 text-blue-600" />,
      items: [
        { name: "All Hubs", href: "/admin/hubs", icon: <Network className="h-5 w-5" /> },
        { name: "Hub Assignment", href: "/admin/hubs/assign", icon: <MapPin className="h-5 w-5" /> },
        { name: "Add Hub", href: "/admin/hubs/add", icon: <Plus className="h-5 w-5" /> },
        { name: "Hub Status", href: "/admin/hubs/status", icon: <Activity className="h-5 w-5" /> },
        { name: "Hub Analytics", href: "/admin/hubs/analytics", icon: <BarChart3 className="h-5 w-5" /> }
      ]
    },
    {
      title: "Sensor Management", 
      description: "Manage temperature sensors and monitoring",
      icon: <Thermometer className="h-8 w-8 text-green-600" />,
      items: [
        { name: "All Sensors", href: "/admin/sensors", icon: <Thermometer className="h-5 w-5" /> },
        { name: "Sensor Assignment", href: "/admin/sensors/manage", icon: <Settings className="h-5 w-5" /> },
        { name: "Add Sensor", href: "/admin/sensors/add", icon: <Plus className="h-5 w-5" /> },
        { name: "Sensor Status", href: "/admin/sensors/status", icon: <Battery className="h-5 w-5" /> },
        { name: "Sensor Analytics", href: "/admin/sensors/analytics", icon: <TrendingUp className="h-5 w-5" /> }
      ]
    },
    {
      title: "Pharmacy Management",
      description: "Manage pharmacy locations and assignments", 
      icon: <Building2 className="h-8 w-8 text-purple-600" />,
      items: [
        { name: "All Pharmacies", href: "/admin/pharmacies", icon: <Building2 className="h-5 w-5" /> },
        { name: "Pharmacy Assignment", href: "/admin/pharmacies/assign", icon: <Users className="h-5 w-5" /> },
        { name: "Add Pharmacy", href: "/admin/pharmacies/add", icon: <Plus className="h-5 w-5" /> },
        { name: "Pharmacy Status", href: "/admin/pharmacies/status", icon: <CheckCircle className="h-5 w-5" /> },
        { name: "Users Linked", href: "/admin/pharmacies/users", icon: <Users className="h-5 w-5" /> },
        { name: "Pharmacy Analytics", href: "/admin/pharmacies/analytics", icon: <BarChart3 className="h-5 w-5" /> },
        { name: "User Analytics", href: "/admin/users/analytics", icon: <TrendingUp className="h-5 w-5" /> }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Comprehensive management tools for TempRx360 system administration
        </p>
      </div>

      {/* System Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <Network className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalHubs}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Hubs</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <Thermometer className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSensors}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sensors</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPharmacies}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pharmacies</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Users</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeAlerts}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <div className="text-lg font-bold text-green-600">{stats.systemHealth}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">System Health</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {managementSections.map((section, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              {section.icon}
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {section.description}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              {section.items.map((item, itemIndex) => (
                <Link
                  key={itemIndex}
                  href={item.href}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                    {item.icon}
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/data-generator"
            className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <Database className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Data Generator</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Generate test data</div>
            </div>
          </Link>
          
          <Link
            href="/admin/system-health"
            className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <Activity className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">System Health</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Monitor system status</div>
            </div>
          </Link>
          
          <Link
            href="/reports"
            className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <BarChart3 className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Generate Reports</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Temperature reports</div>
            </div>
          </Link>
          
          <Link
            href="/policies"
            className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <Shield className="h-6 w-6 text-orange-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Policy Generator</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Compliance policies</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
