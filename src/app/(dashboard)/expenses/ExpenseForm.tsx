'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

interface Employee {
  _id: string;
  name: string;
}

interface ExpenseFormData {
  employeeId: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  remarks: string;
}

interface ExpenseFormProps {
  record?: Record<string, unknown> | null;
  employees: Employee[];
  onSuccess: () => void;
  onCancel: () => void;
}

const categoryOptions = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'travel', label: 'Travel' },
  { value: 'food', label: 'Food' },
  { value: 'phone', label: 'Phone' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'other', label: 'Other' },
];

const initialForm: ExpenseFormData = {
  employeeId: '',
  date: new Date().toISOString().split('T')[0],
  category: '',
  amount: 0,
  description: '',
  remarks: '',
};

export default function ExpenseForm({ record, employees, onSuccess, onCancel }: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormData>(initialForm);
  const [loading, setLoading] = useState(false);

  const isEdit = !!record?._id;

  useEffect(() => {
    if (record) {
      const empId = typeof record.employeeId === 'object' && record.employeeId
        ? (record.employeeId as { _id: string })._id
        : (record.employeeId as string) || '';

      setForm({
        employeeId: empId,
        date: record.date
          ? new Date(record.date as string).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        category: (record.category as string) || '',
        amount: (record.amount as number) || 0,
        description: (record.description as string) || '',
        remarks: (record.remarks as string) || '',
      });
    }
  }, [record]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.employeeId) {
      toast.error('Please select an employee');
      return;
    }
    if (!form.category) {
      toast.error('Please select a category');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      const url = isEdit ? `/api/expenses/${record!._id}` : '/api/expenses';
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

      toast.success(isEdit ? 'Expense updated successfully' : 'Expense added successfully');
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const employeeOptions = employees.map((e) => ({ value: e._id, label: e.name }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Employee */}
      <Select
        label="Employee"
        name="employeeId"
        options={employeeOptions}
        value={form.employeeId}
        onChange={handleChange}
        placeholder="Select Employee"
        required
      />

      {/* Date & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Date"
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          required
        />
        <Select
          label="Category"
          name="category"
          options={categoryOptions}
          value={form.category}
          onChange={handleChange}
          placeholder="Select Category"
          required
        />
      </div>

      {/* Amount */}
      <Input
        label="Amount (INR)"
        name="amount"
        type="number"
        value={form.amount}
        onChange={handleChange}
        min={0}
        step="0.01"
        required
      />

      {/* Description */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="What was this expense for?"
          required
        />
      </div>

      {/* Remarks */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
        <textarea
          name="remarks"
          value={form.remarks}
          onChange={handleChange}
          rows={2}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Additional notes (optional)"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
}
