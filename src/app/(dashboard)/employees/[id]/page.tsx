'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  CalendarDays,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Building2,
  Briefcase,
  CreditCard,
  BadgeCheck,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';

interface BankRef {
  _id: string;
  name: string;
  code: string;
}

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  assignedBanks: BankRef[];
  baseSalary: number;
  incentivePercentage: number;
  fuelAllowance: number;
  emergencyContact: string;
  aadharNumber: string;
  panNumber: string;
  bankAccountNumber: string;
  bankIFSC: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type TabKey = 'profile' | 'compliance' | 'attendance' | 'salary' | 'visits';

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
  { key: 'compliance', label: 'Compliance & Certifications', icon: <ShieldCheck className="h-4 w-4" /> },
  { key: 'attendance', label: 'Attendance', icon: <CalendarDays className="h-4 w-4" /> },
  { key: 'salary', label: 'Salary History', icon: <DollarSign className="h-4 w-4" /> },
  { key: 'visits', label: 'Visits', icon: <MapPin className="h-4 w-4" /> },
];

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [attendanceMonth, setAttendanceMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    if (params.id) {
      fetchEmployee();
    }
  }, [params.id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/employees/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setEmployee(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch employee');
      }
    } catch {
      toast.error('Failed to fetch employee');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" label="Loading employee details..." />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Employee not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/employees')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Button>
      </div>
    );
  }

  // Quick stats
  const stats = [
    { label: 'Total Visits', value: '-', icon: <MapPin className="h-5 w-5 text-driftwood-400" /> },
    { label: 'Total Collected', value: '-', icon: <DollarSign className="h-5 w-5 text-green-500" /> },
    { label: 'Attendance Rate', value: '-', icon: <CalendarDays className="h-5 w-5 text-blue-500" /> },
    { label: 'Assigned Banks', value: employee.assignedBanks?.length || 0, icon: <Building2 className="h-5 w-5 text-purple-500" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/employees')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
              <Badge variant={employee.isActive ? 'success' : 'danger'}>
                {employee.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {employee.employeeId} &middot; {employee.designation} &middot; {employee.department}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-lg">{stat.icon}</div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-driftwood-500 text-driftwood-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && <ProfileTab employee={employee} formatDate={formatDate} formatCurrency={formatCurrency} />}
      {activeTab === 'compliance' && <ComplianceTab employee={employee} />}
      {activeTab === 'attendance' && (
        <AttendanceTab
          month={attendanceMonth}
          onMonthChange={setAttendanceMonth}
        />
      )}
      {activeTab === 'salary' && <SalaryTab employee={employee} formatCurrency={formatCurrency} />}
      {activeTab === 'visits' && <VisitsTab />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Profile Tab                                                         */
/* ------------------------------------------------------------------ */
function ProfileTab({
  employee,
  formatDate,
  formatCurrency,
}: {
  employee: Employee;
  formatDate: (d: string) => string;
  formatCurrency: (n: number) => string;
}) {
  const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-3">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5">{value || '-'}</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Info */}
      <Card title="Personal Information">
        <div className="divide-y divide-gray-100">
          <DetailRow icon={<User className="h-4 w-4" />} label="Full Name" value={employee.name} />
          <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={employee.email} />
          <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={employee.phone} />
          <DetailRow icon={<Phone className="h-4 w-4" />} label="Alternate Phone" value={employee.alternatePhone} />
          <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address" value={`${employee.address}, ${employee.city}`} />
          <DetailRow icon={<AlertCircle className="h-4 w-4" />} label="Emergency Contact" value={employee.emergencyContact} />
        </div>
      </Card>

      {/* Employment Info */}
      <Card title="Employment Details">
        <div className="divide-y divide-gray-100">
          <DetailRow icon={<BadgeCheck className="h-4 w-4" />} label="Employee ID" value={employee.employeeId} />
          <DetailRow icon={<Briefcase className="h-4 w-4" />} label="Designation" value={employee.designation} />
          <DetailRow icon={<Building2 className="h-4 w-4" />} label="Department" value={employee.department} />
          <DetailRow icon={<CalendarDays className="h-4 w-4" />} label="Date of Joining" value={formatDate(employee.dateOfJoining)} />
          <DetailRow
            icon={<Building2 className="h-4 w-4" />}
            label="Assigned Banks"
            value={
              employee.assignedBanks?.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {employee.assignedBanks.map((b) => (
                    <Badge key={b._id} variant="info">{b.name}</Badge>
                  ))}
                </div>
              ) : (
                'None'
              )
            }
          />
        </div>
      </Card>

      {/* Salary Info */}
      <Card title="Compensation">
        <div className="divide-y divide-gray-100">
          <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Base Salary" value={formatCurrency(employee.baseSalary)} />
          <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Incentive %" value={`${employee.incentivePercentage}%`} />
          <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Fuel Allowance" value={formatCurrency(employee.fuelAllowance)} />
        </div>
      </Card>

      {/* ID & Bank Info */}
      <Card title="Documents & Banking">
        <div className="divide-y divide-gray-100">
          <DetailRow icon={<CreditCard className="h-4 w-4" />} label="Aadhar Number" value={employee.aadharNumber} />
          <DetailRow icon={<CreditCard className="h-4 w-4" />} label="PAN Number" value={employee.panNumber} />
          <DetailRow icon={<CreditCard className="h-4 w-4" />} label="Bank Account" value={employee.bankAccountNumber} />
          <DetailRow icon={<Building2 className="h-4 w-4" />} label="IFSC Code" value={employee.bankIFSC} />
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compliance Tab                                                      */
/* ------------------------------------------------------------------ */
function ComplianceTab({ employee }: { employee: Employee }) {
  // Placeholder certifications/exams data from assigned banks
  const certifications = employee.assignedBanks?.flatMap((bank) => [
    { name: `${bank.name} - SARFAESI`, status: 'pending' as const },
    { name: `${bank.name} - DRA Certification`, status: 'completed' as const },
  ]) || [];

  const exams = employee.assignedBanks?.flatMap((bank) => [
    { name: `${bank.name} - RBI Compliance`, status: 'passed' as const, score: 85 },
    { name: `${bank.name} - AML Exam`, status: 'pending' as const, score: null },
  ]) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return <Badge variant="success">{status}</Badge>;
      case 'pending':
        return <Badge variant="warning">{status}</Badge>;
      case 'failed':
      case 'expired':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Certifications">
        {certifications.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No certifications tracked.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {certifications.map((cert, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{cert.name}</span>
                </div>
                {getStatusBadge(cert.status)}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Exams">
        {exams.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No exams tracked.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {exams.map((exam, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-900">{exam.name}</span>
                    {exam.score !== null && (
                      <span className="text-xs text-gray-500 ml-2">Score: {exam.score}</span>
                    )}
                  </div>
                </div>
                {getStatusBadge(exam.status)}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Attendance Tab                                                      */
/* ------------------------------------------------------------------ */
function AttendanceTab({
  month,
  onMonthChange,
}: {
  month: { year: number; month: number };
  onMonthChange: (m: { year: number; month: number }) => void;
}) {
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const firstDay = new Date(month.year, month.month, 1).getDay();
  const monthName = new Date(month.year, month.month).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Placeholder attendance data
  const today = new Date();
  const attendanceMap: Record<number, 'present' | 'absent' | 'leave' | 'holiday'> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(month.year, month.month, d);
    if (date > today) break;
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) {
      attendanceMap[d] = 'holiday';
    } else {
      // Placeholder: mark most days as present
      attendanceMap[d] = d % 7 === 0 ? 'leave' : 'present';
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-700';
      case 'absent':
        return 'bg-red-100 text-red-700';
      case 'leave':
        return 'bg-yellow-100 text-yellow-700';
      case 'holiday':
        return 'bg-gray-100 text-gray-400';
      default:
        return 'bg-white text-gray-300';
    }
  };

  const prevMonth = () => {
    const m = month.month === 0 ? 11 : month.month - 1;
    const y = month.month === 0 ? month.year - 1 : month.year;
    onMonthChange({ year: y, month: m });
  };

  const nextMonth = () => {
    const m = month.month === 11 ? 0 : month.month + 1;
    const y = month.month === 11 ? month.year + 1 : month.year;
    onMonthChange({ year: y, month: m });
  };

  return (
    <Card>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
        >
          &larr;
        </button>
        <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
        >
          &rarr;
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
            {d}
          </div>
        ))}

        {/* Empty cells for days before the 1st */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const status = attendanceMap[day];
          return (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium ${getStatusColor(status)}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
          <span className="text-xs text-gray-600">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
          <span className="text-xs text-gray-600">Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
          <span className="text-xs text-gray-600">Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
          <span className="text-xs text-gray-600">Holiday</span>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Salary History Tab                                                   */
/* ------------------------------------------------------------------ */
function SalaryTab({
  employee,
  formatCurrency,
}: {
  employee: Employee;
  formatCurrency: (n: number) => string;
}) {
  // Placeholder salary history
  const months = ['Mar 2026', 'Feb 2026', 'Jan 2026', 'Dec 2025', 'Nov 2025'];
  const salaryHistory = months.map((month) => ({
    month,
    base: employee.baseSalary,
    incentive: Math.floor(Math.random() * 5000),
    fuel: employee.fuelAllowance,
    deductions: Math.floor(Math.random() * 2000),
    net: 0,
  }));
  salaryHistory.forEach((s) => {
    s.net = s.base + s.incentive + s.fuel - s.deductions;
  });

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Base</th>
              <th className="px-4 py-3">Incentive</th>
              <th className="px-4 py-3">Fuel</th>
              <th className="px-4 py-3">Deductions</th>
              <th className="px-4 py-3">Net Pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {salaryHistory.map((row) => (
              <tr key={row.month} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.month}</td>
                <td className="px-4 py-3 text-gray-700">{formatCurrency(row.base)}</td>
                <td className="px-4 py-3 text-green-600">{formatCurrency(row.incentive)}</td>
                <td className="px-4 py-3 text-gray-700">{formatCurrency(row.fuel)}</td>
                <td className="px-4 py-3 text-red-600">-{formatCurrency(row.deductions)}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(row.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Visits Tab                                                          */
/* ------------------------------------------------------------------ */
function VisitsTab() {
  return (
    <Card>
      <div className="text-center py-12">
        <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">
          Visit history will appear here once the employee starts logging visits.
        </p>
      </div>
    </Card>
  );
}
