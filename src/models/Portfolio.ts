import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPortfolio extends Document {
  bankId: Types.ObjectId;
  portfolioName: string;
  portfolioCode: string;
  totalAccounts: number;
  totalOutstanding: number;
  assignedDate: Date;
  dueDate: Date;
  status: 'active' | 'completed' | 'expired';
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>(
  {
    bankId: { type: Schema.Types.ObjectId, ref: 'Bank', required: true },
    portfolioName: { type: String, required: true },
    portfolioCode: { type: String, required: true, unique: true },
    totalAccounts: { type: Number, default: 0 },
    totalOutstanding: { type: Number, default: 0 },
    assignedDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'completed', 'expired'], default: 'active' },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Portfolio || mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
