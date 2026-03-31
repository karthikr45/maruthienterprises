'use client';

import { useState, useEffect } from 'react';
import {
  IndianRupee,
  Users,
  FileText,
  MapPin,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatsCard from '@/components/ui/StatsCard';
import Card from '@/components/ui/Card';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import Loader from '@/components/ui/Loader';
import Badge from '@/components/ui/Badge';

interface DashboardStats {
  totalCollections: number;
  activeEmployees: number;
  pendingCases: number;
  visitsToday: number;
  totalOutstanding: number;
  recoveryRate: number;
  collectionsTrend?: number;
  employeesTrend?: number;
  casesTrend?: number;
  visitsTrend?: number;
  outstandingTrend?: number;
  recoveryTrend?: number;
  bankWiseCollections: { bank: string; amount: number }[];
  recentVisits: {
    _id: string;
    customerName: string;
    bank: string;
    employee: string;
    status: string;
    date: string;
    amount: number;
  }[];
  upcomingFollowUps: {
    _id: string;
    customerName: string;
    bank: string;
    employee: string;
    followUpDate: string;
    remarks: string;
    priority: string;
  }[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'paid':
      return 'success';
    case 'pending':
    case 'in progress':
      return 'warning';
    case 'failed':
    case 'cancelled':
      return 'danger';
    case 'scheduled':
      return 'info';
    default:
      return 'default';
  }
}

function getPriorityVariant(priority: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" label="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-driftwood-600 hover:text-driftwood-500 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cocoa-800">Dashboard</h1>
        <p className="mt-1 text-sm text-morning-500">
          Overview of your recovery agency performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          icon={IndianRupee}
          label="Total Collections"
          value={formatCurrency(stats.totalCollections)}
          trend={
            stats.collectionsTrend !== undefined
              ? { value: stats.collectionsTrend, isPositive: stats.collectionsTrend >= 0 }
              : undefined
          }
        />
        <StatsCard
          icon={Users}
          label="Active Employees"
          value={stats.activeEmployees}
          trend={
            stats.employeesTrend !== undefined
              ? { value: stats.employeesTrend, isPositive: stats.employeesTrend >= 0 }
              : undefined
          }
        />
        <StatsCard
          icon={FileText}
          label="Pending Cases"
          value={stats.pendingCases}
          trend={
            stats.casesTrend !== undefined
              ? { value: Math.abs(stats.casesTrend), isPositive: stats.casesTrend <= 0 }
              : undefined
          }
        />
        <StatsCard
          icon={MapPin}
          label="Visits Today"
          value={stats.visitsToday}
          trend={
            stats.visitsTrend !== undefined
              ? { value: stats.visitsTrend, isPositive: stats.visitsTrend >= 0 }
              : undefined
          }
        />
        <StatsCard
          icon={Wallet}
          label="Total Outstanding"
          value={formatCurrency(stats.totalOutstanding)}
          trend={
            stats.outstandingTrend !== undefined
              ? { value: Math.abs(stats.outstandingTrend), isPositive: stats.outstandingTrend <= 0 }
              : undefined
          }
        />
        <StatsCard
          icon={TrendingUp}
          label="Recovery Rate"
          value={`${stats.recoveryRate}%`}
          trend={
            stats.recoveryTrend !== undefined
              ? { value: stats.recoveryTrend, isPositive: stats.recoveryTrend >= 0 }
              : undefined
          }
        />
      </div>

      {/* Bank-wise Collections Chart */}
      {stats.bankWiseCollections && stats.bankWiseCollections.length > 0 && (
        <Card title="Bank-wise Collections" subtitle="Monthly collection breakdown by bank">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.bankWiseCollections}
                margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="bank"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  tickFormatter={(value) =>
                    `${(value / 1000).toFixed(0)}K`
                  }
                />
                <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [formatCurrency(Number(value)), 'Collection']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar
                  dataKey="amount"
                  fill="#B07B6B"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visits */}
        <Card title="Recent Visits" subtitle="Latest field visit activity">
          {stats.recentVisits && stats.recentVisits.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell isHeader>Customer</TableCell>
                  <TableCell isHeader>Bank</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.recentVisits.map((visit) => (
                  <TableRow key={visit._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{visit.customerName}</p>
                        <p className="text-xs text-morning-500">
                          {formatDate(visit.date)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{visit.bank}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(visit.status)}>
                        {visit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(visit.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-morning-500 text-center py-8">
              No recent visits
            </p>
          )}
        </Card>

        {/* Upcoming Follow-ups */}
        <Card title="Upcoming Follow-ups" subtitle="Scheduled follow-up tasks">
          {stats.upcomingFollowUps && stats.upcomingFollowUps.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell isHeader>Customer</TableCell>
                  <TableCell isHeader>Bank</TableCell>
                  <TableCell isHeader>Date</TableCell>
                  <TableCell isHeader>Priority</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.upcomingFollowUps.map((followUp) => (
                  <TableRow key={followUp._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{followUp.customerName}</p>
                        <p className="text-xs text-morning-500 truncate max-w-[150px]">
                          {followUp.remarks}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{followUp.bank}</TableCell>
                    <TableCell>{formatDate(followUp.followUpDate)}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityVariant(followUp.priority)}>
                        {followUp.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-morning-500 text-center py-8">
              No upcoming follow-ups
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
