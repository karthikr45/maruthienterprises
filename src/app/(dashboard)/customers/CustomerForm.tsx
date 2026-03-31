'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

interface CustomerData {
  _id?: string;
  loanAccountNumber: string;
  customerName: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  loanType: string;
  loanAmount: string;
  outstandingAmount: string;
  emiAmount: string;
  overdueAmount: string;
  overdueMonths: string;
  portfolioId: string;
  bankId: string;
  assignedEmployeeId: string;
  status: string;
  priority: string;
  notes: string;
}

interface Portfolio {
  _id: string;
  portfolioName: string;
  bankId: { _id: string; name: string } | string;
}

interface Employee {
  _id: string;
  name: string;
  employeeId?: string;
}

interface Bank {
  _id: string;
  name: string;
}

interface CustomerFormProps {
  customer?: Record<string, unknown> | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const loanTypes = [
  { value: 'Home Loan', label: 'Home Loan' },
  { value: 'Personal Loan', label: 'Personal Loan' },
  { value: 'Vehicle Loan', label: 'Vehicle Loan' },
  { value: 'Business Loan', label: 'Business Loan' },
  { value: 'Credit Card', label: 'Credit Card' },
  { value: 'Gold Loan', label: 'Gold Loan' },
  { value: 'Education Loan', label: 'Education Loan' },
];

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'partially_recovered', label: 'Partially Recovered' },
  { value: 'fully_recovered', label: 'Fully Recovered' },
  { value: 'npa', label: 'NPA' },
  { value: 'legal', label: 'Legal' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const initialForm: CustomerData = {
  loanAccountNumber: '',
  customerName: '',
  phone: '',
  alternatePhone: '',
  email: '',
  address: '',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '',
  latitude: '',
  longitude: '',
  loanType: 'Personal Loan',
  loanAmount: '',
  outstandingAmount: '',
  emiAmount: '',
  overdueAmount: '',
  overdueMonths: '',
  portfolioId: '',
  bankId: '',
  assignedEmployeeId: '',
  status: 'pending',
  priority: 'medium',
  notes: '',
};

export default function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const [form, setForm] = useState<CustomerData>(initialForm);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const isEdit = !!customer?._id;

  useEffect(() => {
    const fetchData = async () => {
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
        if (banksData.success) setBanks(banksData.data || []);
        if (portfoliosData.success) setPortfolios(portfoliosData.data || []);
        if (employeesData.success) setEmployees(employeesData.data || []);
      } catch {
        // silent
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (customer) {
      const getRefId = (ref: unknown): string => {
        if (typeof ref === 'object' && ref !== null && '_id' in (ref as Record<string, unknown>)) {
          return (ref as Record<string, unknown>)._id as string;
        }
        return (ref as string) || '';
      };

      setForm({
        _id: customer._id as string,
        loanAccountNumber: (customer.loanAccountNumber as string) || '',
        customerName: (customer.customerName as string) || '',
        phone: (customer.phone as string) || '',
        alternatePhone: (customer.alternatePhone as string) || '',
        email: (customer.email as string) || '',
        address: (customer.address as string) || '',
        city: (customer.city as string) || 'Hyderabad',
        state: (customer.state as string) || 'Telangana',
        pincode: (customer.pincode as string) || '',
        latitude: customer.latitude?.toString() || '',
        longitude: customer.longitude?.toString() || '',
        loanType: (customer.loanType as string) || 'Personal Loan',
        loanAmount: customer.loanAmount?.toString() || '',
        outstandingAmount: customer.outstandingAmount?.toString() || '',
        emiAmount: customer.emiAmount?.toString() || '',
        overdueAmount: customer.overdueAmount?.toString() || '',
        overdueMonths: customer.overdueMonths?.toString() || '',
        portfolioId: getRefId(customer.portfolioId),
        bankId: getRefId(customer.bankId),
        assignedEmployeeId: getRefId(customer.assignedEmployeeId),
        status: (customer.status as string) || 'pending',
        priority: (customer.priority as string) || 'medium',
        notes: (customer.notes as string) || '',
      });
    }
  }, [customer]);

  // Auto-set bankId when portfolioId changes
  useEffect(() => {
    if (form.portfolioId && portfolios.length > 0) {
      const portfolio = portfolios.find((p) => p._id === form.portfolioId);
      if (portfolio) {
        const bankId =
          typeof portfolio.bankId === 'object' && portfolio.bankId !== null
            ? portfolio.bankId._id
            : (portfolio.bankId as string) || '';
        if (bankId && bankId !== form.bankId) {
          setForm((prev) => ({ ...prev, bankId }));
        }
      }
    }
  }, [form.portfolioId, portfolios]);

  const getBankDisplayName = (): string => {
    if (!form.bankId) return '';
    const bank = banks.find((b) => b._id === form.bankId);
    return bank?.name || form.bankId;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        loanAmount: parseFloat(form.loanAmount) || 0,
        outstandingAmount: parseFloat(form.outstandingAmount) || 0,
        emiAmount: form.emiAmount ? parseFloat(form.emiAmount) : 0,
        overdueAmount: parseFloat(form.overdueAmount) || 0,
        overdueMonths: parseInt(form.overdueMonths) || 0,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      };

      const url = isEdit ? `/api/customers/${customer!._id}` : '/api/customers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success && !res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      toast.success(isEdit ? 'Customer updated successfully' : 'Customer added successfully');
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Personal Information */}
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Personal Information
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Loan Account Number"
          name="loanAccountNumber"
          value={form.loanAccountNumber}
          onChange={handleChange}
          required
        />
        <Input
          label="Customer Name"
          name="customerName"
          value={form.customerName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <Input
          label="Alternate Phone"
          name="alternatePhone"
          value={form.alternatePhone}
          onChange={handleChange}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
        />
      </div>

      {/* Address */}
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pt-2">
        Address
      </h4>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          value={form.address}
          onChange={handleChange}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-driftwood-400 focus:border-driftwood-400"
          placeholder="Full address..."
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Input
          label="City"
          name="city"
          value={form.city}
          onChange={handleChange}
        />
        <Input
          label="State"
          name="state"
          value={form.state}
          onChange={handleChange}
        />
        <Input
          label="Pincode"
          name="pincode"
          value={form.pincode}
          onChange={handleChange}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Latitude"
            name="latitude"
            type="number"
            step="any"
            value={form.latitude}
            onChange={handleChange}
            placeholder="e.g. 17.385"
          />
          <Input
            label="Longitude"
            name="longitude"
            type="number"
            step="any"
            value={form.longitude}
            onChange={handleChange}
            placeholder="e.g. 78.486"
          />
        </div>
      </div>

      {/* Loan Details */}
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pt-2">
        Loan Details
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Loan Type"
          name="loanType"
          value={form.loanType}
          onChange={handleChange}
          options={loanTypes}
          placeholder="Select Loan Type"
          required
        />
        <Input
          label="Loan Amount (INR)"
          name="loanAmount"
          type="number"
          step="0.01"
          value={form.loanAmount}
          onChange={handleChange}
          required
        />
        <Input
          label="EMI Amount (INR)"
          name="emiAmount"
          type="number"
          step="0.01"
          value={form.emiAmount}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Outstanding Amount (INR)"
          name="outstandingAmount"
          type="number"
          step="0.01"
          value={form.outstandingAmount}
          onChange={handleChange}
          required
        />
        <Input
          label="Overdue Amount (INR)"
          name="overdueAmount"
          type="number"
          step="0.01"
          value={form.overdueAmount}
          onChange={handleChange}
        />
        <Input
          label="Overdue Months"
          name="overdueMonths"
          type="number"
          value={form.overdueMonths}
          onChange={handleChange}
        />
      </div>

      {/* Assignment */}
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pt-2">
        Assignment & Status
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Portfolio"
          name="portfolioId"
          value={form.portfolioId}
          onChange={handleChange}
          options={portfolios.map((p) => ({ value: p._id, label: p.portfolioName }))}
          placeholder="Select Portfolio"
          required
        />
        <Input
          label="Bank (auto-set from portfolio)"
          name="bankId"
          value={getBankDisplayName()}
          disabled
          className="bg-gray-50"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Assigned Employee"
          name="assignedEmployeeId"
          value={form.assignedEmployeeId}
          onChange={handleChange}
          options={employees.map((emp) => ({
            value: emp._id,
            label: emp.employeeId ? `${emp.name} (${emp.employeeId})` : emp.name,
          }))}
          placeholder="Select Employee"
        />
        <Select
          label="Status"
          name="status"
          value={form.status}
          onChange={handleChange}
          options={statusOptions}
          required
        />
        <Select
          label="Priority"
          name="priority"
          value={form.priority}
          onChange={handleChange}
          options={priorityOptions}
          required
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={form.notes}
          onChange={handleChange}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-driftwood-400 focus:border-driftwood-400"
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Customer' : 'Add Customer'}
        </Button>
      </div>
    </form>
  );
}
