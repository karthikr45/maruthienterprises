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

interface Bank {
  _id: string;
  name: string;
  code: string;
}

interface ComplianceFormData {
  employeeId: string;
  bankId: string;
  certificationType: string;
  certificationName: string;
  issuedDate: string;
  expiryDate: string;
  certificateNumber: string;
  status: string;
  examName: string;
  examDate: string;
  examScore: number;
  examStatus: string;
  remarks: string;
}

interface ComplianceFormProps {
  record?: Record<string, unknown> | null;
  employees: Employee[];
  banks: Bank[];
  onSuccess: () => void;
  onCancel: () => void;
}

const certificationTypeOptions = [
  { value: 'bank_certification', label: 'Bank Certification' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'training', label: 'Training' },
  { value: 'license', label: 'License' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'valid', label: 'Valid' },
  { value: 'expired', label: 'Expired' },
  { value: 'pending', label: 'Pending' },
  { value: 'renewal_due', label: 'Renewal Due' },
];

const examStatusOptions = [
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'pending', label: 'Pending' },
  { value: 'not_applicable', label: 'Not Applicable' },
];

const initialForm: ComplianceFormData = {
  employeeId: '',
  bankId: '',
  certificationType: '',
  certificationName: '',
  issuedDate: '',
  expiryDate: '',
  certificateNumber: '',
  status: 'pending',
  examName: '',
  examDate: '',
  examScore: 0,
  examStatus: '',
  remarks: '',
};

export default function ComplianceForm({ record, employees, banks, onSuccess, onCancel }: ComplianceFormProps) {
  const [form, setForm] = useState<ComplianceFormData>(initialForm);
  const [loading, setLoading] = useState(false);

  const isEdit = !!record?._id;

  useEffect(() => {
    if (record) {
      const empId = typeof record.employeeId === 'object' && record.employeeId
        ? (record.employeeId as { _id: string })._id
        : (record.employeeId as string) || '';
      const bnkId = typeof record.bankId === 'object' && record.bankId
        ? (record.bankId as { _id: string })._id
        : (record.bankId as string) || '';

      setForm({
        employeeId: empId,
        bankId: bnkId,
        certificationType: (record.certificationType as string) || '',
        certificationName: (record.certificationName as string) || '',
        issuedDate: record.issuedDate
          ? new Date(record.issuedDate as string).toISOString().split('T')[0]
          : '',
        expiryDate: record.expiryDate
          ? new Date(record.expiryDate as string).toISOString().split('T')[0]
          : '',
        certificateNumber: (record.certificateNumber as string) || '',
        status: (record.status as string) || 'pending',
        examName: (record.examName as string) || '',
        examDate: record.examDate
          ? new Date(record.examDate as string).toISOString().split('T')[0]
          : '',
        examScore: (record.examScore as number) || 0,
        examStatus: (record.examStatus as string) || '',
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

    setLoading(true);
    try {
      const payload = {
        ...form,
        examScore: Number(form.examScore),
      };

      const url = isEdit ? `/api/compliance/${record!._id}` : '/api/compliance';
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

      toast.success(isEdit ? 'Record updated successfully' : 'Record added successfully');
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const employeeOptions = employees.map((e) => ({ value: e._id, label: e.name }));
  const bankOptions = banks.map((b) => ({ value: b._id, label: `${b.name} (${b.code})` }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Employee & Bank */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Employee"
          name="employeeId"
          options={employeeOptions}
          value={form.employeeId}
          onChange={handleChange}
          placeholder="Select Employee"
          required
        />
        <Select
          label="Bank"
          name="bankId"
          options={bankOptions}
          value={form.bankId}
          onChange={handleChange}
          placeholder="Select Bank"
        />
      </div>

      {/* Certification Type & Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Certification Type"
          name="certificationType"
          options={certificationTypeOptions}
          value={form.certificationType}
          onChange={handleChange}
          placeholder="Select Type"
        />
        <Input
          label="Certification Name"
          name="certificationName"
          value={form.certificationName}
          onChange={handleChange}
          required
        />
      </div>

      {/* Certificate Number */}
      <Input
        label="Certificate Number"
        name="certificateNumber"
        value={form.certificateNumber}
        onChange={handleChange}
        placeholder="Certificate/License number"
      />

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Issued Date"
          name="issuedDate"
          type="date"
          value={form.issuedDate}
          onChange={handleChange}
        />
        <Input
          label="Expiry Date"
          name="expiryDate"
          type="date"
          value={form.expiryDate}
          onChange={handleChange}
        />
      </div>

      {/* Status */}
      <Select
        label="Status"
        name="status"
        options={statusOptions}
        value={form.status}
        onChange={handleChange}
      />

      {/* Exam Details */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Exam Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Exam Name"
            name="examName"
            value={form.examName}
            onChange={handleChange}
          />
          <Input
            label="Exam Date"
            name="examDate"
            type="date"
            value={form.examDate}
            onChange={handleChange}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Input
            label="Exam Score"
            name="examScore"
            type="number"
            value={form.examScore}
            onChange={handleChange}
            min={0}
            max={100}
          />
          <Select
            label="Exam Status"
            name="examStatus"
            options={examStatusOptions}
            value={form.examStatus}
            onChange={handleChange}
            placeholder="Select Exam Status"
          />
        </div>
      </div>

      {/* Remarks */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
        <textarea
          name="remarks"
          value={form.remarks}
          onChange={handleChange}
          rows={3}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Additional notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Record' : 'Add Record'}
        </Button>
      </div>
    </form>
  );
}
