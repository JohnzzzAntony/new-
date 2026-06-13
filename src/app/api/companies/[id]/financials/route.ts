import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    // Fetch invoices for subleases linked to the company's properties
    const invoices = await db.invoice.findMany({
      where: {
        sublease: { property: { companyId: id } },
        deletedAt: null,
      },
      include: {
        sublease: {
          select: {
            subleaseNumber: true,
            subtenant: { select: { name: true } },
            property: { select: { name: true, propertyCode: true } },
            unit: { select: { unitNumber: true } },
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    });

    // Aggregates for totals
    const financialsAgg = await db.invoice.aggregate({
      _sum: { totalAmount: true, amountPaid: true, balanceDue: true },
      where: {
        sublease: { property: { companyId: id } },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
        deletedAt: null,
      },
    });

    // Chart data 1: Monthly revenue trends over the last 12 months (based on issueDate)
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const invoicesForTrends = await db.invoice.findMany({
      where: {
        sublease: { property: { companyId: id } },
        status: { in: ['ISSUED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE'] },
        issueDate: { gte: twelveMonthsAgo },
        deletedAt: null,
      },
      select: {
        totalAmount: true,
        issueDate: true,
      },
    });

    // Initialize 12 months map
    const monthlyMap = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      monthlyMap.set(key, 0);
    }

    // Populate trend
    invoicesForTrends.forEach(inv => {
      const date = new Date(inv.issueDate);
      const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + inv.totalAmount);
      }
    });

    const revenueTrends = Array.from(monthlyMap.entries()).map(([month, amount]) => ({
      month,
      amount: Math.round(amount * 100) / 100,
    }));

    // Chart data 2: Revenue contribution by property
    const propertyAggregates = await db.property.findMany({
      where: { companyId: id, deletedAt: null },
      select: {
        name: true,
        propertyCode: true,
        subleases: {
          where: { deletedAt: null, isActive: true, status: 'ACTIVE' },
          select: { rentAmount: true, rentFrequency: true, contractValue: true },
        },
      },
    });

    const revenueByProperty = propertyAggregates.map(prop => {
      let annualRent = 0;
      prop.subleases.forEach(sub => {
        let freq = (sub.rentFrequency || 'monthly').toLowerCase();
        if (freq === 'monthly') {
          annualRent += sub.rentAmount * 12;
        } else if (freq === 'quarterly') {
          annualRent += sub.rentAmount * 4;
        } else if (freq === 'annual' || freq === 'yearly') {
          annualRent += sub.rentAmount;
        } else {
          annualRent += sub.contractValue;
        }
      });

      return {
        name: prop.name || prop.propertyCode,
        code: prop.propertyCode,
        value: Math.round(annualRent * 100) / 100,
      };
    }).filter(p => p.value > 0);

    return NextResponse.json({
      summary: {
        totalInvoiced: financialsAgg._sum.totalAmount || 0,
        totalCollected: financialsAgg._sum.amountPaid || 0,
        outstanding: financialsAgg._sum.balanceDue || 0,
      },
      invoices,
      revenueTrends,
      revenueByProperty,
    });
  } catch (error) {
    console.error('Company Financials GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
