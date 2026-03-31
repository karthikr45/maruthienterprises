'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Eye, MapPin, Filter } from 'lucide-react';
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
import VisitForm from './VisitForm';

interface Visit {
  _id: string;
  customerId: { _id: string; name: string; loanAccountNumber?: string } | string;
  employeeId: { _id: string; name: string } | string;
  visitType: string;
  visitDate: string;
  outcome: string;
  amountCollected: number;
  paymentMode: string;
  paymentReference: string;
  remarks: string;
  nextFollowUpDate: string;
  checkIn?: { latitude: number; longitude: number; timestamp: string };
  locationVerified: boolean;
  fuelCost: number;
  travelDistance: number;
  photos: string[];
  createdAt: string;
}

interface Employee {
  _id: string;
  name: string;
}

const visitTypeOptions = [
  { value: '', label: 'All Visit Types' },
  { value: 'field_visit', label: 'Field Visit' },
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'office_meeting', label: 'Office Meeting' },
  { value: 'legal_notice', label: 'Legal Notice' },
  { value: 'skip_trace', label: 'Skip Trace' },
  { value: 'repossession', label: 'Repossession' },
];

const outcomeOptions = [
  { value: '', label: 'All Outcomes' },
  { value: 'payment_collected', label: 'Payment Collected' },
  { value: 'promise_to_pay', label: 'Promise to Pay' },
  { value: 'not_available', label: 'Not Available' },
  { value: 'refused_to_pay', label: 'Refused to Pay' },
  { value: 'dispute', label: 'Dispute' },
  { value: 'settled', label: 'Settled' },
  { value: 'legal_action', label: 'Legal Action' },
  { value: 'other', label: 'Other' },
];

const visitTypeBadgeVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  field_visit: 'info',
  phone_call: 'default',
  office_meeting: 'success',
  legal_notice: 'danger',
  skip_trace: 'warning',
  repossession: 'danger',
};

const outcomeBadgeVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  payment_collected: 'success',
  promise_to_pay: 'warning',
  not_available: 'default',
  refused_to_pay: 'danger',
  dispute: 'danger',
  settled: 'success',
  legal_action: 'info',
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

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterVisitType, setFilterVisitType] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/visits');
      const data = await res.json();
      if (data.success) {
        setVisits(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch visits');
      }
    } catch {
      toast.error('Failed to fetch visits');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchVisits();
    fetchEmployees();
  }, []);

  const getEmployeeName = (visit: Visit) => {
    if (typeof visit.employeeId === 'object' && visit.employeeId?.name) return visit.employeeId.name;
    return '-';
  };

  const getCustomerName = (visit: Visit) => {
    if (typeof visit.customerId === 'object' && visit.customerId?.name) return visit.customerId.name;
    return '-';
  };

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (filterEmployee && (typeof v.employeeId === 'object' ? v.employeeId._id : v.employeeId) !== filterEmployee) return false;
      if (filterVisitType && v.visitType !== filterVisitType) return false;
      if (filterOutcome && v.outcome !== filterOutcome) return false;
      if (filterDateFrom && new Date(v.visitDate) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(v.visitDate) > new Date(filterDateTo)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const empName = getEmployeeName(v).toLowerCase();
        const custName = getCustomerName(v).toLowerCase();
        if (!empName.includes(q) && !custName.includes(q) && !v.remarks?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [visits, search, filterEmployee, filterVisitType, filterOutcome, filterDateFrom, filterDateTo]);

  const handleFormSuccess = () => {
    setShowModal(false);
    fetchVisits();
  };

  const employeeOptions = [
    { value: '', label: 'All Employees' },
    ...employees.map((e) => ({ value: e._id, label: e.name })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" label="Loading visits..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visits</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track field visits and customer interactions
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Visit
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by employee, customer, or remarks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
              <Select
                label="Employee"
                options={employeeOptions}
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
              />
              <Select
                label="Visit Type"
                options={visitTypeOptions}
                value={filterVisitType}
                onChange={(e) => setFilterVisitType(e.target.value)}
              />
              <Select
                label="Outcome"
                options={outcomeOptions}
                value={filterOutcome}
                onChange={(e) => setFilterOutcome(e.target.value)}
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
        {filteredVisits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {search || filterEmployee || filterVisitType || filterOutcome
                ? 'No visits match your filters.'
                : 'No visits logged yet.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>Date</TableCell>
                <TableCell isHeader>Employee</TableCell>
                <TableCell isHeader>Customer</TableCell>
                <TableCell isHeader>Visit Type</TableCell>
                <TableCell isHeader>Outcome</TableCell>
                <TableCell isHeader>Amount Collected</TableCell>
                <TableCell isHeader>Payment Mode</TableCell>
                <TableCell isHeader>Location Verified</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVisits.map((visit) => (
                <TableRow key={visit._id}>
                  <TableCell>{formatDate(visit.visitDate)}</TableCell>
                  <TableCell>
                    <span className="font-medium">{getEmployeeName(visit)}</span>
                  </TableCell>
                  <TableCell>{getCustomerName(visit)}</TableCell>
                  <TableCell>
                    <Badge variant={visitTypeBadgeVariant[visit.visitType] || 'default'}>
                      {formatLabel(visit.visitType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={outcomeBadgeVariant[visit.outcome] || 'default'}>
                      {formatLabel(visit.outcome)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(visit.amountCollected || 0)}</TableCell>
                  <TableCell>{visit.paymentMode ? formatLabel(visit.paymentMode) : '-'}</TableCell>
                  <TableCell>
                    {visit.locationVerified ? (
                      <Badge variant="success">
                        <MapPin className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="default">Not Verified</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1 text-gray-400 hover:text-driftwood-500 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
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
        onClose={() => setShowModal(false)}
        title="Log Visit"
        className="max-w-2xl"
      >
        <VisitForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}
