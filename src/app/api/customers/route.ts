import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get('bankId');
    const portfolioId = searchParams.get('portfolioId');
    const assignedEmployeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filter: Record<string, unknown> = {};
    if (bankId) filter.bankId = bankId;
    if (portfolioId) filter.portfolioId = portfolioId;
    if (assignedEmployeeId) filter.assignedEmployeeId = assignedEmployeeId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { loanAccountNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .populate('bankId', 'name code')
        .populate('portfolioId', 'portfolioName portfolioCode')
        .populate('assignedEmployeeId', 'name employeeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const customer = await Customer.create(body);

    const populated = await Customer.findById(customer._id)
      .populate('bankId', 'name code')
      .populate('portfolioId', 'portfolioName portfolioCode')
      .populate('assignedEmployeeId', 'name employeeId');

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
