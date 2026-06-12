import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
        { registrationNo: { contains: search } },
        { email: { contains: search } },
        { city: { contains: search } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      db.company.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      db.company.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Companies GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const company = await db.company.create({
      data: {
        name: body.name,
        tradeName: body.tradeName,
        registrationNo: body.registrationNo,
        tradeLicenseNo: body.tradeLicenseNo,
        tradeLicenseExpiry: body.tradeLicenseExpiry ? new Date(body.tradeLicenseExpiry) : null,
        address: body.address,
        city: body.city,
        country: body.country || 'UAE',
        phone: body.phone,
        email: body.email,
        website: body.website,
        contactPerson: body.contactPerson,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail,
        notes: body.notes,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ data: company }, { status: 201 });
  } catch (error: unknown) {
    console.error('Companies POST error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'Registration number already exists' },
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
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.company.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = { ...updateData };
    if (updateData.tradeLicenseExpiry) {
      data.tradeLicenseExpiry = new Date(updateData.tradeLicenseExpiry);
    }

    const company = await db.company.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: company });
  } catch (error: unknown) {
    console.error('Companies PUT error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    if (errMsg.includes('Unique')) {
      return NextResponse.json(
        { error: 'Registration number already exists' },
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
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.company.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    await db.company.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Companies DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
