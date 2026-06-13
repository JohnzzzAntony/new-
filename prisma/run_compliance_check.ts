import { PrismaClient, ComplianceStatus, ComplianceType, NotificationType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Running compliance check...')
  const now = new Date()
  let createdAlertsCount = 0
  let createdNotificationsCount = 0

  async function upsertAlertAndNotify(params: {
    type: ComplianceType
    title: string
    description: string
    entityType: string
    entityId: string
    expiryDate: Date
    status: ComplianceStatus
    notificationType: NotificationType
    notificationMessage: string
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
    } = params

    const existingAlert = await prisma.complianceAlert.findFirst({
      where: { type, entityType, entityId },
    })

    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (existingAlert) {
      await prisma.complianceAlert.update({
        where: { id: existingAlert.id },
        data: { status, daysUntilExpiry, expiryDate, description },
      })
    } else {
      await prisma.complianceAlert.create({
        data: { type, title, description, entityType, entityId, expiryDate, daysUntilExpiry, status },
      })
      createdAlertsCount++
    }

    const existingNotification = await prisma.notification.findFirst({
      where: { type: notificationType, entityType, entityId, isRead: false },
    })

    if (!existingNotification) {
      await prisma.notification.create({
        data: { type: notificationType, title, message: notificationMessage, entityType, entityId },
      })
      createdNotificationsCount++
    }
  }

  // 1. Company License Expiry
  const companies = await prisma.company.findMany({
    where: { deletedAt: null, isActive: true, tradeLicenseExpiry: { not: null } },
  })

  for (const company of companies) {
    const expiry = company.tradeLicenseExpiry!
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

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
      })
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
      })
    }
  }

  // 2. Property Lease Expiry
  const properties = await prisma.property.findMany({
    where: { deletedAt: null, isActive: true, leaseEndDate: { not: null } },
  })

  for (const prop of properties) {
    const expiry = prop.leaseEndDate!
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

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
      })
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
      })
    }
  }

  // 3. EJARI Expiry Check
  const ejaris = await prisma.ejari.findMany({
    where: { deletedAt: null, isActive: true, expiryDate: { not: null } },
  })

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

  // 4. Overdue payments check
  const overdueInvoices = await prisma.invoice.findMany({
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
  })

  for (const inv of overdueInvoices) {
    await prisma.invoice.update({
      where: { id: inv.id },
      data: { status: 'OVERDUE' },
    })

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
    })
  }

  console.log(`Compliance check completed. Created ${createdAlertsCount} alerts and ${createdNotificationsCount} notifications.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
