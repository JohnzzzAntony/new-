# DREC Property Management System

A comprehensive, production-ready Property Management System built for Dubai Real Estate Corporation (DREC). Manages the complete hierarchy from DREC → Internal Tenant Company → Property/Plot → Unit/Warehouse → Subtenant → EJARI.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM (SQLite)
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React

## Features

### 12 Integrated Modules

1. **Auth/RBAC** - Role-based access control (Super Admin, Property Manager, Finance User, Read Only)
2. **Company Management** - Internal tenant companies with trade license tracking
3. **Property/Plot Management** - Industrial zones with plot tracking (Ras Al Khor, Al Goze, Um Ramool)
4. **Unit/Warehouse Management** - Status tracking (Vacant, Occupied, Under Maintenance, Reserved)
5. **Main Lease Management** - DREC lease contracts with real contract data
6. **Subtenant Management** - Subtenant details with trade license & EJARI tracking
7. **Sublease Management** - Sub-lease contracts with fee calculations
8. **EJARI Registration** - Dubai rental registration tracking
9. **Rent Collection** - Invoice & receipt management with payment tracking
10. **Compliance** - Automated alerts for lease/EJARI/trade license expiries
11. **Dashboard** - KPI metrics, charts, occupancy rates, revenue tracking
12. **Reporting** - Export capabilities and data analytics

### Data Integration

Real DREC data from spreadsheet including:
- **42 Main Leases** with contract numbers, plot numbers, locations, tenant details
- **100+ Subleases** with sub-contract numbers, EJARI numbers, contract values
- **9 Internal Tenant Companies** (AL JABER, FAN ALSALAM, FARIS AL SALAM, etc.)
- **41 Properties** across industrial zones
- **172 Units/Warehouses** with full status tracking
- **36+ EJARI Registrations**

## Getting Started

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm

### Installation

```bash
# Install dependencies
bun install

# Set up database
bun run db:push

# Seed with DREC data
bunx prisma db seed

# Start development server
bun run dev
```

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@drec.ae | admin123 |
| Property Manager | manager@drec.ae | manager123 |
| Finance User | finance@drec.ae | finance123 |
| Read Only | viewer@drec.ae | viewer123 |

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes for all modules
│   │   ├── auth/         # Authentication
│   │   ├── companies/    # Company CRUD
│   │   ├── compliance/   # Compliance alerts
│   │   ├── dashboard/    # Dashboard KPIs
│   │   ├── ejari/        # EJARI management
│   │   ├── invoices/     # Invoice management
│   │   ├── main-leases/  # Main lease CRUD
│   │   ├── plots/        # Plot management
│   │   ├── properties/   # Property CRUD
│   │   ├── receipts/     # Receipt management
│   │   ├── reports/      # Reporting & export
│   │   ├── subleases/    # Sublease CRUD
│   │   ├── subtenants/   # Subtenant CRUD
│   │   └── units/        # Unit CRUD
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main entry (login/app shell)
├── components/
│   ├── common/           # Shared components (DataTable, ModalForm, ModulePage)
│   ├── companies/        # Company page
│   ├── compliance/       # Compliance page
│   ├── dashboard/        # Dashboard page with charts
│   ├── ejari/            # EJARI page
│   ├── leases/           # Main leases page
│   ├── login/            # Login page
│   ├── layout/           # Header & Sidebar
│   ├── properties/       # Properties page
│   ├── rent/             # Rent collection page
│   ├── reports/          # Reports page
│   ├── subleases/        # Subleases page
│   ├── subtenants/       # Subtenants page
│   ├── units/            # Units page
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── api.ts            # API client with CRUD helpers
│   ├── auth.ts           # Auth utilities
│   ├── db.ts             # Prisma client
│   ├── store.ts          # Zustand state
│   └── utils.ts          # Utility functions
└── hooks/                # Custom hooks

prisma/
├── schema.prisma         # Database schema (all 12 modules)
└── seed.ts               # DREC data seeder
```

## Database Schema

- **User** - Authentication & RBAC
- **Company** - Internal tenant companies
- **Property** - Properties/plots with zones
- **Plot** - Individual plot tracking
- **Unit** - Warehouses/units with status
- **MainLease** - DREC main lease contracts
- **Subtenant** - Subtenant details
- **Sublease** - Sub-lease contracts
- **Ejari** - EJARI registrations
- **Invoice** - Rent invoices
- **Receipt** - Payment receipts
- **ComplianceAlert** - Compliance tracking
- **Document** - Document management
- **AuditLog** - Audit trail
- **Notification** - System notifications

## Key Business Logic

- **Hierarchy**: DREC → Company → Property → Unit → Subtenant → EJARI
- **Lease Management**: Track main leases with DREC contract numbers, sub-leases with EJARI integration
- **Rent Collection**: Automated invoice generation, payment tracking, overdue alerts
- **Compliance**: Auto-detect expiring leases, EJARI, trade licenses
- **Soft Delete**: All entities support soft delete with `deletedAt` timestamps
- **Audit Logging**: All CRUD operations are logged

## License

Proprietary - Dubai Real Estate Corporation
