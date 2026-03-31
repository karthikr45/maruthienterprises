import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Visit from '@/models/Visit';
import Employee from '@/models/Employee';
import Customer from '@/models/Customer';
import Bank from '@/models/Bank';
import Attendance from '@/models/Attendance';

export async function GET() {
  try {
    await dbConnect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Run all queries in parallel
    const [
      totalCollections,
      monthlyCollections,
      visitsToday,
      activeEmployees,
      pendingRecoveries,
      totalCustomers,
      totalBanks,
      todayAttendance,
      bankWiseStats,
      statusDistribution,
    ] = await Promise.all([
      // Total collections (all time)
      Visit.aggregate([
        { $group: { _id: null, total: { $sum: '$amountCollected' } } },
      ]),

      // Monthly collections
      Visit.aggregate([
        { $match: { visitDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amountCollected' } } },
      ]),

      // Visits today
      Visit.countDocuments({
        visitDate: { $gte: today, $lt: tomorrow },
      }),

      // Active employees
      Employee.countDocuments({ isActive: true }),

      // Pending recoveries (customers not fully recovered)
      Customer.countDocuments({
        status: { $in: ['pending', 'in_progress', 'partially_recovered'] },
      }),

      // Total customers
      Customer.countDocuments(),

      // Total active banks
      Bank.countDocuments({ isActive: true }),

      // Today's attendance count
      Attendance.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        status: 'present',
      }),

      // Bank-wise collection stats
      Visit.aggregate([
        {
          $group: {
            _id: '$bankId',
            totalCollected: { $sum: '$amountCollected' },
            totalVisits: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'banks',
            localField: '_id',
            foreignField: '_id',
            as: 'bank',
          },
        },
        { $unwind: { path: '$bank', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            bankName: '$bank.name',
            bankCode: '$bank.code',
            totalCollected: 1,
            totalVisits: 1,
          },
        },
        { $sort: { totalCollected: -1 } },
      ]),

      // Customer status distribution
      Customer.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalCollections: totalCollections[0]?.total || 0,
        monthlyCollections: monthlyCollections[0]?.total || 0,
        visitsToday,
        activeEmployees,
        pendingRecoveries,
        totalCustomers,
        totalBanks,
        todayAttendance,
        bankWiseStats,
        statusDistribution,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
