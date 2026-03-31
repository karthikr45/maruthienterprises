import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICompliance extends Document {
  employeeId: Types.ObjectId;
  bankId: Types.ObjectId;
  certificationType: string;
  certificationName: string;
  issuedDate: Date;
  expiryDate: Date;
  certificateNumber: string;
  status: 'valid' | 'expired' | 'pending' | 'renewal_due';
  documentUrl: string;
  examName: string;
  examDate: Date;
  examScore: number;
  examStatus: 'passed' | 'failed' | 'pending' | 'not_attempted';
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComplianceSchema = new Schema<ICompliance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    bankId: { type: Schema.Types.ObjectId, ref: 'Bank', required: true },
    certificationType: { type: String, required: true },
    certificationName: { type: String, required: true },
    issuedDate: { type: Date },
    expiryDate: { type: Date },
    certificateNumber: { type: String },
    status: {
      type: String,
      enum: ['valid', 'expired', 'pending', 'renewal_due'],
      default: 'pending',
    },
    documentUrl: { type: String },
    examName: { type: String },
    examDate: { type: Date },
    examScore: { type: Number },
    examStatus: {
      type: String,
      enum: ['passed', 'failed', 'pending', 'not_attempted'],
      default: 'not_attempted',
    },
    remarks: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Compliance || mongoose.model<ICompliance>('Compliance', ComplianceSchema);
