import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const propertyType = searchParams.get('propertyType');
    const companyId = searchParams.get('companyId');
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { propertyCode: { contains: search } },
        { address: { contains: search } },
        { area: { contains: search } },
        { city: { contains: search } },
      ];
    }

    if (propertyType) {
      where.propertyType = propertyType;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      db.property.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          company: {
            select: { id: true, name: true },
          },
          _count: {
            select: { units: { where: { deletedAt: null } } },
          },
        },
      }),
      db.property.count({ where }),
    ]);

    const formattedData = data.map(({ _count, ...rest }) => ({
      ...rest,
      unitCount: _count.units,
    }));

    return NextResponse.json({
      data: formattedData,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Properties GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const property = await db.property.create({
      data: {
        name: body.name,
        propertyCode: body.propertyCode,
        propertyType: body.propertyType || 'INDUSTRIAL',
        description: body.description,
        address: body.address,
        city: body.city || 'Dubai',
        area: body.area,
        plotNumber: body.plotNumber,
        totalArea: body.totalArea,
        builtUpArea: body.builtUpArea,
        yearBuilt: body.yearBuilt,
        companyId: body.companyId,
        isActive: body.isActive ?? true,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ data: property }, { status: 201 });
  } catch (error: unknown) {
    console.error('Properties POST error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'Property code already exists' },
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
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.property.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const property = await db.property.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ data: property });
  } catch (error: unknown) {
    console.error('Properties PUT error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'Property code already exists' },
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
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.property.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    await db.property.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Properties DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
