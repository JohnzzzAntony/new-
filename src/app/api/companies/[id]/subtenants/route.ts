import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    // Fetch subtenants linked to this company or holding subleases on this company's properties
    const subtenants = await db.subtenant.findMany({
      where: {
        OR: [
          { companyId: id },
          { subleases: { some: { property: { companyId: id } } } }
        ],
        deletedAt: null,
      },
      include: {
        subleases: {
          where: { deletedAt: null, isActive: true },
          include: {
            property: { select: { name: true, propertyCode: true } },
            unit: { select: { unitNumber: true } }
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    const data = subtenants.map(sub => {
      const activeLeases = sub.subleases.filter(s => s.status === 'ACTIVE').length;
      const totalRentContribution = sub.subleases.reduce((sum, s) => sum + s.rentAmount, 0);

      return {
        id: sub.id,
        name: sub.name,
        tradeName: sub.tradeName,
        contactPerson: sub.contactPerson,
        phone: sub.phone,
        email: sub.email,
        isActive: sub.isActive,
        activeLeases,
        totalRentContribution,
        leases: sub.subleases.map(s => ({
          id: s.id,
          subleaseNumber: s.subleaseNumber,
          propertyName: s.property.name || s.property.propertyCode,
          unitNumber: s.unit.unitNumber,
          status: s.status,
          endDate: s.endDate
        }))
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Company Subtenants GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
