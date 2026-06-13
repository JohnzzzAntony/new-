import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ComplianceStatus, ComplianceType, NotificationType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let createdAlertsCount = 0;
    let createdNotificationsCount = 0;

    // Helper to create or update compliance alert & notification
    async function upsertAlertAndNotify(params: {
      type: ComplianceType;
      title: string;
      description: string;
      entityType: string;
      entityId: string;
      expiryDate: Date;
      status: ComplianceStatus;
      notificationType: NotificationType;
      notificationMessage: string;
    }) {
      const {
        type,
        title,
        description,
        entityType,
        entityId,
        expiryDate,
        status,
        notificationType,
        notificationMessage,
      } = params;

      // Check if alert already exists for this entity and type
      const existingAlert = await db.complianceAlert.findFirst({
        where: {
          type,
          entityType,
          entityId,
        },
      });

      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (existingAlert) {
        // Update existing alert status
        await db.complianceAlert.update({
          where: { id: existingAlert.id },
          data: {
            status,
            daysUntilExpiry,
            expiryDate,
            description,
          },
        });
      } else {
        // Create new alert
        await db.complianceAlert.create({
          data: {
            type,
            title,
            description,
            entityType,
            entityId,
            expiryDate,
            daysUntilExpiry,
            status,
          },
        });
        createdAlertsCount++;
      }

      // Check if notification already exists to prevent duplication
      const existingNotification = await db.notification.findFirst({
        where: {
          type: notificationType,
          entityType,
          entityId,
          isRead: false,
        },
      });

      if (!existingNotification) {
        await db.notification.create({
          data: {
            type: notificationType,
            title,
            message: notificationMessage,
            entityType,
            entityId,
          },
        });
        createdNotificationsCount++;
      }
    }

    // ----------------------------------------------------
    // 1. Company Trade License Checks
    // ----------------------------------------------------
    const companies = await db.company.findMany({
      where: { deletedAt: null, isActive: true, tradeLicenseExpiry: { not: null } },
    });

    for (const company of companies) {
      const expiry = company.tradeLicenseExpiry!;
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        await upsertAlertAndNotify({
          type: ComplianceType.TRADE_LICENSE_EXPIRY,
          title: `Trade License Expired: ${company.name}`,
          description: `Trade license No: ${company.tradeLicenseNo || 'N/A'} expired on ${expiry.toLocaleDateString()}`,
          entityType: 'Company',
          entityId: company.id,
          expiryDate: expiry,
          status: ComplianceStatus.EXPIRED,
          notificationType: NotificationType.TRADE_LICENSE_EXPIRY,
          notificationMessage: `The trade license for ${company.name} has expired on ${expiry.toLocaleDateString()}. Please request a renewed copy.`,
        });
      } else if (daysLeft <= 30) {
        await upsertAlertAndNotify({
          type: ComplianceType.TRADE_LICENSE_EXPIRY,
          title: `Trade License Expiry Imminent: ${company.name}`,
          description: `Trade license No: ${company.tradeLicenseNo || 'N/A'} expires in ${daysLeft} days on ${expiry.toLocaleDateString()}`,
          entityType: 'Company',
          entityId: company.id,
          expiryDate: expiry,
          status: ComplianceStatus.WARNING,
          notificationType: NotificationType.TRADE_LICENSE_EXPIRY,
          notificationMessage: `The trade license for ${company.name} will expire in ${daysLeft} days. Action is required.`,
        });
      }
    }

    // ----------------------------------------------------
    // 2. Property Lease Expiry Checks
    // ----------------------------------------------------
    const properties = await db.property.findMany({
      where: { deletedAt: null, isActive: true, leaseEndDate: { not: null } },
    });

    for (const prop of properties) {
      const expiry = prop.leaseEndDate!;
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        await upsertAlertAndNotify({
          type: ComplianceType.LEASE_EXPIRY,
          title: `Property Lease Expired: ${prop.propertyCode}`,
          description: `Lease for ${prop.name} expired on ${expiry.toLocaleDateString()}`,
          entityType: 'Property',
          entityId: prop.id,
          expiryDate: expiry,
          status: ComplianceStatus.EXPIRED,
          notificationType: NotificationType.LEASE_EXPIRY,
          notificationMessage: `DREC Main Lease for property ${prop.propertyCode} (${prop.name}) expired on ${expiry.toLocaleDateString()}.`,
        });
      } else if (daysLeft <= 30) {
        await upsertAlertAndNotify({
          type: ComplianceType.LEASE_EXPIRY,
          title: `Property Lease Expiry: ${prop.propertyCode}`,
          description: `Lease for ${prop.name} expires in ${daysLeft} days`,
          entityType: 'Property',
          entityId: prop.id,
          expiryDate: expiry,
          status: ComplianceStatus.WARNING,
          notificationType: NotificationType.LEASE_EXPIRY,
          notificationMessage: `DREC Main Lease for property ${prop.propertyCode} expires in ${daysLeft} days. Renewal required.`,
        });
      }
    }

    // ----------------------------------------------------
    // 3. EJARI Expiry Checks
    // ----------------------------------------------------
    const ejaris = await db.ejari.findMany({
      where: { deletedAt: null, isActive: true, expiryDate: { not: null } },
    });

    for (const ejari of ejaris) {
      const expiry = ejari.expiryDate!;
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        await upsertAlertAndNotify({
          type: ComplianceType.EJARI_EXPIRY,
          title: `EJARI Registration Expired: ${ejari.ejariNumber || 'N/A'}`,
          description: `EJARI registration expired on ${expiry.toLocaleDateString()}`,
          entityType: 'Ejari',
          entityId: ejari.id,
          expiryDate: expiry,
          status: ComplianceStatus.EXPIRED,
          notificationType: NotificationType.EJARI_EXPIRY,
          notificationMessage: `EJARI number ${ejari.ejariNumber || 'N/A'} has expired on ${expiry.toLocaleDateString()}.`,
        });
      } else if (daysLeft <= 30) {
        await upsertAlertAndNotify({
          type: ComplianceType.EJARI_EXPIRY,
          title: `EJARI Expiration Pending: ${ejari.ejariNumber || 'N/A'}`,
          description: `EJARI number expires in ${daysLeft} days`,
          entityType: 'Ejari',
          entityId: ejari.id,
          expiryDate: expiry,
          status: ComplianceStatus.WARNING,
          notificationType: NotificationType.EJARI_EXPIRY,
          notificationMessage: `EJARI number ${ejari.ejariNumber || 'N/A'} expires in ${daysLeft} days. Renewal required.`,
        });
      }
    }

    // ----------------------------------------------------
    // 4. Overdue Invoices check
    // ----------------------------------------------------
    const overdueInvoices = await db.invoice.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        dueDate: { lt: now },
        status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
        balanceDue: { gt: 0 },
      },
      include: {
        sublease: {
          select: {
            subtenant: { select: { name: true } },
            subleaseNumber: true,
          },
        },
      },
    });

    for (const inv of overdueInvoices) {
      // Transition invoice status to OVERDUE
      await db.invoice.update({
        where: { id: inv.id },
        data: { status: 'OVERDUE' },
      });

      await upsertAlertAndNotify({
        type: ComplianceType.OTHER,
        title: `Overdue Invoice: ${inv.invoiceNumber}`,
        description: `Rent payment of AED ${inv.balanceDue} overdue from ${inv.sublease?.subtenant?.name || 'Subtenant'}`,
        entityType: 'Invoice',
        entityId: inv.id,
        expiryDate: inv.dueDate,
        status: ComplianceStatus.ACTION_REQUIRED,
        notificationType: NotificationType.RENT_OVERDUE,
        notificationMessage: `Invoice ${inv.invoiceNumber} for Sublease ${inv.sublease?.subleaseNumber || 'N/A'} is overdue by AED ${inv.balanceDue}.`,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Compliance check ran successfully',
      createdAlertsCount,
      createdNotificationsCount,
    });
  } catch (error) {
    console.error('Compliance check GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
