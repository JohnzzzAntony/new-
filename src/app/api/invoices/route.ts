import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const subleaseId = searchParams.get('subleaseId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { notes: { contains: search } },
        { sublease: { subleaseNumber: { contains: search } } },
        { sublease: { subtenant: { name: { contains: search } } } },
        { sublease: { subtenant: { tradeName: { contains: search } } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (subleaseId) {
      where.subleaseId = subleaseId;
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      db.invoice.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          sublease: {
            select: {
              id: true,
              subleaseNumber: true,
              subtenant: {
                select: { id: true, name: true, tradeName: true },
              },
            },
          },
        },
      }),
      db.invoice.count({ where }),
    ]);

    const formattedData = data.map((invoice) => ({
      ...invoice,
      subtenantName: invoice.sublease?.subtenant?.name || null,
      subtenantTradeName: invoice.sublease?.subtenant?.tradeName || null,
    }));

    return NextResponse.json({
      data: formattedData,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Invoices GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.invoiceNumber) {
      return NextResponse.json({ error: 'Invoice number is required' }, { status: 400 });
    }

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber: body.invoiceNumber,
        issueDate: body.issueDate ? new Date(body.issueDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        periodStart: body.periodStart ? new Date(body.periodStart) : null,
        periodEnd: body.periodEnd ? new Date(body.periodEnd) : null,
        rentAmount: body.rentAmount ? parseFloat(body.rentAmount) : null,
        otherCharges: body.otherCharges || 0,
        vatAmount: body.vatAmount || 0,
        totalAmount: body.totalAmount ? parseFloat(body.totalAmount) : null,
        amountPaid: body.amountPaid || 0,
        balanceDue: body.balanceDue !== undefined && body.balanceDue !== null ? parseFloat(body.balanceDue) : (body.totalAmount ? (parseFloat(body.totalAmount) - (body.amountPaid || 0)) : null),
        status: body.status || 'ISSUED',
        notes: body.notes,
        subleaseId: body.subleaseId || null,
        isActive: body.isActive ?? true,
      },
      include: {
        sublease: {
          select: {
            id: true,
            subleaseNumber: true,
            subtenant: {
              select: { id: true, name: true, tradeName: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (error: unknown) {
    console.error('Invoices POST error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'Invoice number already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.invoice.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = { ...updateData };
    if (updateData.issueDate !== undefined) data.issueDate = updateData.issueDate ? new Date(updateData.issueDate) : null;
    if (updateData.dueDate !== undefined) data.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
    if (updateData.periodStart !== undefined) data.periodStart = updateData.periodStart ? new Date(updateData.periodStart) : null;
    if (updateData.periodEnd !== undefined) data.periodEnd = updateData.periodEnd ? new Date(updateData.periodEnd) : null;
    if (updateData.subleaseId !== undefined) data.subleaseId = updateData.subleaseId || null;
    if (updateData.rentAmount !== undefined) data.rentAmount = updateData.rentAmount !== null && updateData.rentAmount !== '' ? parseFloat(updateData.rentAmount as string) : null;
    if (updateData.totalAmount !== undefined) data.totalAmount = updateData.totalAmount !== null && updateData.totalAmount !== '' ? parseFloat(updateData.totalAmount as string) : null;
    if (updateData.balanceDue !== undefined) data.balanceDue = updateData.balanceDue !== null && updateData.balanceDue !== '' ? parseFloat(updateData.balanceDue as string) : null;
    delete data.sublease;
    delete data.receipts;

    const invoice = await db.invoice.update({
      where: { id },
      data,
      include: {
        sublease: {
          select: {
            id: true,
            subleaseNumber: true,
            subtenant: {
              select: { id: true, name: true, tradeName: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ data: invoice });
  } catch (error: unknown) {
    console.error('Invoices PUT error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'Invoice number already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.invoice.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    await db.invoice.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Invoices DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
