import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVisit extends Document {
  customerId: Types.ObjectId;
  employeeId: Types.ObjectId;
  bankId: Types.ObjectId;
  visitDate: Date;
  checkInTime: Date;
  checkOutTime: Date;
  checkInLatitude: number;
  checkInLongitude: number;
  checkOutLatitude: number;
  checkOutLongitude: number;
  customerLatitude: number;
  customerLongitude: number;
  distanceFromCustomer: number;
  locationVerified: boolean;
  photos: string[];
  visitType: 'field_visit' | 'phone_call' | 'legal_notice' | 'follow_up';
  outcome: 'promise_to_pay' | 'partial_payment' | 'full_payment' | 'not_available' | 'refused' | 'dispute' | 'other';
  amountCollected: number;
  paymentMode: 'cash' | 'upi' | 'cheque' | 'neft' | 'rtgs' | 'none';
  paymentReference: string;
  remarks: string;
  nextFollowUpDate: Date;
  fuelCost: number;
  travelDistance: number;
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema = new Schema<IVisit>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    bankId: { type: Schema.Types.ObjectId, ref: 'Bank' },
    visitDate: { type: Date, required: true, default: Date.now },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    checkInLatitude: { type: Number },
    checkInLongitude: { type: Number },
    checkOutLatitude: { type: Number },
    checkOutLongitude: { type: Number },
    customerLatitude: { type: Number },
    customerLongitude: { type: Number },
    distanceFromCustomer: { type: Number },
    locationVerified: { type: Boolean, default: false },
    photos: [{ type: String }],
    visitType: {
      type: String,
      enum: ['field_visit', 'phone_call', 'legal_notice', 'follow_up'],
      required: true,
    },
    outcome: {
      type: String,
      enum: ['promise_to_pay', 'partial_payment', 'full_payment', 'not_available', 'refused', 'dispute', 'other'],
    },
    amountCollected: { type: Number, default: 0 },
    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'cheque', 'neft', 'rtgs', 'none'],
      default: 'none',
    },
    paymentReference: { type: String },
    remarks: { type: String },
    nextFollowUpDate: { type: Date },
    fuelCost: { type: Number, default: 0 },
    travelDistance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Visit || mongoose.model<IVisit>('Visit', VisitSchema);
