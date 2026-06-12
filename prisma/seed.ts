import { config } from 'dotenv'
config()

import { PrismaClient, UserRole, PropertyType, UnitType, UnitStatus, LeaseStatus, SubleaseStatus, EjariStatus, InvoiceStatus, PaymentMethod, ComplianceType, ComplianceStatus, NotificationType, LeaseRenewalStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// ============================================
// DREC MAIN LEASE DATA (from Excel)
// ============================================
const DREC_MAIN_DATA = [
  { contractNo: 8863, plotNo: '0613-1208', location: 'Ras Al Khor Industrial Second', leaseFrom: '2022-02-23', leaseTo: '2023-02-22', tenantNumber: '47902', landNumber: 'L2649', plotPropertyName: null, mainTenant: null, annualRent: 277555.6, areaSqFt: 81634, rentPerSqFt: 3.4 },
  { contractNo: 8455, plotNo: '0612-0255', location: 'Ras Al Khor Industrial First', leaseFrom: '2025-05-05', leaseTo: '2026-05-04', tenantNumber: '332679', landNumber: 'L2254', plotPropertyName: 'NAJD', mainTenant: 'AL NAJD GARAGE L.L.C', annualRent: 148800, areaSqFt: 40000, rentPerSqFt: 3.72 },
  { contractNo: 11277, plotNo: '0368-0248', location: 'Al Goze Industrial Third', leaseFrom: '2025-05-07', leaseTo: '2026-05-06', tenantNumber: '414737', landNumber: 'L1820', plotPropertyName: 'PROFAB', mainTenant: 'NAJD ALSALAMAH TECHNICAL SERVICES', annualRent: 120000, areaSqFt: 20000, rentPerSqFt: 6 },
  { contractNo: 11313, plotNo: '0365-0398', location: 'Al Goze Industrial Second', leaseFrom: '2025-05-22', leaseTo: '2026-05-21', tenantNumber: '414737', landNumber: 'L3824', plotPropertyName: 'A3 QASAB', mainTenant: 'NAJD ALSALAMAH TECHNICAL SERVICES', annualRent: 81600, areaSqFt: 20000, rentPerSqFt: 4.08 },
  { contractNo: 10363, plotNo: '0369-0338', location: 'Al Goze Industrial Fourth', leaseFrom: '2025-05-23', leaseTo: '2026-05-22', tenantNumber: '336290', landNumber: 'L4582', plotPropertyName: null, mainTenant: null, annualRent: 100440, areaSqFt: 27000, rentPerSqFt: 3.72 },
  { contractNo: 11317, plotNo: '0368-0263', location: 'Al Goze Industrial Third', leaseFrom: '2025-05-26', leaseTo: '2026-05-25', tenantNumber: '10002140', landNumber: 'L3378', plotPropertyName: 'M2', mainTenant: 'ALALAM ALJADEED BUILDING MATERIALS TRADING', annualRent: 161364, areaSqFt: 39550, rentPerSqFt: 4.08 },
  { contractNo: 8986, plotNo: '0368-0524', location: 'Al Goze Industrial Third', leaseFrom: '2025-06-08', leaseTo: '2026-06-07', tenantNumber: '47902', landNumber: 'L1767', plotPropertyName: 'KK1', mainTenant: 'AL JABER OPTICAL CENTRE LLC', annualRent: 855127.2, areaSqFt: 209590, rentPerSqFt: 4.08 },
  { contractNo: 10386, plotNo: '0365-0244', location: 'Al Goze Industrial Second', leaseFrom: '2025-06-10', leaseTo: '2026-06-09', tenantNumber: '506082', landNumber: 'L2092', plotPropertyName: 'COLD STORAGE', mainTenant: 'FUTTAIM', annualRent: 81600, areaSqFt: 20000, rentPerSqFt: 4.08 },
  { contractNo: 8484, plotNo: '0215-0282', location: 'Um Ramool', leaseFrom: '2025-06-10', leaseTo: '2026-06-09', tenantNumber: '336290', landNumber: 'L202', plotPropertyName: 'QASIM SULTAN', mainTenant: 'AL JABER TRADING ENTERPRICES LLC', annualRent: 191251.5, areaSqFt: 47575, rentPerSqFt: 4.02 },
  { contractNo: 9529, plotNo: '0369-0115', location: 'Al Goze Industrial Fourth', leaseFrom: '2025-06-20', leaseTo: '2026-06-19', tenantNumber: '414737', landNumber: 'L2285', plotPropertyName: 'DABAL', mainTenant: 'NAJD ALSALAMAH TECHNICAL SERVICES', annualRent: 119340, areaSqFt: 29250, rentPerSqFt: 4.08 },
  { contractNo: 9023, plotNo: '0613-1391', location: 'Ras Al Khor Industrial Second', leaseFrom: '2025-06-29', leaseTo: '2026-06-28', tenantNumber: '47902', landNumber: 'L3771', plotPropertyName: 'JAFLA', mainTenant: 'AL JABER OPTICAL CENTRE LLC', annualRent: 162384, areaSqFt: 39800, rentPerSqFt: 4.08 },
  { contractNo: 11405, plotNo: '0368-0121', location: 'Al Goze Industrial Third', leaseFrom: '2025-07-02', leaseTo: '2026-07-01', tenantNumber: '10002140', landNumber: 'L3373', plotPropertyName: 'H1', mainTenant: 'ALALAM ALJADEED BUILDING MATERIALS TRADING', annualRent: 204000, areaSqFt: 50000, rentPerSqFt: 4.08 },
  { contractNo: 9026, plotNo: '0364-0173', location: 'Al Goze Industrial First', leaseFrom: '2025-07-05', leaseTo: '2026-07-04', tenantNumber: '47902', landNumber: 'L5467', plotPropertyName: 'AUTO MILLENIUM', mainTenant: 'AL JABER OPTICAL CENTRE LLC', annualRent: 372340, areaSqFt: 74468, rentPerSqFt: 5 },
  { contractNo: 11458, plotNo: '0364-0166', location: 'Al Goze Industrial First', leaseFrom: '2025-07-18', leaseTo: '2026-07-17', tenantNumber: '10005547', landNumber: 'L2965', plotPropertyName: '80K', mainTenant: 'FAN ALSALAM', annualRent: 324360, areaSqFt: 79500, rentPerSqFt: 4.08 },
  { contractNo: 11494, plotNo: '0364-0331', location: 'Al Goze Industrial First', leaseFrom: '2025-07-24', leaseTo: '2026-07-23', tenantNumber: '10005547', landNumber: 'L2901', plotPropertyName: 'KHAYAT 2', mainTenant: 'FAN ALSALAM', annualRent: 163200, areaSqFt: 40000, rentPerSqFt: 4.08 },
  { contractNo: 11480, plotNo: '0369-0514', location: 'Al Goze Industrial Fourth', leaseFrom: '2025-07-30', leaseTo: '2026-07-29', tenantNumber: '10005547', landNumber: 'L2229', plotPropertyName: 'Z', mainTenant: 'FAN ALSALAM', annualRent: 91800, areaSqFt: 22500, rentPerSqFt: 4.08 },
  { contractNo: 11534, plotNo: '0368-0144', location: 'Al Goze Industrial Third', leaseFrom: '2025-08-12', leaseTo: '2026-08-11', tenantNumber: '10005547', landNumber: 'L3392', plotPropertyName: 'FARIS WH', mainTenant: 'FAN ALSALAM', annualRent: 187680, areaSqFt: 46000, rentPerSqFt: 4.08 },
  { contractNo: 10573, plotNo: '0368-0432', location: 'Al Goze Industrial Third', leaseFrom: '2025-08-20', leaseTo: '2026-08-19', tenantNumber: '47902', landNumber: 'L2202', plotPropertyName: 'FAB', mainTenant: 'AL JABER OPTICAL CENTRE LLC', annualRent: 183600, areaSqFt: 45000, rentPerSqFt: 4.08 },
  { contractNo: 11557, plotNo: '0613-0973', location: 'Ras Al Khor Industrial Second', leaseFrom: '2025-08-27', leaseTo: '2026-08-26', tenantNumber: '10008533', landNumber: 'L3874', plotPropertyName: 'MAITHA', mainTenant: 'FAN ALSALAM GARAGE', annualRent: 921768.96, areaSqFt: 240044, rentPerSqFt: 3.84 },
  { contractNo: 11565, plotNo: '0364-0181', location: 'Al Goze Industrial First', leaseFrom: '2025-08-28', leaseTo: '2026-08-27', tenantNumber: '10005547', landNumber: 'L3151', plotPropertyName: 'SHEIK BUTTI', mainTenant: 'FAN ALSALAM', annualRent: 181764, areaSqFt: 44550, rentPerSqFt: 4.08 },
  { contractNo: 11575, plotNo: '0365-0723', location: 'Al Goze Industrial Second', leaseFrom: '2025-09-09', leaseTo: '2026-09-08', tenantNumber: '414737', landNumber: 'L6571', plotPropertyName: 'REYAMI FACTORY', mainTenant: 'FARIS AL SALAM TRADING', annualRent: 72000, areaSqFt: 20000, rentPerSqFt: 3.6 },
  { contractNo: 11586, plotNo: '0369-0268', location: 'Al Goze Industrial Fourth', leaseFrom: '2025-09-15', leaseTo: '2026-09-14', tenantNumber: '10005547', landNumber: 'L4738', plotPropertyName: 'SUWAIDI', mainTenant: 'FAN ALSALAM', annualRent: 76500, areaSqFt: 18750, rentPerSqFt: 4.08 },
  { contractNo: 11587, plotNo: '0364-0436', location: 'Al Goze Industrial First', leaseFrom: '2025-09-15', leaseTo: '2026-09-14', tenantNumber: '10005547', landNumber: 'L2941', plotPropertyName: 'AWAZI', mainTenant: 'FAN ALSALAM', annualRent: 122400, areaSqFt: 30000, rentPerSqFt: 4.08 },
  { contractNo: 11588, plotNo: '0613-1466', location: 'Ras Al Khor Industrial Second', leaseFrom: '2025-09-15', leaseTo: '2026-09-14', tenantNumber: '10005547', landNumber: 'L4261', plotPropertyName: 'FALAZI', mainTenant: 'FAN ALSALAM', annualRent: 138720, areaSqFt: 34000, rentPerSqFt: 4.08 },
  { contractNo: 8643, plotNo: '0613-1506', location: 'Ras Al Khor Industrial Second', leaseFrom: '2025-10-03', leaseTo: '2026-10-02', tenantNumber: '332679', landNumber: 'L2934', plotPropertyName: 'KHETBI', mainTenant: 'AL NAJD GARAGE L.L.C', annualRent: 63266.04, areaSqFt: 17007, rentPerSqFt: 3.72 },
  { contractNo: 10835, plotNo: '0369-0603', location: 'Al Goze Industrial Fourth', leaseFrom: '2025-10-31', leaseTo: '2026-10-30', tenantNumber: '414737', landNumber: 'L1756', plotPropertyName: 'TAMIMI', mainTenant: 'FARIS AL SALAM TRADING', annualRent: 195840, areaSqFt: 48000, rentPerSqFt: 4.08 },
  { contractNo: 8711, plotNo: '0613-1670', location: 'Ras Al Khor Industrial Second', leaseFrom: '2025-11-04', leaseTo: '2026-11-03', tenantNumber: '332679', landNumber: 'L6762', plotPropertyName: 'AMANA', mainTenant: 'AL NAJD GARAGE L.L.C', annualRent: 76826.88, areaSqFt: 20007, rentPerSqFt: 3.84 },
  { contractNo: 11717, plotNo: '0368-0111', location: 'Al Goze Industrial Third', leaseFrom: '2025-11-05', leaseTo: '2026-11-04', tenantNumber: '10005547', landNumber: 'L3050', plotPropertyName: 'UMM SUQEIM', mainTenant: 'FAN ALSALAM', annualRent: 183600, areaSqFt: 45000, rentPerSqFt: 4.08 },
  { contractNo: 11724, plotNo: '0368-0548', location: 'Al Goze Industrial Third', leaseFrom: '2025-11-07', leaseTo: '2026-11-06', tenantNumber: '414737', landNumber: 'L3006', plotPropertyName: 'KHAMAS', mainTenant: 'FARIS AL SALAM TRADING', annualRent: 153000, areaSqFt: 37500, rentPerSqFt: 4.08 },
  { contractNo: 10881, plotNo: '0365-0114', location: 'Al Goze Industrial Second', leaseFrom: '2025-11-19', leaseTo: '2026-11-18', tenantNumber: '414737', landNumber: 'L2641', plotPropertyName: 'NANCY', mainTenant: 'FARIS AL SALAM TRADING', annualRent: 120000, areaSqFt: 20000, rentPerSqFt: 6 },
  { contractNo: 11740, plotNo: '0215-0358', location: 'Um Ramool', leaseFrom: '2025-11-20', leaseTo: '2026-11-19', tenantNumber: '414737', landNumber: 'L343', plotPropertyName: 'UMMRAMOOL', mainTenant: 'FARIS AL SALAM TRADING', annualRent: 76585.68, areaSqFt: 18771, rentPerSqFt: 4.08 },
  { contractNo: 11745, plotNo: '0613-0855', location: 'Ras Al Khor Industrial Second', leaseFrom: '2025-11-21', leaseTo: '2026-11-20', tenantNumber: '414737', landNumber: 'L5609', plotPropertyName: 'AL AMRI', mainTenant: 'FARIS AL SALAM TRADING', annualRent: 81600, areaSqFt: 20000, rentPerSqFt: 4.08 },
  { contractNo: 8737, plotNo: '0358-0465', location: 'Al Goze Third', leaseFrom: '2025-11-24', leaseTo: '2026-11-23', tenantNumber: '47902', landNumber: 'L2827', plotPropertyName: 'F1', mainTenant: 'AL JABER OPTICAL CENTRE LLC', annualRent: 610164, areaSqFt: 149550, rentPerSqFt: 4.08 },
  { contractNo: 8746, plotNo: '0368-0423', location: 'Al Goze Industrial Third', leaseFrom: '2025-11-30', leaseTo: '2026-11-29', tenantNumber: '47902', landNumber: 'L2943', plotPropertyName: 'F2', mainTenant: 'AL JABER OPTICAL CENTRE LLC', annualRent: 728345.28, areaSqFt: 178516, rentPerSqFt: 4.08 },
  { contractNo: 11831, plotNo: '0368-0693', location: 'Al Goze Industrial Third', leaseFrom: '2025-12-25', leaseTo: '2026-12-24', tenantNumber: '10005547', landNumber: 'L1548', plotPropertyName: 'MK', mainTenant: 'FAN ALSALAM', annualRent: 925743.84, areaSqFt: 226898, rentPerSqFt: 4.08 },
  { contractNo: 10056, plotNo: '0613-1655', location: 'Ras Al Khor Industrial Second', leaseFrom: '2025-12-28', leaseTo: '2026-12-27', tenantNumber: '414737', landNumber: 'L3119', plotPropertyName: 'M1', mainTenant: 'FARIS AL SALAM TRADING', annualRent: 118230, areaSqFt: 19705, rentPerSqFt: 6 },
  { contractNo: 8788, plotNo: '0215-0277', location: 'Um Ramool', leaseFrom: '2026-01-06', leaseTo: '2027-01-05', tenantNumber: '47902', landNumber: 'L209', plotPropertyName: 'F3', mainTenant: 'AL JABER OPTICAL CENTRE LLC', annualRent: 197920.8, areaSqFt: 48510, rentPerSqFt: 4.08 },
  { contractNo: 11846, plotNo: '0612-0103', location: 'Ras Al Khor Industrial First', leaseFrom: '2026-01-13', leaseTo: '2027-01-12', tenantNumber: '414737', landNumber: 'L2868', plotPropertyName: 'ESSA AUTO', mainTenant: 'FARIS AL SALAM TRADING', annualRent: 190550, areaSqFt: 38110, rentPerSqFt: 5 },
  { contractNo: 11848, plotNo: '0365-0327', location: 'Al Goze Industrial Second', leaseFrom: '2026-01-14', leaseTo: '2027-01-13', tenantNumber: '10005547', landNumber: 'L5032', plotPropertyName: 'BAFTA', mainTenant: 'FAN ALSALAM', annualRent: 149940, areaSqFt: 36750, rentPerSqFt: 4.08 },
  { contractNo: 10119, plotNo: '0369-0407', location: 'Al Goze Industrial Fourth', leaseFrom: '2026-02-01', leaseTo: '2027-01-31', tenantNumber: '414737', landNumber: 'L4962', plotPropertyName: 'KHAYAT 3', mainTenant: 'FARIS AL SALAM TRADING', annualRent: 100800, areaSqFt: 24000, rentPerSqFt: 4.2 },
  { contractNo: 9382, plotNo: '0368-0517', location: 'Al Goze Industrial Third', leaseFrom: '2026-04-24', leaseTo: '2027-04-23', tenantNumber: '47902', landNumber: 'L1605', plotPropertyName: 'KHAYAT 1', mainTenant: 'AL JABER OPTICAL CENTRE LLC', annualRent: 268502, areaSqFt: 59800, rentPerSqFt: 4.49 },
]

// ============================================
// DREC SUB LEASE DATA (from Excel)
// ============================================
const DREC_SUB_DATA = [
  { id: 1, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000077194', ejariNo: '0', subUnitNo: 'S.7,S6', subTenantName: 'PETME DOMESTIC PETS BOARDING (branch)', expiresOn: '2025-08-31', contractValue: 300000, subLeaseFee: 60000 },
  { id: 2, mainLeaseContractNo: 11405, plotPropertyName: 'H1', subContractNo: '05000000091587', ejariNo: '0120260223000421', subUnitNo: 'S11', subTenantName: 'CASSIDA MIDDLE EAST GENERAL TRADING L.L.', expiresOn: '2026-06-30', contractValue: 95000, subLeaseFee: 19000 },
  { id: 3, mainLeaseContractNo: 11405, plotPropertyName: 'H1', subContractNo: '05000000003355', ejariNo: '0120131106000320', subUnitNo: 'S12', subTenantName: 'AL SAD BUILDING MATERIALS L.L.C BR', expiresOn: '2026-06-30', contractValue: 98500, subLeaseFee: 19700 },
  { id: 4, mainLeaseContractNo: 11405, plotPropertyName: 'H1', subContractNo: '05000000042741', ejariNo: '0120260304004027', subUnitNo: 'S6', subTenantName: 'TANGENC MEDIA', expiresOn: '2026-06-29', contractValue: 62560, subLeaseFee: 12512 },
  { id: 5, mainLeaseContractNo: 11405, plotPropertyName: 'H1', subContractNo: '05000000076127', ejariNo: '0120251219001180', subUnitNo: 'S.5', subTenantName: 'SCALE INTERIOR DECORATION L.L.C', expiresOn: '2026-06-29', contractValue: 50030, subLeaseFee: 10006 },
  { id: 6, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000078964', ejariNo: '0120230109002065', subUnitNo: 'S10', subTenantName: 'MORGANTI TRADING LLC', expiresOn: '2025-10-25', contractValue: 150000, subLeaseFee: 30000 },
  { id: 7, mainLeaseContractNo: 11405, plotPropertyName: 'H1', subContractNo: '05000000031031', ejariNo: '0120251027003986', subUnitNo: 'S.4', subTenantName: 'J A S I BUILDING MATERIALS TRADING LLC', expiresOn: '2026-06-29', contractValue: 144795, subLeaseFee: 28959 },
  { id: 8, mainLeaseContractNo: 11405, plotPropertyName: 'H1', subContractNo: '05000000055004', ejariNo: '0120200428000147', subUnitNo: 'S01', subTenantName: 'J A S I BULDING MATERIALS TRADING L', expiresOn: '2026-06-29', contractValue: 45000, subLeaseFee: 9000 },
  { id: 9, mainLeaseContractNo: 11405, plotPropertyName: 'H1', subContractNo: '05000000060366', ejariNo: '0120250225004284', subUnitNo: 'S2', subTenantName: 'NEW QAMAR AL JASI BUILDING MATERIAL', expiresOn: '2026-06-29', contractValue: 46315, subLeaseFee: 9263 },
  { id: 10, mainLeaseContractNo: 11405, plotPropertyName: 'H1', subContractNo: '05000000060428', ejariNo: '0120250411001743', subUnitNo: 'S09', subTenantName: 'SCALE INTERIOR DECORATION LLC', expiresOn: '2026-06-26', contractValue: 39460, subLeaseFee: 7892 },
  { id: 11, mainLeaseContractNo: 11458, plotPropertyName: '80K', subContractNo: '05000000047737', ejariNo: '0120181107002767', subUnitNo: 'S11,S10,S01and more', subTenantName: 'IEX RECREATIONAL PLAYGROUND L.L.C', expiresOn: '2025-10-31', contractValue: 2500000, subLeaseFee: 500000 },
  { id: 12, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000085064', ejariNo: '0120240201004479', subUnitNo: 'S6', subTenantName: 'STATUS 67 AUTO REPAIR L.L.C', expiresOn: '2025-11-11', contractValue: 181815, subLeaseFee: 36363 },
  { id: 13, mainLeaseContractNo: 11557, plotPropertyName: 'MAITHA', subContractNo: '05000000043393', ejariNo: '0120180123003221', subUnitNo: 'S01,OF01', subTenantName: 'D S S STEEL L.L.C', expiresOn: '2025-12-31', contractValue: 2054400, subLeaseFee: 410880 },
  { id: 14, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000078864', ejariNo: '0120230101000070', subUnitNo: 'S.14', subTenantName: 'MENSHYKOV AUTO MECHANICAL REPAIR L.L.C', expiresOn: '2026-01-20', contractValue: 181815, subLeaseFee: 36363 },
  { id: 15, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000086364', ejariNo: '0120250411000848', subUnitNo: 'S2', subTenantName: 'F L G SHIPPING & LOGISTICS L.L.C', expiresOn: '2026-01-31', contractValue: 173910, subLeaseFee: 34782 },
  { id: 16, mainLeaseContractNo: 11480, plotPropertyName: 'Z', subContractNo: '05000000060474', ejariNo: '0120210202001751', subUnitNo: 'S04', subTenantName: 'ISSARCH HOME FURNITURE OWNER BY AFR', expiresOn: '2026-01-31', contractValue: 75000, subLeaseFee: 15000 },
  { id: 17, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000006247', ejariNo: '0120250507003895', subUnitNo: 'S.26', subTenantName: 'EPICURE CATERING SERVICES LLC', expiresOn: '2026-02-01', contractValue: 361460, subLeaseFee: 72292 },
  { id: 18, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000088976', ejariNo: '0120251010002783', subUnitNo: 'S8', subTenantName: 'hiCar Select LLC-FZ', expiresOn: '2026-02-15', contractValue: 75000, subLeaseFee: 15000 },
  { id: 19, mainLeaseContractNo: 11588, plotPropertyName: 'FALAZI', subContractNo: '05000000080679', ejariNo: '0120250414000886', subUnitNo: 'S06', subTenantName: 'ENCORE PRECISIONS GENERAL TRADING LLC', expiresOn: '2026-12-31', contractValue: 120821.92, subLeaseFee: 24164.38 },
  { id: 20, mainLeaseContractNo: 8788, plotPropertyName: 'F3', subContractNo: '05000000075429', ejariNo: '0120251006001004', subUnitNo: 'S07', subTenantName: 'POMECHAIN GENERAL TRADING LLC', expiresOn: '2026-02-24', contractValue: 100000, subLeaseFee: 20000 },
  { id: 21, mainLeaseContractNo: 11588, plotPropertyName: 'FALAZI', subContractNo: '05000000080678', ejariNo: '0120250414004026', subUnitNo: 'S05', subTenantName: 'ENCORE PRECISIONS GENERAL TRADING LLC', expiresOn: '2026-12-31', contractValue: 115835.62, subLeaseFee: 23167.12 },
  { id: 22, mainLeaseContractNo: 11534, plotPropertyName: 'FARIS WH', subContractNo: '05000000090243', ejariNo: '0120260421003692', subUnitNo: 'S06,S05', subTenantName: 'MR FURNITURE MANUFACTURING llc', expiresOn: '2026-08-11', contractValue: 102740, subLeaseFee: 20548 },
  { id: 23, mainLeaseContractNo: 11534, plotPropertyName: 'FARIS WH', subContractNo: '05000000090244', ejariNo: '0120251103004817', subUnitNo: 'S07', subTenantName: 'MR DESIGN INTERIOR DECORATION LLC', expiresOn: '2068-10-09', contractValue: 61645, subLeaseFee: 15000 },
  { id: 24, mainLeaseContractNo: 11534, plotPropertyName: 'FARIS WH', subContractNo: '05000000095480', ejariNo: '0120251031004223', subUnitNo: 'S04', subTenantName: 'T H E FURNITURE TRADING LLC', expiresOn: '2026-08-11', contractValue: 127400, subLeaseFee: 25480 },
  { id: 25, mainLeaseContractNo: 11588, plotPropertyName: 'FALAZI', subContractNo: '05000000081319', ejariNo: '0120250414000767', subUnitNo: 'S04', subTenantName: 'ENCORE PRECISIONS GENERAL TRADING LLC', expiresOn: '2026-12-31', contractValue: 108164.38, subLeaseFee: 21632.88 },
  { id: 26, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000098191', ejariNo: '0120260310003857', subUnitNo: 'S13', subTenantName: 'LIVING EDGE CONTRACTING L.L.C', expiresOn: '2026-07-31', contractValue: 50000, subLeaseFee: 10000 },
  { id: 27, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000026768', ejariNo: '0120150115002352', subUnitNo: 'S.12', subTenantName: 'HAYAT COMMUNICATIONS LLC', expiresOn: '2027-01-30', contractValue: 240000, subLeaseFee: 48000 },
  { id: 28, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000094594', ejariNo: '0120250709003332', subUnitNo: 'S3', subTenantName: '800 EXCLUSIVE HUB AUTO REPAIRING LL', expiresOn: '2026-07-19', contractValue: 204000, subLeaseFee: 40800 },
  { id: 29, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000050108', ejariNo: '0120190408000163', subUnitNo: 'S28', subTenantName: 'BALADI FOODSTUFF TRADING L.L.C', expiresOn: '2026-12-27', contractValue: 173910, subLeaseFee: 34782 },
  { id: 30, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000026674', ejariNo: '0120150113000024', subUnitNo: 'S.11', subTenantName: 'Sam Performance LLC', expiresOn: '2027-01-14', contractValue: 208692, subLeaseFee: 41738.4 },
  { id: 31, mainLeaseContractNo: 11740, plotPropertyName: 'UMMRAMOOL', subContractNo: '05000000072966', ejariNo: '0120250414000882', subUnitNo: 'S01', subTenantName: 'BASMAT AL TAMYZ METAL PRODUCTS COAT', expiresOn: '2026-03-24', contractValue: 80000, subLeaseFee: 16000 },
  { id: 32, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000074825', ejariNo: '0120250709003258', subUnitNo: 'S7', subTenantName: 'FIT OUT HEROES DECORATION DESIGN &', expiresOn: '2026-06-30', contractValue: 187097, subLeaseFee: 37419.4 },
  { id: 33, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000074823', ejariNo: '0', subUnitNo: 'S.01', subTenantName: 'F L G SHIPPING AND LOGISTICS L.L.C', expiresOn: '2026-07-31', contractValue: 170048, subLeaseFee: 34009.6 },
  { id: 34, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000084471', ejariNo: '0120251219001298', subUnitNo: 'S5', subTenantName: 'zaz global general trading llc', expiresOn: '2026-10-10', contractValue: 180000, subLeaseFee: 36000 },
  { id: 35, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000076513', ejariNo: '0120251110005448', subUnitNo: 'S4', subTenantName: 'PROTONE AUTO GENERAL REPAIRING CO LLC', expiresOn: '2026-10-20', contractValue: 181000, subLeaseFee: 36200 },
  { id: 36, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000077689', ejariNo: '0120251118005058', subUnitNo: 'S31', subTenantName: 'soltis interiors llc', expiresOn: '2026-10-05', contractValue: 106140, subLeaseFee: 21228 },
  { id: 37, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000076516', ejariNo: '0120250924001891', subUnitNo: 'S10', subTenantName: 'SAM PERFORMANCE L.L.C', expiresOn: '2026-09-09', contractValue: 195000, subLeaseFee: 39000 },
  { id: 38, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000076611', ejariNo: '0', subUnitNo: 'S.27', subTenantName: 'speed wheels auto carage', expiresOn: '2026-08-31', contractValue: 190906, subLeaseFee: 38181.2 },
  { id: 39, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000006246', ejariNo: '0', subUnitNo: 'S.25', subTenantName: 'EXPLORER PUBLISHING &DISTRIBUTION (L.L.C', expiresOn: '2027-03-09', contractValue: 194115, subLeaseFee: 38823 },
  { id: 40, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000078267', ejariNo: '0120221129000267', subUnitNo: 'S.18,S.19,S.20and more', subTenantName: 'snh packing general trading l l c', expiresOn: '2027-01-14', contractValue: 808920, subLeaseFee: 161784 },
  { id: 41, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000085142', ejariNo: '0120231201001236', subUnitNo: 'S9', subTenantName: '800MOTORGURU AUTO REPAIR SERVICES', expiresOn: '2026-11-14', contractValue: 185850, subLeaseFee: 37170 },
  { id: 42, mainLeaseContractNo: 11740, plotPropertyName: 'UMMRAMOOL', subContractNo: '05000000072965', ejariNo: '0120250409002555', subUnitNo: 'S04', subTenantName: 'BASMAT AL TAMYZ METAL PRODUCTS COAT', expiresOn: '2027-03-24', contractValue: 130000, subLeaseFee: 26000 },
  { id: 43, mainLeaseContractNo: 11494, plotPropertyName: 'KHAYAT 2', subContractNo: '05000000096877', ejariNo: '0120251119005862', subUnitNo: 'S07,S06,S.5and more', subTenantName: 'HEROS JOURNEY FITNESS CLUB L.L.C', expiresOn: '2027-01-31', contractValue: 1000000, subLeaseFee: 200000 },
  { id: 44, mainLeaseContractNo: 11494, plotPropertyName: 'KHAYAT 2', subContractNo: '05000000096697', ejariNo: '0120251125003266', subUnitNo: 'S3,S2,S1and more', subTenantName: 'ABRACADABRA KIDS AMUSEMENT ARCADE L.L.C', expiresOn: '2027-01-31', contractValue: 1000000, subLeaseFee: 200000 },
  { id: 45, mainLeaseContractNo: 11586, plotPropertyName: 'SUWAIDI', subContractNo: '05000000090959', ejariNo: '0120251211003891', subUnitNo: 'S04,S03', subTenantName: 'SPEEDO GARAGE', expiresOn: '2026-09-30', contractValue: 250000, subLeaseFee: 50000 },
  { id: 46, mainLeaseContractNo: 11586, plotPropertyName: 'SUWAIDI', subContractNo: '05000000097999', ejariNo: '0120260207001402', subUnitNo: 'S02,S01', subTenantName: 'LUXURY CAR CARE L.L.C', expiresOn: '2026-09-30', contractValue: 275000, subLeaseFee: 55000 },
  { id: 47, mainLeaseContractNo: 11587, plotPropertyName: 'AWAZI', subContractNo: '05000000069363', ejariNo: '0120211227003547', subUnitNo: 'S01', subTenantName: 'M B S CAR DESIGN SERVICES L.L.C', expiresOn: '2027-01-31', contractValue: 500000, subLeaseFee: 100000 },
  { id: 48, mainLeaseContractNo: 11405, plotPropertyName: 'H1', subContractNo: '05000000007717', ejariNo: '0120250502003696', subUnitNo: 'S8', subTenantName: 'safinat al bahar building materials llc', expiresOn: '2026-03-31', contractValue: 195000, subLeaseFee: 39000 },
  { id: 49, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000026579', ejariNo: '0120250508007013', subUnitNo: 'S.23,S.22,S.24and more', subTenantName: 'Fedex Express International BV (Dubai Br', expiresOn: '2026-03-31', contractValue: 755392, subLeaseFee: 151078.4 },
  { id: 50, mainLeaseContractNo: 11717, plotPropertyName: 'UMM SUQEIM', subContractNo: '05000000079697', ejariNo: '0120260510000551', subUnitNo: 'S3,S2,S1and more', subTenantName: 'AUTO A K SEVEN GARAGE LLC', expiresOn: '2027-03-31', contractValue: 1250000, subLeaseFee: 250000 },
  { id: 51, mainLeaseContractNo: 11588, plotPropertyName: 'FALAZI', subContractNo: '05000000078341', ejariNo: '0120251127000689', subUnitNo: 'S03', subTenantName: 'BHARMAL TRADERS', expiresOn: '2026-11-19', contractValue: 120000, subLeaseFee: 24000 },
  { id: 52, mainLeaseContractNo: 11588, plotPropertyName: 'FALAZI', subContractNo: '05000000078219', ejariNo: '0120221123001491', subUnitNo: 'S08', subTenantName: 'EMAAN INTERNATIONAL LLC', expiresOn: '2026-12-31', contractValue: 151667, subLeaseFee: 30333.4 },
  { id: 53, mainLeaseContractNo: 11480, plotPropertyName: 'Z', subContractNo: '05000000083684', ejariNo: '0120251009002238', subUnitNo: 'S08', subTenantName: 'COLLINGHAM LLC', expiresOn: '2026-03-31', contractValue: 46667, subLeaseFee: 9333.4 },
  { id: 54, mainLeaseContractNo: 11588, plotPropertyName: 'FALAZI', subContractNo: '05000000079266', ejariNo: '0120230123002660', subUnitNo: 'S07', subTenantName: 'EMAAN INTERNATIONAL LLC', expiresOn: '2026-12-31', contractValue: 135781, subLeaseFee: 27156.2 },
  { id: 55, mainLeaseContractNo: 11480, plotPropertyName: 'Z', subContractNo: '05000000050388', ejariNo: '0120250425000430', subUnitNo: 'S07', subTenantName: 'COLLINGHAM LLC', expiresOn: '2026-03-31', contractValue: 72000, subLeaseFee: 14400 },
  { id: 56, mainLeaseContractNo: 11480, plotPropertyName: 'Z', subContractNo: '05000000019121', ejariNo: '0120251009004413', subUnitNo: 'S03', subTenantName: 'Collingham L.L.C', expiresOn: '2026-03-31', contractValue: 44877, subLeaseFee: 8975.4 },
  { id: 57, mainLeaseContractNo: 11717, plotPropertyName: 'UMM SUQEIM', subContractNo: '05000000079930', ejariNo: '0120260409001788', subUnitNo: 'S9,S10', subTenantName: 'AP LUXURY SUPERCARS FOR CAR RENTAL CO.', expiresOn: '2027-04-20', contractValue: 325000, subLeaseFee: 65000 },
  { id: 58, mainLeaseContractNo: 10881, plotPropertyName: 'NANCY', subContractNo: '05000000092130', ejariNo: '0120250201001333', subUnitNo: 'S01', subTenantName: 'INDIANA BUILDING MATERIALS TRADING L.L.C', expiresOn: '2026-03-31', contractValue: 100000, subLeaseFee: 20000 },
  { id: 59, mainLeaseContractNo: 10881, plotPropertyName: 'NANCY', subContractNo: '05000000092131', ejariNo: '0120250203001133', subUnitNo: 'S02', subTenantName: 'INDIANA BUILDING MATERIALS TRADING L.L.C', expiresOn: '2026-03-31', contractValue: 100000, subLeaseFee: 20000 },
  { id: 60, mainLeaseContractNo: 10881, plotPropertyName: 'NANCY', subContractNo: '05000000092132', ejariNo: '0', subUnitNo: 'S03,S04', subTenantName: 'INDIANA BUILDING MATERIALS TRADING L.L.C', expiresOn: '2026-03-31', contractValue: 200000, subLeaseFee: 40000 },
  { id: 61, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000078882', ejariNo: '0120250414000737', subUnitNo: 'S.1B,S.1', subTenantName: 'BOX39 MOTORCYCLES & SCOOTERS MANUFACTURI', expiresOn: '2026-03-31', contractValue: 750000, subLeaseFee: 150000 },
  { id: 62, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000010487', ejariNo: '0120250415003695', subUnitNo: 'S30', subTenantName: 'spira power gasket manufacturing LLC', expiresOn: '2026-04-09', contractValue: 180000, subLeaseFee: 36000 },
  { id: 63, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000039638', ejariNo: '0120250415003717', subUnitNo: 'S29', subTenantName: 'SPIRA POWER GASKET MANUFACTURING LLC', expiresOn: '2026-04-09', contractValue: 180000, subLeaseFee: 36000 },
  { id: 64, mainLeaseContractNo: 11480, plotPropertyName: 'Z', subContractNo: '05000000006824', ejariNo: '0120260102002529', subUnitNo: 'S01', subTenantName: 'bolt star building materials trading LLC', expiresOn: '2026-07-30', contractValue: 60000, subLeaseFee: 12000 },
  { id: 65, mainLeaseContractNo: 11480, plotPropertyName: 'Z', subContractNo: '05000000078244', ejariNo: '0120260114005381', subUnitNo: 'S02', subTenantName: 'RHINO NANO CAR CARE LLC', expiresOn: '2026-07-30', contractValue: 62500, subLeaseFee: 12500 },
  { id: 66, mainLeaseContractNo: 11565, plotPropertyName: 'SHEIK BUTTI', subContractNo: '05000000045227', ejariNo: '0120250605000437', subUnitNo: 'S07', subTenantName: 'AUTO MYSTIQUE CAR CARE LLC', expiresOn: '2026-04-14', contractValue: 150000, subLeaseFee: 30000 },
  { id: 67, mainLeaseContractNo: 11740, plotPropertyName: 'UMMRAMOOL', subContractNo: '05000000093358', ejariNo: '0120250425001514', subUnitNo: 'S03', subTenantName: 'BROOK HAND TOOLS TRADING L.L.C', expiresOn: '2026-04-16', contractValue: 150000, subLeaseFee: 30000 },
  { id: 68, mainLeaseContractNo: 11480, plotPropertyName: 'Z', subContractNo: '05000000006825', ejariNo: '0120250602001021', subUnitNo: 'S05', subTenantName: 'Aqua world building materials trading (L', expiresOn: '2026-04-19', contractValue: 84000, subLeaseFee: 16800 },
  { id: 69, mainLeaseContractNo: 11480, plotPropertyName: 'Z', subContractNo: '05000000053487', ejariNo: '0120260128002109', subUnitNo: 'S06', subTenantName: 'AQUA WORLD BUILDING MATERIAL TRADING LLC', expiresOn: '2026-04-19', contractValue: 50630, subLeaseFee: 10126 },
  { id: 70, mainLeaseContractNo: 11534, plotPropertyName: 'FARIS WH', subContractNo: '05000000092056', ejariNo: '0120260111000855', subUnitNo: 'S02,S01', subTenantName: 'ARONAI L.L.C', expiresOn: '2026-06-14', contractValue: 300000, subLeaseFee: 60000 },
  { id: 71, mainLeaseContractNo: 11534, plotPropertyName: 'FARIS WH', subContractNo: '05000000092057', ejariNo: '0120260108007871', subUnitNo: 'S03', subTenantName: 'A B C RONAI GARMENTS MANUFACTURINGL.L.C', expiresOn: '2026-06-14', contractValue: 175000, subLeaseFee: 35000 },
  { id: 72, mainLeaseContractNo: 11717, plotPropertyName: 'UMM SUQEIM', subContractNo: '05000000079979', ejariNo: '0120260510000666', subUnitNo: 'S8,S7,S6and more', subTenantName: 'AUTO A K SEVEN GARAGE LLC', expiresOn: '2027-04-20', contractValue: 625000, subLeaseFee: 125000 },
  { id: 73, mainLeaseContractNo: 11565, plotPropertyName: 'SHEIK BUTTI', subContractNo: '05000000007517', ejariNo: '0120250804002903', subUnitNo: 'S01', subTenantName: 'INTERTECH VISION MIDDLE EAST LLC', expiresOn: '2026-06-23', contractValue: 250000, subLeaseFee: 50000 },
  { id: 74, mainLeaseContractNo: 11317, plotPropertyName: 'M2', subContractNo: '05000000074282', ejariNo: '0120250815002187', subUnitNo: 'S.4', subTenantName: 'ABRAO TRADING', expiresOn: '2026-04-30', contractValue: 56667, subLeaseFee: 11333.4 },
  { id: 75, mainLeaseContractNo: 11565, plotPropertyName: 'SHEIK BUTTI', subContractNo: '05000000064639', ejariNo: '0120250804006842', subUnitNo: 'S08', subTenantName: 'AUTO MYSTIQUE CAR CARE LLC', expiresOn: '2026-07-24', contractValue: 150000, subLeaseFee: 30000 },
  { id: 76, mainLeaseContractNo: 11565, plotPropertyName: 'SHEIK BUTTI', subContractNo: '05000000032046', ejariNo: '0120250926004051', subUnitNo: 'S03', subTenantName: 'SILICON ADVERTISING CO LLC', expiresOn: '2026-09-19', contractValue: 150000, subLeaseFee: 30000 },
  { id: 77, mainLeaseContractNo: 11565, plotPropertyName: 'SHEIK BUTTI', subContractNo: '05000000042411', ejariNo: '0120251127000697', subUnitNo: 'S02', subTenantName: 'INTERTECH VISION MIDDLE EAST (L.L.C)', expiresOn: '2026-11-20', contractValue: 250000, subLeaseFee: 50000 },
  { id: 78, mainLeaseContractNo: 11565, plotPropertyName: 'SHEIK BUTTI', subContractNo: '05000000023292', ejariNo: '0120251010002853', subUnitNo: 'S06', subTenantName: 'auto mystique car care L.L.C', expiresOn: '2026-09-10', contractValue: 150000, subLeaseFee: 30000 },
  { id: 79, mainLeaseContractNo: 11565, plotPropertyName: 'SHEIK BUTTI', subContractNo: '05000000039497', ejariNo: '0120250414000856', subUnitNo: 'S05', subTenantName: 'AUTO MYSTIQUE CAR CARE LLC', expiresOn: '2027-04-06', contractValue: 150000, subLeaseFee: 30000 },
  { id: 80, mainLeaseContractNo: 11317, plotPropertyName: 'M2', subContractNo: '05000000071095', ejariNo: '0120220224004202', subUnitNo: 'S.3', subTenantName: 'KAZIM GULF TRADERS', expiresOn: '2026-04-30', contractValue: 64550, subLeaseFee: 12910 },
  { id: 81, mainLeaseContractNo: 11317, plotPropertyName: 'M2', subContractNo: '05000000053476', ejariNo: '0120220126002389', subUnitNo: 'S.2', subTenantName: 'Stationery World', expiresOn: '2026-04-30', contractValue: 64550, subLeaseFee: 12910 },
  { id: 82, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000088272', ejariNo: '0120250814004510', subUnitNo: 'S11', subTenantName: 'RANT GAMING STUDIO L.L.C', expiresOn: '2026-04-30', contractValue: 150000, subLeaseFee: 30000 },
  { id: 83, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000086339', ejariNo: '0120250724004398', subUnitNo: 'S.22,S.21', subTenantName: 'PF INNOVATIONS CONSULTANCY', expiresOn: '2026-04-30', contractValue: 1260000, subLeaseFee: 252000 },
  { id: 84, mainLeaseContractNo: 10881, plotPropertyName: 'NANCY', subContractNo: '05000000098827', ejariNo: '0', subUnitNo: 'S01', subTenantName: 'INDIANA BUILDING MATERIALS TRADING L.L.C', expiresOn: '2027-03-31', contractValue: 337500, subLeaseFee: 67500 },
  { id: 85, mainLeaseContractNo: 10881, plotPropertyName: 'NANCY', subContractNo: '05000000098828', ejariNo: '0', subUnitNo: 'S03,S04,S02and more', subTenantName: 'INDIANA BUILDING MATERIALS TRADING L.L.C', expiresOn: '2027-03-31', contractValue: 1012500, subLeaseFee: 202500 },
  { id: 86, mainLeaseContractNo: 10119, plotPropertyName: 'KHAYAT 3', subContractNo: '05000000098618', ejariNo: '0120260409006397', subUnitNo: 'OFC,S 01,OPLand more', subTenantName: 'EZ OUTDOORS FOR AUTO ACCESSORIES FITTING', expiresOn: '2027-01-31', contractValue: 1350000, subLeaseFee: 270000 },
  { id: 87, mainLeaseContractNo: 10835, plotPropertyName: 'TAMIMI', subContractNo: '05000000078834', ejariNo: '0120221229002627', subUnitNo: 'S1', subTenantName: 'Mayhab General Land Transport L.L.C', expiresOn: '2026-12-31', contractValue: 384000, subLeaseFee: 76800 },
  { id: 88, mainLeaseContractNo: 10056, plotPropertyName: 'M1', subContractNo: '05000000095658', ejariNo: '0120250909004922', subUnitNo: 'S.3,S.1,S.2and more', subTenantName: 'KEETA DB DELIVERY SERVICES L.L.C', expiresOn: '2026-08-31', contractValue: 1100000, subLeaseFee: 220000 },
  { id: 89, mainLeaseContractNo: 11277, plotPropertyName: 'PROFAB', subContractNo: '05000000076731', ejariNo: '0120260127004217', subUnitNo: 'S.3,S.2,S01and more', subTenantName: 'PIONEERS BADMINTON HUB CLUB LLC', expiresOn: '2026-12-31', contractValue: 500000, subLeaseFee: 100000 },
  { id: 90, mainLeaseContractNo: 11313, plotPropertyName: 'A3 QASAB', subContractNo: '05000000096062', ejariNo: '0120251003004679', subUnitNo: 'S04,S02,S01and more', subTenantName: 'CARVOGUE GARAGE L.L.C', expiresOn: '2026-11-30', contractValue: 500000, subLeaseFee: 100000 },
  { id: 91, mainLeaseContractNo: 11745, plotPropertyName: 'AL AMRI', subContractNo: '05000000085247', ejariNo: '0120251229005128', subUnitNo: 'S02', subTenantName: 'E V T CAR SERVICE CENTER L.L.C', expiresOn: '2026-10-28', contractValue: 260548, subLeaseFee: 52109.6 },
  { id: 92, mainLeaseContractNo: 11745, plotPropertyName: 'AL AMRI', subContractNo: '05000000069664', ejariNo: '0120220104002440', subUnitNo: 'S01', subTenantName: 'ZHICHENGS FAMOUS FOR AUTO GENERAL R', expiresOn: '2026-10-28', contractValue: 203726, subLeaseFee: 40745.2 },
  { id: 93, mainLeaseContractNo: 11740, plotPropertyName: 'UMMRAMOOL', subContractNo: '05000000095277', ejariNo: '0', subUnitNo: 'OF02', subTenantName: 'S R K TRANSPORT L L C', expiresOn: '2026-06-07', contractValue: 37500, subLeaseFee: 7500 },
  { id: 94, mainLeaseContractNo: 11831, plotPropertyName: 'MK', subContractNo: '05000000074826', ejariNo: '0120251015001523', subUnitNo: 'S8', subTenantName: 'Cool Running Garage LLC', expiresOn: '2026-05-10', contractValue: 180960, subLeaseFee: 36192 },
  { id: 95, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000086574', ejariNo: '0120250521004797', subUnitNo: 'S.25', subTenantName: 'SWELL SPACE YOGA CENTER L.L.C', expiresOn: '2026-05-10', contractValue: 183420, subLeaseFee: 36684 },
  { id: 96, mainLeaseContractNo: 11317, plotPropertyName: 'M2', subContractNo: '05000000074056', ejariNo: '0120251219001188', subUnitNo: 'S06', subTenantName: 'Linen Obsession Textile Trading LLC', expiresOn: '2026-05-11', contractValue: 61220, subLeaseFee: 12244 },
  { id: 97, mainLeaseContractNo: 11317, plotPropertyName: 'M2', subContractNo: '05000000074509', ejariNo: '0', subUnitNo: 'S08', subTenantName: 'linen obsession textile', expiresOn: '2026-05-11', contractValue: 0, subLeaseFee: 0 },
  { id: 98, mainLeaseContractNo: 11740, plotPropertyName: 'UMMRAMOOL', subContractNo: '05000000097816', ejariNo: '0120260207001052', subUnitNo: 'OP02', subTenantName: 'STAR LINE DIESEL FUEL TRANSPORT & DISTRI', expiresOn: '2026-06-30', contractValue: 100000, subLeaseFee: 20000 },
  { id: 99, mainLeaseContractNo: 11575, plotPropertyName: 'REYAMI FACTORY', subContractNo: '05000000097876', ejariNo: '0120260129000298', subUnitNo: 'S01', subTenantName: 'J N F BESPOKE HOME FURNITURE MANUFACTURI', expiresOn: '2026-12-31', contractValue: 800000, subLeaseFee: 160000 },
  { id: 100, mainLeaseContractNo: 11724, plotPropertyName: 'KHAMAS', subContractNo: '05000000085997', ejariNo: '0120251015003457', subUnitNo: 'S05', subTenantName: 'TOP EXCELLENCE AUTO REPAIRING L.L.C', expiresOn: '2026-06-30', contractValue: 280000, subLeaseFee: 56000 },
  { id: 101, mainLeaseContractNo: 11724, plotPropertyName: 'KHAMAS', subContractNo: '05000000046359', ejariNo: '0120251211001135', subUnitNo: 'S03', subTenantName: 'Ghusia Bus Rental LLC', expiresOn: '2026-08-18', contractValue: 123750, subLeaseFee: 24750 },
  { id: 102, mainLeaseContractNo: 9529, plotPropertyName: 'DABAL', subContractNo: '05000000026677', ejariNo: '0120260122001454', subUnitNo: 'S05', subTenantName: 'WECARE PHOTOCOPYING', expiresOn: '2026-12-15', contractValue: 120000, subLeaseFee: 24000 },
  { id: 103, mainLeaseContractNo: 9529, plotPropertyName: 'DABAL', subContractNo: '05000000097757', ejariNo: '0120260120005612', subUnitNo: 'S07', subTenantName: 'PERLA BRIDAL TRADING L.L.C', expiresOn: '2026-12-19', contractValue: 100000, subLeaseFee: 20000 },
  { id: 104, mainLeaseContractNo: 9529, plotPropertyName: 'DABAL', subContractNo: '05000000097756', ejariNo: '0120260121000391', subUnitNo: 'S06', subTenantName: 'GREAT HILLS CONTRACTING L.L.C', expiresOn: '2026-11-30', contractValue: 100000, subLeaseFee: 20000 },
  { id: 105, mainLeaseContractNo: 10386, plotPropertyName: 'COLD STORAGE', subContractNo: '05000000080824', ejariNo: '0120250908003950', subUnitNo: 'S1', subTenantName: 'HIPPO BOX GENERAL TRADING LLC', expiresOn: '2026-08-31', contractValue: 750000, subLeaseFee: 150000 },
  { id: 106, mainLeaseContractNo: 8455, plotPropertyName: 'NAJD', subContractNo: '05000000065761', ejariNo: '0120250903001482', subUnitNo: 'WR01', subTenantName: 'SKY TEAM GARAGE L.L.C', expiresOn: '2026-07-31', contractValue: 300000, subLeaseFee: 60000 },
  { id: 107, mainLeaseContractNo: 8455, plotPropertyName: 'NAJD', subContractNo: '05000000065094', ejariNo: '0120250814003839', subUnitNo: 'OF02,S01', subTenantName: 'EXPRESS TRANSPORT L.L.C', expiresOn: '2026-06-30', contractValue: 80000, subLeaseFee: 16000 },
  { id: 108, mainLeaseContractNo: 8643, plotPropertyName: 'KHETBI', subContractNo: '05000000090435', ejariNo: '0120251015005627', subUnitNo: 'OP01', subTenantName: 'FUELBUDDY FUEL SUPPLY SERVICES L.L.C', expiresOn: '2026-10-15', contractValue: 450000, subLeaseFee: 90000 },
  { id: 109, mainLeaseContractNo: 8711, plotPropertyName: 'AMANA', subContractNo: '05000000077851', ejariNo: '0120250829000785', subUnitNo: 'OP01,OF01,S1and more', subTenantName: 'GALAXY DIESEL TRADING L.L.C', expiresOn: '2026-08-15', contractValue: 300000, subLeaseFee: 60000 },
  { id: 110, mainLeaseContractNo: 8484, plotPropertyName: 'QASIM SULTAN', subContractNo: '05000000070053', ejariNo: '0120260401002188', subUnitNo: 'S.3,S02,S01and more', subTenantName: 'Bright Plus Fitout', expiresOn: '2026-11-30', contractValue: 1100000, subLeaseFee: 220000 },
  { id: 111, mainLeaseContractNo: 10363, plotPropertyName: 'N/A', subContractNo: '05000000075484', ejariNo: '0120251219001558', subUnitNo: 'S01', subTenantName: 'FEB TECH GLASS WORKS LLC', expiresOn: '2026-08-31', contractValue: 800000, subLeaseFee: 160000 },
  { id: 112, mainLeaseContractNo: 8986, plotPropertyName: 'KK1', subContractNo: '05000000080224', ejariNo: '0120230313000452', subUnitNo: 'S06-B,S03-B,S04-B and more', subTenantName: 'CHAMPS SPORTS AND FITNESS CLUB', expiresOn: '2026-06-30', contractValue: 653736.33, subLeaseFee: 130747.27 },
  { id: 113, mainLeaseContractNo: 8986, plotPropertyName: 'KK1', subContractNo: '05000000080216', ejariNo: '0120230314001894', subUnitNo: 'S05-B', subTenantName: 'CHAMPS SPORTS AND FITNESS CLUB', expiresOn: '2026-06-30', contractValue: 303760.7, subLeaseFee: 60752.14 },
  { id: 114, mainLeaseContractNo: 8986, plotPropertyName: 'KK1', subContractNo: '05000000082737', ejariNo: '0120230725002539', subUnitNo: 'S06-A', subTenantName: 'GRMS TRADING LLC', expiresOn: '2027-01-23', contractValue: 575000, subLeaseFee: 115000 },
  { id: 115, mainLeaseContractNo: 8986, plotPropertyName: 'KK1', subContractNo: '05000000083560', ejariNo: '0', subUnitNo: 'S01-A', subTenantName: 'ROYAL SWISS AUTO SERVICES LLC (BRANCH)', expiresOn: '2026-09-30', contractValue: 639342, subLeaseFee: 127868.4 },
  { id: 116, mainLeaseContractNo: 8986, plotPropertyName: 'KK1', subContractNo: '05000000083495', ejariNo: '0120230905001769', subUnitNo: 'S02-A', subTenantName: 'M P WARRANTIES EXTENSION SERVICES LLC', expiresOn: '2026-09-30', contractValue: 477207, subLeaseFee: 95441.4 },
  { id: 117, mainLeaseContractNo: 8986, plotPropertyName: 'KK1', subContractNo: '05000000081201', ejariNo: '0120260122000015', subUnitNo: 'S08-A', subTenantName: 'TRANSCORP INTERNATIONAL LOGISTICS LLC', expiresOn: '2026-12-05', contractValue: 938475, subLeaseFee: 187695 },
  { id: 118, mainLeaseContractNo: 8986, plotPropertyName: 'KK1', subContractNo: '05000000096716', ejariNo: '0120251106006526', subUnitNo: 'S01-B', subTenantName: 'BLACK DETAILS CAR CARE L.L.C', expiresOn: '2026-10-31', contractValue: 623193, subLeaseFee: 124638.6 },
  { id: 119, mainLeaseContractNo: 8986, plotPropertyName: 'KK1', subContractNo: '05000000083259', ejariNo: '0120250715001687', subUnitNo: 'S07-A', subTenantName: 'PADEL POINT SPORTS & AMUSEMENT TRACKS L.', expiresOn: '2026-06-30', contractValue: 240000, subLeaseFee: 48000 },
  { id: 120, mainLeaseContractNo: 8986, plotPropertyName: 'KK1', subContractNo: '05000000083260', ejariNo: '0120250715001678', subUnitNo: 'S02-B', subTenantName: 'PADEL POINT SPORTS & AMUSEMENT TRACKS L.', expiresOn: '2026-06-30', contractValue: 360000, subLeaseFee: 72000 },
  { id: 121, mainLeaseContractNo: 8986, plotPropertyName: 'KK1', subContractNo: '05000000075879', ejariNo: '0120251009003755', subUnitNo: 'S03-A', subTenantName: 'CONSTRUCTION MULTIPLEX CONTRACTING COMPA', expiresOn: '2026-06-30', contractValue: 277480, subLeaseFee: 55496 },
  { id: 122, mainLeaseContractNo: 8986, plotPropertyName: 'KK1', subContractNo: '05000000076351', ejariNo: '0120251009003778', subUnitNo: 'S04-A', subTenantName: 'REPLICA THEMING INDUSTRIES LLC', expiresOn: '2026-08-14', contractValue: 277480, subLeaseFee: 55496 },
  { id: 123, mainLeaseContractNo: 8986, plotPropertyName: 'KK1', subContractNo: '05000000082180', ejariNo: '0120251110005381', subUnitNo: 'S05-A', subTenantName: 'NEW VISION CONCEPT LIGHTING L.L.C (BR)', expiresOn: '2026-10-31', contractValue: 285000, subLeaseFee: 57000 },
  { id: 124, mainLeaseContractNo: 11317, plotPropertyName: 'M2', subContractNo: '05000000068877', ejariNo: '0120251219001162', subUnitNo: 'S05', subTenantName: 'Linen Obsession Textile Trading', expiresOn: '2026-05-11', contractValue: 71015, subLeaseFee: 14203 },
  { id: 125, mainLeaseContractNo: 9023, plotPropertyName: 'JAFLA', subContractNo: '05000000077412', ejariNo: '0120251110005536', subUnitNo: 'S01', subTenantName: 'GREEN VALLEY ICE PLANT LLC', expiresOn: '2026-09-30', contractValue: 350000, subLeaseFee: 70000 },
  { id: 126, mainLeaseContractNo: 11317, plotPropertyName: 'M2', subContractNo: '05000000053457', ejariNo: '0120260101000672', subUnitNo: 'S.7', subTenantName: 'LINEN OBSESSION TEXTILE TRADING LLC', expiresOn: '2026-05-11', contractValue: 65315, subLeaseFee: 13063 },
  { id: 127, mainLeaseContractNo: 11317, plotPropertyName: 'M2', subContractNo: '05000000070416', ejariNo: '0120230321003061', subUnitNo: 'S.1', subTenantName: 'HUNTER TYRES L.L.C', expiresOn: '2026-05-11', contractValue: 32438.35, subLeaseFee: 6487.67 },
  { id: 128, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000079493', ejariNo: '0120250911006040', subUnitNo: 'S.12', subTenantName: 'LANA FITNESS CLUB LLC', expiresOn: '2026-05-15', contractValue: 350000, subLeaseFee: 70000 },
  { id: 129, mainLeaseContractNo: 9023, plotPropertyName: 'JAFLA', subContractNo: '05000000080641', ejariNo: '0120250701005804', subUnitNo: 'S2', subTenantName: 'SHAKIL DIESEL TRADING LLC', expiresOn: '2026-05-16', contractValue: 250000, subLeaseFee: 50000 },
  { id: 130, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000080369', ejariNo: '0120250423003484', subUnitNo: 'S04-B', subTenantName: 'VIP MOTORS LLC', expiresOn: '2027-04-15', contractValue: 750000, subLeaseFee: 150000 },
  { id: 131, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000098728', ejariNo: '0120260410004644', subUnitNo: 'S.1B,S.1', subTenantName: 'PREMIUM PLUS AUTOMOTIVE TRADING L.L.C', expiresOn: '2026-10-31', contractValue: 300000, subLeaseFee: 60000 },
  { id: 132, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000095588', ejariNo: '0120250903002005', subUnitNo: 'S.9.', subTenantName: 'THE VITRINE AUCTIONS ORGANIZING', expiresOn: '2026-08-28', contractValue: 175000, subLeaseFee: 0 },
  { id: 133, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000094700', ejariNo: '0120250715003136', subUnitNo: 'S12', subTenantName: 'Hypercar Collective L.L.C-FZ', expiresOn: '2026-06-30', contractValue: 500000, subLeaseFee: 100000 },
  { id: 134, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000084310', ejariNo: '0', subUnitNo: 'S11', subTenantName: 'HICAR AUCTIONS', expiresOn: '2026-11-28', contractValue: 550000, subLeaseFee: 110000 },
  { id: 135, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000084069', ejariNo: '0120260121008495', subUnitNo: 'S.2', subTenantName: 'GRAND DANCE ACADEMY L.L.C', expiresOn: '2026-11-30', contractValue: 375000, subLeaseFee: 75000 },
  { id: 136, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000082435', ejariNo: '0120250814004409', subUnitNo: 'S13', subTenantName: 'TRONIK AUTOMOTIVE AUTO GENERAL REPAIRING', expiresOn: '2026-08-15', contractValue: 150000, subLeaseFee: 30000 },
  { id: 137, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000089395', ejariNo: '0120250929002040', subUnitNo: 'S.3', subTenantName: 'VIP HOME GALLERY TRADING L.L.C', expiresOn: '2026-09-20', contractValue: 200000, subLeaseFee: 40000 },
  { id: 138, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000097779', ejariNo: '0120260122005342', subUnitNo: 'S4', subTenantName: 'D B I MOTORS WRAPPING L.L.C', expiresOn: '2026-12-31', contractValue: 200000, subLeaseFee: 40000 },
  { id: 139, mainLeaseContractNo: 8737, plotPropertyName: 'F1', subContractNo: '05000000097782', ejariNo: '0120260123003043', subUnitNo: 'S.5', subTenantName: 'LUXURY PLUS MOTORWORKS L.L.C', expiresOn: '2026-12-31', contractValue: 270833.5, subLeaseFee: 54166.6 },
  { id: 140, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000071890', ejariNo: '0120250723003854', subUnitNo: 'S.1', subTenantName: 'MKV CAR RENTAL', expiresOn: '2026-05-20', contractValue: 350000, subLeaseFee: 70000 },
  { id: 141, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000080823', ejariNo: '0120250905000417', subUnitNo: 'S20', subTenantName: 'CHAMP BELTS BY GRIDIN MARTIAL ARTS CLUB', expiresOn: '2026-05-25', contractValue: 397000, subLeaseFee: 79400 },
  { id: 142, mainLeaseContractNo: 11588, plotPropertyName: 'FALAZI', subContractNo: '05000000081688', ejariNo: '0120250526003989', subUnitNo: 'S02', subTenantName: 'EMAAN INTERNATIONAL LLC', expiresOn: '2026-05-19', contractValue: 130000, subLeaseFee: 26000 },
  { id: 143, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000072683', ejariNo: '0120250625004672', subUnitNo: 'S.3', subTenantName: 'MONARCA GENERAL TRADING LLC', expiresOn: '2026-05-31', contractValue: 250000, subLeaseFee: 50000 },
  { id: 144, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000094350', ejariNo: '0120250701004197', subUnitNo: 'S4', subTenantName: 'PARMASTONE GENERAL TRADING CO. L.L.C', expiresOn: '2026-06-10', contractValue: 300000, subLeaseFee: 60000 },
  { id: 145, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000074023', ejariNo: '0120251127000588', subUnitNo: 'S.6', subTenantName: 'IDMI COFFEE ROASTING AND PACKAGING', expiresOn: '2026-06-14', contractValue: 252000, subLeaseFee: 50400 },
  { id: 146, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000081326', ejariNo: '0120250714004403', subUnitNo: 'S.5', subTenantName: 'THE BRIDAL ATELIER GARMENTS TRADING', expiresOn: '2026-06-30', contractValue: 330000, subLeaseFee: 66000 },
  { id: 147, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000088450', ejariNo: '0120250714004429', subUnitNo: 'S.16', subTenantName: 'AREA 51 GENERAL TRADING L.L.C', expiresOn: '2026-06-30', contractValue: 325000, subLeaseFee: 65000 },
  { id: 148, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000081649', ejariNo: '0120251208004025', subUnitNo: 'S.15', subTenantName: 'PIROUETTE GYMNASTICS CLUB EST', expiresOn: '2026-07-31', contractValue: 160000, subLeaseFee: 32000 },
  { id: 149, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000076976', ejariNo: '0120251030005645', subUnitNo: 'S.29,S26', subTenantName: 'DGC LUXURY CAR RENTAL', expiresOn: '2026-08-31', contractValue: 350000, subLeaseFee: 70000 },
  { id: 150, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000090771', ejariNo: '0', subUnitNo: 'S28', subTenantName: 'CASA MURADO BUILDING MATERIALS TRADING C', expiresOn: '2026-09-09', contractValue: 350000, subLeaseFee: 70000 },
  { id: 151, mainLeaseContractNo: 11405, plotPropertyName: 'H1', subContractNo: '05000000075659', ejariNo: '0120250701003111', subUnitNo: 'S.3', subTenantName: 'JASI BUILDING MATERIALS TRADING L.L.C', expiresOn: '2026-05-31', contractValue: 168000, subLeaseFee: 33600 },
  { id: 152, mainLeaseContractNo: 11588, plotPropertyName: 'FALAZI', subContractNo: '05000000074843', ejariNo: '0120250605000433', subUnitNo: 'S01', subTenantName: 'FIRESHIELD SPECIALISTS LLC', expiresOn: '2026-05-31', contractValue: 100000, subLeaseFee: 20000 },
  { id: 153, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000081180', ejariNo: '0120251010002837', subUnitNo: 'S18,S17', subTenantName: 'VISIONARY FURNITURE TRADING LLC', expiresOn: '2026-10-01', contractValue: 892500, subLeaseFee: 178500 },
  { id: 154, mainLeaseContractNo: 11565, plotPropertyName: 'SHEIK BUTTI', subContractNo: '05000000082665', ejariNo: '0120250612003427', subUnitNo: 'S04', subTenantName: 'AVENUE RENT A CAR LLC', expiresOn: '2026-05-31', contractValue: 250000, subLeaseFee: 50000 },
  { id: 155, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000077300', ejariNo: '0120260107004778', subUnitNo: 'S.24', subTenantName: 'FIVE678 ARTS AND ENTERTAINMENT L.L.C S.O', expiresOn: '2026-11-21', contractValue: 200000, subLeaseFee: 40000 },
  { id: 156, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000077515', ejariNo: '0120221017004558', subUnitNo: 'S23', subTenantName: 'BESKAR TECHNOLOGY LLC', expiresOn: '2026-12-04', contractValue: 200000, subLeaseFee: 40000 },
  { id: 157, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000070625', ejariNo: '0120220215000403', subUnitNo: 'S.2', subTenantName: 'MUD HOUSE HANDICRAFT WORKS', expiresOn: '2027-01-23', contractValue: 225000, subLeaseFee: 45000 },
  { id: 158, mainLeaseContractNo: 11740, plotPropertyName: 'UMMRAMOOL', subContractNo: '05000000063263', ejariNo: '0120251030005620', subUnitNo: 'S02', subTenantName: 'DASHGO LOGISTICS L.L.C', expiresOn: '2026-05-31', contractValue: 90000, subLeaseFee: 18000 },
  { id: 159, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000070724', ejariNo: '0120220222000352', subUnitNo: 'S19', subTenantName: 'HOTELITY GENERAL TRADING L.L.C', expiresOn: '2027-01-31', contractValue: 200000, subLeaseFee: 40000 },
  { id: 160, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000093025', ejariNo: '0120260326000406', subUnitNo: 'S.9', subTenantName: 'OIKOS ME TECHNICAL SERVICES L.L.C', expiresOn: '2027-03-09', contractValue: 650000, subLeaseFee: 130000 },
  { id: 161, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000084507', ejariNo: '0120231025001713', subUnitNo: 'S.10', subTenantName: 'BOCASU SPECIALTY COFFEE L.L.C', expiresOn: '2027-03-20', contractValue: 300000, subLeaseFee: 60000 },
  { id: 162, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000079535', ejariNo: '0120250410004492', subUnitNo: 'S13', subTenantName: 'ROCKY ROAD BOXING CLUB LLC', expiresOn: '2027-03-23', contractValue: 350000, subLeaseFee: 70000 },
  { id: 163, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000098277', ejariNo: '0120260225004994', subUnitNo: 'S.14', subTenantName: 'REM STUDIO L.L.C S.O.C', expiresOn: '2027-04-10', contractValue: 600000, subLeaseFee: 120000 },
  { id: 164, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000098422', ejariNo: '0120260312001078', subUnitNo: 'S07', subTenantName: 'FIVE ELEMENTS FURNITURE TRADING L.L.C', expiresOn: '2027-05-22', contractValue: 250000, subLeaseFee: 50000 },
  { id: 165, mainLeaseContractNo: 9026, plotPropertyName: 'AUTO MILLENIUM', subContractNo: '05000000077822', ejariNo: '0', subUnitNo: 'S02,S10,S01and more', subTenantName: 'ALLIED ENTERPRISE LLC', expiresOn: '2027-03-14', contractValue: 2400000, subLeaseFee: 480000 },
  { id: 166, mainLeaseContractNo: 8746, plotPropertyName: 'F2', subContractNo: '05000000098622', ejariNo: '0120260409006554', subUnitNo: 'S31', subTenantName: 'CNTXT ARTIFICIAL INTELLIGENCE DWC-LLC', expiresOn: '2027-06-20', contractValue: 1800000, subLeaseFee: 360000 },
  { id: 167, mainLeaseContractNo: 8788, plotPropertyName: 'F3', subContractNo: '05000000085314', ejariNo: '0120231212002970', subUnitNo: 'S08', subTenantName: 'A T B Aircraft Maintenance est', expiresOn: '2026-09-25', contractValue: 119180, subLeaseFee: 23836 },
  { id: 168, mainLeaseContractNo: 8788, plotPropertyName: 'F3', subContractNo: '05000000094194', ejariNo: '0120250612004687', subUnitNo: 'S12', subTenantName: 'THE DEEP SEAFOOD CO.(L.L.C)(DUBAI)(BRANC', expiresOn: '2026-05-31', contractValue: 150000, subLeaseFee: 30000 },
  { id: 169, mainLeaseContractNo: 8788, plotPropertyName: 'F3', subContractNo: '05000000079630', ejariNo: '0120230209002221', subUnitNo: 'S11', subTenantName: 'H F H GENERAL TRADING LLC', expiresOn: '2026-09-25', contractValue: 79070, subLeaseFee: 15814 },
  { id: 170, mainLeaseContractNo: 8788, plotPropertyName: 'F3', subContractNo: '05000000082261', ejariNo: '0120250701002467', subUnitNo: 'S01', subTenantName: 'GULF PACKAGING INDUSTRY L.L.C BR', expiresOn: '2026-06-02', contractValue: 112500, subLeaseFee: 22500 },
  { id: 171, mainLeaseContractNo: 8788, plotPropertyName: 'F3', subContractNo: '05000000075182', ejariNo: '0120250701006010', subUnitNo: 'S04,S03,S02and more', subTenantName: 'GULF PACKAGING INDUSTRY L.L.C', expiresOn: '2026-06-02', contractValue: 337500, subLeaseFee: 67500 },
  { id: 172, mainLeaseContractNo: 8788, plotPropertyName: 'F3', subContractNo: '05000000075240', ejariNo: '0120250701001733', subUnitNo: 'S06,S05,S10and more', subTenantName: 'ADAM ALLYS (L.L.C)', expiresOn: '2026-09-25', contractValue: 327452, subLeaseFee: 65490.4 },
  { id: 173, mainLeaseContractNo: 8526, plotPropertyName: null, subContractNo: '05000000098791', ejariNo: null, subUnitNo: 'LBRC-S01', subTenantName: 'ASTRA LINE MOBILE PHONES TRADING LLC (BR', expiresOn: '2027-05-04', contractValue: 90000, subLeaseFee: 18000 },
  { id: 174, mainLeaseContractNo: 8526, plotPropertyName: null, subContractNo: '05000000093588', ejariNo: null, subUnitNo: 'LBRC0027,LBRC0028,LBRC0029and more', subTenantName: 'SHALOOM REAL ESTATE BUYING AND SELLING B', expiresOn: '2026-05-31', contractValue: 144000, subLeaseFee: 28800 },
  { id: 175, mainLeaseContractNo: 8526, plotPropertyName: null, subContractNo: '05000000098547', ejariNo: '0120260324001859', subUnitNo: 'S.9', subTenantName: 'AQUAGALLERY TRADING L.L.C', expiresOn: '2027-04-30', contractValue: 550000, subLeaseFee: 110000 },
  { id: 176, mainLeaseContractNo: 8526, plotPropertyName: null, subContractNo: '05000000098543', ejariNo: '0120260325003302', subUnitNo: 'WHA-3', subTenantName: 'BROWN BUTTER CAFE & RESTAURANT L.L.C', expiresOn: '2027-05-31', contractValue: 520000, subLeaseFee: 104000 },
]

async function main() {
  console.log('🌱 Seeding database with DREC data...')

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
  // COMPANIES (from "Main tenant / Us" column)
  // ============================================
  const companyNames = [...new Set(DREC_MAIN_DATA.map(d => d.mainTenant).filter(Boolean))] as string[]
  const companyMap: Record<string, any> = {}
  
  // Add DREC as the default company
  const drecCompany = await prisma.company.create({
    data: {
      name: 'DREC Properties',
      tradeName: 'DREC',
      registrationNo: 'REG-DREC-001',
      tradeLicenseNo: 'TL-DREC-001',
      address: 'Dubai, UAE',
      city: 'Dubai',
      country: 'UAE',
      phone: '+971-4-333-4444',
      email: 'leasing@drec.ae',
      contactPerson: 'DREC Management',
      isActive: true
    }
  })
  companyMap['DREC'] = drecCompany

  for (let i = 0; i < companyNames.length; i++) {
    const name = companyNames[i]!
    const company = await prisma.company.create({
      data: {
        name,
        tradeName: name.split(' ').slice(0, 2).join(' '),
        registrationNo: `REG-COMP-${(i + 2).toString().padStart(4, '0')}`,
        address: 'Dubai, UAE',
        city: 'Dubai',
        country: 'UAE',
        isActive: true
      }
    })
    companyMap[name] = company
  }
  console.log(`✅ Companies created (${companyNames.length + 1})`)

  // ============================================
  // PROPERTIES (one per DREC MAIN row)
  // ============================================
  const propertyMap: Record<number, any> = {}
  
  for (const row of DREC_MAIN_DATA) {
    const companyName = row.mainTenant || 'DREC'
    const companyId = companyMap[companyName]?.id || drecCompany.id
    const propertyName = row.plotPropertyName || `Plot ${row.plotNo}`
    
    const property = await prisma.property.create({
      data: {
        name: propertyName,
        propertyCode: `PROP-${row.contractNo}`,
        propertyType: PropertyType.INDUSTRIAL,
        description: `DREC Property - Contract #${row.contractNo}`,
        address: row.location || 'Dubai, UAE',
        city: 'Dubai',
        area: row.location,
        plotNumber: row.plotNo,
        totalArea: row.areaSqFt,
        builtUpArea: row.areaSqFt,
        companyId,
        isActive: true
      }
    })
    propertyMap[row.contractNo] = property
  }
  console.log(`✅ Properties created (${DREC_MAIN_DATA.length})`)

  // ============================================
  // MAIN LEASES (from DREC MAIN)
  // ============================================
  const mainLeaseMap: Record<number, any> = {}

  for (const row of DREC_MAIN_DATA) {
    const companyName = row.mainTenant || 'DREC'
    const companyId = companyMap[companyName]?.id || drecCompany.id
    const property = propertyMap[row.contractNo]

    // Determine status based on dates
    const endDate = new Date(row.leaseTo)
    const now = new Date()
    const startDate = new Date(row.leaseFrom)
    let status: LeaseStatus = LeaseStatus.ACTIVE
    if (endDate < now) status = LeaseStatus.EXPIRED
    else if (startDate > now) status = LeaseStatus.DRAFT

    const mainLease = await prisma.mainLease.create({
      data: {
        contractNo: row.contractNo,
        leaseNumber: `ML-${row.contractNo}`,
        startDate: new Date(row.leaseFrom),
        endDate: new Date(row.leaseTo),
        rentAmount: row.annualRent,
        rentFrequency: 'annual',
        landlordName: 'DREC Properties',
        landlordContact: '+971-4-333-4444',
        landlordEmail: 'leasing@drec.ae',
        tenantNumber: row.tenantNumber,
        landNumber: row.landNumber,
        annualRentPerSqFt: row.rentPerSqFt,
        location: row.location,
        status,
        propertyId: property.id,
        companyId,
        isActive: true
      }
    })
    mainLeaseMap[row.contractNo] = mainLease
  }
  console.log(`✅ Main Leases created (${DREC_MAIN_DATA.length})`)

  // ============================================
  // SUBTENANTS (unique names from DREC SUB)
  // ============================================
  const subtenantNames = [...new Set(DREC_SUB_DATA.map(d => d.subTenantName))]
  const subtenantMap: Record<string, any> = {}

  for (const name of subtenantNames) {
    const subtenant = await prisma.subtenant.create({
      data: {
        name: name!,
        contactPerson: name!.split(' ').slice(0, 2).join(' '),
        phone: '+971-50-000-0000',
        email: `${name!.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10)}@example.com`,
        city: 'Dubai',
        country: 'UAE',
        isActive: true
      }
    })
    subtenantMap[name!] = subtenant
  }
  console.log(`✅ Subtenants created (${subtenantNames.length})`)

  // ============================================
  // UNITS + SUBLEASES + EJARI (from DREC SUB)
  // ============================================
  let unitCount = 0
  let subleaseCount = 0
  let ejariCount = 0
  // Track unit numbers per property to avoid duplicates
  const unitNumberCounter: Record<string, number> = {}

  for (const sub of DREC_SUB_DATA) {
    // Find the main lease by contractNo
    const mainLease = mainLeaseMap[sub.mainLeaseContractNo]
    if (!mainLease) {
      console.log(`⚠️  Skipping sub lease ${sub.id} - main lease ${sub.mainLeaseContractNo} not found`)
      continue
    }

    // Find or create the property
    const property = propertyMap[sub.mainLeaseContractNo]
    if (!property) continue

    // Make unit number unique per property
    const unitKey = `${property.id}-${sub.subUnitNo}`
    if (!unitNumberCounter[unitKey]) {
      unitNumberCounter[unitKey] = 0
    }
    unitNumberCounter[unitKey]++
    const uniqueUnitNumber = unitNumberCounter[unitKey] > 1 
      ? `${sub.subUnitNo}-${unitNumberCounter[unitKey]}` 
      : sub.subUnitNo

    // Create unit
    const unit = await prisma.unit.create({
      data: {
        unitNumber: uniqueUnitNumber,
        unitCode: `U-${sub.mainLeaseContractNo}-${sub.id}`,
        unitType: UnitType.WAREHOUSE,
        status: UnitStatus.OCCUPIED,
        area: property.totalArea ? property.totalArea / 10 : null,
        rentAmount: sub.contractValue,
        propertyId: property.id,
        isActive: true
      }
    })
    unitCount++

    // Determine sublease status
    const subEndDate = new Date(sub.expiresOn)
    const nowDate = new Date()
    let subStatus: SubleaseStatus = SubleaseStatus.ACTIVE
    if (subEndDate < nowDate) subStatus = SubleaseStatus.EXPIRED

    // Create sublease
    const subtenant = subtenantMap[sub.subTenantName]
    if (!subtenant) continue

    const sublease = await prisma.sublease.create({
      data: {
        subleaseNumber: sub.subContractNo,
        contractValue: sub.contractValue,
        subLeaseFee: sub.subLeaseFee,
        startDate: mainLease.startDate,
        endDate: subEndDate,
        rentAmount: sub.contractValue,
        rentFrequency: 'annual',
        status: subStatus,
        mainLeaseId: mainLease.id,
        unitId: unit.id,
        subtenantId: subtenant.id,
        isActive: true
      }
    })
    subleaseCount++

    // Create EJARI registration if there's an ejari number
    if (sub.ejariNo && sub.ejariNo !== '0') {
      await prisma.ejari.create({
        data: {
          ejariNumber: sub.ejariNo,
          registrationDate: mainLease.startDate,
          expiryDate: subEndDate,
          status: EjariStatus.REGISTERED,
          subleaseId: sublease.id,
          subtenantId: subtenant.id,
          isActive: true
        }
      })
      ejariCount++
    } else if (sub.ejariNo === '0' || !sub.ejariNo) {
      // Pending EJARI
      await prisma.ejari.create({
        data: {
          ejariNumber: null,
          registrationDate: null,
          expiryDate: subEndDate,
          status: EjariStatus.PENDING,
          notes: 'EJARI registration pending',
          subleaseId: sublease.id,
          subtenantId: subtenant.id,
          isActive: true
        }
      })
      ejariCount++
    }
  }
  console.log(`✅ Units created (${unitCount})`)
  console.log(`✅ Subleases created (${subleaseCount})`)
  console.log(`✅ EJARI registrations created (${ejariCount})`)

  // ============================================
  // COMPLIANCE ALERTS
  // ============================================
  const now2 = new Date()
  
  // Generate compliance alerts for expiring leases
  for (const row of DREC_MAIN_DATA) {
    const endDate = new Date(row.leaseTo)
    const daysUntil = Math.ceil((endDate.getTime() - now2.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil < 90 && daysUntil > -30) {
      const mainLease = mainLeaseMap[row.contractNo]
      if (mainLease) {
        await prisma.complianceAlert.create({
          data: {
            type: ComplianceType.LEASE_EXPIRY,
            title: `Main Lease ML-${row.contractNo} Expiring`,
            description: `Main lease for ${row.plotPropertyName || row.plotNo} ${daysUntil < 0 ? 'has expired' : `expires in ${daysUntil} days`}.`,
            entityType: 'MainLease',
            entityId: mainLease.id,
            expiryDate: endDate,
            daysUntilExpiry: daysUntil,
            status: daysUntil < 0 ? ComplianceStatus.EXPIRED : daysUntil < 30 ? ComplianceStatus.ACTION_REQUIRED : ComplianceStatus.WARNING,
            isNotified: false
          }
        })
      }
    }
  }
  console.log('✅ Compliance alerts created')

  // ============================================
  // NOTIFICATIONS
  // ============================================
  await Promise.all([
    prisma.notification.create({
      data: { type: NotificationType.SYSTEM, title: 'Welcome to DREC PMS', message: 'Welcome to the DREC Property Management System with real lease data.', isRead: false, userId: superAdmin.id }
    }),
    prisma.notification.create({
      data: { type: NotificationType.LEASE_EXPIRY, title: 'Lease Expiry Review', message: 'Please review the dashboard for leases approaching expiry.', isRead: false, userId: propertyManager.id }
    }),
  ])
  console.log('✅ Notifications created')

  console.log('🎉 Seeding completed successfully!')
  console.log('')
  console.log('📋 Summary:')
  console.log(`  Main Leases: ${DREC_MAIN_DATA.length}`)
  console.log(`  Sub Leases: ${DREC_SUB_DATA.length}`)
  console.log(`  Unique Subtenants: ${subtenantNames.length}`)
  console.log(`  Companies: ${companyNames.length + 1}`)
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
