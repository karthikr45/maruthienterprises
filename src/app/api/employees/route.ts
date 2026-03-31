import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const bank = searchParams.get('bank');

    const filter: Record<string, unknown> = {};
    if (isActive !== null && isActive !== '') {
      filter.isActive = isActive === 'true';
    }
    if (bank) {
      filter.assignedBanks = bank;
    }

    const employees = await Employee.find(filter)
      .populate('assignedBanks', 'name code')
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: employees });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { password, ...employeeData } = body;

    // Create user account for the employee
    const user = await User.create({
      name: employeeData.name,
      email: employeeData.email,
      password: password || 'changeme123',
      role: 'employee',
      phone: employeeData.phone,
    });

    // Create employee record linked to user
    const employee = await Employee.create({
      ...employeeData,
      userId: user._id,
    });

    const populated = await Employee.findById(employee._id)
      .populate('assignedBanks', 'name code')
      .populate('userId', 'name email role');

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
