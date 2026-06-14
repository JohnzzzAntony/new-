import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    // Fetch main leases (properties owned/leased by the company)
    const mainLeases = await db.property.findMany({
      where: { companyId: id, deletedAt: null },
      select: {
        id: true,
        name: true,
        propertyCode: true,
        contractNo: true,
        leaseNumber: true,
        leaseStartDate: true,
        leaseEndDate: true,
        rentAmount: true,
        rentFrequency: true,
        leaseStatus: true,
        landlordName: true,
        location: true,
        landNumber: true,
      },
      orderBy: { leaseEndDate: 'asc' },
    });

    // Fetch subleases linked to properties of this company
    const subleases = await db.sublease.findMany({
      where: {
        property: { companyId: id },
        deletedAt: null,
      },
      include: {
        subtenant: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            propertyCode: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    return NextResponse.json({
      mainLeases,
      subleases,
    });
  } catch (error) {
    console.error('Company Leases GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
