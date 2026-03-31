'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

interface BankRef {
  _id: string;
  name: string;
  code: string;
}

interface EmployeeData {
  _id?: string;
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
  assignedBanks: string[];
  baseSalary: number;
  incentivePercentage: number;
  fuelAllowance: number;
  emergencyContact: string;
  aadharNumber: string;
  panNumber: string;
  bankAccountNumber: string;
  bankIFSC: string;
}

interface EmployeeFormProps {
  employee?: (Record<string, unknown> & { assignedBanks?: BankRef[] }) | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const designationOptions = [
  { value: 'Field Agent', label: 'Field Agent' },
  { value: 'Team Lead', label: 'Team Lead' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Tele-caller', label: 'Tele-caller' },
];

const departmentOptions = [
  { value: 'Recovery', label: 'Recovery' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Admin', label: 'Admin' },
];

const initialForm: EmployeeData = {
  employeeId: '',
  name: '',
  email: '',
  phone: '',
  alternatePhone: '',
  address: '',
  city: 'Hyderabad',
  designation: '',
  department: '',
  dateOfJoining: '',
  assignedBanks: [],
  baseSalary: 0,
  incentivePercentage: 0,
  fuelAllowance: 0,
  emergencyContact: '',
  aadharNumber: '',
  panNumber: '',
  bankAccountNumber: '',
  bankIFSC: '',
};

export default function EmployeeForm({ employee, onSuccess, onCancel }: EmployeeFormProps) {
  const [form, setForm] = useState<EmployeeData>(initialForm);
  const [banks, setBanks] = useState<BankRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState(false);

  const isEdit = !!employee?._id;

  useEffect(() => {
    fetchBanks();
    if (!isEdit) {
      generateEmployeeId();
    }
  }, []);

  useEffect(() => {
    if (employee) {
      const assignedBankIds = Array.isArray(employee.assignedBanks)
        ? (employee.assignedBanks as BankRef[]).map((b) =>
            typeof b === 'string' ? b : b._id
          )
        : [];

      setForm({
        _id: employee._id as string,
        employeeId: (employee.employeeId as string) || '',
        name: (employee.name as string) || '',
        email: (employee.email as string) || '',
        phone: (employee.phone as string) || '',
        alternatePhone: (employee.alternatePhone as string) || '',
        address: (employee.address as string) || '',
        city: (employee.city as string) || 'Hyderabad',
        designation: (employee.designation as string) || '',
        department: (employee.department as string) || '',
        dateOfJoining: employee.dateOfJoining
          ? new Date(employee.dateOfJoining as string).toISOString().split('T')[0]
          : '',
        assignedBanks: assignedBankIds,
        baseSalary: (employee.baseSalary as number) || 0,
        incentivePercentage: (employee.incentivePercentage as number) || 0,
        fuelAllowance: (employee.fuelAllowance as number) || 0,
        emergencyContact: (employee.emergencyContact as string) || '',
        aadharNumber: (employee.aadharNumber as string) || '',
        panNumber: (employee.panNumber as string) || '',
        bankAccountNumber: (employee.bankAccountNumber as string) || '',
        bankIFSC: (employee.bankIFSC as string) || '',
      });
    }
  }, [employee]);

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

  const generateEmployeeId = async () => {
    setGeneratingId(true);
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) {
        const count = data.data.length;
        const nextNum = count + 1;
        const id = `ME-${String(nextNum).padStart(3, '0')}`;
        setForm((prev) => ({ ...prev, employeeId: id }));
      }
    } catch {
      setForm((prev) => ({ ...prev, employeeId: 'ME-001' }));
    } finally {
      setGeneratingId(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankToggle = (bankId: string) => {
    setForm((prev) => ({
      ...prev,
      assignedBanks: prev.assignedBanks.includes(bankId)
        ? prev.assignedBanks.filter((id) => id !== bankId)
        : [...prev.assignedBanks, bankId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        baseSalary: Number(form.baseSalary),
        incentivePercentage: Number(form.incentivePercentage),
        fuelAllowance: Number(form.fuelAllowance),
      };

      const url = isEdit ? `/api/employees/${employee!._id}` : '/api/employees';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Something went wrong');
      }

      toast.success(isEdit ? 'Employee updated successfully' : 'Employee added successfully');
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
      {/* Employee ID */}
      <Input
        label="Employee ID"
        name="employeeId"
        value={form.employeeId}
        onChange={handleChange}
        required
        disabled={isEdit || generatingId}
        placeholder="Auto-generated (ME-001)"
      />

      {/* Name & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>

      {/* Phone numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>

      {/* Address & City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
          required
        />
        <Input
          label="City"
          name="city"
          value={form.city}
          onChange={handleChange}
        />
      </div>

      {/* Designation & Department */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Designation"
          name="designation"
          options={designationOptions}
          value={form.designation}
          onChange={handleChange}
          placeholder="Select Designation"
          required
        />
        <Select
          label="Department"
          name="department"
          options={departmentOptions}
          value={form.department}
          onChange={handleChange}
          placeholder="Select Department"
          required
        />
      </div>

      {/* Date of Joining */}
      <Input
        label="Date of Joining"
        name="dateOfJoining"
        type="date"
        value={form.dateOfJoining}
        onChange={handleChange}
        required
      />

      {/* Assigned Banks - Multi-select checkboxes */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assigned Banks
        </label>
        <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
          {banks.length === 0 ? (
            <p className="text-sm text-gray-400">No banks available</p>
          ) : (
            banks.map((bank) => (
              <label
                key={bank._id}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={form.assignedBanks.includes(bank._id)}
                  onChange={() => handleBankToggle(bank._id)}
                  className="rounded border-gray-300 text-driftwood-500 focus:ring-driftwood-400"
                />
                <span className="text-sm text-gray-700">
                  {bank.name} ({bank.code})
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Salary details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Base Salary"
          name="baseSalary"
          type="number"
          value={form.baseSalary}
          onChange={handleChange}
          required
        />
        <Input
          label="Incentive %"
          name="incentivePercentage"
          type="number"
          step="0.01"
          value={form.incentivePercentage}
          onChange={handleChange}
        />
        <Input
          label="Fuel Allowance"
          name="fuelAllowance"
          type="number"
          value={form.fuelAllowance}
          onChange={handleChange}
        />
      </div>

      {/* ID documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Aadhar Number"
          name="aadharNumber"
          value={form.aadharNumber}
          onChange={handleChange}
        />
        <Input
          label="PAN Number"
          name="panNumber"
          value={form.panNumber}
          onChange={handleChange}
        />
      </div>

      {/* Bank account details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Bank Account Number"
          name="bankAccountNumber"
          value={form.bankAccountNumber}
          onChange={handleChange}
        />
        <Input
          label="Bank IFSC"
          name="bankIFSC"
          value={form.bankIFSC}
          onChange={handleChange}
        />
      </div>

      {/* Emergency Contact */}
      <Input
        label="Emergency Contact"
        name="emergencyContact"
        value={form.emergencyContact}
        onChange={handleChange}
      />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Employee' : 'Add Employee'}
        </Button>
      </div>
    </form>
  );
}
