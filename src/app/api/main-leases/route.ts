import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const propertyId = searchParams.get('propertyId');
    const companyId = searchParams.get('companyId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      const orConditions: Record<string, unknown>[] = [
        { leaseNumber: { contains: search } },
        { landlordName: { contains: search } },
        { landlordEmail: { contains: search } },
        { tenantNumber: { contains: search } },
        { landNumber: { contains: search } },
        { location: { contains: search } },
        { notes: { contains: search } },
      ];
      // Search contractNo as number if search is numeric
      const searchAsNum = parseInt(search);
      if (!isNaN(searchAsNum)) {
        orConditions.push({ contractNo: searchAsNum });
      }
      where.OR = orConditions;
    }

    if (status) {
      where.status = status;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      db.mainLease.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          property: {
            select: { id: true, name: true, propertyCode: true, plotNumber: true, area: true, totalArea: true },
          },
          company: {
            select: { id: true, name: true },
          },
        },
      }),
      db.mainLease.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('MainLeases GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const lease = await db.mainLease.create({
      data: {
        contractNo: body.contractNo,
        leaseNumber: body.leaseNumber,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        rentAmount: body.rentAmount,
        rentFrequency: body.rentFrequency || 'annual',
        securityDeposit: body.securityDeposit,
        incrementPercent: body.incrementPercent,
        incrementFrequency: body.incrementFrequency,
        landlordName: body.landlordName,
        landlordContact: body.landlordContact,
        landlordEmail: body.landlordEmail,
        tenantNumber: body.tenantNumber,
        landNumber: body.landNumber,
        annualRentPerSqFt: body.annualRentPerSqFt,
        location: body.location,
        terms: body.terms,
        notes: body.notes,
        status: body.status || 'DRAFT',
        renewalStatus: body.renewalStatus || 'NONE',
        renewedFromId: body.renewedFromId,
        propertyId: body.propertyId,
        companyId: body.companyId,
        isActive: body.isActive ?? true,
      },
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true, plotNumber: true, area: true, totalArea: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ data: lease }, { status: 201 });
  } catch (error: unknown) {
    console.error('MainLeases POST error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'Lease number or contract number already exists' },
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
        { error: 'Lease ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.mainLease.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Main lease not found' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = { ...updateData };
    if (updateData.startDate) data.startDate = new Date(updateData.startDate);
    if (updateData.endDate) data.endDate = new Date(updateData.endDate);

    const lease = await db.mainLease.update({
      where: { id },
      data,
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true, plotNumber: true, area: true, totalArea: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ data: lease });
  } catch (error: unknown) {
    console.error('MainLeases PUT error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'Lease number or contract number already exists' },
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
        { error: 'Lease ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.mainLease.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Main lease not found' },
        { status: 404 }
      );
    }

    await db.mainLease.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ message: 'Main lease deleted successfully' });
  } catch (error) {
    console.error('MainLeases DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
