'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Loader2, UserCheck, UserX, Coffee } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
// Badge available for future use
import Loader from '@/components/ui/Loader';
import Modal from '@/components/ui/Modal';
import StatsCard from '@/components/ui/StatsCard';

interface Employee {
  _id: string;
  name: string;
}

interface AttendanceRecord {
  _id: string;
  employeeId: string | { _id: string; name: string };
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';
  checkInTime?: string;
  checkOutTime?: string;
  checkInLocation?: { latitude: number; longitude: number };
  workingHours?: number;
  remarks?: string;
}

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-500 text-white',
  absent: 'bg-red-500 text-white',
  half_day: 'bg-yellow-500 text-white',
  leave: 'bg-blue-500 text-white',
  holiday: 'bg-gray-400 text-white',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const statusOptions = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'leave', label: 'Leave' },
  { value: 'holiday', label: 'Holiday' },
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function AttendancePage() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);

  // Mark attendance form
  const [markForm, setMarkForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    remarks: '',
    checkInLocation: null as { latitude: number; longitude: number } | null,
  });

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) setEmployees(data.data);
    } catch {
      // silent
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        month: String(currentMonth + 1),
        year: String(currentYear),
      });
      if (filterEmployee) params.set('employeeId', filterEmployee);

      const res = await fetch(`/api/attendance?${params}`);
      const data = await res.json();
      if (data.success) {
        setAttendance(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch attendance');
      }
    } catch {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [currentMonth, currentYear, filterEmployee]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const getAttendanceForDay = (day: number): AttendanceRecord | undefined => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendance.find((a) => {
      const aDate = new Date(a.date).toISOString().split('T')[0];
      return aDate === dateStr;
    });
  };

  const summary = useMemo(() => {
    const stats = { present: 0, absent: 0, half_day: 0, leave: 0, holiday: 0, totalHours: 0 };
    attendance.forEach((a) => {
      if (a.status in stats) {
        stats[a.status as keyof typeof stats] += 1;
      }
      if (a.workingHours) stats.totalHours += a.workingHours;
    });
    return stats;
  }, [attendance]);

  const handleCaptureCheckInLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMarkForm((prev) => ({
          ...prev,
          checkInLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        }));
        setCapturingLocation(false);
        toast.success('Check-in location captured');
      },
      (error) => {
        setCapturingLocation(false);
        toast.error(`Location error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markForm.employeeId) {
      toast.error('Please select an employee');
      return;
    }

    setMarkingAttendance(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(markForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to mark attendance');

      toast.success('Attendance marked successfully');
      setShowMarkModal(false);
      setMarkForm({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        remarks: '',
        checkInLocation: null,
      });
      fetchAttendance();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setMarkingAttendance(false);
    }
  };

  const employeeOptions = employees.map((e) => ({ value: e._id, label: e.name }));

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = now.getFullYear() - 2 + i;
    return { value: String(y), label: String(y) };
  });

  const monthOptions = MONTHS.map((m, i) => ({ value: String(i), label: m }));

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" label="Loading attendance..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track employee attendance and working hours
          </p>
        </div>
        <Button onClick={() => setShowMarkModal(true)}>
          <UserCheck className="h-4 w-4 mr-2" />
          Mark Attendance
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={UserCheck} label="Present Days" value={summary.present} />
        <StatsCard icon={UserX} label="Absent Days" value={summary.absent} />
        <StatsCard icon={Coffee} label="Leave Days" value={summary.leave} />
        <StatsCard icon={Clock} label="Working Hours" value={`${summary.totalHours.toFixed(1)}h`} />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Select
            label="Employee"
            options={employeeOptions}
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            placeholder="All Employees"
          />
          <Select
            label="Month"
            options={monthOptions}
            value={String(currentMonth)}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
          />
          <Select
            label="Year"
            options={yearOptions}
            value={String(currentYear)}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
          />
          <div className="flex items-end">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                {MONTHS[currentMonth]} {currentYear}
              </span>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar View */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="md" label="Loading calendar..." />
          </div>
        ) : (
          <div>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6">
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${color}`} />
                  <span className="text-xs text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}

              {/* Empty cells for days before start of month */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16 rounded-lg" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const record = getAttendanceForDay(day);
                const statusColor = record ? STATUS_COLORS[record.status] : '';

                return (
                  <div
                    key={day}
                    className={`h-16 rounded-lg border border-gray-100 p-1 flex flex-col items-center justify-center transition-colors ${
                      record ? statusColor : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`text-sm font-medium ${record ? '' : 'text-gray-700'}`}>
                      {day}
                    </span>
                    {record && (
                      <span className="text-xs mt-0.5 capitalize">
                        {record.status.replace('_', ' ')}
                      </span>
                    )}
                    {record?.workingHours && (
                      <span className="text-xs opacity-75">
                        {record.workingHours}h
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={showMarkModal}
        onClose={() => setShowMarkModal(false)}
        title="Mark Attendance"
        className="max-w-lg"
      >
        <form onSubmit={handleMarkAttendance} className="space-y-4">
          <Select
            label="Employee"
            options={employeeOptions}
            value={markForm.employeeId}
            onChange={(e) => setMarkForm((prev) => ({ ...prev, employeeId: e.target.value }))}
            placeholder="Select Employee"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={markForm.date}
                onChange={(e) => setMarkForm((prev) => ({ ...prev, date: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-driftwood-400 focus:border-driftwood-400"
                required
              />
            </div>
            <Select
              label="Status"
              options={statusOptions}
              value={markForm.status}
              onChange={(e) => setMarkForm((prev) => ({ ...prev, status: e.target.value }))}
            />
          </div>

          {/* Check-in Location */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Check-In Location</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCaptureCheckInLocation}
              disabled={capturingLocation}
            >
              {capturingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  {markForm.checkInLocation ? 'Recapture Location' : 'Capture Location'}
                </>
              )}
            </Button>
            {markForm.checkInLocation && (
              <p className="mt-2 text-xs text-gray-500">
                Lat: {markForm.checkInLocation.latitude.toFixed(6)}, Lng: {markForm.checkInLocation.longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* Remarks */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea
              value={markForm.remarks}
              onChange={(e) => setMarkForm((prev) => ({ ...prev, remarks: e.target.value }))}
              rows={2}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-driftwood-400 focus:border-driftwood-400"
              placeholder="Optional remarks..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => setShowMarkModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={markingAttendance}>
              Mark Attendance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
