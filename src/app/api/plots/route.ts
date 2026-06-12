import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      db.plot.findMany({
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
      db.plot.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Plots GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const plot = await db.plot.create({
      data: {
        plotNumber: body.plotNumber,
        area: body.area,
        zoning: body.zoning,
        status: body.status || 'available',
        notes: body.notes,
        propertyId: body.propertyId,
      },
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true },
        },
      },
    });

    return NextResponse.json({ data: plot }, { status: 201 });
  } catch (error: unknown) {
    console.error('Plots POST error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'Plot number already exists for this property' },
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
        { error: 'Plot ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.plot.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Plot not found' },
        { status: 404 }
      );
    }

    const plot = await db.plot.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: { id: true, name: true, propertyCode: true },
        },
      },
    });

    return NextResponse.json({ data: plot });
  } catch (error: unknown) {
    console.error('Plots PUT error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'Plot number already exists for this property' },
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
        { error: 'Plot ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.plot.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Plot not found' },
        { status: 404 }
      );
    }

    await db.plot.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'Plot deleted successfully' });
  } catch (error) {
    console.error('Plots DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
