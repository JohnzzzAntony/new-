import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const unitType = searchParams.get('unitType');
    const status = searchParams.get('status');
    const propertyId = searchParams.get('propertyId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { unitNumber: { contains: search } },
        { unitCode: { contains: search } },
        { description: { contains: search } },
        { property: { name: { contains: search } } },
        { property: { propertyCode: { contains: search } } },
      ];
    }

    if (unitType) {
      where.unitType = unitType;
    }

    if (status) {
      where.status = status;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      db.unit.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          property: {
            select: { id: true, name: true, propertyCode: true },
          },
        },
      }),
      db.unit.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Units GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const unit = await db.unit.create({
      data: {
        unitNumber: body.unitNumber,
        unitCode: body.unitCode,
        unitType: body.unitType || 'WAREHOUSE',
        status: body.status || 'VACANT',
        floor: body.floor,
        area: body.area,
        rentAmount: body.rentAmount,
        securityDeposit: body.securityDeposit,
        amenities: body.amenities,
        description: body.description,
        notes: body.notes,
        propertyId: body.propertyId,
        isActive: body.isActive ?? true,
      },
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true },
        },
      },
    });

    return NextResponse.json({ data: unit }, { status: 201 });
  } catch (error: unknown) {
    console.error('Units POST error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'Unit number already exists for this property' },
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
        { error: 'Unit ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.unit.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      );
    }

    const unit = await db.unit.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true },
        },
      },
    });

    return NextResponse.json({ data: unit });
  } catch (error: unknown) {
    console.error('Units PUT error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'Unit number already exists for this property' },
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
        { error: 'Unit ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.unit.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      );
    }

    await db.unit.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Units DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
