-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_mainLeaseId_fkey";

-- DropForeignKey
ALTER TABLE "main_leases" DROP CONSTRAINT "main_leases_companyId_fkey";

-- DropForeignKey
ALTER TABLE "main_leases" DROP CONSTRAINT "main_leases_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "main_leases" DROP CONSTRAINT "main_leases_renewedFromId_fkey";

-- DropForeignKey
ALTER TABLE "subleases" DROP CONSTRAINT "subleases_mainLeaseId_fkey";

-- DropIndex
DROP INDEX "companies_registrationNo_key";

-- DropIndex
DROP INDEX "ejari_registrations_ejariNumber_key";

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "mainLeaseId";

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "annualRentPerSqFt" DOUBLE PRECISION,
ADD COLUMN     "contractNo" INTEGER,
ADD COLUMN     "incrementFrequency" INTEGER,
ADD COLUMN     "incrementPercent" DOUBLE PRECISION,
ADD COLUMN     "landNumber" TEXT,
ADD COLUMN     "landlordContact" TEXT,
ADD COLUMN     "landlordEmail" TEXT,
ADD COLUMN     "landlordName" TEXT DEFAULT 'DREC Properties',
ADD COLUMN     "leaseEndDate" TIMESTAMP(3),
ADD COLUMN     "leaseNumber" TEXT,
ADD COLUMN     "leaseStartDate" TIMESTAMP(3),
ADD COLUMN     "leaseStatus" "LeaseStatus" DEFAULT 'DRAFT',
ADD COLUMN     "location" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "renewalStatus" "LeaseRenewalStatus" DEFAULT 'NONE',
ADD COLUMN     "renewedFromId" TEXT,
ADD COLUMN     "rentAmount" DOUBLE PRECISION,
ADD COLUMN     "rentFrequency" TEXT DEFAULT 'annual',
ADD COLUMN     "securityDeposit" DOUBLE PRECISION,
ADD COLUMN     "tenantNumber" TEXT,
ADD COLUMN     "terms" TEXT;

-- AlterTable
ALTER TABLE "subleases" DROP COLUMN "mainLeaseId",
ADD COLUMN     "numberOfCheques" INTEGER,
ADD COLUMN     "paymentNotes" TEXT,
ADD COLUMN     "pdcDates" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "subtenants" ADD COLUMN     "companyId" TEXT;

-- DropTable
DROP TABLE "main_leases";

-- CreateTable
CREATE TABLE "sublease_stages" (
    "id" TEXT NOT NULL,
    "subleaseId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "doneBy" TEXT,
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sublease_stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sublease_stages_subleaseId_stage_key" ON "sublease_stages"("subleaseId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "properties_contractNo_key" ON "properties"("contractNo");

-- CreateIndex
CREATE UNIQUE INDEX "properties_leaseNumber_key" ON "properties"("leaseNumber");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_renewedFromId_fkey" FOREIGN KEY ("renewedFromId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtenants" ADD CONSTRAINT "subtenants_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subleases" ADD CONSTRAINT "subleases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sublease_stages" ADD CONSTRAINT "sublease_stages_subleaseId_fkey" FOREIGN KEY ("subleaseId") REFERENCES "subleases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
