import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExpense extends Document {
  employeeId: Types.ObjectId;
  date: Date;
  category: 'fuel' | 'travel' | 'food' | 'phone' | 'office_supplies' | 'other';
  amount: number;
  description: string;
  receiptUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: Types.ObjectId;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    category: {
      type: String,
      enum: ['fuel', 'travel', 'food', 'phone', 'office_supplies', 'other'],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    receiptUrl: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
