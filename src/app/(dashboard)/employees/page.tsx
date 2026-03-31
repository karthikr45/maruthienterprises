'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
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
import EmployeeForm from './EmployeeForm';

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
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [banks, setBanks] = useState<BankRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch employees');
      }
    } catch {
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/banks');
      const data = await res.json();
      if (data.success) {
        setBanks(data.data);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchBanks();
  }, []);

  const filteredEmployees = useMemo(() => {
    let result = employees;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.phone.includes(q)
      );
    }

    if (filterBank) {
      result = result.filter((e) =>
        e.assignedBanks?.some((b) => b._id === filterBank)
      );
    }

    if (filterDepartment) {
      result = result.filter((e) => e.department === filterDepartment);
    }

    if (filterStatus) {
      const isActive = filterStatus === 'active';
      result = result.filter((e) => e.isActive === isActive);
    }

    return result;
  }, [employees, search, filterBank, filterDepartment, filterStatus]);

  const handleAdd = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setShowModal(true);
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Are you sure you want to delete "${emp.name}"?`)) return;

    try {
      const res = await fetch(`/api/employees/${emp._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Employee deleted successfully');
        fetchEmployees();
      } else {
        toast.error(data.error || 'Failed to delete employee');
      }
    } catch {
      toast.error('Failed to delete employee');
    }
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingEmployee(null);
    fetchEmployees();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const departmentOptions = [
    { value: 'Recovery', label: 'Recovery' },
    { value: 'Legal', label: 'Legal' },
    { value: 'Admin', label: 'Admin' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const bankOptions = banks.map((b) => ({
    value: b._id,
    label: `${b.name} (${b.code})`,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" label="Loading employees..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage employees and their assignments
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, ID, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            options={bankOptions}
            value={filterBank}
            onChange={(e) => setFilterBank(e.target.value)}
            placeholder="All Banks"
          />
          <Select
            options={departmentOptions}
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            placeholder="All Departments"
          />
          <Select
            options={statusOptions}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            placeholder="All Status"
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {search || filterBank || filterDepartment || filterStatus
                ? 'No employees match your filters.'
                : 'No employees added yet.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>Employee ID</TableCell>
                <TableCell isHeader>Name</TableCell>
                <TableCell isHeader>Phone</TableCell>
                <TableCell isHeader>Designation</TableCell>
                <TableCell isHeader>Assigned Banks</TableCell>
                <TableCell isHeader>Date of Joining</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.map((emp) => (
                <TableRow key={emp._id}>
                  <TableCell>
                    <span className="font-mono text-sm">{emp.employeeId}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{emp.name}</span>
                  </TableCell>
                  <TableCell>{emp.phone}</TableCell>
                  <TableCell>{emp.designation}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {emp.assignedBanks?.length > 0
                        ? emp.assignedBanks.map((b) => (
                            <Badge key={b._id} variant="info">
                              {b.name}
                            </Badge>
                          ))
                        : <span className="text-gray-400">None</span>}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(emp.dateOfJoining)}</TableCell>
                  <TableCell>
                    <Badge variant={emp.isActive ? 'success' : 'danger'}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/employees/${emp._id}`}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleEdit(emp)}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp)}
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
          setEditingEmployee(null);
        }}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        className="max-w-3xl"
      >
        <EmployeeForm
          employee={editingEmployee as Record<string, unknown> | null}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowModal(false);
            setEditingEmployee(null);
          }}
        />
      </Modal>
    </div>
  );
}
