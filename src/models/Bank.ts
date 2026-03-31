import mongoose, { Schema, Document } from 'mongoose';

export interface IBank extends Document {
  name: string;
  code: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  requiredCertifications: string[];
  requiredExams: string[];
  agreementStartDate: Date;
  agreementEndDate: Date;
  commissionPercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BankSchema = new Schema<IBank>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    contactPerson: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    address: { type: String, required: true },
    requiredCertifications: [{ type: String }],
    requiredExams: [{ type: String }],
    agreementStartDate: { type: Date, required: true },
    agreementEndDate: { type: Date, required: true },
    commissionPercentage: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Bank || mongoose.model<IBank>('Bank', BankSchema);
