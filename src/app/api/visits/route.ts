import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Visit from '@/models/Visit';
import Customer from '@/models/Customer';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const customerId = searchParams.get('customerId');
    const bankId = searchParams.get('bankId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const visitType = searchParams.get('visitType');
    const outcome = searchParams.get('outcome');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filter: Record<string, unknown> = {};
    if (employeeId) filter.employeeId = employeeId;
    if (customerId) filter.customerId = customerId;
    if (bankId) filter.bankId = bankId;
    if (visitType) filter.visitType = visitType;
    if (outcome) filter.outcome = outcome;
    if (startDate || endDate) {
      filter.visitDate = {} as Record<string, unknown>;
      if (startDate) (filter.visitDate as Record<string, unknown>).$gte = new Date(startDate);
      if (endDate) (filter.visitDate as Record<string, unknown>).$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [visits, total] = await Promise.all([
      Visit.find(filter)
        .populate('customerId', 'customerName loanAccountNumber phone')
        .populate('employeeId', 'name employeeId')
        .populate('bankId', 'name code')
        .sort({ visitDate: -1 })
        .skip(skip)
        .limit(limit),
      Visit.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: visits,
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
    const visit = await Visit.create(body);

    // Update customer totalCollected and status if amount was collected
    if (visit.amountCollected > 0 && visit.customerId) {
      const customer = await Customer.findById(visit.customerId);
      if (customer) {
        customer.totalCollected = (customer.totalCollected || 0) + visit.amountCollected;
        customer.lastPaymentDate = visit.visitDate;

        if (customer.totalCollected >= customer.outstandingAmount) {
          customer.status = 'fully_recovered';
        } else if (customer.totalCollected > 0) {
          customer.status = 'partially_recovered';
        } else if (customer.status === 'pending') {
          customer.status = 'in_progress';
        }

        await customer.save();
      }
    }

    const populated = await Visit.findById(visit._id)
      .populate('customerId', 'customerName loanAccountNumber phone')
      .populate('employeeId', 'name employeeId')
      .populate('bankId', 'name code');

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
