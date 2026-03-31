'use client';

import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

interface Employee {
  _id: string;
  name: string;
  baseSalary: number;
  fuelAllowance: number;
}

interface SalaryFormData {
  employeeId: string;
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
}

interface SalaryFormProps {
  record?: Record<string, unknown> | null;
  employees: Employee[];
  defaultMonth: number;
  defaultYear: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const initialForm: SalaryFormData = {
  employeeId: '',
  month: 1,
  year: 2026,
  baseSalary: 0,
  incentiveAmount: 0,
  fuelAllowance: 0,
  otherAllowances: 0,
  pfDeduction: 0,
  esiDeduction: 0,
  tdsDeduction: 0,
  otherDeductions: 0,
};

export default function SalaryForm({ record, employees, defaultMonth, defaultYear, onSuccess, onCancel }: SalaryFormProps) {
  const [form, setForm] = useState<SalaryFormData>({
    ...initialForm,
    month: defaultMonth,
    year: defaultYear,
  });
  const [loading, setLoading] = useState(false);

  const isEdit = !!record?._id;

  useEffect(() => {
    if (record) {
      const empId = typeof record.employeeId === 'object' && record.employeeId
        ? (record.employeeId as { _id: string })._id
        : (record.employeeId as string) || '';

      setForm({
        employeeId: empId,
        month: (record.month as number) || defaultMonth,
        year: (record.year as number) || defaultYear,
        baseSalary: (record.baseSalary as number) || 0,
        incentiveAmount: (record.incentiveAmount as number) || 0,
        fuelAllowance: (record.fuelAllowance as number) || 0,
        otherAllowances: (record.otherAllowances as number) || 0,
        pfDeduction: (record.pfDeduction as number) || 0,
        esiDeduction: (record.esiDeduction as number) || 0,
        tdsDeduction: (record.tdsDeduction as number) || 0,
        otherDeductions: (record.otherDeductions as number) || 0,
      });
    }
  }, [record]);

  // Auto-fill base salary and fuel allowance from employee
  const handleEmployeeChange = (empId: string) => {
    setForm((prev) => {
      const emp = employees.find((e) => e._id === empId);
      return {
        ...prev,
        employeeId: empId,
        baseSalary: emp?.baseSalary || prev.baseSalary,
        fuelAllowance: emp?.fuelAllowance || prev.fuelAllowance,
      };
    });
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: Number(value) || 0 }));
  };

  // Auto-calculate net salary
  const netSalary = useMemo(() => {
    const totalEarnings =
      Number(form.baseSalary) +
      Number(form.incentiveAmount) +
      Number(form.fuelAllowance) +
      Number(form.otherAllowances);
    const totalDeductions =
      Number(form.pfDeduction) +
      Number(form.esiDeduction) +
      Number(form.tdsDeduction) +
      Number(form.otherDeductions);
    return totalEarnings - totalDeductions;
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.employeeId) {
      toast.error('Please select an employee');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        baseSalary: Number(form.baseSalary),
        incentiveAmount: Number(form.incentiveAmount),
        fuelAllowance: Number(form.fuelAllowance),
        otherAllowances: Number(form.otherAllowances),
        pfDeduction: Number(form.pfDeduction),
        esiDeduction: Number(form.esiDeduction),
        tdsDeduction: Number(form.tdsDeduction),
        otherDeductions: Number(form.otherDeductions),
        netSalary,
      };

      const url = isEdit ? `/api/salaries/${record!._id}` : '/api/salaries';
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

      toast.success(isEdit ? 'Salary record updated' : 'Salary record generated');
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const employeeOptions = employees.map((e) => ({ value: e._id, label: e.name }));
  const monthOptions = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }));
  const now = new Date();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = now.getFullYear() - 2 + i;
    return { value: String(y), label: String(y) };
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Employee */}
      <Select
        label="Employee"
        name="employeeId"
        options={employeeOptions}
        value={form.employeeId}
        onChange={(e) => handleEmployeeChange(e.target.value)}
        placeholder="Select Employee"
        required
      />

      {/* Month & Year */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Month"
          name="month"
          options={monthOptions}
          value={String(form.month)}
          onChange={(e) => setForm((prev) => ({ ...prev, month: Number(e.target.value) }))}
        />
        <Select
          label="Year"
          name="year"
          options={yearOptions}
          value={String(form.year)}
          onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
        />
      </div>

      {/* Earnings */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Earnings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Base Salary"
            name="baseSalary"
            type="number"
            value={form.baseSalary}
            onChange={handleNumberChange}
            min={0}
            required
          />
          <Input
            label="Incentive Amount"
            name="incentiveAmount"
            type="number"
            value={form.incentiveAmount}
            onChange={handleNumberChange}
            min={0}
          />
          <Input
            label="Fuel Allowance"
            name="fuelAllowance"
            type="number"
            value={form.fuelAllowance}
            onChange={handleNumberChange}
            min={0}
          />
          <Input
            label="Other Allowances"
            name="otherAllowances"
            type="number"
            value={form.otherAllowances}
            onChange={handleNumberChange}
            min={0}
          />
        </div>
      </div>

      {/* Deductions */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Deductions</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="PF Deduction"
            name="pfDeduction"
            type="number"
            value={form.pfDeduction}
            onChange={handleNumberChange}
            min={0}
          />
          <Input
            label="ESI Deduction"
            name="esiDeduction"
            type="number"
            value={form.esiDeduction}
            onChange={handleNumberChange}
            min={0}
          />
          <Input
            label="TDS Deduction"
            name="tdsDeduction"
            type="number"
            value={form.tdsDeduction}
            onChange={handleNumberChange}
            min={0}
          />
          <Input
            label="Other Deductions"
            name="otherDeductions"
            type="number"
            value={form.otherDeductions}
            onChange={handleNumberChange}
            min={0}
          />
        </div>
      </div>

      {/* Net Salary Display */}
      <div className="border-t border-gray-200 pt-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-green-800">Net Salary</span>
          <span className="text-xl font-bold text-green-700">{formatCurrency(netSalary)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Salary' : 'Generate Salary'}
        </Button>
      </div>
    </form>
  );
}
