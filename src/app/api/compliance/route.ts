import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Compliance from '@/models/Compliance';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const bankId = searchParams.get('bankId');
    const status = searchParams.get('status');
    const examStatus = searchParams.get('examStatus');

    const filter: Record<string, unknown> = {};
    if (employeeId) filter.employeeId = employeeId;
    if (bankId) filter.bankId = bankId;
    if (status) filter.status = status;
    if (examStatus) filter.examStatus = examStatus;

    const compliance = await Compliance.find(filter)
      .populate('employeeId', 'name employeeId')
      .populate('bankId', 'name code')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: compliance });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const compliance = await Compliance.create(body);

    const populated = await Compliance.findById(compliance._id)
      .populate('employeeId', 'name employeeId')
      .populate('bankId', 'name code');

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
