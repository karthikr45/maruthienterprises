'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

interface PortfolioData {
  _id?: string;
  portfolioName: string;
  portfolioCode: string;
  bankId: string;
  totalAccounts: number;
  totalOutstanding: number;
  assignedDate: string;
  dueDate: string;
  status: string;
  description: string;
}

interface Bank {
  _id: string;
  name: string;
}

interface PortfolioFormProps {
  portfolio?: Record<string, unknown> | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const initialForm: PortfolioData = {
  portfolioName: '',
  portfolioCode: '',
  bankId: '',
  totalAccounts: 0,
  totalOutstanding: 0,
  assignedDate: '',
  dueDate: '',
  status: 'active',
  description: '',
};

export default function PortfolioForm({ portfolio, onSuccess, onCancel }: PortfolioFormProps) {
  const [form, setForm] = useState<PortfolioData>(initialForm);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);

  const isEdit = !!portfolio?._id;

  useEffect(() => {
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
    fetchBanks();
  }, []);

  useEffect(() => {
    if (portfolio) {
      const bankId =
        typeof portfolio.bankId === 'object' && portfolio.bankId !== null
          ? (portfolio.bankId as Record<string, unknown>)._id as string
          : (portfolio.bankId as string) || '';

      setForm({
        _id: portfolio._id as string,
        portfolioName: (portfolio.portfolioName as string) || '',
        portfolioCode: (portfolio.portfolioCode as string) || '',
        bankId,
        totalAccounts: (portfolio.totalAccounts as number) || 0,
        totalOutstanding: (portfolio.totalOutstanding as number) || 0,
        assignedDate: portfolio.assignedDate
          ? new Date(portfolio.assignedDate as string).toISOString().split('T')[0]
          : '',
        dueDate: portfolio.dueDate
          ? new Date(portfolio.dueDate as string).toISOString().split('T')[0]
          : '',
        status: (portfolio.status as string) || 'active',
        description: (portfolio.description as string) || '',
      });
    }
  }, [portfolio]);

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
        totalAccounts: Number(form.totalAccounts),
        totalOutstanding: Number(form.totalOutstanding),
      };

      const url = isEdit ? `/api/portfolios/${portfolio!._id}` : '/api/portfolios';
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

      toast.success(isEdit ? 'Portfolio updated successfully' : 'Portfolio added successfully');
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Portfolio Name"
          name="portfolioName"
          value={form.portfolioName}
          onChange={handleChange}
          required
        />
        <Input
          label="Portfolio Code"
          name="portfolioCode"
          value={form.portfolioCode}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Bank"
          name="bankId"
          value={form.bankId}
          onChange={handleChange}
          options={banks.map((b) => ({ value: b._id, label: b.name }))}
          placeholder="Select Bank"
          required
        />
        <Select
          label="Status"
          name="status"
          value={form.status}
          onChange={handleChange}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'expired', label: 'Expired' },
          ]}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Total Accounts"
          name="totalAccounts"
          type="number"
          value={form.totalAccounts}
          onChange={handleChange}
          required
        />
        <Input
          label="Total Outstanding (INR)"
          name="totalOutstanding"
          type="number"
          step="0.01"
          value={form.totalOutstanding}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Assigned Date"
          name="assignedDate"
          type="date"
          value={form.assignedDate}
          onChange={handleChange}
          required
        />
        <Input
          label="Due Date"
          name="dueDate"
          type="date"
          value={form.dueDate}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Optional description..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Portfolio' : 'Add Portfolio'}
        </Button>
      </div>
    </form>
  );
}
