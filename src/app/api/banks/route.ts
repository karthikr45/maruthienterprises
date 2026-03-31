import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Bank from '@/models/Bank';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const filter: Record<string, unknown> = {};
    if (isActive !== null && isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    const banks = await Bank.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: banks });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const bank = await Bank.create(body);

    return NextResponse.json({ success: true, data: bank }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
