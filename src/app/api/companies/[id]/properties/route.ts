import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const properties = await db.property.findMany({
      where: { companyId: id, deletedAt: null },
      include: {
        units: {
          where: { deletedAt: null, isActive: true },
          select: { id: true, status: true, rentAmount: true },
        },
        subleases: {
          where: { deletedAt: null, isActive: true, status: 'ACTIVE' },
          select: { id: true, rentAmount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = properties.map(p => {
      const totalUnits = p.units.length;
      const occupiedUnits = p.units.filter(u => u.status === 'OCCUPIED').length;
      const vacantUnits = p.units.filter(u => u.status === 'VACANT').length;
      const maintenanceUnits = p.units.filter(u => u.status === 'UNDER_MAINTENANCE').length;
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
      
      const totalSubleasesRent = p.subleases.reduce((sum, s) => sum + (s.rentAmount || 0), 0);

      return {
        id: p.id,
        name: p.name,
        propertyCode: p.propertyCode,
        plotNumber: p.plotNumber,
        propertyType: p.propertyType,
        description: p.description,
        address: p.address,
        city: p.city,
        area: p.area,
        totalArea: p.totalArea,
        leaseStartDate: p.leaseStartDate,
        leaseEndDate: p.leaseEndDate,
        leaseStatus: p.leaseStatus,
        rentAmount: p.rentAmount,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        maintenanceUnits,
        occupancyRate,
        totalSubleasesRent,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Company Properties GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
