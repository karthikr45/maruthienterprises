'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Filter, CheckCircle, XCircle, Receipt, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
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
import ExpenseForm from './ExpenseForm';

interface Employee {
  _id: string;
  name: string;
}

interface ExpenseRecord {
  _id: string;
  employeeId: { _id: string; name: string } | string;
  date: string;
  category: string;
  amount: number;
  description: string;
  remarks: string;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
  createdAt: string;
}

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'travel', label: 'Travel' },
  { value: 'food', label: 'Food' },
  { value: 'phone', label: 'Phone' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'other', label: 'Other' },
];

const statusFilterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const categoryBadgeVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  fuel: 'info',
  travel: 'default',
  food: 'success',
  phone: 'warning',
  office_supplies: 'info',
  other: 'default',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatLabel = (str: string) =>
  str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (data.success) {
        setExpenses(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch expenses');
      }
    } catch {
      toast.error('Failed to fetch expenses');
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
    fetchExpenses();
    fetchEmployees();
  }, []);

  const getEmployeeName = (record: ExpenseRecord) => {
    if (typeof record.employeeId === 'object' && record.employeeId?.name) return record.employeeId.name;
    return '-';
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((ex) => {
      if (filterEmployee) {
        const empId = typeof ex.employeeId === 'object' ? ex.employeeId._id : ex.employeeId;
        if (empId !== filterEmployee) return false;
      }
      if (filterCategory && ex.category !== filterCategory) return false;
      if (filterStatus && ex.status !== filterStatus) return false;
      if (filterDateFrom && new Date(ex.date) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(ex.date) > new Date(filterDateTo)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const empName = getEmployeeName(ex).toLowerCase();
        const desc = (ex.description || '').toLowerCase();
        if (!empName.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, search, filterEmployee, filterCategory, filterStatus, filterDateFrom, filterDateTo]);

  const summary = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    expenses.forEach((ex) => {
      if (ex.status === 'pending') pending += ex.amount || 0;
      else if (ex.status === 'approved') approved += ex.amount || 0;
      else if (ex.status === 'rejected') rejected += ex.amount || 0;
    });
    return { pending, approved, rejected };
  }, [expenses]);

  const handleAdd = () => {
    setEditingRecord(null);
    setShowModal(true);
  };

  const handleEdit = (record: ExpenseRecord) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const handleDelete = async (record: ExpenseRecord) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const res = await fetch(`/api/expenses/${record._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Expense deleted');
        fetchExpenses();
      } else {
        toast.error(data.error || 'Failed to delete expense');
      }
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const handleApproveReject = async (record: ExpenseRecord, action: 'approved' | 'rejected') => {
    setActionLoading(record._id);
    try {
      const res = await fetch(`/api/expenses/${record._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...record,
          employeeId: typeof record.employeeId === 'object' ? record.employeeId._id : record.employeeId,
          status: action,
          approvedDate: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Expense ${action}`);
        fetchExpenses();
      } else {
        toast.error(data.error || `Failed to ${action === 'approved' ? 'approve' : 'reject'} expense`);
      }
    } catch {
      toast.error('Failed to update expense');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingRecord(null);
    fetchExpenses();
  };

  const employeeFilterOptions = [
    { value: '', label: 'All Employees' },
    ...employees.map((e) => ({ value: e._id, label: e.name })),
  ];

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" label="Loading expenses..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage employee expenses
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard icon={Clock} label="Total Pending" value={formatCurrency(summary.pending)} />
        <StatsCard icon={ThumbsUp} label="Total Approved" value={formatCurrency(summary.approved)} />
        <StatsCard icon={ThumbsDown} label="Total Rejected" value={formatCurrency(summary.rejected)} />
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by employee or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
              <Select
                label="Employee"
                options={employeeFilterOptions}
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
              />
              <Select
                label="Category"
                options={categoryOptions}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              />
              <Select
                label="Status"
                options={statusFilterOptions}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              />
              <Input
                label="Date From"
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
              <Input
                label="Date To"
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="md" label="Loading expenses..." />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {search || filterEmployee || filterCategory || filterStatus
                ? 'No expenses match your filters.'
                : 'No expenses recorded yet.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>Date</TableCell>
                <TableCell isHeader>Employee</TableCell>
                <TableCell isHeader>Category</TableCell>
                <TableCell isHeader>Amount</TableCell>
                <TableCell isHeader>Description</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense._id}>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>
                    <span className="font-medium">{getEmployeeName(expense)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={categoryBadgeVariant[expense.category] || 'default'}>
                      {formatLabel(expense.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{formatCurrency(expense.amount || 0)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 line-clamp-2">
                      {expense.description || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[expense.status] || 'default'}>
                      {formatLabel(expense.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-1 text-gray-400 hover:text-driftwood-500 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {expense.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveReject(expense, 'approved')}
                            disabled={actionLoading === expense._id}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleApproveReject(expense, 'rejected')}
                            disabled={actionLoading === expense._id}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
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
        title={editingRecord ? 'Edit Expense' : 'Add Expense'}
        className="max-w-lg"
      >
        <ExpenseForm
          record={editingRecord as unknown as Record<string, unknown> | null}
          employees={employees}
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
