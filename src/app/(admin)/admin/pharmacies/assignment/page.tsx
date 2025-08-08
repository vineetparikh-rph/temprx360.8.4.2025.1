"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Building2, 
  Users, 
  Cpu,
  Thermometer,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Link,
  Unlink
} from 'lucide-react';

interface Assignment {
  pharmacyId: string;
  pharmacyName: string;
  assignedUsers: number;
  totalUsers: number;
  assignedHubs: number;
  totalHubs: number;
  assignedSensors: number;
  totalSensors: number;
  lastUpdated: string;
}

export default function PharmacyAssignmentPage() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      // Generate sample assignment data
      const data = generateSampleAssignments();
      setAssignments(data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleAssignments = (): Assignment[] => {
    const pharmacies = [
      'Georgies Family Pharmacy',
      'Georgies Specialty Pharmacy', 
      'Georgies Parlin Pharmacy',
      'Georgies Outpatient Pharmacy'
    ];

    return pharmacies.map((pharmacy, index) => ({
      pharmacyId: `pharm_${index + 1}`,
      pharmacyName: pharmacy,
      assignedUsers: Math.floor(Math.random() * 6) + 4,
      totalUsers: Math.floor(Math.random() * 3) + 8,
      assignedHubs: Math.floor(Math.random() * 2) + 2,
      totalHubs: Math.floor(Math.random() * 2) + 3,
      assignedSensors: Math.floor(Math.random() * 8) + 8,
      totalSensors: Math.floor(Math.random() * 5) + 12,
      lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  };

  const getAssignmentStatus = (assigned: number, total: number) => {
    const percentage = (assigned / total) * 100;
    if (percentage === 100) return { color: 'text-green-600', status: 'Complete' };
    if (percentage >= 80) return { color: 'text-yellow-600', status: 'Good' };
    return { color: 'text-red-600', status: 'Needs Attention' };
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pharmacy Assignment
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage assignments of users, hubs, and sensors to pharmacy locations
          </p>
        </div>
        <button
          onClick={fetchAssignments}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pharmacies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Assignment Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssignments.map((assignment) => {
          const userStatus = getAssignmentStatus(assignment.assignedUsers, assignment.totalUsers);
          const hubStatus = getAssignmentStatus(assignment.assignedHubs, assignment.totalHubs);
          const sensorStatus = getAssignmentStatus(assignment.assignedSensors, assignment.totalSensors);

          return (
            <div key={assignment.pharmacyId} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Building2 className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {assignment.pharmacyName}
                  </h3>
                </div>
                <button className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                  <Link className="h-4 w-4 mr-1" />
                  Manage
                </button>
              </div>

              <div className="space-y-4">
                {/* Users Assignment */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Users</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {assignment.assignedUsers} of {assignment.totalUsers} assigned
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${userStatus.color}`}>
                      {userStatus.status}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round((assignment.assignedUsers / assignment.totalUsers) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Hubs Assignment */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <Cpu className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Hubs</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {assignment.assignedHubs} of {assignment.totalHubs} assigned
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${hubStatus.color}`}>
                      {hubStatus.status}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round((assignment.assignedHubs / assignment.totalHubs) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Sensors Assignment */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <Thermometer className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Sensors</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {assignment.assignedSensors} of {assignment.totalSensors} assigned
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${sensorStatus.color}`}>
                      {sensorStatus.status}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round((assignment.assignedSensors / assignment.totalSensors) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Last updated: {new Date(assignment.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Users className="h-5 w-5 text-purple-600 mr-2" />
            <span>Bulk User Assignment</span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Cpu className="h-5 w-5 text-green-600 mr-2" />
            <span>Bulk Hub Assignment</span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Thermometer className="h-5 w-5 text-blue-600 mr-2" />
            <span>Bulk Sensor Assignment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
