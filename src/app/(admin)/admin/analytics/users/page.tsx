"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit,
  Trash2,
  RefreshCw,
  Shield,
  User,
  Calendar
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'pharmacist' | 'technician' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  pharmacyName: string;
  pharmacyId: string;
  lastLogin: string;
  createdAt: string;
  permissions: string[];
}

export default function AllUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pharmacyFilter, setPharmacyFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        // Fallback to sample data
        setUsers(generateSampleUsers());
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers(generateSampleUsers());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleUsers = (): UserData[] => {
    const pharmacies = [
      { id: 'pharm_1', name: 'Georgies Family Pharmacy' },
      { id: 'pharm_2', name: 'Georgies Specialty Pharmacy' },
      { id: 'pharm_3', name: 'Georgies Parlin Pharmacy' },
      { id: 'pharm_4', name: 'Georgies Outpatient Pharmacy' }
    ];

    const roles = ['admin', 'manager', 'pharmacist', 'technician', 'viewer'] as const;
    const firstNames = ['John', 'Sarah', 'Michael', 'Lisa', 'David', 'Emily', 'Robert', 'Jessica', 'William', 'Ashley'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];

    const users: UserData[] = [];

    pharmacies.forEach((pharmacy, pharmIndex) => {
      const userCount = Math.floor(Math.random() * 6) + 4; // 4-9 users per pharmacy

      for (let i = 0; i < userCount; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const role = roles[Math.floor(Math.random() * roles.length)];
        const isActive = Math.random() > 0.1;

        users.push({
          id: `user_${pharmIndex}_${i}`,
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@georgiesrx.com`,
          phone: `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          role,
          status: isActive ? 'active' : (Math.random() > 0.5 ? 'inactive' : 'pending'),
          pharmacyName: pharmacy.name,
          pharmacyId: pharmacy.id,
          lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          permissions: getPermissionsForRole(role)
        });
      }
    });

    return users;
  };

  const getPermissionsForRole = (role: string): string[] => {
    switch(role) {
      case 'admin':
        return ['read', 'write', 'delete', 'manage_users', 'manage_settings', 'view_reports'];
      case 'manager':
        return ['read', 'write', 'view_reports', 'manage_pharmacy'];
      case 'pharmacist':
        return ['read', 'write', 'view_reports'];
      case 'technician':
        return ['read', 'write'];
      case 'viewer':
        return ['read'];
      default:
        return ['read'];
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pharmacist': return 'bg-green-100 text-green-800 border-green-200';
      case 'technician': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesPharmacy = pharmacyFilter === 'all' || user.pharmacyId === pharmacyFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesPharmacy;
  });

  const uniquePharmacies = Array.from(new Set(users.map(user => ({
    id: user.pharmacyId,
    name: user.pharmacyName
  }))));

  const activeCount = users.filter(u => u.status === 'active').length;
  const inactiveCount = users.filter(u => u.status === 'inactive').length;
  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            All Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user accounts and permissions across all pharmacies
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchUsers}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {inactiveCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Inactive Users</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {pendingCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending Users</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}