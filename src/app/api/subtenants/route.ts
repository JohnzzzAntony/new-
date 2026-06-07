import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
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
        { tradeName: { contains: search } },
        { tradeLicenseNo: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { contactPerson: { contains: search } },
        { emiratesId: { contains: search } },
        { passportNo: { contains: search } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      db.subtenant.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      db.subtenant.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Subtenants GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const subtenant = await db.subtenant.create({
      data: {
        name: body.name,
        tradeName: body.tradeName,
        tradeLicenseNo: body.tradeLicenseNo,
        tradeLicenseExpiry: body.tradeLicenseExpiry ? new Date(body.tradeLicenseExpiry) : null,
        registrationNo: body.registrationNo,
        contactPerson: body.contactPerson,
        phone: body.phone,
        email: body.email,
        address: body.address,
        city: body.city,
        country: body.country || 'UAE',
        nationality: body.nationality,
        emiratesId: body.emiratesId,
        passportNo: body.passportNo,
        notes: body.notes,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ data: subtenant }, { status: 201 });
  } catch (error) {
    console.error('Subtenants POST error:', error);
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
        { error: 'Subtenant ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.subtenant.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Subtenant not found' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = { ...updateData };
    if (updateData.tradeLicenseExpiry) {
      data.tradeLicenseExpiry = new Date(updateData.tradeLicenseExpiry);
    }

    const subtenant = await db.subtenant.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: subtenant });
  } catch (error) {
    console.error('Subtenants PUT error:', error);
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
        { error: 'Subtenant ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.subtenant.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Subtenant not found' },
        { status: 404 }
      );
    }

    await db.subtenant.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ message: 'Subtenant deleted successfully' });
  } catch (error) {
    console.error('Subtenants DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
