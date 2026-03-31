'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, AlertTriangle, Filter, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import Modal from '@/components/ui/Modal';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import ComplianceForm from './ComplianceForm';

interface ComplianceRecord {
  _id: string;
  employeeId: { _id: string; name: string } | string;
  bankId: { _id: string; name: string } | string;
  certificationType: string;
  certificationName: string;
  issuedDate: string;
  expiryDate: string;
  certificateNumber: string;
  status: string;
  examName: string;
  examDate: string;
  examScore: number;
  examStatus: string;
  remarks: string;
  createdAt: string;
}

interface Employee {
  _id: string;
  name: string;
}

interface Bank {
  _id: string;
  name: string;
  code: string;
}

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  valid: 'success',
  expired: 'danger',
  pending: 'warning',
  renewal_due: 'warning',
};

const examStatusBadgeVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  passed: 'success',
  failed: 'danger',
  scheduled: 'info',
  pending: 'warning',
  not_applicable: 'default',
};

const statusOptions = [
  { value: 'valid', label: 'Valid' },
  { value: 'expired', label: 'Expired' },
  { value: 'pending', label: 'Pending' },
  { value: 'renewal_due', label: 'Renewal Due' },
];

const examStatusOptions = [
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'pending', label: 'Pending' },
  { value: 'not_applicable', label: 'Not Applicable' },
];

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

export default function CompliancePage() {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ComplianceRecord | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterExamStatus, setFilterExamStatus] = useState('');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/compliance');
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch compliance records');
      }
    } catch {
      toast.error('Failed to fetch compliance records');
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

  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/banks');
      const data = await res.json();
      if (data.success) setBanks(data.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchEmployees();
    fetchBanks();
  }, []);

  const getEmployeeName = (record: ComplianceRecord) => {
    if (typeof record.employeeId === 'object' && record.employeeId?.name) return record.employeeId.name;
    return '-';
  };

  const getBankName = (record: ComplianceRecord) => {
    if (typeof record.bankId === 'object' && record.bankId?.name) return record.bankId.name;
    return '-';
  };

  // Records expiring within 30 days
  const expiringRecords = useMemo(() => {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return records.filter((r) => {
      if (!r.expiryDate) return false;
      const expiry = new Date(r.expiryDate);
      return expiry > now && expiry <= thirtyDaysLater;
    });
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterEmployee) {
        const empId = typeof r.employeeId === 'object' ? r.employeeId._id : r.employeeId;
        if (empId !== filterEmployee) return false;
      }
      if (filterBank) {
        const bankId = typeof r.bankId === 'object' ? r.bankId._id : r.bankId;
        if (bankId !== filterBank) return false;
      }
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterExamStatus && r.examStatus !== filterExamStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const empName = getEmployeeName(r).toLowerCase();
        const certName = (r.certificationName || '').toLowerCase();
        const examName = (r.examName || '').toLowerCase();
        if (!empName.includes(q) && !certName.includes(q) && !examName.includes(q)) return false;
      }
      return true;
    });
  }, [records, search, filterEmployee, filterBank, filterStatus, filterExamStatus]);

  const handleAdd = () => {
    setEditingRecord(null);
    setShowModal(true);
  };

  const handleEdit = (record: ComplianceRecord) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const handleDelete = async (record: ComplianceRecord) => {
    if (!confirm('Are you sure you want to delete this compliance record?')) return;

    try {
      const res = await fetch(`/api/compliance/${record._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Compliance record deleted');
        fetchRecords();
      } else {
        toast.error(data.error || 'Failed to delete record');
      }
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingRecord(null);
    fetchRecords();
  };

  const employeeOptions = employees.map((e) => ({ value: e._id, label: e.name }));
  const bankOptions = banks.map((b) => ({ value: b._id, label: `${b.name} (${b.code})` }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" label="Loading compliance records..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance & Certifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage employee certifications and compliance records
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Compliance Record
        </Button>
      </div>

      {/* Expiring Soon Alert */}
      {expiringRecords.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-orange-800">
                Expiring Soon ({expiringRecords.length} record{expiringRecords.length > 1 ? 's' : ''})
              </h3>
              <div className="mt-2 space-y-1">
                {expiringRecords.map((r) => (
                  <p key={r._id} className="text-sm text-orange-700">
                    <span className="font-medium">{getEmployeeName(r)}</span>
                    {' - '}
                    {r.certificationName}
                    {' (expires '}
                    {formatDate(r.expiryDate)}
                    {')'}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Search & Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by employee, certification, or exam name..."
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <Select
                label="Employee"
                options={employeeOptions}
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                placeholder="All Employees"
              />
              <Select
                label="Bank"
                options={bankOptions}
                value={filterBank}
                onChange={(e) => setFilterBank(e.target.value)}
                placeholder="All Banks"
              />
              <Select
                label="Status"
                options={statusOptions}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                placeholder="All Statuses"
              />
              <Select
                label="Exam Status"
                options={examStatusOptions}
                value={filterExamStatus}
                onChange={(e) => setFilterExamStatus(e.target.value)}
                placeholder="All Exam Statuses"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {search || filterEmployee || filterBank || filterStatus || filterExamStatus
                ? 'No compliance records match your filters.'
                : 'No compliance records added yet.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>Employee Name</TableCell>
                <TableCell isHeader>Bank</TableCell>
                <TableCell isHeader>Certification Name</TableCell>
                <TableCell isHeader>Exam Name</TableCell>
                <TableCell isHeader>Issued Date</TableCell>
                <TableCell isHeader>Expiry Date</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Exam Status</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record._id}>
                  <TableCell>
                    <span className="font-medium">{getEmployeeName(record)}</span>
                  </TableCell>
                  <TableCell>{getBankName(record)}</TableCell>
                  <TableCell>{record.certificationName || '-'}</TableCell>
                  <TableCell>{record.examName || '-'}</TableCell>
                  <TableCell>{formatDate(record.issuedDate)}</TableCell>
                  <TableCell>{formatDate(record.expiryDate)}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[record.status] || 'default'}>
                      {formatLabel(record.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.examStatus ? (
                      <Badge variant={examStatusBadgeVariant[record.examStatus] || 'default'}>
                        {formatLabel(record.examStatus)}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="p-1 text-gray-400 hover:text-driftwood-500 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(record)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
        title={editingRecord ? 'Edit Compliance Record' : 'Add Compliance Record'}
        className="max-w-2xl"
      >
        <ComplianceForm
          record={editingRecord as unknown as Record<string, unknown> | null}
          employees={employees}
          banks={banks}
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
