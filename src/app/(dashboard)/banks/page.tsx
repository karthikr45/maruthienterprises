'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
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
import BankForm from './BankForm';

interface Bank {
  _id: string;
  name: string;
  code: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  commissionPercentage: number;
  agreementStartDate: string;
  agreementEndDate: string;
  requiredCertifications: string[];
  requiredExams: string[];
  isActive: boolean;
  createdAt: string;
}

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/banks');
      const data = await res.json();
      if (data.success) {
        setBanks(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch banks');
      }
    } catch {
      toast.error('Failed to fetch banks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const filteredBanks = useMemo(() => {
    if (!search.trim()) return banks;
    const q = search.toLowerCase();
    return banks.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.contactPerson.toLowerCase().includes(q)
    );
  }, [banks, search]);

  const handleAdd = () => {
    setEditingBank(null);
    setShowModal(true);
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setShowModal(true);
  };

  const handleDelete = async (bank: Bank) => {
    if (!confirm(`Are you sure you want to delete "${bank.name}"?`)) return;

    try {
      const res = await fetch(`/api/banks/${bank._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Bank deleted successfully');
        fetchBanks();
      } else {
        toast.error(data.error || 'Failed to delete bank');
      }
    } catch {
      toast.error('Failed to delete bank');
    }
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingBank(null);
    fetchBanks();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" label="Loading banks..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banks</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage partner banks and their agreements
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bank
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, code, or contact person..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        {filteredBanks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {search ? 'No banks match your search.' : 'No banks added yet.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>Name</TableCell>
                <TableCell isHeader>Code</TableCell>
                <TableCell isHeader>Contact Person</TableCell>
                <TableCell isHeader>Phone</TableCell>
                <TableCell isHeader>Commission %</TableCell>
                <TableCell isHeader>Agreement End</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBanks.map((bank) => (
                <TableRow key={bank._id}>
                  <TableCell>
                    <span className="font-medium">{bank.name}</span>
                  </TableCell>
                  <TableCell>{bank.code}</TableCell>
                  <TableCell>{bank.contactPerson}</TableCell>
                  <TableCell>{bank.contactPhone}</TableCell>
                  <TableCell>{bank.commissionPercentage}%</TableCell>
                  <TableCell>{formatDate(bank.agreementEndDate)}</TableCell>
                  <TableCell>
                    <Badge variant={bank.isActive ? 'success' : 'danger'}>
                      {bank.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(bank)}
                        className="p-1 text-gray-400 hover:text-driftwood-500 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bank)}
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
          setEditingBank(null);
        }}
        title={editingBank ? 'Edit Bank' : 'Add Bank'}
        className="max-w-2xl"
      >
        <BankForm
          bank={editingBank as Record<string, unknown> | null}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowModal(false);
            setEditingBank(null);
          }}
        />
      </Modal>
    </div>
  );
}
