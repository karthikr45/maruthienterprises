import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICustomer extends Document {
  portfolioId: Types.ObjectId;
  bankId: Types.ObjectId;
  assignedEmployeeId: Types.ObjectId;
  loanAccountNumber: string;
  customerName: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  loanType: string;
  loanAmount: number;
  outstandingAmount: number;
  emiAmount: number;
  overdueAmount: number;
  overdueMonths: number;
  lastPaymentDate: Date;
  totalCollected: number;
  status: 'pending' | 'in_progress' | 'partially_recovered' | 'fully_recovered' | 'npa' | 'legal';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    portfolioId: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    bankId: { type: Schema.Types.ObjectId, ref: 'Bank', required: true },
    assignedEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    loanAccountNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    alternatePhone: { type: String },
    email: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: 'Telangana' },
    pincode: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    loanType: { type: String, required: true },
    loanAmount: { type: Number, required: true },
    outstandingAmount: { type: Number, required: true },
    emiAmount: { type: Number },
    overdueAmount: { type: Number, required: true },
    overdueMonths: { type: Number, default: 0 },
    lastPaymentDate: { type: Date },
    totalCollected: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'partially_recovered', 'fully_recovered', 'npa', 'legal'],
      default: 'pending',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
