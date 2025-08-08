"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Calendar as CalendarIcon, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'maintenance' | 'calibration' | 'inspection' | 'training' | 'meeting';
  pharmacyName: string;
  pharmacyId: string;
  assignedTo: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Generate sample events
      const data = generateSampleEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleEvents = (): CalendarEvent[] => {
    const pharmacies = [
      { id: 'pharm_1', name: 'Georgies Family Pharmacy' },
      { id: 'pharm_2', name: 'Georgies Specialty Pharmacy' },
      { id: 'pharm_3', name: 'Georgies Parlin Pharmacy' },
      { id: 'pharm_4', name: 'Georgies Outpatient Pharmacy' }
    ];

    const eventTypes = ['maintenance', 'calibration', 'inspection', 'training', 'meeting'] as const;
    const statuses = ['scheduled', 'in-progress', 'completed', 'cancelled'] as const;
    const assignees = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Lisa Davis', 'David Wilson'];

    const events: CalendarEvent[] = [];
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    for (let i = 0; i < 20; i++) {
      const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      const pharmacy = pharmacies[Math.floor(Math.random() * pharmacies.length)];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      events.push({
        id: `event_${i}`,
        title: getEventTitle(eventType),
        description: getEventDescription(eventType),
        date: randomDate.toISOString().split('T')[0],
        time: `${Math.floor(Math.random() * 12) + 8}:${Math.random() > 0.5 ? '00' : '30'}`,
        type: eventType,
        pharmacyName: pharmacy.name,
        pharmacyId: pharmacy.id,
        assignedTo: assignees[Math.floor(Math.random() * assignees.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getEventTitle = (type: string): string => {
    switch(type) {
      case 'maintenance': return 'Equipment Maintenance';
      case 'calibration': return 'Sensor Calibration';
      case 'inspection': return 'Compliance Inspection';
      case 'training': return 'Staff Training';
      case 'meeting': return 'Team Meeting';
      default: return 'Scheduled Event';
    }
  };

  const getEventDescription = (type: string): string => {
    switch(type) {
      case 'maintenance': return 'Routine maintenance of temperature monitoring equipment';
      case 'calibration': return 'Calibration of temperature sensors and verification';
      case 'inspection': return 'Regulatory compliance inspection and documentation';
      case 'training': return 'Staff training on temperature monitoring procedures';
      case 'meeting': return 'Team meeting to discuss operational updates';
      default: return 'Scheduled event details';
    }
  };

  const getEventTypeColor = (type: string): string => {
    switch(type) {
      case 'maintenance': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'calibration': return 'bg-green-100 text-green-800 border-green-200';
      case 'inspection': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'training': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'meeting': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date().toISOString().split('T')[0];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 dark:border-gray-700"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
      const dayEvents = getEventsForDate(dateStr);
      const isToday = dateStr === today;

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 dark:border-gray-700 p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
            isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          onClick={() => setSelectedDate(new Date(dateStr))}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
            {day}
          </div>
          <div className="space-y-1 mt-1">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className={`text-xs px-1 py-0.5 rounded truncate ${getEventTypeColor(event.type)}`}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Calendar & Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage maintenance schedules, inspections, and team events
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchEvents}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            {['month', 'week', 'day'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === mode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{day}</span>
            </div>
          ))}
          
          {/* Calendar days */}
          {renderCalendarGrid()}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Events</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {events.slice(0, 5).map(event => (
              <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(event.status)}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{event.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {event.pharmacyName} • {new Date(event.date).toLocaleDateString()} at {event.time}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{event.assignedTo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
