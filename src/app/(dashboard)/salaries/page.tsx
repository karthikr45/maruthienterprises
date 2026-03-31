'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, DollarSign, CheckCircle, Calculator, Wallet, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import Modal from '@/components/ui/Modal';
import StatsCard from '@/components/ui/StatsCard';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import SalaryForm from './SalaryForm';

interface Employee {
  _id: string;
  name: string;
  baseSalary: number;
  fuelAllowance: number;
}

interface SalaryRecord {
  _id: string;
  employeeId: { _id: string; name: string } | string;
  month: number;
  year: number;
  baseSalary: number;
  incentiveAmount: number;
  fuelAllowance: number;
  otherAllowances: number;
  pfDeduction: number;
  esiDeduction: number;
  tdsDeduction: number;
  otherDeductions: number;
  netSalary: number;
  status: string;
  paidDate?: string;
  remarks?: string;
  createdAt: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  draft: 'default',
  generated: 'info',
  processed: 'warning',
  paid: 'success',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatLabel = (str: string) =>
  str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function SalariesPage() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalaryRecord | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        month: String(currentMonth),
        year: String(currentYear),
      });
      const res = await fetch(`/api/salaries?${params}`);
      const data = await res.json();
      if (data.success) {
        setSalaries(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch salary records');
      }
    } catch {
      toast.error('Failed to fetch salary records');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) setEmployees(data.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchSalaries();
  }, [currentMonth, currentYear]);

  const getEmployeeName = (record: SalaryRecord) => {
    if (typeof record.employeeId === 'object' && record.employeeId?.name) return record.employeeId.name;
    return '-';
  };

  const summary = useMemo(() => {
    let totalPayroll = 0;
    let totalIncentives = 0;
    let totalDeductions = 0;
    salaries.forEach((s) => {
      totalPayroll += s.netSalary || 0;
      totalIncentives += s.incentiveAmount || 0;
      totalDeductions += (s.pfDeduction || 0) + (s.esiDeduction || 0) + (s.tdsDeduction || 0) + (s.otherDeductions || 0);
    });
    return { totalPayroll, totalIncentives, totalDeductions };
  }, [salaries]);

  const handleAdd = () => {
    setEditingRecord(null);
    setShowModal(true);
  };

  const handleEdit = (record: SalaryRecord) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const handleProcess = async (record: SalaryRecord, newStatus: string) => {
    setProcessingId(record._id);
    try {
      const res = await fetch(`/api/salaries/${record._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...record,
          employeeId: typeof record.employeeId === 'object' ? record.employeeId._id : record.employeeId,
          status: newStatus,
          paidDate: newStatus === 'paid' ? new Date().toISOString() : record.paidDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Salary marked as ${formatLabel(newStatus)}`);
        fetchSalaries();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingRecord(null);
    fetchSalaries();
  };

  const monthOptions = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }));
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = now.getFullYear() - 2 + i;
    return { value: String(y), label: String(y) };
  });

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" label="Loading salaries..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate and manage employee salaries
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Salary
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard icon={Wallet} label="Total Payroll" value={formatCurrency(summary.totalPayroll)} />
        <StatsCard icon={DollarSign} label="Total Incentives" value={formatCurrency(summary.totalIncentives)} />
        <StatsCard icon={TrendingDown} label="Total Deductions" value={formatCurrency(summary.totalDeductions)} />
      </div>

      {/* Month/Year Selector */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="md" label="Loading salary records..." />
          </div>
        ) : salaries.length === 0 ? (
          <div className="text-center py-12">
            <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              No salary records for {MONTHS[currentMonth - 1]} {currentYear}.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Click &quot;Generate Salary&quot; to create salary records.
            </p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>Employee</TableCell>
                <TableCell isHeader>Base Salary</TableCell>
                <TableCell isHeader>Incentive</TableCell>
                <TableCell isHeader>Fuel Allowance</TableCell>
                <TableCell isHeader>Other Allowances</TableCell>
                <TableCell isHeader>PF</TableCell>
                <TableCell isHeader>ESI</TableCell>
                <TableCell isHeader>TDS</TableCell>
                <TableCell isHeader>Other Deductions</TableCell>
                <TableCell isHeader>Net Salary</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salaries.map((record) => (
                <TableRow key={record._id}>
                  <TableCell>
                    <span className="font-medium">{getEmployeeName(record)}</span>
                  </TableCell>
                  <TableCell>{formatCurrency(record.baseSalary || 0)}</TableCell>
                  <TableCell>{formatCurrency(record.incentiveAmount || 0)}</TableCell>
                  <TableCell>{formatCurrency(record.fuelAllowance || 0)}</TableCell>
                  <TableCell>{formatCurrency(record.otherAllowances || 0)}</TableCell>
                  <TableCell className="text-red-600">{formatCurrency(record.pfDeduction || 0)}</TableCell>
                  <TableCell className="text-red-600">{formatCurrency(record.esiDeduction || 0)}</TableCell>
                  <TableCell className="text-red-600">{formatCurrency(record.tdsDeduction || 0)}</TableCell>
                  <TableCell className="text-red-600">{formatCurrency(record.otherDeductions || 0)}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-700">{formatCurrency(record.netSalary || 0)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[record.status] || 'default'}>
                      {formatLabel(record.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(record)}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {record.status !== 'processed' && record.status !== 'paid' && (
                        <button
                          onClick={() => handleProcess(record, 'processed')}
                          disabled={processingId === record._id}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Process"
                        >
                          <Calculator className="h-4 w-4" />
                        </button>
                      )}
                      {record.status !== 'paid' && (
                        <button
                          onClick={() => handleProcess(record, 'paid')}
                          disabled={processingId === record._id}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Mark as Paid"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingRecord(null);
        }}
        title={editingRecord ? 'Edit Salary Record' : 'Generate Salary'}
        className="max-w-2xl"
      >
        <SalaryForm
          record={editingRecord as unknown as Record<string, unknown> | null}
          employees={employees}
          defaultMonth={currentMonth}
          defaultYear={currentYear}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowModal(false);
            setEditingRecord(null);
          }}
        />
      </Modal>
    </div>
  );
}
