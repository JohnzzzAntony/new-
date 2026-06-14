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
        { phone: { contains: search } },
        { contactPerson: { contains: search } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [companies, total] = await Promise.all([
      db.company.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          properties: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              propertyCode: true,
              leaseStatus: true,
              subleases: {
                where: { deletedAt: null },
                select: {
                  id: true,
                  status: true,
                  rentAmount: true,
                  rentFrequency: true,
                  contractValue: true,
                  invoices: {
                    where: { deletedAt: null, status: 'OVERDUE' },
                    select: { balanceDue: true }
                  }
                }
              }
            },
          },
        },
      }),
      db.company.count({ where }),
    ]);

    const mappedData = companies.map(company => {
      let totalProperties = company.properties.length;
      let activeLeases = company.properties.filter(p => p.leaseStatus === 'ACTIVE').length;
      let monthlyRevenue = 0;
      let outstandingAmount = 0;
      
      company.properties.forEach(p => {
        p.subleases.forEach(sub => {
          if (sub.status === 'ACTIVE') {
            let freq = (sub.rentFrequency || 'monthly').toLowerCase();
            if (freq === 'monthly') {
              monthlyRevenue += sub.rentAmount;
            } else if (freq === 'quarterly') {
              monthlyRevenue += sub.rentAmount / 3;
            } else if (freq === 'annual' || freq === 'yearly') {
              monthlyRevenue += sub.rentAmount / 12;
            } else {
              monthlyRevenue += sub.contractValue / 12;
            }
          }
          
          sub.invoices.forEach(inv => {
            outstandingAmount += inv.balanceDue;
          });
        });
      });

      // Compliance status determination
      let complianceStatus = 'COMPLIANT';
      const now = new Date();
      if (company.tradeLicenseExpiry) {
        const licenseExpiry = new Date(company.tradeLicenseExpiry);
        const daysLeft = Math.ceil((licenseExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) {
          complianceStatus = 'EXPIRED';
        } else if (daysLeft <= 30) {
          complianceStatus = 'WARNING';
        }
      }

      return {
        ...company,
        totalProperties,
        activeLeases,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        outstandingAmount: Math.round(outstandingAmount * 100) / 100,
        complianceStatus,
      };
    });

    return NextResponse.json({
      data: mappedData,
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
        emiratesId: body.emiratesId,
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

    const data: Record<string, any> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.tradeName !== undefined) data.tradeName = body.tradeName;
    if (body.registrationNo !== undefined) data.registrationNo = body.registrationNo;
    if (body.tradeLicenseNo !== undefined) data.tradeLicenseNo = body.tradeLicenseNo;
    if (body.tradeLicenseExpiry !== undefined) {
      data.tradeLicenseExpiry = body.tradeLicenseExpiry ? new Date(body.tradeLicenseExpiry) : null;
    }
    if (body.emiratesId !== undefined) data.emiratesId = body.emiratesId;
    if (body.address !== undefined) data.address = body.address;
    if (body.city !== undefined) data.city = body.city;
    if (body.country !== undefined) data.country = body.country;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.email !== undefined) data.email = body.email;
    if (body.website !== undefined) data.website = body.website;
    if (body.contactPerson !== undefined) data.contactPerson = body.contactPerson;
    if (body.contactPhone !== undefined) data.contactPhone = body.contactPhone;
    if (body.contactEmail !== undefined) data.contactEmail = body.contactEmail;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.isActive !== undefined) data.isActive = body.isActive;

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
