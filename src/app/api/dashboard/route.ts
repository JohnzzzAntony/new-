import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run all independent queries in parallel
    const [
      totalProperties,
      totalUnits,
      occupiedUnits,
      totalUnitRent,
      activeLeases,
      activeSubleases,
      expiringLeases,
      expiringEjari,
      recentComplianceAlerts,
      occupancyByPropertyType,
      unitStatusDistribution,
      invoicesForRevenue,
      outstandingInvoices,
    ] = await Promise.all([
      // Total properties (non-deleted, active)
      db.property.count({
        where: { deletedAt: null, isActive: true },
      }),

      // Total units (non-deleted, active)
      db.unit.count({
        where: { deletedAt: null, isActive: true },
      }),

      // Occupied units
      db.unit.count({
        where: { deletedAt: null, isActive: true, status: 'OCCUPIED' },
      }),

      // Total rent from active units
      db.unit.aggregate({
        _sum: { rentAmount: true },
        where: { deletedAt: null, isActive: true, rentAmount: { not: null } },
      }),

      // Active leases
      db.mainLease.count({
        where: { deletedAt: null, isActive: true, status: 'ACTIVE' },
      }),

      // Active subleases
      db.sublease.count({
        where: { deletedAt: null, isActive: true, status: 'ACTIVE' },
      }),

      // Expiring leases (next 90 days)
      db.mainLease.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          status: 'ACTIVE',
          endDate: { lte: ninetyDaysFromNow, gte: now },
        },
        include: {
          property: { select: { name: true } },
          company: { select: { name: true } },
        },
        take: 10,
        orderBy: { endDate: 'asc' },
      }),

      // Expiring EJARI (next 90 days)
      db.ejari.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          status: { in: ['REGISTERED', 'RENEWAL_PENDING'] },
          expiryDate: { lte: ninetyDaysFromNow, gte: now },
        },
        include: {
          sublease: { select: { subleaseNumber: true } },
          subtenant: { select: { name: true, tradeName: true } },
        },
        take: 10,
        orderBy: { expiryDate: 'asc' },
      }),

      // Recent compliance alerts
      db.complianceAlert.findMany({
        where: {
          status: { in: ['WARNING', 'EXPIRED', 'ACTION_REQUIRED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Occupancy by property type
      db.property.findMany({
        where: { deletedAt: null, isActive: true },
        select: {
          propertyType: true,
          units: {
            where: { deletedAt: null, isActive: true },
            select: { status: true },
          },
        },
      }),

      // Unit status distribution
      db.unit.groupBy({
        by: ['status'],
        where: { deletedAt: null, isActive: true },
        _count: { status: true },
      }),

      // Invoices for revenue calculation (paid in last 12 months)
      db.invoice.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          status: { in: ['PAID', 'PARTIALLY_PAID'] },
          issueDate: { gte: thirtyDaysAgo },
        },
        select: {
          totalAmount: true,
          amountPaid: true,
          balanceDue: true,
          issueDate: true,
        },
      }),

      // Outstanding invoices
      db.invoice.aggregate({
        _sum: { balanceDue: true },
        where: {
          deletedAt: null,
          isActive: true,
          status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
      }),
    ]);

    // Calculate KPI values
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    const totalRevenue = invoicesForRevenue.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const outstandingBalance = outstandingInvoices._sum.balanceDue || 0;

    // Process occupancy by property type
    const occupancyByTypeMap = new Map<string, { total: number; occupied: number }>();
    for (const prop of occupancyByPropertyType) {
      const type = prop.propertyType;
      const current = occupancyByTypeMap.get(type) || { total: 0, occupied: 0 };
      current.total += prop.units.length;
      current.occupied += prop.units.filter((u) => u.status === 'OCCUPIED').length;
      occupancyByTypeMap.set(type, current);
    }

    const occupancyByType = Array.from(occupancyByTypeMap.entries()).map(([type, counts]) => ({
      propertyType: type,
      totalUnits: counts.total,
      occupiedUnits: counts.occupied,
      occupancyRate: counts.total > 0 ? Math.round((counts.occupied / counts.total) * 100) : 0,
    }));

    // Process unit status distribution for pie chart
    const unitStatusData = unitStatusDistribution.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    // Monthly revenue data (last 12 months)
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthlyInvoices = await db.invoice.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        status: { in: ['PAID', 'PARTIALLY_PAID'] },
        issueDate: { gte: twelveMonthsAgo },
      },
      select: {
        amountPaid: true,
        issueDate: true,
      },
    });

    const monthlyRevenueMap = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenueMap.set(key, 0);
    }

    for (const inv of monthlyInvoices) {
      const date = new Date(inv.issueDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyRevenueMap.has(key)) {
        monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + (inv.amountPaid || 0));
      }
    }

    const monthlyRevenue = Array.from(monthlyRevenueMap.entries()).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue * 100) / 100,
    }));

    // Build KPI cards
    const kpis = {
      totalProperties,
      totalUnits,
      occupancyRate,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      outstandingBalance: Math.round(outstandingBalance * 100) / 100,
      activeLeases,
      activeSubleases,
      expiringLeasesCount: expiringLeases.length,
    };

    return NextResponse.json({
      kpis,
      occupancyByPropertyType: occupancyByType,
      monthlyRevenue,
      unitStatusDistribution: unitStatusData,
      recentComplianceAlerts,
      expiringLeases,
      expiringEjari,
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
