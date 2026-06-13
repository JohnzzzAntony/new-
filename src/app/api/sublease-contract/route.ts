import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Sublease ID is required' }, { status: 400 });
    }

    const sublease = await db.sublease.findFirst({
      where: { id, deletedAt: null },
      include: {
        property: {
          include: {
            company: true,
          },
        },
        unit: {
          include: { property: true },
        },
        subtenant: {
          include: { company: true },
        },
        stages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!sublease) {
      return NextResponse.json({ error: 'Sublease not found' }, { status: 404 });
    }

    return NextResponse.json({ data: sublease });
  } catch (error) {
    console.error('SubleaseContract GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
