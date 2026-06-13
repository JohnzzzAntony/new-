import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const property = await db.property.findFirst({
        where: { id, deletedAt: null },
        include: {
          company: {
            select: { id: true, name: true },
          },
          renewals: {
            where: { deletedAt: null },
            orderBy: { leaseStartDate: 'asc' },
          },
          _count: {
            select: { units: { where: { deletedAt: null } } },
          },
        },
      });
      if (!property) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }
      return NextResponse.json({ data: property });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const propertyType = searchParams.get('propertyType');
    const companyId = searchParams.get('companyId');
    const isActive = searchParams.get('isActive');
    const leaseStatus = searchParams.get('leaseStatus') || searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      const orConditions: Record<string, unknown>[] = [
        { name: { contains: search } },
        { propertyCode: { contains: search } },
        { address: { contains: search } },
        { area: { contains: search } },
        { city: { contains: search } },
        { leaseNumber: { contains: search } },
        { landlordName: { contains: search } },
        { landlordEmail: { contains: search } },
        { tenantNumber: { contains: search } },
        { landNumber: { contains: search } },
        { location: { contains: search } },
        { notes: { contains: search } },
      ];
      const searchAsNum = parseInt(search);
      if (!isNaN(searchAsNum)) {
        orConditions.push({ contractNo: searchAsNum });
      }
      where.OR = orConditions;
    }

    if (propertyType) {
      where.propertyType = propertyType;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (leaseStatus) {
      where.leaseStatus = leaseStatus;
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

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Property name is required' }, { status: 400 });
    }
    if (!body.propertyCode) {
      return NextResponse.json({ error: 'Property code is required' }, { status: 400 });
    }
    if (!body.companyId) {
      return NextResponse.json({ error: 'Company is required' }, { status: 400 });
    }

    const property = await db.property.create({
      data: {
        name: body.name,
        propertyCode: body.propertyCode,
        propertyType: body.propertyType || 'INDUSTRIAL',
        description: body.description || null,
        address: body.address || '',
        city: body.city || 'Dubai',
        area: body.area || null,
        plotNumber: body.plotNumber || null,
        totalArea: body.totalArea ? parseFloat(body.totalArea) : null,
        builtUpArea: body.builtUpArea ? parseFloat(body.builtUpArea) : null,
        yearBuilt: body.yearBuilt ? parseInt(body.yearBuilt) : null,
        companyId: body.companyId,
        isActive: body.isActive ?? true,
        // Merged lease fields:
        contractNo: body.contractNo ? parseInt(body.contractNo) : null,
        leaseNumber: body.leaseNumber || null,
        leaseStartDate: body.leaseStartDate ? new Date(body.leaseStartDate) : null,
        leaseEndDate: body.leaseEndDate ? new Date(body.leaseEndDate) : null,
        rentAmount: body.rentAmount ? parseFloat(body.rentAmount) : null,
        rentFrequency: body.rentFrequency || 'annual',
        securityDeposit: body.securityDeposit ? parseFloat(body.securityDeposit) : null,
        incrementPercent: body.incrementPercent ? parseFloat(body.incrementPercent) : null,
        incrementFrequency: body.incrementFrequency ? parseInt(body.incrementFrequency) : null,
        landlordName: body.landlordName || 'DREC Properties',
        landlordContact: body.landlordContact || null,
        landlordEmail: body.landlordEmail || null,
        tenantNumber: body.tenantNumber || null,
        landNumber: body.landNumber || null,
        annualRentPerSqFt: body.annualRentPerSqFt ? parseFloat(body.annualRentPerSqFt) : null,
        location: body.location || null,
        terms: body.terms || null,
        notes: body.notes || null,
        leaseStatus: body.leaseStatus || 'DRAFT',
        renewalStatus: body.renewalStatus || 'NONE',
        renewedFromId: body.renewedFromId || null,
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
    const { id } = body;

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

    // Whitelist only valid Prisma scalar/enum fields — exclude relation objects
    // (company, unitCount, _count) and auto-managed timestamps (createdAt, updatedAt, deletedAt).
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.propertyCode !== undefined) updateData.propertyCode = body.propertyCode;
    if (body.propertyType !== undefined) updateData.propertyType = body.propertyType;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.area !== undefined) updateData.area = body.area;
    if (body.plotNumber !== undefined) updateData.plotNumber = body.plotNumber;
    if (body.totalArea !== undefined) updateData.totalArea = body.totalArea !== null && body.totalArea !== '' ? parseFloat(body.totalArea) : null;
    if (body.builtUpArea !== undefined) updateData.builtUpArea = body.builtUpArea !== null && body.builtUpArea !== '' ? parseFloat(body.builtUpArea) : null;
    if (body.yearBuilt !== undefined) updateData.yearBuilt = body.yearBuilt !== null && body.yearBuilt !== '' ? parseInt(body.yearBuilt) : null;
    if (body.companyId !== undefined) updateData.companyId = body.companyId;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    // Merged lease fields:
    if (body.contractNo !== undefined) updateData.contractNo = body.contractNo !== null && body.contractNo !== '' ? parseInt(body.contractNo) : null;
    if (body.leaseNumber !== undefined) updateData.leaseNumber = body.leaseNumber || null;
    if (body.leaseStartDate !== undefined) updateData.leaseStartDate = body.leaseStartDate ? new Date(body.leaseStartDate) : null;
    if (body.leaseEndDate !== undefined) updateData.leaseEndDate = body.leaseEndDate ? new Date(body.leaseEndDate) : null;
    if (body.rentAmount !== undefined) updateData.rentAmount = body.rentAmount !== null && body.rentAmount !== '' ? parseFloat(body.rentAmount) : null;
    if (body.rentFrequency !== undefined) updateData.rentFrequency = body.rentFrequency || 'annual';
    if (body.securityDeposit !== undefined) updateData.securityDeposit = body.securityDeposit !== null && body.securityDeposit !== '' ? parseFloat(body.securityDeposit) : null;
    if (body.incrementPercent !== undefined) updateData.incrementPercent = body.incrementPercent !== null && body.incrementPercent !== '' ? parseFloat(body.incrementPercent) : null;
    if (body.incrementFrequency !== undefined) updateData.incrementFrequency = body.incrementFrequency !== null && body.incrementFrequency !== '' ? parseInt(body.incrementFrequency) : null;
    if (body.landlordName !== undefined) updateData.landlordName = body.landlordName || 'DREC Properties';
    if (body.landlordContact !== undefined) updateData.landlordContact = body.landlordContact || null;
    if (body.landlordEmail !== undefined) updateData.landlordEmail = body.landlordEmail || null;
    if (body.tenantNumber !== undefined) updateData.tenantNumber = body.tenantNumber || null;
    if (body.landNumber !== undefined) updateData.landNumber = body.landNumber || null;
    if (body.annualRentPerSqFt !== undefined) updateData.annualRentPerSqFt = body.annualRentPerSqFt !== null && body.annualRentPerSqFt !== '' ? parseFloat(body.annualRentPerSqFt) : null;
    if (body.location !== undefined) updateData.location = body.location || null;
    if (body.terms !== undefined) updateData.terms = body.terms || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.leaseStatus !== undefined) updateData.leaseStatus = body.leaseStatus || 'DRAFT';
    if (body.renewalStatus !== undefined) updateData.renewalStatus = body.renewalStatus || 'NONE';
    if (body.renewedFromId !== undefined) updateData.renewedFromId = body.renewedFromId || null;

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
    // The generic API client sends DELETE with id as a query param.
    // Read from URL search params (not body — fetch ignores bodies on DELETE).
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
