import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const assets = await db.asset.findMany({
      where: { companyId: id, deletedAt: null },
      include: {
        property: {
          select: { name: true, propertyCode: true },
        },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

    return NextResponse.json({
      assets,
      summary: {
        totalCount: assets.length,
        totalValue,
      },
    });
  } catch (error) {
    console.error('Company Assets GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();

    if (!body.name || !body.category || body.value == null) {
      return NextResponse.json(
        { error: 'Name, Category and Value are required' },
        { status: 400 }
      );
    }

    // Generate automatic asset code
    const count = await db.asset.count({ where: { companyId: id } });
    const assetCode = `AST-${id.substring(15, 19).toUpperCase()}-${body.category.substring(0, 3).toUpperCase()}-${(count + 1).toString().padStart(3, '0')}`;

    const asset = await db.asset.create({
      data: {
        name: body.name,
        assetCode,
        category: body.category,
        value: parseFloat(body.value),
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
        status: body.status || 'ACTIVE',
        notes: body.notes,
        companyId: id,
        propertyId: body.propertyId || null,
      },
    });

    return NextResponse.json({ data: asset }, { status: 201 });
  } catch (error) {
    console.error('Company Assets POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
