import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    // Fetch company to get trade license status
    const company = await db.company.findFirst({
      where: { id, deletedAt: null },
      select: {
        tradeLicenseNo: true,
        tradeLicenseExpiry: true,
        registrationNo: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Fetch documents linked to the company
    const documents = await db.document.findMany({
      where: { companyId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch compliance alerts linked directly to this Company, or properties/leases of this company
    const alerts = await db.complianceAlert.findMany({
      where: {
        OR: [
          { entityType: 'Company', entityId: id },
          {
            entityType: 'Property',
            entityId: {
              in: (
                await db.property.findMany({
                  where: { companyId: id, deletedAt: null },
                  select: { id: true },
                })
              ).map((p) => p.id),
            },
          },
        ],
      },
      orderBy: { expiryDate: 'asc' },
    });

    return NextResponse.json({
      licenseInfo: company,
      documents,
      alerts,
    });
  } catch (error) {
    console.error('Company Compliance GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
