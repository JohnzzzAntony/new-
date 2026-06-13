import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function toCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(',');
  const dataLines = rows.map((row) =>
    row.map((cell) => {
      // Escape cells that contain commas, quotes, or newlines
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'occupancy';
    const format = searchParams.get('format') || 'json';

    let data: Record<string, unknown> = {};
    let csvHeaders: string[] = [];
    let csvRows: string[][] = [];

    switch (reportType) {
      case 'occupancy': {
        const properties = await db.property.findMany({
          where: { deletedAt: null, isActive: true },
          include: {
            _count: {
              select: {
                units: { where: { deletedAt: null, isActive: true } },
              },
            },
            units: {
              where: { deletedAt: null, isActive: true },
              select: { status: true },
            },
          },
        });

        const reportData = properties.map((p) => {
          const totalUnits = p._count.units;
          const occupiedUnits = p.units.filter((u) => u.status === 'OCCUPIED').length;
          return {
            propertyId: p.id,
            propertyName: p.name,
            propertyCode: p.propertyCode,
            propertyType: p.propertyType,
            city: p.city,
            area: p.area,
            totalUnits,
            occupiedUnits,
            vacantUnits: totalUnits - occupiedUnits,
            occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
          };
        });

        data = { reportType: 'occupancy', generatedAt: new Date().toISOString(), data: reportData };
        csvHeaders = ['Property Name', 'Property Code', 'Type', 'City', 'Area', 'Total Units', 'Occupied', 'Vacant', 'Occupancy Rate %'];
        csvRows = reportData.map((r) => [
          r.propertyName, r.propertyCode, r.propertyType, r.city, r.area || '',
          String(r.totalUnits), String(r.occupiedUnits), String(r.vacantUnits), String(r.occupancyRate),
        ]);
        break;
      }

      case 'revenue': {
        const startDate = searchParams.get('startDate')
          ? new Date(searchParams.get('startDate')!)
          : new Date(new Date().getFullYear(), 0, 1);
        const endDate = searchParams.get('endDate')
          ? new Date(searchParams.get('endDate')!)
          : new Date();

        const invoices = await db.invoice.findMany({
          where: {
            deletedAt: null,
            isActive: true,
            issueDate: { gte: startDate, lte: endDate },
          },
          include: {
            sublease: {
              select: { subleaseNumber: true, subtenant: { select: { name: true } } },
            },
          },
          orderBy: { issueDate: 'desc' },
        });

        const reportData = invoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          issueDate: inv.issueDate.toISOString().split('T')[0],
          dueDate: inv.dueDate.toISOString().split('T')[0],
          subleaseNumber: inv.sublease.subleaseNumber,
          subtenantName: inv.sublease.subtenant.name,
          rentAmount: inv.rentAmount,
          otherCharges: inv.otherCharges,
          vatAmount: inv.vatAmount,
          totalAmount: inv.totalAmount,
          amountPaid: inv.amountPaid,
          balanceDue: inv.balanceDue,
          status: inv.status,
        }));

        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
        const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
        const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

        data = {
          reportType: 'revenue',
          generatedAt: new Date().toISOString(),
          period: { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] },
          summary: { totalInvoiced, totalRevenue, totalOutstanding, invoiceCount: invoices.length },
          data: reportData,
        };
        csvHeaders = ['Invoice #', 'Issue Date', 'Due Date', 'Sublease #', 'Subtenant', 'Total Amount', 'Amount Paid', 'Balance Due', 'Status'];
        csvRows = reportData.map((r) => [
          r.invoiceNumber, r.issueDate, r.dueDate, r.subleaseNumber, r.subtenantName,
          String(r.totalAmount), String(r.amountPaid), String(r.balanceDue), r.status,
        ]);
        break;
      }

      case 'leases': {
        const leases = await db.property.findMany({
          where: { deletedAt: null, leaseNumber: { not: null } },
          include: {
            company: { select: { name: true } },
            _count: { select: { subleases: { where: { deletedAt: null } } } },
          },
          orderBy: { createdAt: 'desc' },
        });

        const reportData = leases.map((l) => ({
          leaseNumber: l.leaseNumber,
          propertyName: l.name,
          propertyCode: l.propertyCode,
          companyName: l.company.name,
          landlordName: l.landlordName,
          startDate: l.leaseStartDate ? l.leaseStartDate.toISOString().split('T')[0] : 'N/A',
          endDate: l.leaseEndDate ? l.leaseEndDate.toISOString().split('T')[0] : 'N/A',
          rentAmount: l.rentAmount,
          rentFrequency: l.rentFrequency,
          status: l.leaseStatus,
          renewalStatus: l.renewalStatus,
          subleaseCount: l._count.subleases,
          isActive: l.isActive,
        }));

        data = { reportType: 'leases', generatedAt: new Date().toISOString(), data: reportData };
        csvHeaders = ['Lease #', 'Property', 'Company', 'Landlord', 'Start Date', 'End Date', 'Rent Amount', 'Frequency', 'Status', 'Renewal Status', 'Subleases', 'Active'];
        csvRows = reportData.map((r) => [
          r.leaseNumber || '', r.propertyName, r.companyName, r.landlordName || '',
          r.startDate, r.endDate, String(r.rentAmount || 0), r.rentFrequency || '',
          r.status || '', r.renewalStatus || '', String(r.subleaseCount), String(r.isActive),
        ]);
        break;
      }

      case 'ejari': {
        const ejariRecords = await db.ejari.findMany({
          where: { deletedAt: null },
          include: {
            sublease: { select: { subleaseNumber: true } },
            subtenant: { select: { name: true, tradeName: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        const reportData = ejariRecords.map((e) => ({
          ejariNumber: e.ejariNumber || 'N/A',
          subleaseNumber: e.sublease.subleaseNumber,
          subtenantName: e.subtenant.name,
          subtenantTradeName: e.subtenant.tradeName || '',
          registrationDate: e.registrationDate ? e.registrationDate.toISOString().split('T')[0] : 'N/A',
          expiryDate: e.expiryDate ? e.expiryDate.toISOString().split('T')[0] : 'N/A',
          status: e.status,
          isActive: e.isActive,
        }));

        data = { reportType: 'ejari', generatedAt: new Date().toISOString(), data: reportData };
        csvHeaders = ['EJARI #', 'Sublease #', 'Subtenant', 'Trade Name', 'Registration Date', 'Expiry Date', 'Status', 'Active'];
        csvRows = reportData.map((r) => [
          r.ejariNumber, r.subleaseNumber, r.subtenantName, r.subtenantTradeName,
          r.registrationDate, r.expiryDate, r.status, String(r.isActive),
        ]);
        break;
      }

      case 'compliance': {
        const alerts = await db.complianceAlert.findMany({
          orderBy: { createdAt: 'desc' },
        });

        const reportData = alerts.map((a) => ({
          title: a.title,
          type: a.type,
          entityType: a.entityType,
          entityId: a.entityId,
          expiryDate: a.expiryDate.toISOString().split('T')[0],
          daysUntilExpiry: a.daysUntilExpiry,
          status: a.status,
          isNotified: a.isNotified,
          resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString().split('T')[0] : 'N/A',
        }));

        const summary = {
          total: alerts.length,
          compliant: alerts.filter((a) => a.status === 'COMPLIANT').length,
          warning: alerts.filter((a) => a.status === 'WARNING').length,
          expired: alerts.filter((a) => a.status === 'EXPIRED').length,
          actionRequired: alerts.filter((a) => a.status === 'ACTION_REQUIRED').length,
        };

        data = { reportType: 'compliance', generatedAt: new Date().toISOString(), summary, data: reportData };
        csvHeaders = ['Title', 'Type', 'Entity Type', 'Expiry Date', 'Days Until Expiry', 'Status', 'Notified', 'Resolved At'];
        csvRows = reportData.map((r) => [
          r.title, r.type, r.entityType, r.expiryDate,
          String(r.daysUntilExpiry ?? ''), r.status, String(r.isNotified), r.resolvedAt,
        ]);
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid report type. Use: occupancy, revenue, leases, ejari, compliance' },
          { status: 400 }
        );
    }

    if (format === 'csv') {
      const csvContent = toCSV(csvHeaders, csvRows);
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}-report.csv"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Reports GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
