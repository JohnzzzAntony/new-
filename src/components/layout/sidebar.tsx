'use client'

import React from 'react'
import { useAppStore } from '@/lib/store'
import {
  LayoutDashboard, Building2, Building, Box, FileText, Users,
  FileSignature, Shield, DollarSign, AlertTriangle, BarChart3,
  LogOut, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'properties', label: 'Properties', icon: Building },
  { id: 'subtenants', label: 'Subtenants', icon: Users },
  { id: 'subleases', label: 'Subleases', icon: FileSignature },
  { id: 'ejari', label: 'EJARI', icon: Shield },
  { id: 'rent-collection', label: 'Rent Collection', icon: DollarSign },
  { id: 'compliance', label: 'Compliance', icon: AlertTriangle },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
]

export function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, toggleSidebar, setSidebarOpen, user, logout } = useAppStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-gray-900 text-white transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-16',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 h-16 border-b border-gray-800">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-sm whitespace-nowrap">DREC PMS</h1>
              <p className="text-[10px] text-gray-400 whitespace-nowrap">Property Management</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false)
                  }
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
                title={item.label}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <Separator className="bg-gray-800" />

        {/* User */}
        <div className="p-3">
          {user && sidebarOpen && (
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-emerald-600 text-white text-xs">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-400 hover:text-white hover:bg-gray-800 flex-1 justify-start h-8"
            >
              <LogOut className="w-4 h-4" />
              {sidebarOpen && <span className="ml-2 text-xs">Logout</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0 hidden lg:flex"
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
