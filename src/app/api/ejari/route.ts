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
    const subtenantId = searchParams.get('subtenantId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { ejariNumber: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (subtenantId) {
      where.subtenantId = subtenantId;
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      db.ejari.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          sublease: {
            select: { id: true, subleaseNumber: true },
          },
          subtenant: {
            select: { id: true, name: true, tradeName: true },
          },
        },
      }),
      db.ejari.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Ejari GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const ejari = await db.ejari.create({
      data: {
        ejariNumber: body.ejariNumber,
        registrationDate: body.registrationDate ? new Date(body.registrationDate) : null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        certificateUrl: body.certificateUrl,
        status: body.status || 'PENDING',
        notes: body.notes,
        subleaseId: body.subleaseId,
        subtenantId: body.subtenantId,
        isActive: body.isActive ?? true,
      },
      include: {
        sublease: {
          select: { id: true, subleaseNumber: true },
        },
        subtenant: {
          select: { id: true, name: true, tradeName: true },
        },
      },
    });

    return NextResponse.json({ data: ejari }, { status: 201 });
  } catch (error: unknown) {
    console.error('Ejari POST error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'EJARI number already exists' },
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
        { error: 'EJARI ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.ejari.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'EJARI registration not found' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = { ...updateData };
    if (updateData.registrationDate) data.registrationDate = new Date(updateData.registrationDate);
    if (updateData.expiryDate) data.expiryDate = new Date(updateData.expiryDate);

    const ejari = await db.ejari.update({
      where: { id },
      data,
      include: {
        sublease: {
          select: { id: true, subleaseNumber: true },
        },
        subtenant: {
          select: { id: true, name: true, tradeName: true },
        },
      },
    });

    return NextResponse.json({ data: ejari });
  } catch (error: unknown) {
    console.error('Ejari PUT error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'EJARI number already exists' },
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
        { error: 'EJARI ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.ejari.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'EJARI registration not found' },
        { status: 404 }
      );
    }

    await db.ejari.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ message: 'EJARI registration deleted successfully' });
  } catch (error) {
    console.error('Ejari DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
