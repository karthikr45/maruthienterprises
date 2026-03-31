'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
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
import PortfolioForm from './PortfolioForm';

interface Portfolio {
  _id: string;
  portfolioName: string;
  portfolioCode: string;
  bankId: { _id: string; name: string } | string;
  totalAccounts: number;
  totalOutstanding: number;
  assignedDate: string;
  dueDate: string;
  status: string;
  description: string;
  createdAt: string;
}

interface Bank {
  _id: string;
  name: string;
}

const statusVariant = (status: string): 'success' | 'info' | 'danger' | 'default' => {
  switch (status) {
    case 'active':
      return 'success';
    case 'completed':
      return 'info';
    case 'expired':
      return 'danger';
    default:
      return 'default';
  }
};

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

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portfolios');
      const data = await res.json();
      if (data.success) {
        setPortfolios(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch portfolios');
      }
    } catch {
      toast.error('Failed to fetch portfolios');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchPortfolios();
    fetchBanks();
  }, []);

  const getBankName = (bankId: Portfolio['bankId']) => {
    if (typeof bankId === 'object' && bankId !== null) return bankId.name;
    const bank = banks.find((b) => b._id === bankId);
    return bank?.name || '-';
  };

  const getBankId = (bankId: Portfolio['bankId']) => {
    if (typeof bankId === 'object' && bankId !== null) return bankId._id;
    return bankId;
  };

  const filteredPortfolios = useMemo(() => {
    return portfolios.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.portfolioName.toLowerCase().includes(search.toLowerCase()) ||
        p.portfolioCode.toLowerCase().includes(search.toLowerCase());
      const matchesBank = !filterBank || getBankId(p.bankId) === filterBank;
      const matchesStatus = !filterStatus || p.status === filterStatus;
      return matchesSearch && matchesBank && matchesStatus;
    });
  }, [portfolios, search, filterBank, filterStatus, banks]);

  const handleAdd = () => {
    setEditingPortfolio(null);
    setShowModal(true);
  };

  const handleEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setShowModal(true);
  };

  const handleDelete = async (portfolio: Portfolio) => {
    if (!confirm(`Are you sure you want to delete "${portfolio.portfolioName}"?`)) return;
    try {
      const res = await fetch(`/api/portfolios/${portfolio._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Portfolio deleted successfully');
        fetchPortfolios();
      } else {
        toast.error(data.error || 'Failed to delete portfolio');
      }
    } catch {
      toast.error('Failed to delete portfolio');
    }
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingPortfolio(null);
    fetchPortfolios();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" label="Loading portfolios..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage loan portfolios assigned by banks
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Portfolio
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4">
            <Select
              options={banks.map((b) => ({ value: b._id, label: b.name }))}
              placeholder="All Banks"
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
            />
            <Select
              options={[
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'expired', label: 'Expired' },
              ]}
              placeholder="All Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {filteredPortfolios.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {search || filterBank || filterStatus
                ? 'No portfolios match your filters.'
                : 'No portfolios added yet.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>Portfolio Code</TableCell>
                <TableCell isHeader>Name</TableCell>
                <TableCell isHeader>Bank Name</TableCell>
                <TableCell isHeader>Total Accounts</TableCell>
                <TableCell isHeader>Total Outstanding</TableCell>
                <TableCell isHeader>Assigned Date</TableCell>
                <TableCell isHeader>Due Date</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPortfolios.map((portfolio) => (
                <TableRow key={portfolio._id}>
                  <TableCell>
                    <span className="font-medium">{portfolio.portfolioCode}</span>
                  </TableCell>
                  <TableCell>{portfolio.portfolioName}</TableCell>
                  <TableCell>{getBankName(portfolio.bankId)}</TableCell>
                  <TableCell>{portfolio.totalAccounts.toLocaleString('en-IN')}</TableCell>
                  <TableCell>{formatINR(portfolio.totalOutstanding)}</TableCell>
                  <TableCell>{formatDate(portfolio.assignedDate)}</TableCell>
                  <TableCell>{formatDate(portfolio.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(portfolio.status)}>
                      {portfolio.status.charAt(0).toUpperCase() + portfolio.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(portfolio)}
                        className="p-1 text-gray-400 hover:text-driftwood-500 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(portfolio)}
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
          setEditingPortfolio(null);
        }}
        title={editingPortfolio ? 'Edit Portfolio' : 'Add Portfolio'}
        className="max-w-2xl"
      >
        <PortfolioForm
          portfolio={editingPortfolio as Record<string, unknown> | null}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowModal(false);
            setEditingPortfolio(null);
          }}
        />
      </Modal>
    </div>
  );
}
