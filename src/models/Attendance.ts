import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttendance extends Document {
  employeeId: Types.ObjectId;
  date: Date;
  checkIn: Date;
  checkOut: Date;
  checkInLatitude: number;
  checkInLongitude: number;
  checkOutLatitude: number;
  checkOutLongitude: number;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';
  leaveType: 'casual' | 'sick' | 'earned' | 'none';
  workingHours: number;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    checkInLatitude: { type: Number },
    checkInLongitude: { type: Number },
    checkOutLatitude: { type: Number },
    checkOutLongitude: { type: Number },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'leave', 'holiday'],
      default: 'present',
    },
    leaveType: {
      type: String,
      enum: ['casual', 'sick', 'earned', 'none'],
      default: 'none',
    },
    workingHours: { type: Number, default: 0 },
    remarks: { type: String },
  },
  { timestamps: true }
);

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
