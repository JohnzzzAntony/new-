import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const invoiceId = searchParams.get('invoiceId');
    const paymentMethod = searchParams.get('paymentMethod');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search } },
        { referenceNo: { contains: search } },
        { bankName: { contains: search } },
      ];
    }

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      db.receipt.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          invoice: {
            select: { id: true, invoiceNumber: true, totalAmount: true, balanceDue: true },
          },
        },
      }),
      db.receipt.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Receipts GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate receipt number if not provided
    const receiptNumber = body.receiptNumber || `REC-${randomUUID().substring(0, 8).toUpperCase()}`;

    const receipt = await db.receipt.create({
      data: {
        receiptNumber,
        invoiceId: body.invoiceId,
        amount: body.amount,
        paymentDate: new Date(body.paymentDate),
        paymentMethod: body.paymentMethod || 'BANK_TRANSFER',
        referenceNo: body.referenceNo,
        bankName: body.bankName,
        notes: body.notes,
        isActive: body.isActive ?? true,
      },
      include: {
        invoice: {
          select: { id: true, invoiceNumber: true, totalAmount: true, balanceDue: true },
        },
      },
    });

    // Update invoice amount paid and balance due
    const invoice = await db.invoice.findUnique({
      where: { id: body.invoiceId },
    });

    if (invoice) {
      const newAmountPaid = invoice.amountPaid + body.amount;
      const newBalanceDue = invoice.totalAmount - newAmountPaid;
      let newStatus = invoice.status;

      if (newBalanceDue <= 0) {
        newStatus = 'PAID';
      } else if (newAmountPaid > 0) {
        newStatus = 'PARTIALLY_PAID';
      }

      await db.invoice.update({
        where: { id: body.invoiceId },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: Math.max(0, newBalanceDue),
          status: newStatus,
        },
      });
    }

    return NextResponse.json({ data: receipt }, { status: 201 });
  } catch (error: unknown) {
    console.error('Receipts POST error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'Receipt number already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
