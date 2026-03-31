'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
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
import CustomerForm from './CustomerForm';

interface Customer {
  _id: string;
  loanAccountNumber: string;
  customerName: string;
  phone: string;
  email: string;
  loanType: string;
  loanAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  overdueMonths: number;
  status: string;
  priority: string;
  bankId: { _id: string; name: string } | string;
  portfolioId: { _id: string; portfolioName: string } | string;
  assignedEmployeeId: { _id: string; name: string } | string;
  createdAt: string;
}

interface Bank {
  _id: string;
  name: string;
}

interface Portfolio {
  _id: string;
  portfolioName: string;
}

interface Employee {
  _id: string;
  name: string;
}

const statusVariant = (status: string): 'success' | 'info' | 'danger' | 'warning' | 'default' => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'in_progress':
      return 'info';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'default';
    case 'escalated':
      return 'danger';
    default:
      return 'default';
  }
};

const priorityVariant = (priority: string): 'success' | 'info' | 'danger' | 'warning' | 'default' => {
  switch (priority) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'danger';
    case 'critical':
      return 'danger';
    default:
      return 'default';
  }
};

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [filterPortfolio, setFilterPortfolio] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch customers');
      }
    } catch {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiltersData = async () => {
    try {
      const [banksRes, portfoliosRes, employeesRes] = await Promise.all([
        fetch('/api/banks'),
        fetch('/api/portfolios'),
        fetch('/api/employees'),
      ]);
      const [banksData, portfoliosData, employeesData] = await Promise.all([
        banksRes.json(),
        portfoliosRes.json(),
        employeesRes.json(),
      ]);
      if (banksData.success) setBanks(banksData.data);
      if (portfoliosData.success) setPortfolios(portfoliosData.data);
      if (employeesData.success) setEmployees(employeesData.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchFiltersData();
  }, []);

  const getRefName = (
    ref: { _id: string; name?: string; portfolioName?: string } | string,
    field: 'name' | 'portfolioName' = 'name'
  ) => {
    if (typeof ref === 'object' && ref !== null) return ref[field] || ref.name || '-';
    return '-';
  };

  const getRefId = (ref: { _id: string } | string) => {
    if (typeof ref === 'object' && ref !== null) return ref._id;
    return ref;
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        c.customerName.toLowerCase().includes(q) ||
        c.loanAccountNumber.toLowerCase().includes(q) ||
        c.phone.includes(q);
      const matchesBank = !filterBank || getRefId(c.bankId) === filterBank;
      const matchesPortfolio = !filterPortfolio || getRefId(c.portfolioId) === filterPortfolio;
      const matchesStatus = !filterStatus || c.status === filterStatus;
      const matchesPriority = !filterPriority || c.priority === filterPriority;
      const matchesEmployee = !filterEmployee || getRefId(c.assignedEmployeeId) === filterEmployee;
      return matchesSearch && matchesBank && matchesPortfolio && matchesStatus && matchesPriority && matchesEmployee;
    });
  }, [customers, search, filterBank, filterPortfolio, filterStatus, filterPriority, filterEmployee]);

  const handleAdd = () => {
    setEditingCustomer(null);
    setShowModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowModal(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete "${customer.customerName}"?`)) return;
    try {
      const res = await fetch(`/api/customers/${customer._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Customer deleted successfully');
        fetchCustomers();
      } else {
        toast.error(data.error || 'Failed to delete customer');
      }
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" label="Loading customers..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage loan customers and their recovery status
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, loan account number, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Select
              options={banks.map((b) => ({ value: b._id, label: b.name }))}
              placeholder="All Banks"
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
            />
            <Select
              options={portfolios.map((p) => ({ value: p._id, label: p.portfolioName }))}
              placeholder="All Portfolios"
              value={filterPortfolio}
              onChange={(e) => setFilterPortfolio(e.target.value)}
            />
            <Select
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'escalated', label: 'Escalated' },
                { value: 'closed', label: 'Closed' },
              ]}
              placeholder="All Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />
            <Select
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
              placeholder="All Priority"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            />
            <Select
              options={employees.map((e) => ({ value: e._id, label: e.name }))}
              placeholder="All Employees"
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {search || filterBank || filterPortfolio || filterStatus || filterPriority || filterEmployee
                ? 'No customers match your filters.'
                : 'No customers added yet.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>Loan Account</TableCell>
                <TableCell isHeader>Customer Name</TableCell>
                <TableCell isHeader>Phone</TableCell>
                <TableCell isHeader>Bank</TableCell>
                <TableCell isHeader>Loan Type</TableCell>
                <TableCell isHeader>Outstanding</TableCell>
                <TableCell isHeader>Overdue</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Priority</TableCell>
                <TableCell isHeader>Assigned To</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell>
                    <span className="font-medium">{customer.loanAccountNumber}</span>
                  </TableCell>
                  <TableCell>{customer.customerName}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{getRefName(customer.bankId as { _id: string; name: string })}</TableCell>
                  <TableCell>{customer.loanType}</TableCell>
                  <TableCell>{formatINR(customer.outstandingAmount)}</TableCell>
                  <TableCell>{formatINR(customer.overdueAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(customer.status)}>
                      {customer.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={priorityVariant(customer.priority)}>
                      {customer.priority.charAt(0).toUpperCase() + customer.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getRefName(customer.assignedEmployeeId as { _id: string; name: string })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/customers/${customer._id}`)}
                        className="p-1 text-gray-400 hover:text-driftwood-500 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-1 text-gray-400 hover:text-driftwood-500 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer)}
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
          setEditingCustomer(null);
        }}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        className="max-w-3xl"
      >
        <CustomerForm
          customer={editingCustomer as Record<string, unknown> | null}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowModal(false);
            setEditingCustomer(null);
          }}
        />
      </Modal>
    </div>
  );
}
