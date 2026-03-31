import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Compliance from '@/models/Compliance';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const compliance = await Compliance.findById(params.id)
      .populate('employeeId', 'name employeeId')
      .populate('bankId', 'name code');

    if (!compliance) {
      return NextResponse.json(
        { success: false, error: 'Compliance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: compliance });
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
    const compliance = await Compliance.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    })
      .populate('employeeId', 'name employeeId')
      .populate('bankId', 'name code');

    if (!compliance) {
      return NextResponse.json(
        { success: false, error: 'Compliance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: compliance });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const compliance = await Compliance.findByIdAndDelete(params.id);

    if (!compliance) {
      return NextResponse.json(
        { success: false, error: 'Compliance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
