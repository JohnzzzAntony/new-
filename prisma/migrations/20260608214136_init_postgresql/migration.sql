-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'PROPERTY_MANAGER', 'FINANCE_USER', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED_USE', 'WAREHOUSE', 'PLOT');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('WAREHOUSE', 'OFFICE', 'SHOP', 'APARTMENT', 'VILLA', 'STORAGE_UNIT', 'PARKING');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('VACANT', 'OCCUPIED', 'UNDER_MAINTENANCE', 'RESERVED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "LeaseRenewalStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubleaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "EjariStatus" AS ENUM ('PENDING', 'REGISTERED', 'EXPIRED', 'RENEWAL_PENDING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplianceType" AS ENUM ('LEASE_EXPIRY', 'EJARI_EXPIRY', 'TRADE_LICENSE_EXPIRY', 'INSURANCE_EXPIRY', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('COMPLIANT', 'WARNING', 'EXPIRED', 'ACTION_REQUIRED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('LEASE_AGREEMENT', 'TRADE_LICENSE', 'EJARI_CERTIFICATE', 'INSURANCE', 'ID_DOCUMENT', 'PASSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LEASE_EXPIRY', 'EJARI_EXPIRY', 'TRADE_LICENSE_EXPIRY', 'INSURANCE_EXPIRY', 'RENT_OVERDUE', 'PAYMENT_RECEIVED', 'LEASE_RENEWAL', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PROPERTY_MANAGER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatar" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "registrationNo" TEXT,
    "tradeLicenseNo" TEXT,
    "tradeLicenseExpiry" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'UAE',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "propertyCode" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL DEFAULT 'INDUSTRIAL',
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Dubai',
    "area" TEXT,
    "plotNumber" TEXT,
    "totalArea" DOUBLE PRECISION,
    "builtUpArea" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "companyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plots" (
    "id" TEXT NOT NULL,
    "plotNumber" TEXT NOT NULL,
    "area" DOUBLE PRECISION,
    "zoning" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "notes" TEXT,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "unitCode" TEXT,
    "unitType" "UnitType" NOT NULL DEFAULT 'WAREHOUSE',
    "status" "UnitStatus" NOT NULL DEFAULT 'VACANT',
    "floor" INTEGER,
    "area" DOUBLE PRECISION,
    "rentAmount" DOUBLE PRECISION,
    "securityDeposit" DOUBLE PRECISION,
    "amenities" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "propertyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main_leases" (
    "id" TEXT NOT NULL,
    "contractNo" INTEGER NOT NULL,
    "leaseNumber" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rentAmount" DOUBLE PRECISION NOT NULL,
    "rentFrequency" TEXT NOT NULL DEFAULT 'annual',
    "securityDeposit" DOUBLE PRECISION,
    "incrementPercent" DOUBLE PRECISION,
    "incrementFrequency" INTEGER,
    "landlordName" TEXT NOT NULL,
    "landlordContact" TEXT,
    "landlordEmail" TEXT,
    "tenantNumber" TEXT,
    "landNumber" TEXT,
    "annualRentPerSqFt" DOUBLE PRECISION,
    "location" TEXT,
    "terms" TEXT,
    "notes" TEXT,
    "status" "LeaseStatus" NOT NULL DEFAULT 'DRAFT',
    "renewalStatus" "LeaseRenewalStatus" NOT NULL DEFAULT 'NONE',
    "renewedFromId" TEXT,
    "propertyId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "main_leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "tradeLicenseNo" TEXT,
    "tradeLicenseExpiry" TIMESTAMP(3),
    "registrationNo" TEXT,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'UAE',
    "nationality" TEXT,
    "emiratesId" TEXT,
    "passportNo" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "subtenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subleases" (
    "id" TEXT NOT NULL,
    "subleaseNumber" TEXT NOT NULL,
    "contractValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subLeaseFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rentAmount" DOUBLE PRECISION NOT NULL,
    "rentFrequency" TEXT NOT NULL DEFAULT 'monthly',
    "securityDeposit" DOUBLE PRECISION,
    "incrementPercent" DOUBLE PRECISION,
    "incrementFrequency" INTEGER,
    "terms" TEXT,
    "notes" TEXT,
    "status" "SubleaseStatus" NOT NULL DEFAULT 'DRAFT',
    "renewalStatus" "LeaseRenewalStatus" NOT NULL DEFAULT 'NONE',
    "renewedFromId" TEXT,
    "mainLeaseId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "subtenantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "subleases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ejari_registrations" (
    "id" TEXT NOT NULL,
    "ejariNumber" TEXT,
    "registrationDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "certificateUrl" TEXT,
    "status" "EjariStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "subleaseId" TEXT NOT NULL,
    "subtenantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ejari_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "rentAmount" DOUBLE PRECISION NOT NULL,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceDue" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "notes" TEXT,
    "subleaseId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "referenceNo" TEXT,
    "bankName" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_alerts" (
    "id" TEXT NOT NULL,
    "type" "ComplianceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "daysUntilExpiry" INTEGER,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'COMPLIANT',
    "isNotified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "companyId" TEXT,
    "propertyId" TEXT,
    "unitId" TEXT,
    "mainLeaseId" TEXT,
    "subleaseId" TEXT,
    "ejariId" TEXT,
    "subtenantId" TEXT,
    "uploadedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_registrationNo_key" ON "companies"("registrationNo");

-- CreateIndex
CREATE UNIQUE INDEX "properties_propertyCode_key" ON "properties"("propertyCode");

-- CreateIndex
CREATE UNIQUE INDEX "plots_plotNumber_propertyId_key" ON "plots"("plotNumber", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "units_unitNumber_propertyId_key" ON "units"("unitNumber", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "main_leases_contractNo_key" ON "main_leases"("contractNo");

-- CreateIndex
CREATE UNIQUE INDEX "main_leases_leaseNumber_key" ON "main_leases"("leaseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "subleases_subleaseNumber_key" ON "subleases"("subleaseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ejari_registrations_ejariNumber_key" ON "ejari_registrations"("ejariNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receiptNumber_key" ON "receipts"("receiptNumber");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plots" ADD CONSTRAINT "plots_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main_leases" ADD CONSTRAINT "main_leases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main_leases" ADD CONSTRAINT "main_leases_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main_leases" ADD CONSTRAINT "main_leases_renewedFromId_fkey" FOREIGN KEY ("renewedFromId") REFERENCES "main_leases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subleases" ADD CONSTRAINT "subleases_mainLeaseId_fkey" FOREIGN KEY ("mainLeaseId") REFERENCES "main_leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subleases" ADD CONSTRAINT "subleases_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subleases" ADD CONSTRAINT "subleases_subtenantId_fkey" FOREIGN KEY ("subtenantId") REFERENCES "subtenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subleases" ADD CONSTRAINT "subleases_renewedFromId_fkey" FOREIGN KEY ("renewedFromId") REFERENCES "subleases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejari_registrations" ADD CONSTRAINT "ejari_registrations_subleaseId_fkey" FOREIGN KEY ("subleaseId") REFERENCES "subleases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejari_registrations" ADD CONSTRAINT "ejari_registrations_subtenantId_fkey" FOREIGN KEY ("subtenantId") REFERENCES "subtenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subleaseId_fkey" FOREIGN KEY ("subleaseId") REFERENCES "subleases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_mainLeaseId_fkey" FOREIGN KEY ("mainLeaseId") REFERENCES "main_leases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_subleaseId_fkey" FOREIGN KEY ("subleaseId") REFERENCES "subleases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_ejariId_fkey" FOREIGN KEY ("ejariId") REFERENCES "ejari_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_subtenantId_fkey" FOREIGN KEY ("subtenantId") REFERENCES "subtenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
