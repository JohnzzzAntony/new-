import { PrismaClient, UserRole, PropertyType, UnitType, UnitStatus, LeaseStatus, SubleaseStatus, EjariStatus, InvoiceStatus, PaymentMethod, ComplianceType, ComplianceStatus, NotificationType, LeaseRenewalStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.notification.deleteMany()
  await prisma.complianceAlert.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.receipt.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.ejari.deleteMany()
  await prisma.document.deleteMany()
  await prisma.sublease.deleteMany()
  await prisma.mainLease.deleteMany()
  await prisma.subtenant.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.plot.deleteMany()
  await prisma.property.deleteMany()
  await prisma.company.deleteMany()
  await prisma.user.deleteMany()

  // ============================================
  // USERS
  // ============================================
  const passwordHash = await hash('Admin123!', 12)

  const superAdmin = await prisma.user.create({
    data: { email: 'admin@drec.ae', name: 'Ahmed Al Maktoum', password: passwordHash, role: UserRole.SUPER_ADMIN, isActive: true }
  })
  const propertyManager = await prisma.user.create({
    data: { email: 'manager@drec.ae', name: 'Sara Al Rashid', password: passwordHash, role: UserRole.PROPERTY_MANAGER, isActive: true }
  })
  const financeUser = await prisma.user.create({
    data: { email: 'finance@drec.ae', name: 'Mohammed Khan', password: passwordHash, role: UserRole.FINANCE_USER, isActive: true }
  })
  const readOnlyUser = await prisma.user.create({
    data: { email: 'viewer@drec.ae', name: 'Fatima Al Suwaidi', password: passwordHash, role: UserRole.READ_ONLY, isActive: true }
  })

  console.log('✅ Users created')

  // ============================================
  // COMPANIES
  // ============================================
  const company1 = await prisma.company.create({
    data: {
      name: 'Al Fardan Warehousing LLC',
      tradeName: 'Al Fardan Storage',
      registrationNo: 'REG-2024-001',
      tradeLicenseNo: 'TL-DUB-78432',
      tradeLicenseExpiry: new Date('2025-12-15'),
      address: 'Building 45, Jebel Ali Free Zone',
      city: 'Dubai',
      country: 'UAE',
      phone: '+971-4-887-3321',
      email: 'info@alfardan.ae',
      website: 'www.alfardan.ae',
      contactPerson: 'Hassan Al Fardan',
      contactPhone: '+971-50-123-4567',
      contactEmail: 'hassan@alfardan.ae',
      notes: 'Premium warehouse client since 2020',
      isActive: true
    }
  })

  const company2 = await prisma.company.create({
    data: {
      name: 'Gulf Industrial Services FZE',
      tradeName: 'Gulf Industrial',
      registrationNo: 'REG-2024-002',
      tradeLicenseNo: 'TL-DUB-65198',
      tradeLicenseExpiry: new Date('2025-06-30'),
      address: 'Plot 12, Dubai Investment Park',
      city: 'Dubai',
      country: 'UAE',
      phone: '+971-4-899-2210',
      email: 'info@gulfindustrial.ae',
      contactPerson: 'Omar Bakri',
      contactPhone: '+971-50-987-6543',
      contactEmail: 'omar@gulfindustrial.ae',
      notes: 'Industrial services provider',
      isActive: true
    }
  })

  const company3 = await prisma.company.create({
    data: {
      name: 'Emirates Logistics Corp',
      tradeName: 'Emirates Logistics',
      registrationNo: 'REG-2024-003',
      tradeLicenseNo: 'TL-DUB-91205',
      tradeLicenseExpiry: new Date('2026-03-20'),
      address: 'Warehouse District, Al Quoz',
      city: 'Dubai',
      country: 'UAE',
      phone: '+971-4-347-8899',
      email: 'info@emirateslogistics.ae',
      contactPerson: 'Khalid Mansoor',
      contactPhone: '+971-55-456-7890',
      contactEmail: 'khalid@emirateslogistics.ae',
      isActive: true
    }
  })

  const company4 = await prisma.company.create({
    data: {
      name: 'Dubai Commercial Hub LLC',
      tradeName: 'DCH Trading',
      registrationNo: 'REG-2024-004',
      tradeLicenseNo: 'TL-DUB-44567',
      tradeLicenseExpiry: new Date('2025-09-10'),
      address: 'Office 201, Dubai Silicon Oasis',
      city: 'Dubai',
      country: 'UAE',
      phone: '+971-4-776-5533',
      email: 'info@dch.ae',
      contactPerson: 'Rashid Al Neyadi',
      contactPhone: '+971-50-321-6549',
      contactEmail: 'rashid@dch.ae',
      isActive: true
    }
  })

  console.log('✅ Companies created')

  // ============================================
  // PROPERTIES
  // ============================================
  const property1 = await prisma.property.create({
    data: {
      name: 'Jebel Ali Warehouse Complex',
      propertyCode: 'PROP-JAFZA-001',
      propertyType: PropertyType.WAREHOUSE,
      description: 'Premium warehouse complex in Jebel Ali Free Zone with 12 units',
      address: 'Jebel Ali Free Zone, Block D',
      city: 'Dubai',
      area: 'Jebel Ali',
      plotNumber: 'JAFZA-D-45',
      totalArea: 150000,
      builtUpArea: 120000,
      yearBuilt: 2018,
      companyId: company1.id,
      isActive: true
    }
  })

  const property2 = await prisma.property.create({
    data: {
      name: 'DIP Industrial Park',
      propertyCode: 'PROP-DIP-002',
      propertyType: PropertyType.INDUSTRIAL,
      description: 'Industrial park with warehouse and office spaces',
      address: 'Dubai Investment Park, Phase 2',
      city: 'Dubai',
      area: 'Dubai Investment Park',
      plotNumber: 'DIP-P2-12',
      totalArea: 200000,
      builtUpArea: 160000,
      yearBuilt: 2020,
      companyId: company2.id,
      isActive: true
    }
  })

  const property3 = await prisma.property.create({
    data: {
      name: 'Al Quoz Storage Facility',
      propertyCode: 'PROP-ALQ-003',
      propertyType: PropertyType.WAREHOUSE,
      description: 'Central storage facility in Al Quoz industrial area',
      address: 'Al Quoz Industrial Area 3',
      city: 'Dubai',
      area: 'Al Quoz',
      plotNumber: 'ALQ-3-78',
      totalArea: 80000,
      builtUpArea: 65000,
      yearBuilt: 2015,
      companyId: company3.id,
      isActive: true
    }
  })

  const property4 = await prisma.property.create({
    data: {
      name: 'Silicon Oasis Commercial Hub',
      propertyCode: 'PROP-DSO-004',
      propertyType: PropertyType.COMMERCIAL,
      description: 'Modern commercial complex with offices and shops',
      address: 'Dubai Silicon Oasis, Building A',
      city: 'Dubai',
      area: 'Dubai Silicon Oasis',
      plotNumber: 'DSO-A-15',
      totalArea: 45000,
      builtUpArea: 38000,
      yearBuilt: 2022,
      companyId: company4.id,
      isActive: true
    }
  })

  console.log('✅ Properties created')

  // ============================================
  // PLOTS
  // ============================================
  const plots = await Promise.all([
    prisma.plot.create({ data: { plotNumber: 'JAFZA-D-45-A', area: 50000, zoning: 'Industrial', status: 'leased', propertyId: property1.id } }),
    prisma.plot.create({ data: { plotNumber: 'JAFZA-D-45-B', area: 50000, zoning: 'Industrial', status: 'leased', propertyId: property1.id } }),
    prisma.plot.create({ data: { plotNumber: 'JAFZA-D-45-C', area: 50000, zoning: 'Industrial', status: 'available', propertyId: property1.id } }),
    prisma.plot.create({ data: { plotNumber: 'DIP-P2-12-A', area: 80000, zoning: 'Mixed Use', status: 'leased', propertyId: property2.id } }),
    prisma.plot.create({ data: { plotNumber: 'DIP-P2-12-B', area: 120000, zoning: 'Industrial', status: 'leased', propertyId: property2.id } }),
    prisma.plot.create({ data: { plotNumber: 'ALQ-3-78-A', area: 40000, zoning: 'Industrial', status: 'leased', propertyId: property3.id } }),
    prisma.plot.create({ data: { plotNumber: 'ALQ-3-78-B', area: 40000, zoning: 'Industrial', status: 'available', propertyId: property3.id } }),
    prisma.plot.create({ data: { plotNumber: 'DSO-A-15-A', area: 22500, zoning: 'Commercial', status: 'leased', propertyId: property4.id } }),
    prisma.plot.create({ data: { plotNumber: 'DSO-A-15-B', area: 22500, zoning: 'Commercial', status: 'reserved', propertyId: property4.id } }),
  ])

  console.log('✅ Plots created')

  // ============================================
  // UNITS
  // ============================================
  const units = await Promise.all([
    // Property 1 units
    prisma.unit.create({ data: { unitNumber: 'WH-A01', unitCode: 'JAFZA-WH-A01', unitType: UnitType.WAREHOUSE, status: UnitStatus.OCCUPIED, area: 10000, rentAmount: 250000, securityDeposit: 25000, amenities: '["Loading Dock", "Crane", "Fire Suppression"]', propertyId: property1.id } }),
    prisma.unit.create({ data: { unitNumber: 'WH-A02', unitCode: 'JAFZA-WH-A02', unitType: UnitType.WAREHOUSE, status: UnitStatus.OCCUPIED, area: 12000, rentAmount: 300000, securityDeposit: 30000, amenities: '["Loading Dock", "Cold Storage"]', propertyId: property1.id } }),
    prisma.unit.create({ data: { unitNumber: 'WH-A03', unitCode: 'JAFZA-WH-A03', unitType: UnitType.WAREHOUSE, status: UnitStatus.VACANT, area: 8000, rentAmount: 200000, securityDeposit: 20000, amenities: '["Loading Dock"]', propertyId: property1.id } }),
    prisma.unit.create({ data: { unitNumber: 'WH-B01', unitCode: 'JAFZA-WH-B01', unitType: UnitType.WAREHOUSE, status: UnitStatus.OCCUPIED, area: 15000, rentAmount: 375000, securityDeposit: 37500, amenities: '["Loading Dock", "Crane", "Cold Storage", "Fire Suppression"]', propertyId: property1.id } }),
    prisma.unit.create({ data: { unitNumber: 'OF-A01', unitCode: 'JAFZA-OF-A01', unitType: UnitType.OFFICE, status: UnitStatus.OCCUPIED, floor: 1, area: 2000, rentAmount: 120000, securityDeposit: 12000, amenities: '["AC", "Parking"]', propertyId: property1.id } }),
    prisma.unit.create({ data: { unitNumber: 'OF-A02', unitCode: 'JAFZA-OF-A02', unitType: UnitType.OFFICE, status: UnitStatus.VACANT, floor: 1, area: 1500, rentAmount: 90000, securityDeposit: 9000, amenities: '["AC"]', propertyId: property1.id } }),
    // Property 2 units
    prisma.unit.create({ data: { unitNumber: 'WH-C01', unitCode: 'DIP-WH-C01', unitType: UnitType.WAREHOUSE, status: UnitStatus.OCCUPIED, area: 20000, rentAmount: 500000, securityDeposit: 50000, amenities: '["Loading Dock", "Crane", "Heavy Power"]', propertyId: property2.id } }),
    prisma.unit.create({ data: { unitNumber: 'WH-C02', unitCode: 'DIP-WH-C02', unitType: UnitType.WAREHOUSE, status: UnitStatus.OCCUPIED, area: 18000, rentAmount: 450000, securityDeposit: 45000, amenities: '["Loading Dock", "Fire Suppression"]', propertyId: property2.id } }),
    prisma.unit.create({ data: { unitNumber: 'WH-C03', unitCode: 'DIP-WH-C03', unitType: UnitType.WAREHOUSE, status: UnitStatus.UNDER_MAINTENANCE, area: 16000, rentAmount: 400000, securityDeposit: 40000, amenities: '["Loading Dock"]', propertyId: property2.id } }),
    prisma.unit.create({ data: { unitNumber: 'OF-D01', unitCode: 'DIP-OF-D01', unitType: UnitType.OFFICE, status: UnitStatus.OCCUPIED, floor: 1, area: 3000, rentAmount: 180000, securityDeposit: 18000, amenities: '["AC", "Furnished"]', propertyId: property2.id } }),
    // Property 3 units
    prisma.unit.create({ data: { unitNumber: 'ST-E01', unitCode: 'ALQ-ST-E01', unitType: UnitType.STORAGE_UNIT, status: UnitStatus.OCCUPIED, area: 5000, rentAmount: 100000, securityDeposit: 10000, amenities: '["Climate Control"]', propertyId: property3.id } }),
    prisma.unit.create({ data: { unitNumber: 'ST-E02', unitCode: 'ALQ-ST-E02', unitType: UnitType.STORAGE_UNIT, status: UnitStatus.VACANT, area: 5000, rentAmount: 100000, securityDeposit: 10000, amenities: '["Climate Control"]', propertyId: property3.id } }),
    prisma.unit.create({ data: { unitNumber: 'WH-E03', unitCode: 'ALQ-WH-E03', unitType: UnitType.WAREHOUSE, status: UnitStatus.OCCUPIED, area: 12000, rentAmount: 240000, securityDeposit: 24000, amenities: '["Loading Dock", "AC"]', propertyId: property3.id } }),
    // Property 4 units
    prisma.unit.create({ data: { unitNumber: 'SH-F01', unitCode: 'DSO-SH-F01', unitType: UnitType.SHOP, status: UnitStatus.OCCUPIED, floor: 1, area: 2000, rentAmount: 180000, securityDeposit: 18000, amenities: '["AC", "Street Facing"]', propertyId: property4.id } }),
    prisma.unit.create({ data: { unitNumber: 'OF-F02', unitCode: 'DSO-OF-F02', unitType: UnitType.OFFICE, status: UnitStatus.OCCUPIED, floor: 2, area: 2500, rentAmount: 200000, securityDeposit: 20000, amenities: '["AC", "Furnished", "Parking"]', propertyId: property4.id } }),
    prisma.unit.create({ data: { unitNumber: 'OF-F03', unitCode: 'DSO-OF-F03', unitType: UnitType.OFFICE, status: UnitStatus.VACANT, floor: 3, area: 1800, rentAmount: 144000, securityDeposit: 14400, amenities: '["AC", "Parking"]', propertyId: property4.id } }),
  ])

  console.log('✅ Units created')

  // ============================================
  // MAIN LEASES
  // ============================================
  const mainLease1 = await prisma.mainLease.create({
    data: {
      leaseNumber: 'ML-2024-001',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
      rentAmount: 1500000,
      rentFrequency: 'annual',
      securityDeposit: 150000,
      incrementPercent: 5,
      incrementFrequency: 1,
      landlordName: 'DREC Properties',
      landlordContact: '+971-4-333-4444',
      landlordEmail: 'leasing@drec.ae',
      terms: '{"notice_period": "3 months", "grace_period": "15 days", "early_termination_penalty": "3 months rent"}',
      status: LeaseStatus.ACTIVE,
      renewalStatus: LeaseRenewalStatus.NONE,
      propertyId: property1.id,
      companyId: company1.id
    }
  })

  const mainLease2 = await prisma.mainLease.create({
    data: {
      leaseNumber: 'ML-2024-002',
      startDate: new Date('2023-06-01'),
      endDate: new Date('2025-05-31'),
      rentAmount: 2000000,
      rentFrequency: 'annual',
      securityDeposit: 200000,
      incrementPercent: 4,
      incrementFrequency: 2,
      landlordName: 'DREC Properties',
      landlordContact: '+971-4-333-4444',
      landlordEmail: 'leasing@drec.ae',
      terms: '{"notice_period": "3 months", "grace_period": "10 days"}',
      status: LeaseStatus.ACTIVE,
      renewalStatus: LeaseRenewalStatus.PENDING,
      propertyId: property2.id,
      companyId: company2.id
    }
  })

  const mainLease3 = await prisma.mainLease.create({
    data: {
      leaseNumber: 'ML-2023-003',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2024-12-31'),
      rentAmount: 800000,
      rentFrequency: 'quarterly',
      securityDeposit: 80000,
      landlordName: 'DREC Properties',
      landlordContact: '+971-4-333-4444',
      landlordEmail: 'leasing@drec.ae',
      terms: '{"notice_period": "2 months"}',
      status: LeaseStatus.EXPIRED,
      renewalStatus: LeaseRenewalStatus.PENDING,
      propertyId: property3.id,
      companyId: company3.id
    }
  })

  const mainLease4 = await prisma.mainLease.create({
    data: {
      leaseNumber: 'ML-2024-004',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2027-02-28'),
      rentAmount: 1200000,
      rentFrequency: 'annual',
      securityDeposit: 120000,
      incrementPercent: 3,
      incrementFrequency: 1,
      landlordName: 'DREC Properties',
      landlordContact: '+971-4-333-4444',
      landlordEmail: 'leasing@drec.ae',
      terms: '{"notice_period": "3 months"}',
      status: LeaseStatus.ACTIVE,
      renewalStatus: LeaseRenewalStatus.NONE,
      propertyId: property4.id,
      companyId: company4.id
    }
  })

  console.log('✅ Main Leases created')

  // ============================================
  // SUBTENANTS
  // ============================================
  const subtenant1 = await prisma.subtenant.create({
    data: {
      name: 'Global Trading FZE',
      tradeName: 'Global Trading',
      tradeLicenseNo: 'TL-GT-11223',
      tradeLicenseExpiry: new Date('2025-11-30'),
      registrationNo: 'REG-GT-001',
      contactPerson: 'Ali Reza',
      phone: '+971-50-111-2222',
      email: 'ali@globaltrading.ae',
      address: 'JAFZA, Dubai',
      city: 'Dubai',
      country: 'UAE',
      nationality: 'UAE',
      emiratesId: '784-1990-1234567-1',
      isActive: true
    }
  })

  const subtenant2 = await prisma.subtenant.create({
    data: {
      name: 'Mega Logistics LLC',
      tradeName: 'Mega Logistics',
      tradeLicenseNo: 'TL-ML-44556',
      tradeLicenseExpiry: new Date('2025-08-15'),
      registrationNo: 'REG-ML-002',
      contactPerson: 'Suresh Patel',
      phone: '+971-50-333-4444',
      email: 'suresh@megalogistics.ae',
      address: 'DIP, Dubai',
      city: 'Dubai',
      country: 'UAE',
      nationality: 'Indian',
      emiratesId: '784-1985-7654321-2',
      isActive: true
    }
  })

  const subtenant3 = await prisma.subtenant.create({
    data: {
      name: 'Al Nabha Storage Services',
      tradeName: 'Al Nabha Storage',
      tradeLicenseNo: 'TL-ANS-77889',
      tradeLicenseExpiry: new Date('2026-01-20'),
      registrationNo: 'REG-ANS-003',
      contactPerson: 'Ahmed Al Nabha',
      phone: '+971-50-555-6666',
      email: 'ahmed@alnabha.ae',
      address: 'Al Quoz, Dubai',
      city: 'Dubai',
      country: 'UAE',
      nationality: 'UAE',
      emiratesId: '784-1988-9876543-3',
      isActive: true
    }
  })

  const subtenant4 = await prisma.subtenant.create({
    data: {
      name: 'Tech Hub Solutions',
      tradeName: 'Tech Hub',
      tradeLicenseNo: 'TL-TH-99001',
      tradeLicenseExpiry: new Date('2025-04-30'),
      registrationNo: 'REG-TH-004',
      contactPerson: 'Maria Santos',
      phone: '+971-50-777-8888',
      email: 'maria@techhub.ae',
      address: 'DSO, Dubai',
      city: 'Dubai',
      country: 'UAE',
      nationality: 'Filipino',
      emiratesId: '784-1992-2345678-4',
      isActive: true
    }
  })

  const subtenant5 = await prisma.subtenant.create({
    data: {
      name: 'Emirates Food Distributors',
      tradeName: 'EFD',
      tradeLicenseNo: 'TL-EFD-33445',
      tradeLicenseExpiry: new Date('2026-06-15'),
      registrationNo: 'REG-EFD-005',
      contactPerson: 'Hamad Al Shamsi',
      phone: '+971-50-999-0000',
      email: 'hamad@efd.ae',
      address: 'JAFZA, Dubai',
      city: 'Dubai',
      country: 'UAE',
      nationality: 'UAE',
      isActive: true
    }
  })

  const subtenant6 = await prisma.subtenant.create({
    data: {
      name: 'Rapid Express Cargo',
      tradeName: 'Rapid Cargo',
      tradeLicenseNo: 'TL-RC-55667',
      tradeLicenseExpiry: new Date('2025-10-01'),
      registrationNo: 'REG-RC-006',
      contactPerson: 'David Chen',
      phone: '+971-50-222-3333',
      email: 'david@rapidcargo.ae',
      address: 'DIP, Dubai',
      city: 'Dubai',
      country: 'UAE',
      nationality: 'Chinese',
      isActive: true
    }
  })

  console.log('✅ Subtenants created')

  // ============================================
  // SUBLEASES
  // ============================================
  const sublease1 = await prisma.sublease.create({
    data: {
      subleaseNumber: 'SL-2024-001',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2025-01-31'),
      rentAmount: 275000,
      rentFrequency: 'annual',
      securityDeposit: 27500,
      incrementPercent: 5,
      terms: '{"notice_period": "2 months", "subletting_allowed": false}',
      status: SubleaseStatus.ACTIVE,
      mainLeaseId: mainLease1.id,
      unitId: units[0].id,
      subtenantId: subtenant1.id
    }
  })

  const sublease2 = await prisma.sublease.create({
    data: {
      subleaseNumber: 'SL-2024-002',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-02-28'),
      rentAmount: 330000,
      rentFrequency: 'monthly',
      securityDeposit: 33000,
      terms: '{"notice_period": "1 month"}',
      status: SubleaseStatus.ACTIVE,
      mainLeaseId: mainLease1.id,
      unitId: units[1].id,
      subtenantId: subtenant5.id
    }
  })

  const sublease3 = await prisma.sublease.create({
    data: {
      subleaseNumber: 'SL-2024-003',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      rentAmount: 550000,
      rentFrequency: 'quarterly',
      securityDeposit: 55000,
      incrementPercent: 4,
      terms: '{"notice_period": "3 months"}',
      status: SubleaseStatus.ACTIVE,
      mainLeaseId: mainLease2.id,
      unitId: units[6].id,
      subtenantId: subtenant2.id
    }
  })

  const sublease4 = await prisma.sublease.create({
    data: {
      subleaseNumber: 'SL-2024-004',
      startDate: new Date('2023-07-01'),
      endDate: new Date('2024-06-30'),
      rentAmount: 490000,
      rentFrequency: 'annual',
      securityDeposit: 49000,
      terms: '{"notice_period": "2 months"}',
      status: SubleaseStatus.EXPIRED,
      mainLeaseId: mainLease2.id,
      unitId: units[7].id,
      subtenantId: subtenant6.id
    }
  })

  const sublease5 = await prisma.sublease.create({
    data: {
      subleaseNumber: 'SL-2024-005',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-05-31'),
      rentAmount: 110000,
      rentFrequency: 'monthly',
      securityDeposit: 11000,
      terms: '{"notice_period": "1 month"}',
      status: SubleaseStatus.ACTIVE,
      mainLeaseId: mainLease3.id,
      unitId: units[10].id,
      subtenantId: subtenant3.id
    }
  })

  const sublease6 = await prisma.sublease.create({
    data: {
      subleaseNumber: 'SL-2024-006',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2026-03-31'),
      rentAmount: 198000,
      rentFrequency: 'annual',
      securityDeposit: 19800,
      incrementPercent: 3,
      terms: '{"notice_period": "2 months"}',
      status: SubleaseStatus.ACTIVE,
      mainLeaseId: mainLease4.id,
      unitId: units[13].id,
      subtenantId: subtenant4.id
    }
  })

  const sublease7 = await prisma.sublease.create({
    data: {
      subleaseNumber: 'SL-2024-007',
      startDate: new Date('2024-05-01'),
      endDate: new Date('2025-04-30'),
      rentAmount: 220000,
      rentFrequency: 'monthly',
      securityDeposit: 22000,
      terms: '{"notice_period": "1 month"}',
      status: SubleaseStatus.ACTIVE,
      mainLeaseId: mainLease4.id,
      unitId: units[14].id,
      subtenantId: subtenant5.id
    }
  })

  const sublease8 = await prisma.sublease.create({
    data: {
      subleaseNumber: 'SL-2024-008',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      rentAmount: 264000,
      rentFrequency: 'annual',
      securityDeposit: 26400,
      terms: '{"notice_period": "2 months"}',
      status: SubleaseStatus.ACTIVE,
      mainLeaseId: mainLease1.id,
      unitId: units[3].id,
      subtenantId: subtenant2.id
    }
  })

  console.log('✅ Subleases created')

  // ============================================
  // EJARI REGISTRATIONS
  // ============================================
  const ejari1 = await prisma.ejari.create({
    data: {
      ejariNumber: 'EJ-2024-001234',
      registrationDate: new Date('2024-02-15'),
      expiryDate: new Date('2025-02-14'),
      status: EjariStatus.REGISTERED,
      subleaseId: sublease1.id,
      subtenantId: subtenant1.id
    }
  })

  const ejari2 = await prisma.ejari.create({
    data: {
      ejariNumber: 'EJ-2024-002345',
      registrationDate: new Date('2024-03-10'),
      expiryDate: new Date('2025-03-09'),
      status: EjariStatus.REGISTERED,
      subleaseId: sublease2.id,
      subtenantId: subtenant5.id
    }
  })

  const ejari3 = await prisma.ejari.create({
    data: {
      ejariNumber: 'EJ-2024-003456',
      registrationDate: new Date('2024-01-20'),
      expiryDate: new Date('2025-12-31'),
      status: EjariStatus.REGISTERED,
      subleaseId: sublease3.id,
      subtenantId: subtenant2.id
    }
  })

  const ejari4 = await prisma.ejari.create({
    data: {
      ejariNumber: null,
      registrationDate: null,
      expiryDate: null,
      status: EjariStatus.PENDING,
      notes: 'Awaiting RERA approval',
      subleaseId: sublease5.id,
      subtenantId: subtenant3.id
    }
  })

  const ejari5 = await prisma.ejari.create({
    data: {
      ejariNumber: 'EJ-2023-005678',
      registrationDate: new Date('2023-07-10'),
      expiryDate: new Date('2024-07-09'),
      status: EjariStatus.EXPIRED,
      notes: 'Needs renewal',
      subleaseId: sublease4.id,
      subtenantId: subtenant6.id
    }
  })

  const ejari6 = await prisma.ejari.create({
    data: {
      ejariNumber: 'EJ-2024-006789',
      registrationDate: new Date('2024-04-20'),
      expiryDate: new Date('2026-03-31'),
      status: EjariStatus.REGISTERED,
      subleaseId: sublease6.id,
      subtenantId: subtenant4.id
    }
  })

  const ejari7 = await prisma.ejari.create({
    data: {
      ejariNumber: 'EJ-2024-007890',
      registrationDate: new Date('2024-05-15'),
      expiryDate: new Date('2025-05-14'),
      status: EjariStatus.RENEWAL_PENDING,
      notes: 'Renewal submitted to RERA',
      subleaseId: sublease7.id,
      subtenantId: subtenant5.id
    }
  })

  console.log('✅ EJARI registrations created')

  // ============================================
  // INVOICES
  // ============================================
  const now = new Date()
  const invoices = await Promise.all([
    // Sublease 1 invoices
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-0001',
        issueDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-15'),
        periodStart: new Date('2024-02-01'),
        periodEnd: new Date('2025-01-31'),
        rentAmount: 275000,
        otherCharges: 5000,
        vatAmount: 14000,
        totalAmount: 294000,
        amountPaid: 294000,
        balanceDue: 0,
        status: InvoiceStatus.PAID,
        subleaseId: sublease1.id
      }
    }),
    // Sublease 2 invoices
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-0002',
        issueDate: new Date('2024-03-01'),
        dueDate: new Date('2024-03-15'),
        periodStart: new Date('2024-03-01'),
        periodEnd: new Date('2025-02-28'),
        rentAmount: 330000,
        otherCharges: 8000,
        vatAmount: 16900,
        totalAmount: 354900,
        amountPaid: 354900,
        balanceDue: 0,
        status: InvoiceStatus.PAID,
        subleaseId: sublease2.id
      }
    }),
    // Sublease 3 invoices
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-0003',
        issueDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-15'),
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-03-31'),
        rentAmount: 137500,
        otherCharges: 3000,
        vatAmount: 7025,
        totalAmount: 147525,
        amountPaid: 147525,
        balanceDue: 0,
        status: InvoiceStatus.PAID,
        subleaseId: sublease3.id
      }
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-0004',
        issueDate: new Date('2024-04-01'),
        dueDate: new Date('2024-04-15'),
        periodStart: new Date('2024-04-01'),
        periodEnd: new Date('2024-06-30'),
        rentAmount: 137500,
        otherCharges: 3000,
        vatAmount: 7025,
        totalAmount: 147525,
        amountPaid: 147525,
        balanceDue: 0,
        status: InvoiceStatus.PAID,
        subleaseId: sublease3.id
      }
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-0005',
        issueDate: new Date('2024-07-01'),
        dueDate: new Date('2024-07-15'),
        periodStart: new Date('2024-07-01'),
        periodEnd: new Date('2024-09-30'),
        rentAmount: 137500,
        otherCharges: 3000,
        vatAmount: 7025,
        totalAmount: 147525,
        amountPaid: 100000,
        balanceDue: 47525,
        status: InvoiceStatus.OVERDUE,
        subleaseId: sublease3.id
      }
    }),
    // Sublease 5 invoices
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-0006',
        issueDate: new Date('2024-06-01'),
        dueDate: new Date('2024-06-15'),
        periodStart: new Date('2024-06-01'),
        periodEnd: new Date('2024-06-30'),
        rentAmount: 9167,
        otherCharges: 500,
        vatAmount: 483,
        totalAmount: 10150,
        amountPaid: 10150,
        balanceDue: 0,
        status: InvoiceStatus.PAID,
        subleaseId: sublease5.id
      }
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-0007',
        issueDate: new Date('2024-12-01'),
        dueDate: new Date('2024-12-15'),
        periodStart: new Date('2024-12-01'),
        periodEnd: new Date('2024-12-31'),
        rentAmount: 9167,
        otherCharges: 500,
        vatAmount: 483,
        totalAmount: 10150,
        amountPaid: 0,
        balanceDue: 10150,
        status: InvoiceStatus.ISSUED,
        subleaseId: sublease5.id
      }
    }),
    // Sublease 6 invoices
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-0008',
        issueDate: new Date('2024-04-01'),
        dueDate: new Date('2024-04-15'),
        periodStart: new Date('2024-04-01'),
        periodEnd: new Date('2025-03-31'),
        rentAmount: 198000,
        otherCharges: 6000,
        vatAmount: 10200,
        totalAmount: 214200,
        amountPaid: 214200,
        balanceDue: 0,
        status: InvoiceStatus.PAID,
        subleaseId: sublease6.id
      }
    }),
    // Sublease 7 invoices
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-0009',
        issueDate: new Date('2024-05-01'),
        dueDate: new Date('2024-05-15'),
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2025-04-30'),
        rentAmount: 220000,
        otherCharges: 7000,
        vatAmount: 11350,
        totalAmount: 238350,
        amountPaid: 150000,
        balanceDue: 88350,
        status: InvoiceStatus.PARTIALLY_PAID,
        subleaseId: sublease7.id
      }
    }),
    // Sublease 8 invoices
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-0010',
        issueDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-15'),
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-12-31'),
        rentAmount: 264000,
        otherCharges: 8000,
        vatAmount: 13600,
        totalAmount: 285600,
        amountPaid: 285600,
        balanceDue: 0,
        status: InvoiceStatus.PAID,
        subleaseId: sublease8.id
      }
    }),
  ])

  console.log('✅ Invoices created')

  // ============================================
  // RECEIPTS
  // ============================================
  await Promise.all([
    prisma.receipt.create({ data: { receiptNumber: 'RCT-2024-0001', invoiceId: invoices[0].id, amount: 294000, paymentDate: new Date('2024-01-10'), paymentMethod: PaymentMethod.BANK_TRANSFER, referenceNo: 'TXN-78901', bankName: 'Emirates NBD' } }),
    prisma.receipt.create({ data: { receiptNumber: 'RCT-2024-0002', invoiceId: invoices[1].id, amount: 354900, paymentDate: new Date('2024-03-12'), paymentMethod: PaymentMethod.CHEQUE, referenceNo: 'CHQ-45678', bankName: 'Mashreq Bank' } }),
    prisma.receipt.create({ data: { receiptNumber: 'RCT-2024-0003', invoiceId: invoices[2].id, amount: 147525, paymentDate: new Date('2024-01-14'), paymentMethod: PaymentMethod.BANK_TRANSFER, referenceNo: 'TXN-78902', bankName: 'Emirates NBD' } }),
    prisma.receipt.create({ data: { receiptNumber: 'RCT-2024-0004', invoiceId: invoices[3].id, amount: 147525, paymentDate: new Date('2024-04-10'), paymentMethod: PaymentMethod.BANK_TRANSFER, referenceNo: 'TXN-78903', bankName: 'Emirates NBD' } }),
    prisma.receipt.create({ data: { receiptNumber: 'RCT-2024-0005', invoiceId: invoices[4].id, amount: 100000, paymentDate: new Date('2024-07-15'), paymentMethod: PaymentMethod.CASH, notes: 'Partial payment' } }),
    prisma.receipt.create({ data: { receiptNumber: 'RCT-2024-0006', invoiceId: invoices[5].id, amount: 10150, paymentDate: new Date('2024-06-14'), paymentMethod: PaymentMethod.ONLINE, referenceNo: 'PAY-11223' } }),
    prisma.receipt.create({ data: { receiptNumber: 'RCT-2024-0007', invoiceId: invoices[7].id, amount: 214200, paymentDate: new Date('2024-04-12'), paymentMethod: PaymentMethod.BANK_TRANSFER, referenceNo: 'TXN-78904', bankName: 'Abu Dhabi Commercial Bank' } }),
    prisma.receipt.create({ data: { receiptNumber: 'RCT-2024-0008', invoiceId: invoices[8].id, amount: 150000, paymentDate: new Date('2024-05-20'), paymentMethod: PaymentMethod.CHEQUE, referenceNo: 'CHQ-56789', bankName: 'Dubai Islamic Bank', notes: 'Partial payment - balance pending' } }),
    prisma.receipt.create({ data: { receiptNumber: 'RCT-2024-0009', invoiceId: invoices[9].id, amount: 285600, paymentDate: new Date('2024-01-12'), paymentMethod: PaymentMethod.BANK_TRANSFER, referenceNo: 'TXN-78905', bankName: 'Emirates NBD' } }),
  ])

  console.log('✅ Receipts created')

  // ============================================
  // COMPLIANCE ALERTS
  // ============================================
  await Promise.all([
    prisma.complianceAlert.create({
      data: {
        type: ComplianceType.LEASE_EXPIRY,
        title: 'Main Lease ML-2023-003 Expired',
        description: 'Main lease for Al Quoz Storage Facility has expired. Renewal is pending.',
        entityType: 'MainLease',
        entityId: mainLease3.id,
        expiryDate: new Date('2024-12-31'),
        daysUntilExpiry: -90,
        status: ComplianceStatus.EXPIRED,
        isNotified: true,
        notifiedAt: new Date('2024-12-01')
      }
    }),
    prisma.complianceAlert.create({
      data: {
        type: ComplianceType.EJARI_EXPIRY,
        title: 'EJARI EJ-2023-005678 Expired',
        description: 'EJARI registration for Rapid Express Cargo has expired. Immediate renewal required.',
        entityType: 'Ejari',
        entityId: ejari5.id,
        expiryDate: new Date('2024-07-09'),
        daysUntilExpiry: -240,
        status: ComplianceStatus.EXPIRED,
        isNotified: true,
        notifiedAt: new Date('2024-06-09')
      }
    }),
    prisma.complianceAlert.create({
      data: {
        type: ComplianceType.TRADE_LICENSE_EXPIRY,
        title: 'Trade License Expiring - Global Trading FZE',
        description: 'Trade license for Global Trading FZE expiring in 180 days.',
        entityType: 'Subtenant',
        entityId: subtenant1.id,
        expiryDate: new Date('2025-11-30'),
        daysUntilExpiry: 180,
        status: ComplianceStatus.WARNING,
        isNotified: false
      }
    }),
    prisma.complianceAlert.create({
      data: {
        type: ComplianceType.TRADE_LICENSE_EXPIRY,
        title: 'Trade License Expiring - Tech Hub Solutions',
        description: 'Trade license for Tech Hub Solutions expiring soon.',
        entityType: 'Subtenant',
        entityId: subtenant4.id,
        expiryDate: new Date('2025-04-30'),
        daysUntilExpiry: 30,
        status: ComplianceStatus.ACTION_REQUIRED,
        isNotified: true,
        notifiedAt: new Date('2025-03-01')
      }
    }),
    prisma.complianceAlert.create({
      data: {
        type: ComplianceType.INSURANCE_EXPIRY,
        title: 'Insurance Policy Expiring - DIP Industrial Park',
        description: 'Property insurance for DIP Industrial Park expiring in 60 days.',
        entityType: 'Property',
        entityId: property2.id,
        expiryDate: new Date('2025-06-30'),
        daysUntilExpiry: 60,
        status: ComplianceStatus.WARNING,
        isNotified: false
      }
    }),
    prisma.complianceAlert.create({
      data: {
        type: ComplianceType.LEASE_EXPIRY,
        title: 'Sublease SL-2024-004 Expired',
        description: 'Sublease for Rapid Express Cargo has expired.',
        entityType: 'Sublease',
        entityId: sublease4.id,
        expiryDate: new Date('2024-06-30'),
        daysUntilExpiry: -300,
        status: ComplianceStatus.EXPIRED,
        isNotified: true,
        notifiedAt: new Date('2024-05-30')
      }
    }),
    prisma.complianceAlert.create({
      data: {
        type: ComplianceType.EJARI_EXPIRY,
        title: 'EJARI Renewal Pending - EJ-2024-007890',
        description: 'EJARI for Emirates Food Distributors is pending renewal.',
        entityType: 'Ejari',
        entityId: ejari7.id,
        expiryDate: new Date('2025-05-14'),
        daysUntilExpiry: 45,
        status: ComplianceStatus.ACTION_REQUIRED,
        isNotified: true,
        notifiedAt: new Date('2025-03-14')
      }
    }),
    prisma.complianceAlert.create({
      data: {
        type: ComplianceType.TRADE_LICENSE_EXPIRY,
        title: 'Company Trade License Expiring - Gulf Industrial',
        description: 'Gulf Industrial Services trade license expiring.',
        entityType: 'Company',
        entityId: company2.id,
        expiryDate: new Date('2025-06-30'),
        daysUntilExpiry: 60,
        status: ComplianceStatus.WARNING,
        isNotified: false
      }
    }),
  ])

  console.log('✅ Compliance alerts created')

  // ============================================
  // NOTIFICATIONS
  // ============================================
  await Promise.all([
    prisma.notification.create({
      data: {
        type: NotificationType.LEASE_EXPIRY,
        title: 'Main Lease Expiring',
        message: 'Main lease ML-2024-002 for DIP Industrial Park is approaching expiry. Please initiate renewal process.',
        isRead: false,
        userId: propertyManager.id
      }
    }),
    prisma.notification.create({
      data: {
        type: NotificationType.EJARI_EXPIRY,
        title: 'EJARI Expired',
        message: 'EJARI EJ-2023-005678 for Rapid Express Cargo has expired. Immediate action required.',
        isRead: false,
        userId: propertyManager.id
      }
    }),
    prisma.notification.create({
      data: {
        type: NotificationType.RENT_OVERDUE,
        title: 'Overdue Rent Payment',
        message: 'Invoice INV-2024-0005 for Mega Logistics LLC is overdue. Outstanding amount: AED 47,525.',
        isRead: false,
        userId: financeUser.id
      }
    }),
    prisma.notification.create({
      data: {
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Payment Received',
        message: 'Payment of AED 214,200 received from Tech Hub Solutions against invoice INV-2024-0008.',
        isRead: true,
        userId: financeUser.id,
        readAt: new Date('2024-04-13')
      }
    }),
    prisma.notification.create({
      data: {
        type: NotificationType.TRADE_LICENSE_EXPIRY,
        title: 'Trade License Expiring',
        message: 'Trade license for Tech Hub Solutions expiring on April 30, 2025. Please remind the tenant.',
        isRead: false,
        userId: propertyManager.id
      }
    }),
    prisma.notification.create({
      data: {
        type: NotificationType.SYSTEM,
        title: 'Welcome to DREC PMS',
        message: 'Welcome to the DREC Property Management System. Please review the dashboard for current status.',
        isRead: false,
        userId: superAdmin.id
      }
    }),
  ])

  console.log('✅ Notifications created')
  console.log('🎉 Seeding completed successfully!')
  console.log('')
  console.log('📋 Login Credentials:')
  console.log('  Super Admin:    admin@drec.ae / Admin123!')
  console.log('  Property Mgr:   manager@drec.ae / Admin123!')
  console.log('  Finance User:   finance@drec.ae / Admin123!')
  console.log('  Read Only:      viewer@drec.ae / Admin123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
