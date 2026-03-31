import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISalary extends Document {
  employeeId: Types.ObjectId;
  month: number;
  year: number;
  baseSalary: number;
  incentiveAmount: number;
  fuelAllowance: number;
  otherAllowances: number;
  totalDeductions: number;
  pfDeduction: number;
  esiDeduction: number;
  tdsDeduction: number;
  otherDeductions: number;
  netSalary: number;
  totalCollected: number;
  totalVisits: number;
  status: 'draft' | 'processed' | 'paid';
  paidDate: Date;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

const SalarySchema = new Schema<ISalary>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    baseSalary: { type: Number, required: true },
    incentiveAmount: { type: Number, default: 0 },
    fuelAllowance: { type: Number, default: 0 },
    otherAllowances: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    pfDeduction: { type: Number, default: 0 },
    esiDeduction: { type: Number, default: 0 },
    tdsDeduction: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    totalCollected: { type: Number, default: 0 },
    totalVisits: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'processed', 'paid'], default: 'draft' },
    paidDate: { type: Date },
    remarks: { type: String },
  },
  { timestamps: true }
);

SalarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.models.Salary || mongoose.model<ISalary>('Salary', SalarySchema);
