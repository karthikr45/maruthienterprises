'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Calendar,
  User,
  ClipboardList,
  RefreshCw,
  UserCheck,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import StatsCard from '@/components/ui/StatsCard';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';

interface Customer {
  _id: string;
  loanAccountNumber: string;
  customerName: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  loanType: string;
  loanAmount: number;
  outstandingAmount: number;
  emiAmount: number;
  overdueAmount: number;
  overdueMonths: number;
  portfolioId: { _id: string; portfolioName: string; portfolioCode: string } | string;
  bankId: { _id: string; name: string } | string;
  assignedEmployeeId: { _id: string; name: string } | string;
  status: string;
  priority: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Visit {
  _id: string;
  visitDate: string;
  employeeId: { _id: string; name: string } | string;
  status: string;
  remarks: string;
  outcome: string;
  amountCollected: number;
  createdAt: string;
}

interface Collection {
  _id: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  referenceNumber: string;
  collectedBy: { _id: string; name: string } | string;
  createdAt: string;
}

interface Employee {
  _id: string;
  name: string;
}

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusVariant = (status: string): 'success' | 'info' | 'danger' | 'warning' | 'default' => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'in_progress':
      return 'info';
    case 'partially_recovered':
      return 'info';
    case 'fully_recovered':
      return 'success';
    case 'resolved':
      return 'success';
    case 'npa':
      return 'danger';
    case 'legal':
      return 'danger';
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

const getRefName = (
  ref: { _id: string; name?: string; portfolioName?: string; portfolioCode?: string } | string,
  field: string = 'name'
): string => {
  if (typeof ref === 'object' && ref !== null) {
    return (ref as Record<string, unknown>)[field] as string || (ref as { name?: string }).name || '-';
  }
  return '-';
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick action modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      const data = await res.json();
      if (data.success) {
        setCustomer(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch customer');
      }
    } catch {
      toast.error('Failed to fetch customer details');
    }
  };

  const fetchVisits = async () => {
    try {
      const res = await fetch(`/api/visits?customerId=${customerId}`);
      const data = await res.json();
      if (data.success) {
        setVisits(data.data || []);
      }
    } catch {
      // silent
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await fetch(`/api/collections?customerId=${customerId}`);
      const data = await res.json();
      if (data.success) {
        setCollections(data.data || []);
      }
    } catch {
      // silent
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchCustomer(), fetchVisits(), fetchCollections(), fetchEmployees()]);
      setLoading(false);
    };
    loadAll();
  }, [customerId]);

  const handleChangeStatus = async () => {
    if (!newStatus) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success('Status updated successfully');
        setShowStatusModal(false);
        setNewStatus('');
        fetchCustomer();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!newEmployeeId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedEmployeeId: newEmployeeId }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success('Employee reassigned successfully');
        setShowReassignModal(false);
        setNewEmployeeId('');
        fetchCustomer();
      } else {
        toast.error(data.error || 'Failed to reassign');
      }
    } catch {
      toast.error('Failed to reassign employee');
    } finally {
      setActionLoading(false);
    }
  };

  // Computed stats
  const totalCollected = collections.reduce((sum, c) => sum + (c.amount || 0), 0);
  const visitsCount = visits.length;
  const lastVisitDate = visits.length > 0
    ? visits.sort((a, b) => new Date(b.visitDate || b.createdAt).getTime() - new Date(a.visitDate || a.createdAt).getTime())[0]
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" label="Loading customer details..." />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found.</p>
        <Button variant="outline" onClick={() => router.push('/customers')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/customers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.customerName}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Loan Account: {customer.loanAccountNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(customer.status)}>
            {customer.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </Badge>
          <Badge variant={priorityVariant(customer.priority)}>
            {customer.priority.charAt(0).toUpperCase() + customer.priority.slice(1)} Priority
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={IndianRupee}
          label="Total Collected"
          value={formatINR(totalCollected)}
        />
        <StatsCard
          icon={Eye}
          label="Total Visits"
          value={visitsCount}
        />
        <StatsCard
          icon={Calendar}
          label="Last Visit"
          value={lastVisitDate ? formatDate(lastVisitDate.visitDate || lastVisitDate.createdAt) : 'No visits'}
        />
        <StatsCard
          icon={IndianRupee}
          label="Outstanding"
          value={formatINR(customer.outstandingAmount)}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            onClick={() => router.push(`/visits?customerId=${customerId}`)}
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Log Visit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setNewStatus(customer.status);
              setShowStatusModal(true);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Change Status
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const empId =
                typeof customer.assignedEmployeeId === 'object' && customer.assignedEmployeeId !== null
                  ? customer.assignedEmployeeId._id
                  : (customer.assignedEmployeeId as string) || '';
              setNewEmployeeId(empId);
              setShowReassignModal(true);
            }}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Reassign Employee
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Info */}
        <Card title="Customer Information">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Name</p>
                <p className="text-sm text-gray-900 mt-1">{customer.customerName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Loan Account</p>
                <p className="text-sm text-gray-900 mt-1">{customer.loanAccountNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                  <p className="text-sm text-gray-900">{customer.phone}</p>
                </div>
              </div>
              {customer.alternatePhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Alternate Phone</p>
                    <p className="text-sm text-gray-900">{customer.alternatePhone}</p>
                  </div>
                </div>
              )}
            </div>
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                  <p className="text-sm text-gray-900">{customer.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Address</p>
                <p className="text-sm text-gray-900">
                  {[customer.address, customer.city, customer.state, customer.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Bank</p>
                <p className="text-sm text-gray-900 mt-1">
                  {getRefName(customer.bankId as { _id: string; name: string })}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Portfolio</p>
                <p className="text-sm text-gray-900 mt-1">
                  {getRefName(customer.portfolioId as { _id: string; portfolioName: string }, 'portfolioName')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Assigned Employee</p>
                <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  {getRefName(customer.assignedEmployeeId as { _id: string; name: string })}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Loan Type</p>
                <p className="text-sm text-gray-900 mt-1">{customer.loanType}</p>
              </div>
            </div>
            {customer.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Notes</p>
                <p className="text-sm text-gray-900 mt-1">{customer.notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Loan & Location */}
        <div className="space-y-6">
          <Card title="Loan Details">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Loan Amount</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{formatINR(customer.loanAmount)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Outstanding</p>
                  <p className="text-sm font-semibold text-red-600 mt-1">{formatINR(customer.outstandingAmount)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">EMI Amount</p>
                  <p className="text-sm text-gray-900 mt-1">{formatINR(customer.emiAmount)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Overdue Amount</p>
                  <p className="text-sm font-semibold text-red-600 mt-1">{formatINR(customer.overdueAmount)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Overdue Months</p>
                  <p className="text-sm text-gray-900 mt-1">{customer.overdueMonths || 0} months</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Total Collected</p>
                  <p className="text-sm font-semibold text-green-600 mt-1">{formatINR(totalCollected)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Map Placeholder */}
          <Card title="Customer Location">
            {customer.latitude && customer.longitude ? (
              <div className="space-y-3">
                <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Map View</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {customer.latitude.toFixed(6)}, {customer.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Lat: {customer.latitude.toFixed(6)}</span>
                  <span>Lng: {customer.longitude.toFixed(6)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No location data available</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Visit History */}
      <Card title="Visit History">
        {visits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No visits recorded yet.</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>Date</TableCell>
                <TableCell isHeader>Employee</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Outcome</TableCell>
                <TableCell isHeader>Amount Collected</TableCell>
                <TableCell isHeader>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visits.map((visit) => (
                <TableRow key={visit._id}>
                  <TableCell>{formatDateTime(visit.visitDate || visit.createdAt)}</TableCell>
                  <TableCell>
                    {getRefName(visit.employeeId as { _id: string; name: string })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(visit.status || 'default')}>
                      {(visit.status || '-').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell>{visit.outcome || '-'}</TableCell>
                  <TableCell>
                    {visit.amountCollected ? formatINR(visit.amountCollected) : '-'}
                  </TableCell>
                  <TableCell>
                    <span className="max-w-xs truncate block">{visit.remarks || '-'}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Collection History / Payment Timeline */}
      <Card title="Collection History">
        {collections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No collections recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-0">
            <div className="relative">
              {collections
                .sort((a, b) => new Date(b.paymentDate || b.createdAt).getTime() - new Date(a.paymentDate || a.createdAt).getTime())
                .map((collection, index) => (
                  <div key={collection._id} className="flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100 flex-shrink-0" />
                      {index < collections.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-green-700">
                          {formatINR(collection.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(collection.paymentDate || collection.createdAt)}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        {collection.paymentMode && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded">
                            {collection.paymentMode}
                          </span>
                        )}
                        {collection.referenceNumber && (
                          <span>Ref: {collection.referenceNumber}</span>
                        )}
                        <span>
                          By: {getRefName(collection.collectedBy as { _id: string; name: string })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Card>

      {/* Change Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Change Customer Status"
      >
        <div className="space-y-4">
          <Select
            label="New Status"
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'partially_recovered', label: 'Partially Recovered' },
              { value: 'fully_recovered', label: 'Fully Recovered' },
              { value: 'npa', label: 'NPA' },
              { value: 'legal', label: 'Legal' },
              { value: 'closed', label: 'Closed' },
            ]}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            placeholder="Select Status"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeStatus} loading={actionLoading}>
              Update Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reassign Employee Modal */}
      <Modal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        title="Reassign Employee"
      >
        <div className="space-y-4">
          <Select
            label="Assign To"
            options={employees.map((emp) => ({ value: emp._id, label: emp.name }))}
            value={newEmployeeId}
            onChange={(e) => setNewEmployeeId(e.target.value)}
            placeholder="Select Employee"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowReassignModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleReassign} loading={actionLoading}>
              Reassign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
