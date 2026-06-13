import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const company = await db.company.findFirst({
      where: { id, deletedAt: null },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Run parallel DB queries for metrics
    const [
      properties,
      activeLeases,
      expiredLeases,
      totalTenants,
      subleaseRevenue,
      subleaseOutstanding,
      financialsAgg,
      totalAssetsCount,
      totalAssetsValue,
      activeEjari,
      expiringDocsCount,
      complianceAlerts,
    ] = await Promise.all([
      // Properties and their unit statuses
      db.property.findMany({
        where: { companyId: id, deletedAt: null },
        select: {
          id: true,
          units: {
            where: { deletedAt: null, isActive: true },
            select: { status: true },
          },
        },
      }),

      // Active main leases (Properties where leaseStatus is ACTIVE)
      db.property.count({
        where: { companyId: id, leaseStatus: 'ACTIVE', deletedAt: null },
      }),

      // Expired main leases (Properties where leaseStatus is EXPIRED)
      db.property.count({
        where: { companyId: id, leaseStatus: 'EXPIRED', deletedAt: null },
      }),

      // Total subtenants sponsored by or linked to the company
      db.subtenant.count({
        where: { companyId: id, deletedAt: null },
      }),

      // Sum of active subleases for rentAmount calculation
      db.sublease.findMany({
        where: {
          property: { companyId: id },
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          rentAmount: true,
          rentFrequency: true,
          contractValue: true,
        },
      }),

      // Sum of outstanding amount from overdue invoices
      db.invoice.aggregate({
        _sum: { balanceDue: true },
        where: {
          sublease: { property: { companyId: id } },
          status: 'OVERDUE',
          deletedAt: null,
        },
      }),

      // Paid vs Invoiced totals for collection rate
      db.invoice.aggregate({
        _sum: { totalAmount: true, amountPaid: true },
        where: {
          sublease: { property: { companyId: id } },
          status: { notIn: ['DRAFT', 'CANCELLED'] },
          deletedAt: null,
        },
      }),

      // Assets Count
      db.asset.count({
        where: { companyId: id, deletedAt: null },
      }),

      // Assets Value
      db.asset.aggregate({
        _sum: { value: true },
        where: { companyId: id, deletedAt: null },
      }),

      // Active Ejari Registrations
      db.ejari.count({
        where: {
          sublease: { property: { companyId: id } },
          status: 'REGISTERED',
          deletedAt: null,
        },
      }),

      // Expiring Documents (within 30 days) from Company Documents
      db.document.count({
        where: {
          companyId: id,
          isActive: true,
          deletedAt: null,
          // Let's assume document expiry is handled via compliance alerts or notifications.
          // To be safe, we can query active warnings/expires in ComplianceAlerts.
        },
      }),

      // Active Compliance alerts for score calculation
      db.complianceAlert.findMany({
        where: {
          entityType: 'Company',
          entityId: id,
        },
        select: {
          status: true,
          expiryDate: true,
        },
      }),
    ]);

    // Calculate occupied vs vacant properties
    let totalProperties = properties.length;
    let occupiedProperties = 0;
    let vacantProperties = 0;

    properties.forEach((p) => {
      if (p.units.length === 0) {
        vacantProperties++;
      } else {
        const hasOccupied = p.units.some((u) => u.status === 'OCCUPIED');
        const allVacant = p.units.every((u) => u.status === 'VACANT');
        if (hasOccupied) occupiedProperties++;
        if (allVacant) vacantProperties++;
      }
    });

    // Calculate dynamic revenues
    let monthlyRevenue = 0;
    let annualRevenue = 0;

    subleaseRevenue.forEach((sub) => {
      let freq = (sub.rentFrequency || 'monthly').toLowerCase();
      let annualVal = 0;
      if (freq === 'monthly') {
        annualVal = sub.rentAmount * 12;
        monthlyRevenue += sub.rentAmount;
      } else if (freq === 'quarterly') {
        annualVal = sub.rentAmount * 4;
        monthlyRevenue += sub.rentAmount / 3;
      } else if (freq === 'annual' || freq === 'yearly') {
        annualVal = sub.rentAmount;
        monthlyRevenue += sub.rentAmount / 12;
      } else {
        annualVal = sub.contractValue;
        monthlyRevenue += sub.contractValue / 12;
      }
      annualRevenue += annualVal;
    });

    // Outstanding Payments
    const outstandingPayments = subleaseOutstanding._sum.balanceDue || 0;

    // Collection Rate (%)
    const totalInvoiced = financialsAgg._sum.totalAmount || 0;
    const totalCollected = financialsAgg._sum.amountPaid || 0;
    const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 100;

    // Compliance score calculation
    // Base compliance is 100%. Each Warning subtracts 5%, Action Required subtracts 10%, Expired subtracts 15%. Minimum is 0%.
    let score = 100;
    let expiredDocs = 0;

    complianceAlerts.forEach((alert) => {
      if (alert.status === 'WARNING') score -= 5;
      else if (alert.status === 'ACTION_REQUIRED') score -= 10;
      else if (alert.status === 'EXPIRED') {
        score -= 15;
        expiredDocs++;
      }
    });

    // Also check company trade license expiry
    if (company.tradeLicenseExpiry) {
      const daysLeft = Math.ceil((company.tradeLicenseExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) {
        score -= 20;
        expiredDocs++;
      } else if (daysLeft <= 30) {
        score -= 10;
      }
    }

    const complianceScore = Math.max(0, Math.min(100, score));

    // Compile KPI Dashboard cards response
    return NextResponse.json({
      company,
      kpis: {
        totalProperties,
        occupiedProperties,
        vacantProperties,
        activeLeases,
        expiredLeases,
        totalTenants,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        annualRevenue: Math.round(annualRevenue * 100) / 100,
        outstandingPayments: Math.round(outstandingPayments * 100) / 100,
        collectionRate,
        totalAssets: totalAssetsCount,
        assetValue: totalAssetsValue._sum.value || 0,
        activeEjari,
        expiringDocuments: expiredDocs + expiringDocsCount, // Combine count from docs and expired/warning alerts
        complianceScore,
      },
    });
  } catch (error) {
    console.error('Company Dashboard GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
