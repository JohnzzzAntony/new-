import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const propertyType = searchParams.get('propertyType');
    const dateRange = searchParams.get('dateRange') || '12m'; // '12m', 'ytd', '6m'

    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const propertyFilter: Record<string, any> = {
      deletedAt: null,
      isActive: true,
      ...(companyId ? { companyId } : {}),
      ...(propertyType ? { propertyType: propertyType as any } : {}),
    };

    const unitPropertyFilter = companyId || propertyType ? {
      property: {
        deletedAt: null,
        isActive: true,
        ...(companyId ? { companyId } : {}),
        ...(propertyType ? { propertyType: propertyType as any } : {}),
      }
    } : {};

    // Get matching IDs for compliance alert filtering
    let complianceWhere: Record<string, any> = {
      status: { in: ['WARNING', 'EXPIRED', 'ACTION_REQUIRED'] },
    };

    if (companyId || propertyType) {
      const matchingProperties = await db.property.findMany({
        where: propertyFilter,
        select: { id: true },
      });
      const propertyIds = matchingProperties.map((p) => p.id);

      const matchingSubleases = await db.sublease.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          propertyId: { in: propertyIds },
        },
        select: { id: true },
      });
      const subleaseIds = matchingSubleases.map((s) => s.id);

      const matchingEjaris = await db.ejari.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          subleaseId: { in: subleaseIds },
        },
        select: { id: true },
      });
      const ejariIds = matchingEjaris.map((e) => e.id);

      complianceWhere.OR = [
        { entityType: 'Property', entityId: { in: propertyIds } },
        { entityType: 'Sublease', entityId: { in: subleaseIds } },
        { entityType: 'Ejari', entityId: { in: ejariIds } },
        ...(companyId ? [{ entityType: 'Company', entityId: companyId }] : []),
      ];
    }

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
        where: propertyFilter,
      }),

      // Total units (non-deleted, active)
      db.unit.count({
        where: { deletedAt: null, isActive: true, ...unitPropertyFilter },
      }),

      // Occupied units
      db.unit.count({
        where: { deletedAt: null, isActive: true, status: 'OCCUPIED', ...unitPropertyFilter },
      }),

      // Total rent from active units
      db.unit.aggregate({
        _sum: { rentAmount: true },
        where: { deletedAt: null, isActive: true, rentAmount: { not: null }, ...unitPropertyFilter },
      }),

      // Active leases
      db.property.count({
        where: { ...propertyFilter, leaseStatus: 'ACTIVE' },
      }),

      // Active subleases
      db.sublease.count({
        where: { deletedAt: null, isActive: true, status: 'ACTIVE', ...unitPropertyFilter },
      }),

      // Expiring leases (next 90 days)
      db.property.findMany({
        where: {
          ...propertyFilter,
          leaseStatus: 'ACTIVE',
          leaseEndDate: { lte: ninetyDaysFromNow, gte: now },
        },
        include: {
          company: { select: { name: true } },
        },
        take: 10,
        orderBy: { leaseEndDate: 'asc' },
      }),

      // Expiring EJARI (next 90 days)
      db.ejari.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          status: { in: ['REGISTERED', 'RENEWAL_PENDING'] },
          expiryDate: { lte: ninetyDaysFromNow, gte: now },
          ...(companyId || propertyType ? {
            sublease: {
              deletedAt: null,
              isActive: true,
              property: {
                deletedAt: null,
                isActive: true,
                ...(companyId ? { companyId } : {}),
                ...(propertyType ? { propertyType: propertyType as any } : {})
              }
            }
          } : {})
        },
        include: {
          sublease: {
            select: {
              id: true,
              subleaseNumber: true,
              property: { select: { name: true } },
              unit: { select: { unitNumber: true } },
            }
          },
          subtenant: { select: { name: true, tradeName: true } },
        },
        take: 10,
        orderBy: { expiryDate: 'asc' },
      }),

      // Recent compliance alerts
      db.complianceAlert.findMany({
        where: complianceWhere,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Occupancy by property type
      db.property.findMany({
        where: propertyFilter,
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
        where: { deletedAt: null, isActive: true, ...unitPropertyFilter },
        _count: { status: true },
      }),

      // Revenue from active sublease contract values
      db.sublease.aggregate({
        _sum: { contractValue: true, subLeaseFee: true },
        where: { deletedAt: null, isActive: true, status: 'ACTIVE', ...unitPropertyFilter },
      }),

      // Outstanding - sum of expired sublease contract values
      db.sublease.aggregate({
        _sum: { contractValue: true },
        where: { deletedAt: null, isActive: true, status: 'EXPIRED', ...unitPropertyFilter },
      }),
    ]);

    // Calculate KPI values
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    const totalRevenue = invoicesForRevenue._sum.contractValue || 0;
    const outstandingBalance = outstandingInvoices._sum.contractValue || 0;

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

    // Process date range logic
    let monthsToShow = 12;
    let startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    
    if (dateRange === 'ytd') {
      startDate = new Date(now.getFullYear(), 0, 1);
      monthsToShow = now.getMonth() + 1;
    } else if (dateRange === '6m') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      monthsToShow = 6;
    }

    // Monthly revenue data - from sublease contract values by end date month
    const monthlySubleases = await db.sublease.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        status: 'ACTIVE',
        endDate: { gte: startDate },
        ...unitPropertyFilter,
      },
      select: {
        contractValue: true,
        subLeaseFee: true,
        endDate: true,
      },
    });

    const monthlyRevenueMap = new Map<string, number>();
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenueMap.set(key, 0);
    }

    for (const sub of monthlySubleases) {
      const date = new Date(sub.endDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyRevenueMap.has(key)) {
        monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + (sub.subLeaseFee || 0));
      }
    }

    const monthlyRevenue = Array.from(monthlyRevenueMap.entries()).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue * 100) / 100,
    }));

    // Enrich compliance alerts with details link
    const enrichedAlerts = [];
    for (const alert of recentComplianceAlerts) {
      let linkType = null;
      let linkId = null;
      if (alert.entityType === 'Property') {
        linkType = 'property';
        linkId = alert.entityId;
      } else if (alert.entityType === 'Ejari') {
        const ej = await db.ejari.findUnique({
          where: { id: alert.entityId },
          select: { subleaseId: true },
        });
        if (ej) {
          linkType = 'sublease';
          linkId = ej.subleaseId;
        }
      } else if (alert.entityType === 'Invoice') {
        const inv = await db.invoice.findUnique({
          where: { id: alert.entityId },
          select: { subleaseId: true },
        });
        if (inv) {
          linkType = 'sublease';
          linkId = inv.subleaseId;
        }
      } else if (alert.entityType === 'Company') {
        linkType = 'company';
        linkId = alert.entityId;
      }
      enrichedAlerts.push({
        ...alert,
        linkType,
        linkId,
      });
    }

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

    const formattedExpiringLeases = expiringLeases.map(p => ({
      id: p.id,
      leaseNumber: p.leaseNumber,
      contractNo: p.contractNo,
      startDate: p.leaseStartDate,
      endDate: p.leaseEndDate,
      property: { name: p.name },
      company: p.company,
      status: p.leaseStatus,
    }));

    return NextResponse.json({
      kpis,
      occupancyByPropertyType: occupancyByType,
      monthlyRevenue,
      unitStatusDistribution: unitStatusData,
      recentComplianceAlerts: enrichedAlerts,
      expiringLeases: formattedExpiringLeases,
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

