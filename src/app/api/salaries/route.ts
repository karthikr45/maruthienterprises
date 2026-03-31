import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Salary from '@/models/Salary';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (employeeId) filter.employeeId = employeeId;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;

    const salaries = await Salary.find(filter)
      .populate('employeeId', 'name employeeId designation')
      .sort({ year: -1, month: -1 });

    return NextResponse.json({ success: true, data: salaries });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const salary = await Salary.create(body);

    const populated = await Salary.findById(salary._id).populate(
      'employeeId',
      'name employeeId designation'
    );

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
