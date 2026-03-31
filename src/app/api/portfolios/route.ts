import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Portfolio from '@/models/Portfolio';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get('bankId');
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (bankId) filter.bankId = bankId;
    if (status) filter.status = status;

    const portfolios = await Portfolio.find(filter)
      .populate('bankId', 'name code')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: portfolios });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const portfolio = await Portfolio.create(body);

    const populated = await Portfolio.findById(portfolio._id).populate('bankId', 'name code');

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
