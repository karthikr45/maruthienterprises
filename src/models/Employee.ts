import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmployee extends Document {
  userId: Types.ObjectId;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  designation: string;
  department: string;
  dateOfJoining: Date;
  assignedBanks: Types.ObjectId[];
  baseSalary: number;
  incentivePercentage: number;
  fuelAllowance: number;
  emergencyContact: string;
  aadharNumber: string;
  panNumber: string;
  bankAccountNumber: string;
  bankIFSC: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    alternatePhone: { type: String },
    address: { type: String, required: true },
    city: { type: String, default: 'Hyderabad' },
    designation: { type: String, required: true },
    department: { type: String, required: true },
    dateOfJoining: { type: Date, required: true },
    assignedBanks: [{ type: Schema.Types.ObjectId, ref: 'Bank' }],
    baseSalary: { type: Number, required: true },
    incentivePercentage: { type: Number, default: 0 },
    fuelAllowance: { type: Number, default: 0 },
    emergencyContact: { type: String },
    aadharNumber: { type: String },
    panNumber: { type: String },
    bankAccountNumber: { type: String },
    bankIFSC: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
