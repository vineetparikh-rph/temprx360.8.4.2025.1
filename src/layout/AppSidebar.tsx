"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronDownIcon } from '@/icons';
import { 
  BarChart3, 
  Building2, 
  Users, 
  Settings, 
  AlertTriangle, 
  FileText, 
  Thermometer,
  Cpu,
  TrendingUp,
  Shield,
  Database,
  Calendar,
  Download,
  History,
  Plus,
  CheckCircle,
  Bell,
  FileCheck,
  User,
  UserPlus,
  HardDrive
} from 'lucide-react';

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ReactNode;
  badge?: string;
  children?: MenuItem[];
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Monitoring']);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isExpanded = (title: string) => expandedItems.includes(title);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const menuItems: MenuItem[] = [
    // 📊 MONITORING (Core functionality)
    {
      title: 'Monitoring',
      icon: <BarChart3 className="h-5 w-5" />,
      children: [
        { 
          title: 'Temperature Monitoring', 
          href: '/', 
          icon: <Thermometer className="h-4 w-4" /> 
        },
        {
          title: 'Alerts',
          icon: <AlertTriangle className="h-4 w-4" />,
          children: [
            { title: 'Active Alerts', href: '/alerts', icon: <Bell className="h-4 w-4" /> },
            { title: 'Alert History', href: '/alerts/history', icon: <History className="h-4 w-4" /> },
            { title: 'Alert Settings', href: '/alerts/settings', icon: <Settings className="h-4 w-4" /> }
          ]
        },
        {
          title: 'Temperature Policy',
          icon: <FileCheck className="h-4 w-4" />,
          children: [
            { title: 'Current Policies', href: '/policies', icon: <FileCheck className="h-4 w-4" /> },
            { title: 'Policy History', href: '/policies/history', icon: <History className="h-4 w-4" /> },
            { title: 'Add Policy', href: '/policies/add', icon: <Plus className="h-4 w-4" /> }
          ]
        },
        {
          title: 'Reports',
          icon: <FileText className="h-4 w-4" />,
          children: [
            { title: 'Daily Reports', href: '/reports/daily', icon: <Calendar className="h-4 w-4" /> },
            { title: 'Compliance Reports', href: '/reports/compliance', icon: <FileCheck className="h-4 w-4" /> },
            { title: 'Report Logs', href: '/reports/logs', icon: <History className="h-4 w-4" /> },
            { title: 'Export Reports', href: '/reports/export', icon: <Download className="h-4 w-4" /> }
          ]
        },
        {
          title: 'Analytics',
          icon: <TrendingUp className="h-4 w-4" />,
          children: [
            { title: 'Trends', href: '/analytics/trends', icon: <TrendingUp className="h-4 w-4" /> },
            { title: 'Metrics', href: '/analytics/metrics', icon: <BarChart3 className="h-4 w-4" /> }
          ]
        }
      ]
    },

    // 🔧 ADMIN TOOLS (Hardware & System)
    {
      title: 'Admin Tools',
      icon: <Settings className="h-5 w-5" />,
      children: [
        {
          title: 'System Management',
          icon: <Database className="h-4 w-4" />,
          children: [
            { title: 'Sensor Assignment', href: '/admin/sensors/manage', icon: <Thermometer className="h-4 w-4" /> },
            { title: 'Pharmacy Management', href: '/admin/pharmacies', icon: <Building2 className="h-4 w-4" /> }
          ]
        },
        {
          title: 'Hardware',
          icon: <HardDrive className="h-4 w-4" />,
          children: [
            { title: 'All Sensors', href: '/sensors', icon: <Thermometer className="h-4 w-4" /> },
            { title: 'Add Sensor', href: '/sensors/add', icon: <Plus className="h-4 w-4" /> },
            { title: 'Sensor Status', href: '/sensors/status', icon: <CheckCircle className="h-4 w-4" /> },
            { title: 'Hubs & Gateways', href: '/admin/hubs', icon: <Cpu className="h-4 w-4" /> }
          ]
        }
      ]
    },

    // ⚙️ ADMINISTRATION (Users & Settings)
    {
      title: 'Administration',
      icon: <Shield className="h-5 w-5" />,
      children: [
        {
          title: 'User Management',
          icon: <Users className="h-4 w-4" />,
          children: [
            { title: 'All Users', href: '/admin/analytics/users', icon: <Users className="h-4 w-4" /> },
            { title: 'Add User', href: '/admin/users/add', icon: <UserPlus className="h-4 w-4" /> },
            { title: 'User Profiles', href: '/profile', icon: <User className="h-4 w-4" /> }
          ]
        },
        {
          title: 'Settings',
          icon: <Settings className="h-4 w-4" />,
          children: [
            { title: 'Temperature Thresholds', href: '/admin/settings/thresholds', icon: <Thermometer className="h-4 w-4" /> },
            { title: 'Notifications', href: '/admin/settings/notifications', icon: <Bell className="h-4 w-4" /> },
            { title: 'System Settings', href: '/admin/settings/system', icon: <Settings className="h-4 w-4" /> }
          ]
        },
        { title: 'Calendar & Schedule', href: '/calendar', icon: <Calendar className="h-4 w-4" /> }
      ]
    },

    // 🗄️ DATABASE ADMINISTRATION (Direct Prisma Access)
    {
      title: 'Database Admin',
      icon: <Database className="h-5 w-5" />,
      children: [
        { title: 'Database Tables', href: '/database', icon: <Database className="h-4 w-4" /> },
        { title: 'Raw SQL Query', href: '/database/query', icon: <FileText className="h-4 w-4" /> },
        { title: 'Schema Browser', href: '/database/schema', icon: <Settings className="h-4 w-4" /> }
      ]
    },

    // 🎨 LAYOUT (Design & Development)
    {
      title: 'Layout',
      icon: <FileText className="h-5 w-5" />,
      children: [
        {
          title: 'Tables',
          icon: <Database className="h-4 w-4" />,
          children: [
            { title: 'Basic Tables', href: '/basic-tables', icon: <Database className="h-4 w-4" /> }
          ]
        },
        {
          title: 'Charts',
          icon: <BarChart3 className="h-4 w-4" />,
          children: [
            { title: 'Line Charts', href: '/line-chart', icon: <TrendingUp className="h-4 w-4" /> },
            { title: 'Bar Charts', href: '/bar-chart', icon: <BarChart3 className="h-4 w-4" /> }
          ]
        },
        {
          title: 'UI Elements',
          icon: <Settings className="h-4 w-4" />,
          children: [
            { title: 'Alerts', href: '/alerts', icon: <AlertTriangle className="h-4 w-4" /> },
            { title: 'Avatars', href: '/avatars', icon: <User className="h-4 w-4" /> },
            { title: 'Badges', href: '/badge', icon: <CheckCircle className="h-4 w-4" /> },
            { title: 'Buttons', href: '/buttons', icon: <Plus className="h-4 w-4" /> },
            { title: 'Images', href: '/images', icon: <FileText className="h-4 w-4" /> },
            { title: 'Videos', href: '/videos', icon: <FileText className="h-4 w-4" /> }
          ]
        }
      ]
    }
  ];

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const expanded = isExpanded(item.title);
    const active = item.href ? isActive(item.href) : false;

    return (
      <li key={item.title}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.title)}
            className={`flex items-center justify-between w-full px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
              active ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              <span>{item.title}</span>
            </div>
            <div className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
              <ChevronDownIcon className="h-4 w-4" />
            </div>
          </button>
        ) : (
          <Link
            href={item.href!}
            className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
              active ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {item.icon}
            <span>{item.title}</span>
            {item.badge && (
              <span className="ml-auto px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full dark:bg-red-900/20 dark:text-red-400">
                {item.badge}
              </span>
            )}
          </Link>
        )}
        
        {hasChildren && expanded && (
          <ul className={`mt-2 space-y-1 ${level === 0 ? 'ml-4 border-l border-gray-200 dark:border-gray-700' : 'ml-2'}`}>
            {item.children!.map((child) => (
              <div key={child.title} className={level === 0 ? 'pl-4' : 'pl-2'}>
                {renderMenuItem(child, level + 1)}
              </div>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="flex items-center space-x-2">
          <Thermometer className="h-8 w-8 text-blue-600" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 dark:text-white">TempRx360</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Admin Dashboard</span>
          </div>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => renderMenuItem(item))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-900/20">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Admin Panel</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}