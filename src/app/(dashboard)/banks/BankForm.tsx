'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface BankData {
  _id?: string;
  name: string;
  code: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  commissionPercentage: number;
  agreementStartDate: string;
  agreementEndDate: string;
  requiredCertifications: string;
  requiredExams: string;
}

interface BankFormProps {
  bank?: Record<string, unknown> | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const initialForm: BankData = {
  name: '',
  code: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  commissionPercentage: 0,
  agreementStartDate: '',
  agreementEndDate: '',
  requiredCertifications: '',
  requiredExams: '',
};

export default function BankForm({ bank, onSuccess, onCancel }: BankFormProps) {
  const [form, setForm] = useState<BankData>(initialForm);
  const [loading, setLoading] = useState(false);

  const isEdit = !!bank?._id;

  useEffect(() => {
    if (bank) {
      setForm({
        _id: bank._id as string,
        name: (bank.name as string) || '',
        code: (bank.code as string) || '',
        contactPerson: (bank.contactPerson as string) || '',
        contactEmail: (bank.contactEmail as string) || '',
        contactPhone: (bank.contactPhone as string) || '',
        address: (bank.address as string) || '',
        commissionPercentage: (bank.commissionPercentage as number) || 0,
        agreementStartDate: bank.agreementStartDate
          ? new Date(bank.agreementStartDate as string).toISOString().split('T')[0]
          : '',
        agreementEndDate: bank.agreementEndDate
          ? new Date(bank.agreementEndDate as string).toISOString().split('T')[0]
          : '',
        requiredCertifications: Array.isArray(bank.requiredCertifications)
          ? (bank.requiredCertifications as string[]).join(', ')
          : '',
        requiredExams: Array.isArray(bank.requiredExams)
          ? (bank.requiredExams as string[]).join(', ')
          : '',
      });
    }
  }, [bank]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
        commissionPercentage: Number(form.commissionPercentage),
        requiredCertifications: form.requiredCertifications
          ? form.requiredCertifications.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        requiredExams: form.requiredExams
          ? form.requiredExams.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const url = isEdit ? `/api/banks/${bank!._id}` : '/api/banks';
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

      toast.success(isEdit ? 'Bank updated successfully' : 'Bank added successfully');
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
          label="Bank Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <Input
          label="Bank Code"
          name="code"
          value={form.code}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Contact Person"
          name="contactPerson"
          value={form.contactPerson}
          onChange={handleChange}
          required
        />
        <Input
          label="Contact Email"
          name="contactEmail"
          type="email"
          value={form.contactEmail}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Contact Phone"
          name="contactPhone"
          value={form.contactPhone}
          onChange={handleChange}
          required
        />
        <Input
          label="Commission %"
          name="commissionPercentage"
          type="number"
          step="0.01"
          value={form.commissionPercentage}
          onChange={handleChange}
          required
        />
      </div>

      <Input
        label="Address"
        name="address"
        value={form.address}
        onChange={handleChange}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Agreement Start Date"
          name="agreementStartDate"
          type="date"
          value={form.agreementStartDate}
          onChange={handleChange}
          required
        />
        <Input
          label="Agreement End Date"
          name="agreementEndDate"
          type="date"
          value={form.agreementEndDate}
          onChange={handleChange}
          required
        />
      </div>

      <Input
        label="Required Certifications (comma-separated)"
        name="requiredCertifications"
        value={form.requiredCertifications}
        onChange={handleChange}
        placeholder="e.g. SARFAESI, DRA"
      />

      <Input
        label="Required Exams (comma-separated)"
        name="requiredExams"
        value={form.requiredExams}
        onChange={handleChange}
        placeholder="e.g. RBI Compliance, AML"
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Bank' : 'Add Bank'}
        </Button>
      </div>
    </form>
  );
}
