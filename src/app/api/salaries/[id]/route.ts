import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Salary from '@/models/Salary';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const salary = await Salary.findById(params.id).populate(
      'employeeId',
      'name employeeId designation baseSalary'
    );

    if (!salary) {
      return NextResponse.json(
        { success: false, error: 'Salary record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: salary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const body = await request.json();
    const salary = await Salary.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).populate('employeeId', 'name employeeId designation');

    if (!salary) {
      return NextResponse.json(
        { success: false, error: 'Salary record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: salary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
