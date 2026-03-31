import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Visit from '@/models/Visit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const visit = await Visit.findById(params.id)
      .populate('customerId', 'customerName loanAccountNumber phone address')
      .populate('employeeId', 'name employeeId phone')
      .populate('bankId', 'name code');

    if (!visit) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: visit });
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
    const visit = await Visit.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    })
      .populate('customerId', 'customerName loanAccountNumber phone')
      .populate('employeeId', 'name employeeId')
      .populate('bankId', 'name code');

    if (!visit) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: visit });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
