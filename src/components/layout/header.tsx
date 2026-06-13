'use client'

import React from 'react'
import { useAppStore } from '@/lib/store'
import { Menu, Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const tabTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  companies: 'Company Management',
  properties: 'Property Management',
  units: 'Unit Management',
  'main-leases': 'Main Lease Management',
  subtenants: 'Subtenant Management',
  subleases: 'Sublease Management',
  ejari: 'EJARI Module',
  'rent-collection': 'Rent Collection',
  compliance: 'Compliance Module',
  reports: 'Reports',
}

export function Header() {
  const { activeTab, toggleSidebar, searchQuery, setSearchQuery } = useAppStore()

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden h-9 w-9"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold text-gray-900">
          {tabTitles[activeTab] || 'Dashboard'}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        {['companies', 'properties', 'units', 'subtenants', 'subleases', 'ejari', 'rent-collection', 'compliance'].includes(activeTab) && (
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={`Search ${activeTab.replace('-', ' ')}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 h-9 bg-gray-50 border-gray-200"
            />
          </div>
        )}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-4 h-4 text-gray-500" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0">
            3
          </Badge>
        </Button>
      </div>
    </header>
  )
}
