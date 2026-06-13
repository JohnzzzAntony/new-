import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subleaseId = searchParams.get('subleaseId');
    const id = searchParams.get('id');

    if (id) {
      const stage = await db.subleaseStage.findFirst({ where: { id } });
      if (!stage) return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
      return NextResponse.json({ data: stage });
    }

    if (!subleaseId) {
      return NextResponse.json({ error: 'subleaseId is required' }, { status: 400 });
    }

    const stages = await db.subleaseStage.findMany({
      where: { subleaseId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ data: stages, total: stages.length, page: 1, pageSize: 20 });
  } catch (error) {
    console.error('SubleaseStages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.subleaseId || !body.stage) {
      return NextResponse.json({ error: 'subleaseId and stage are required' }, { status: 400 });
    }

    // Upsert: if stage already exists for this sublease, update it
    const existing = await db.subleaseStage.findFirst({
      where: { subleaseId: body.subleaseId, stage: body.stage },
    });

    let result;
    if (existing) {
      result = await db.subleaseStage.update({
        where: { id: existing.id },
        data: {
          completedAt: body.completedAt ? new Date(body.completedAt) : existing.completedAt,
          doneBy: body.doneBy ?? existing.doneBy,
          documentUrl: body.documentUrl ?? existing.documentUrl,
          notes: body.notes ?? existing.notes,
        },
      });
    } else {
      result = await db.subleaseStage.create({
        data: {
          subleaseId: body.subleaseId,
          stage: body.stage,
          completedAt: body.completedAt ? new Date(body.completedAt) : null,
          doneBy: body.doneBy || null,
          documentUrl: body.documentUrl || null,
          notes: body.notes || null,
        },
      });
    }

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error('SubleaseStages POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Stage ID is required' }, { status: 400 });
    }

    const existing = await db.subleaseStage.findFirst({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (updateData.completedAt !== undefined) data.completedAt = updateData.completedAt ? new Date(updateData.completedAt) : null;
    if (updateData.doneBy !== undefined) data.doneBy = updateData.doneBy;
    if (updateData.documentUrl !== undefined) data.documentUrl = updateData.documentUrl;
    if (updateData.notes !== undefined) data.notes = updateData.notes;

    const stage = await db.subleaseStage.update({ where: { id }, data });
    return NextResponse.json({ data: stage });
  } catch (error) {
    console.error('SubleaseStages PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Stage ID is required' }, { status: 400 });

    await db.subleaseStage.delete({ where: { id } });
    return NextResponse.json({ message: 'Stage deleted successfully' });
  } catch (error) {
    console.error('SubleaseStages DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
