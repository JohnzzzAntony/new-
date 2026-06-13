import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'xlsx';

    const company = await db.company.findFirst({
      where: { id, deletedAt: null },
      include: {
        properties: {
          where: { deletedAt: null },
          include: {
            units: { where: { deletedAt: null, isActive: true } },
            subleases: { where: { deletedAt: null, isActive: true } },
          },
        },
        assets: { where: { deletedAt: null } },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

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
          },
        },
      },
    });

    // ----------------------------------------------------
    // EXCEL / CSV EXPORT FORMAT
    // ----------------------------------------------------
    if (format === 'xlsx' || format === 'csv') {
      let csvContent = '';

      // Helper to append a row
      const appendRow = (cells: string[]) => {
        const escaped = cells.map((c) => {
          const s = String(c ?? '').replace(/"/g, '""');
          return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
        });
        csvContent += escaped.join(',') + '\r\n';
      };

      // 1. Company Information
      appendRow(['COMPANY PROFILE REPORT']);
      appendRow(['Company Name', company.name]);
      appendRow(['Trade Name', company.tradeName || 'N/A']);
      appendRow(['Registration No', company.registrationNo || 'N/A']);
      appendRow(['Trade License No', company.tradeLicenseNo || 'N/A']);
      appendRow(['License Expiry', company.tradeLicenseExpiry ? company.tradeLicenseExpiry.toLocaleDateString() : 'N/A']);
      appendRow(['Contact Person', company.contactPerson || 'N/A']);
      appendRow(['Email', company.email || 'N/A']);
      appendRow(['Phone', company.phone || 'N/A']);
      appendRow([]);

      // 2. Properties Summary
      appendRow(['PROPERTIES REGISTRY']);
      appendRow(['Property Code', 'Property Name', 'Type', 'Total Units', 'Occupied Units', 'Rent Amount']);
      company.properties.forEach((p) => {
        const totalUnits = p.units.length;
        const occupied = p.units.filter((u) => u.status === 'OCCUPIED').length;
        appendRow([
          p.propertyCode,
          p.name,
          p.propertyType,
          String(totalUnits),
          String(occupied),
          String(p.rentAmount || 0),
        ]);
      });
      appendRow([]);

      // 3. Subleases / Tenants
      appendRow(['ACTIVE SUBLEASES']);
      appendRow(['Sublease No', 'Subtenant Name', 'Start Date', 'End Date', 'Rent Amount', 'Status']);
      company.properties.forEach((p) => {
        p.subleases.forEach((sub) => {
          appendRow([
            sub.subleaseNumber,
            sub.id, // linked subtenant name would go here
            sub.startDate.toLocaleDateString(),
            sub.endDate.toLocaleDateString(),
            String(sub.rentAmount),
            sub.status,
          ]);
        });
      });
      appendRow([]);

      // 4. Financial Invoices Ledger
      appendRow(['FINANCIAL INVOICES LEDGER']);
      appendRow(['Invoice No', 'Sublease No', 'Due Date', 'Total Amount', 'Paid Amount', 'Balance Due', 'Status']);
      invoices.forEach((inv) => {
        appendRow([
          inv.invoiceNumber,
          inv.sublease?.subleaseNumber || 'N/A',
          inv.dueDate.toLocaleDateString(),
          String(inv.totalAmount),
          String(inv.amountPaid),
          String(inv.balanceDue),
          inv.status,
        ]);
      });
      appendRow([]);

      // 5. Assets Registry
      appendRow(['PHYSICAL ASSETS REGISTRY']);
      appendRow(['Asset Code', 'Asset Name', 'Category', 'Valuation (AED)', 'Purchase Date', 'Status']);
      company.assets.forEach((asset) => {
        appendRow([
          asset.assetCode,
          asset.name,
          asset.category,
          String(asset.value),
          asset.purchaseDate.toLocaleDateString(),
          asset.status,
        ]);
      });

      const filename = `${company.name.replace(/\s+/g, '_')}_Report.csv`;
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // ----------------------------------------------------
    // PDF / HTML PRINTABLE EXPORT FORMAT
    // ----------------------------------------------------
    if (format === 'pdf') {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${company.name} - Executive Brief</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; line-height: 1.6; }
            h1 { color: #065f46; font-size: 24px; border-bottom: 2px solid #065f46; padding-bottom: 8px; margin-bottom: 20px; }
            h2 { color: #1e3a8a; font-size: 16px; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
            th { bg-color: #f9fafb; font-weight: 600; color: #4b5563; }
            .kpi-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; }
            .kpi-card { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; background-color: #f9fafb; }
            .kpi-val { font-size: 18px; font-weight: bold; color: #065f46; margin-top: 4px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
            .badge-active { background-color: #d1fae5; color: #065f46; }
            .print-btn { background-color: #059669; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-bottom: 20px; }
            @media print {
              .print-btn { display: none; }
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">Print or Save as PDF</button>
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1 style="margin: 0; border: none; padding: 0;">${company.name}</h1>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">
                Trade Name: ${company.tradeName || 'N/A'} | Registration No: ${company.registrationNo || 'N/A'}
              </p>
            </div>
            <span class="badge badge-active">ACTIVE CORPORATE SPONSOR</span>
          </div>

          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

          <div class="kpi-container">
            <div class="kpi-card">
              <div style="font-size: 11px; text-transform: uppercase; color: #6b7280;">Properties Registry</div>
              <div class="kpi-val">${company.properties.length} Active Properties</div>
            </div>
            <div class="kpi-card">
              <div style="font-size: 11px; text-transform: uppercase; color: #6b7280;">Physical Assets Value</div>
              <div class="kpi-val">AED ${company.assets.reduce((sum, a) => sum + a.value, 0).toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div style="font-size: 11px; text-transform: uppercase; color: #6b7280;">License Expiry</div>
              <div class="kpi-val">${company.tradeLicenseExpiry ? company.tradeLicenseExpiry.toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>

          <h2>Properties Registry</h2>
          <table>
            <thead>
              <tr>
                <th>Property Code</th>
                <th>Property Name</th>
                <th>Type</th>
                <th>Total Units</th>
                <th>Main Rent (AED)</th>
              </tr>
            </thead>
            <tbody>
              ${company.properties
                .map(
                  (p) => `
                <tr>
                  <td><strong>${p.propertyCode}</strong></td>
                  <td>${p.name}</td>
                  <td>${p.propertyType}</td>
                  <td>${p.units.length} Units</td>
                  <td>${(p.rentAmount || 0).toLocaleString()}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <h2>Physical Assets</h2>
          <table>
            <thead>
              <tr>
                <th>Asset Code</th>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Purchase Date</th>
                <th>Value (AED)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${company.assets
                .map(
                  (a) => `
                <tr>
                  <td>${a.assetCode}</td>
                  <td>${a.name}</td>
                  <td>${a.category}</td>
                  <td>${a.purchaseDate.toLocaleDateString()}</td>
                  <td>${a.value.toLocaleString()}</td>
                  <td>${a.status}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af;">
            Generated automatically by DREC Properties portal on ${new Date().toLocaleDateString()}.
          </div>
        </body>
        </html>
      `;

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 });
  } catch (error) {
    console.error('Company export GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
