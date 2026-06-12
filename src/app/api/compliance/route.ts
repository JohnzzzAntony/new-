import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      db.complianceAlert.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      db.complianceAlert.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Compliance GET error:', error);
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
        { error: 'Compliance alert ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.complianceAlert.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Compliance alert not found' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = { ...updateData };

    // If marking as resolved, set resolvedAt
    if (updateData.status === 'COMPLIANT' && !existing.resolvedAt) {
      data.resolvedAt = new Date();
    }

    const alert = await db.complianceAlert.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: alert });
  } catch (error) {
    console.error('Compliance PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
