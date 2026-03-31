'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Camera, X, Loader2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

interface Customer {
  _id: string;
  name: string;
  loanAccountNumber?: string;
  address?: string;
  location?: { latitude: number; longitude: number };
}

interface Employee {
  _id: string;
  name: string;
}

interface VisitFormData {
  customerId: string;
  visitType: string;
  visitDate: string;
  outcome: string;
  amountCollected: number;
  paymentMode: string;
  paymentReference: string;
  remarks: string;
  nextFollowUpDate: string;
  fuelCost: number;
  travelDistance: number;
  checkIn: { latitude: number; longitude: number; timestamp: string } | null;
  photos: string[];
}

interface VisitFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const visitTypeOptions = [
  { value: 'field_visit', label: 'Field Visit' },
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'office_meeting', label: 'Office Meeting' },
  { value: 'legal_notice', label: 'Legal Notice' },
  { value: 'skip_trace', label: 'Skip Trace' },
  { value: 'repossession', label: 'Repossession' },
];

const outcomeOptions = [
  { value: 'payment_collected', label: 'Payment Collected' },
  { value: 'promise_to_pay', label: 'Promise to Pay' },
  { value: 'not_available', label: 'Not Available' },
  { value: 'refused_to_pay', label: 'Refused to Pay' },
  { value: 'dispute', label: 'Dispute' },
  { value: 'settled', label: 'Settled' },
  { value: 'legal_action', label: 'Legal Action' },
  { value: 'other', label: 'Other' },
];

const paymentModeOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'neft', label: 'NEFT' },
  { value: 'rtgs', label: 'RTGS' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'demand_draft', label: 'Demand Draft' },
  { value: 'online', label: 'Online' },
];

const LOCATION_THRESHOLD_METERS = 500;

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const initialForm: VisitFormData = {
  customerId: '',
  visitType: '',
  visitDate: new Date().toISOString().split('T')[0],
  outcome: '',
  amountCollected: 0,
  paymentMode: '',
  paymentReference: '',
  remarks: '',
  nextFollowUpDate: '',
  fuelCost: 0,
  travelDistance: 0,
  checkIn: null,
  photos: [],
};

export default function VisitForm({ onSuccess, onCancel }: VisitFormProps) {
  const [form, setForm] = useState<VisitFormData>(initialForm);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [locationDistance, setLocationDistance] = useState<number | null>(null);
  const [locationVerified, setLocationVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) setCustomers(data.data);
    } catch {
      // silent
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) setEmployees(data.data);
    } catch {
      // silent
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.loanAccountNumber && c.loanAccountNumber.toLowerCase().includes(q))
    );
  });

  const selectedCustomer = customers.find((c) => c._id === form.customerId);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerSelect = (customer: Customer) => {
    setForm((prev) => ({ ...prev, customerId: customer._id }));
    setCustomerSearch(customer.name + (customer.loanAccountNumber ? ` (${customer.loanAccountNumber})` : ''));
    setShowCustomerDropdown(false);

    // Re-verify location if we already captured it
    if (form.checkIn && customer.location) {
      const dist = haversineDistance(
        form.checkIn.latitude,
        form.checkIn.longitude,
        customer.location.latitude,
        customer.location.longitude
      );
      setLocationDistance(Math.round(dist));
      setLocationVerified(dist <= LOCATION_THRESHOLD_METERS);
    }
  };

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const checkIn = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
        };
        setForm((prev) => ({ ...prev, checkIn }));
        setCapturingLocation(false);
        toast.success('Location captured successfully');

        // Verify against customer location
        if (selectedCustomer?.location) {
          const dist = haversineDistance(
            checkIn.latitude,
            checkIn.longitude,
            selectedCustomer.location.latitude,
            selectedCustomer.location.longitude
          );
          setLocationDistance(Math.round(dist));
          setLocationVerified(dist <= LOCATION_THRESHOLD_METERS);
        }
      },
      (error) => {
        setCapturingLocation(false);
        toast.error(`Location error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setForm((prev) => ({ ...prev, photos: [...prev.photos, base64] }));
      };
      reader.readAsDataURL(file);
    });

    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (!form.visitType) {
      toast.error('Please select a visit type');
      return;
    }
    if (!form.outcome) {
      toast.error('Please select an outcome');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        amountCollected: Number(form.amountCollected),
        fuelCost: Number(form.fuelCost),
        travelDistance: Number(form.travelDistance),
        locationVerified,
      };

      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Something went wrong');
      }

      toast.success('Visit logged successfully');
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
      {/* Customer Search Dropdown */}
      <div className="w-full relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Customer <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="Search customer by name or loan account..."
          value={customerSearch}
          onChange={(e) => {
            setCustomerSearch(e.target.value);
            setShowCustomerDropdown(true);
            if (!e.target.value) setForm((prev) => ({ ...prev, customerId: '' }));
          }}
          onFocus={() => setShowCustomerDropdown(true)}
        />
        {showCustomerDropdown && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">No customers found</div>
            ) : (
              filteredCustomers.slice(0, 20).map((c) => (
                <button
                  key={c._id}
                  type="button"
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition-colors ${
                    form.customerId === c._id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                  }`}
                  onClick={() => handleCustomerSelect(c)}
                >
                  <span className="font-medium">{c.name}</span>
                  {c.loanAccountNumber && (
                    <span className="ml-2 text-gray-400">({c.loanAccountNumber})</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Visit Type & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Visit Type"
          name="visitType"
          options={visitTypeOptions}
          value={form.visitType}
          onChange={handleChange}
          placeholder="Select Visit Type"
          required
        />
        <Input
          label="Visit Date"
          name="visitDate"
          type="date"
          value={form.visitDate}
          onChange={handleChange}
          required
        />
      </div>

      {/* Outcome */}
      <Select
        label="Outcome"
        name="outcome"
        options={outcomeOptions}
        value={form.outcome}
        onChange={handleChange}
        placeholder="Select Outcome"
        required
      />

      {/* Payment Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Amount Collected (INR)"
          name="amountCollected"
          type="number"
          value={form.amountCollected}
          onChange={handleChange}
          min={0}
        />
        <Select
          label="Payment Mode"
          name="paymentMode"
          options={paymentModeOptions}
          value={form.paymentMode}
          onChange={handleChange}
          placeholder="Select Mode"
        />
        <Input
          label="Payment Reference"
          name="paymentReference"
          value={form.paymentReference}
          onChange={handleChange}
          placeholder="Transaction/Cheque #"
        />
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
          placeholder="Additional notes about the visit..."
        />
      </div>

      {/* Follow-up & Travel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Next Follow-Up Date"
          name="nextFollowUpDate"
          type="date"
          value={form.nextFollowUpDate}
          onChange={handleChange}
        />
        <Input
          label="Fuel Cost (INR)"
          name="fuelCost"
          type="number"
          value={form.fuelCost}
          onChange={handleChange}
          min={0}
        />
        <Input
          label="Travel Distance (km)"
          name="travelDistance"
          type="number"
          value={form.travelDistance}
          onChange={handleChange}
          min={0}
        />
      </div>

      {/* Location Capture */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">Location Check-In</label>
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCaptureLocation}
            disabled={capturingLocation}
          >
            {capturingLocation ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Capturing...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                {form.checkIn ? 'Recapture Location' : 'Capture Location'}
              </>
            )}
          </Button>

          {form.checkIn && (
            <div className="text-sm space-y-1">
              <p className="text-gray-600">
                <span className="font-medium">Lat:</span> {form.checkIn.latitude.toFixed(6)},{' '}
                <span className="font-medium">Lng:</span> {form.checkIn.longitude.toFixed(6)}
              </p>
              <p className="text-gray-400 text-xs">
                Captured at {new Date(form.checkIn.timestamp).toLocaleTimeString('en-IN')}
              </p>
              {locationDistance !== null && (
                <div className={`flex items-center gap-2 mt-2 p-2 rounded-md ${
                  locationVerified ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">
                    {locationDistance}m from customer location -{' '}
                    {locationVerified ? 'Within threshold (500m)' : 'Outside threshold (500m)'}
                  </span>
                </div>
              )}
              {locationDistance === null && selectedCustomer && !selectedCustomer.location && (
                <p className="text-xs text-yellow-600">
                  Customer has no stored location. Verification unavailable.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Photo Capture */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-4 w-4 mr-2" />
            Add Photos
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handlePhotoCapture}
          />

          {form.photos.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {form.photos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={photo}
                    alt={`Visit photo ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Log Visit
        </Button>
      </div>
    </form>
  );
}
