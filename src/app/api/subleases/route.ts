import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SUBLEASE_INCLUDE = {
  property: {
    select: {
      id: true,
      name: true,
      plotNumber: true,
      area: true,
      totalArea: true,
      address: true,
      leaseNumber: true,
      contractNo: true,
      leaseStartDate: true,
      leaseEndDate: true,
      rentAmount: true,
    },
  },
  unit: {
    select: { id: true, unitNumber: true, unitCode: true, unitType: true, area: true, rentAmount: true, status: true },
  },
  subtenant: {
    include: {
      company: { select: { id: true, name: true, phone: true, email: true, contactPerson: true } },
    },
  },
  stages: { orderBy: { createdAt: 'asc' as const } },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      const sublease = await db.sublease.findFirst({
        where: { id, deletedAt: null },
        include: SUBLEASE_INCLUDE,
      });
      if (!sublease) return NextResponse.json({ error: 'Sublease not found' }, { status: 404 });
      return NextResponse.json({ data: sublease });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const subtenantId = searchParams.get('subtenantId');
    const unitId = searchParams.get('unitId');
    const propertyId = searchParams.get('propertyId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { subleaseNumber: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (subtenantId) {
      where.subtenantId = subtenantId;
    }

    if (unitId) {
      where.unitId = unitId;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      db.sublease.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          property: {
            select: {
              id: true,
              leaseNumber: true,
              contractNo: true,
              name: true,
            },
          },
          unit: { select: { id: true, unitNumber: true, unitType: true, area: true } },
          subtenant: { select: { id: true, name: true, tradeName: true, phone: true, email: true } },
        },
      }),
      db.sublease.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    console.error('Subleases GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const sublease = await db.sublease.create({
      data: {
        subleaseNumber: body.subleaseNumber,
        contractValue: body.contractValue ?? 0,
        subLeaseFee: body.subLeaseFee ?? 0,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        rentAmount: body.rentAmount,
        rentFrequency: body.rentFrequency || 'monthly',
        securityDeposit: body.securityDeposit,
        incrementPercent: body.incrementPercent,
        incrementFrequency: body.incrementFrequency,
        numberOfCheques: body.numberOfCheques ?? null,
        pdcDates: body.pdcDates ?? null,
        paymentNotes: body.paymentNotes ?? null,
        terms: body.terms,
        notes: body.notes,
        status: body.status || 'DRAFT',
        renewalStatus: body.renewalStatus || 'NONE',
        renewedFromId: body.renewedFromId,
        propertyId: body.propertyId,
        unitId: body.unitId,
        subtenantId: body.subtenantId,
        isActive: body.isActive ?? true,
      },
      include: SUBLEASE_INCLUDE,
    });

    return NextResponse.json({ data: sublease }, { status: 201 });
  } catch (error: unknown) {
    console.error('Subleases POST error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json({ error: 'Sublease number already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'Sublease ID is required' }, { status: 400 });

    const existing = await db.sublease.findFirst({ where: { id, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: 'Sublease not found' }, { status: 404 });

    const data: Record<string, unknown> = { ...updateData };
    if (updateData.startDate) data.startDate = new Date(updateData.startDate);
    if (updateData.endDate) data.endDate = new Date(updateData.endDate);
    // Remove relation objects that Prisma cannot write directly
    delete data.property;
    delete data.unit;
    delete data.subtenant;
    delete data.stages;
    delete data.invoices;
    delete data.ejariRegistrations;
    delete data.documents;
    delete data.renewals;

    const sublease = await db.sublease.update({
      where: { id },
      data,
      include: SUBLEASE_INCLUDE,
    });

    return NextResponse.json({ data: sublease });
  } catch (error: unknown) {
    console.error('Subleases PUT error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json({ error: 'Sublease number already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Sublease ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.sublease.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Sublease not found' },
        { status: 404 }
      );
    }

    await db.sublease.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ message: 'Sublease deleted successfully' });
  } catch (error) {
    console.error('Subleases DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
