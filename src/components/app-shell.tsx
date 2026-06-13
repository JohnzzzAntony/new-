'use client'

import React from 'react'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { CompaniesPage } from '@/components/companies/companies-page'
import { PropertiesPage } from '@/components/properties/properties-page'
import { PropertyDetailPage } from '@/components/properties/property-detail-page'
import { UnitsPage } from '@/components/units/units-page'
import { SubtenantsPage } from '@/components/subtenants/subtenants-page'
import { SubleasesPage } from '@/components/subleases/subleases-page'
import { SubleaseDetailPage } from '@/components/subleases/sublease-detail-page'
import { EjariPage } from '@/components/ejari/ejari-page'
import { RentCollectionPage } from '@/components/rent/rent-collection-page'
import { CompliancePage } from '@/components/compliance/compliance-page'
import { ReportsPage } from '@/components/reports/reports-page'

const pageComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  companies: CompaniesPage,
  properties: PropertiesPage,
  'property-detail': PropertyDetailPage,
  units: UnitsPage,
  subtenants: SubtenantsPage,
  subleases: SubleasesPage,
  'sublease-detail': SubleaseDetailPage,
  ejari: EjariPage,
  'rent-collection': RentCollectionPage,
  compliance: CompliancePage,
  reports: ReportsPage,
}

export function AppShell() {
  const { activeTab, sidebarOpen, setSidebarOpen } = useAppStore()
  const PageComponent = pageComponents[activeTab] || DashboardPage

  React.useEffect(() => {
    // Start closed on mobile/tablet screens
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        <Header />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <PageComponent />
        </main>
        <footer className="py-3 px-4 text-center text-xs text-gray-400 border-t bg-white">
          DREC Property Management System &copy; {new Date().getFullYear()} &mdash; Dubai Real Estate Corporation
        </footer>
      </div>
    </div>
  )
}
