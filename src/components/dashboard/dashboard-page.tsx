'use client'

import React, { useEffect, useState } from 'react'
import { dashboardApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Building, Box, Percent, DollarSign, AlertCircle, FileText,
  FileSignature, Clock
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { format, differenceInDays } from 'date-fns'

const CHART_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6']

export function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const result = await dashboardApi.get()
      setData(result)
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-100 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return <div className="text-center py-12 text-gray-500">Failed to load dashboard</div>

  const kpis = data.kpis || {}
  const kpiCards = [
    { label: 'Total Properties', value: kpis.totalProperties || 0, icon: Building, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Units', value: kpis.totalUnits || 0, icon: Box, color: 'bg-teal-50 text-teal-600' },
    { label: 'Occupancy Rate', value: `${kpis.occupancyRate || 0}%`, icon: Percent, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Total Revenue', value: `AED ${((kpis.totalRevenue || 0)).toLocaleString()}`, icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
    { label: 'Outstanding', value: `AED ${((kpis.outstandingBalance || 0)).toLocaleString()}`, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
    { label: 'Active Leases', value: kpis.activeLeases || 0, icon: FileText, color: 'bg-violet-50 text-violet-600' },
    { label: 'Active Subleases', value: kpis.activeSubleases || 0, icon: FileSignature, color: 'bg-pink-50 text-pink-600' },
    { label: 'Expiring Soon', value: kpis.expiringLeasesCount || 0, icon: Clock, color: 'bg-orange-50 text-orange-600' },
  ]

  // Transform occupancy data for charts
  const occupancyByType = (data.occupancyByPropertyType || []).map((item: any) => ({
    name: item.propertyType?.replace('_', ' ') || 'Unknown',
    occupied: item.occupiedUnits || 0,
    vacant: (item.totalUnits || 0) - (item.occupiedUnits || 0),
  }))

  // Transform unit status for pie chart
  const unitStatusDist = (data.unitStatusDistribution || []).map((item: any) => ({
    name: item.status?.replace('_', ' ') || 'Unknown',
    value: item.count || 0,
  }))

  // Transform expiring leases
  const expiringLeases = (data.expiringLeases || []).map((lease: any) => ({
    leaseNumber: lease.leaseNumber,
    property: lease.property?.name || '-',
    endDate: lease.endDate,
  }))

  // Transform expiring EJARI
  const expiringEjari = (data.expiringEjari || []).map((ej: any) => ({
    ejariNumber: ej.ejariNumber || 'Pending',
    subtenant: ej.subtenant?.name || ej.subtenant?.tradeName || '-',
    expiryDate: ej.expiryDate,
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
                    <p className="text-xl font-bold mt-1 text-gray-900">{kpi.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Occupancy by Property Type</CardTitle>
          </CardHeader>
          <CardContent>
            {occupancyByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={occupancyByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="occupied" fill="#10b981" name="Occupied" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="vacant" fill="#e5e7eb" name="Vacant" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {(data.monthlyRevenue || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.monthlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `AED ${v.toLocaleString()}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Unit Status</CardTitle>
          </CardHeader>
          <CardContent>
            {unitStatusDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={unitStatusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {unitStatusDist.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-gray-400">No data</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Expiring Leases (90 Days)</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto custom-scrollbar">
            {expiringLeases.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No expiring leases</p>
            ) : (
              <div className="space-y-2">
                {expiringLeases.map((lease: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{lease.leaseNumber}</p>
                      <p className="text-xs text-gray-500">{lease.property}</p>
                    </div>
                    <Badge variant={differenceInDays(new Date(lease.endDate), new Date()) < 30 ? 'destructive' : 'secondary'} className="text-xs">
                      {differenceInDays(new Date(lease.endDate), new Date())}d
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Expiring EJARI (90 Days)</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto custom-scrollbar">
            {expiringEjari.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No expiring EJARI</p>
            ) : (
              <div className="space-y-2">
                {expiringEjari.map((ej: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{ej.ejariNumber}</p>
                      <p className="text-xs text-gray-500">{ej.subtenant}</p>
                    </div>
                    <Badge variant={differenceInDays(new Date(ej.expiryDate), new Date()) < 30 ? 'destructive' : 'secondary'} className="text-xs">
                      {differenceInDays(new Date(ej.expiryDate), new Date())}d
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Compliance Alerts */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent Compliance Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {(data.recentComplianceAlerts || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No compliance alerts</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Type</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Title</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Expiry</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recentComplianceAlerts || []).map((alert: any, i: number) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">{(alert.type || '').replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-2 px-3">{alert.title}</td>
                      <td className="py-2 px-3 text-gray-500">{alert.expiryDate ? format(new Date(alert.expiryDate), 'dd MMM yyyy') : '-'}</td>
                      <td className="py-2 px-3">
                        <Badge className={alert.status === 'EXPIRED' ? 'bg-red-100 text-red-700 border-0' : alert.status === 'ACTION_REQUIRED' ? 'bg-orange-100 text-orange-700 border-0' : 'bg-yellow-100 text-yellow-700 border-0'}>
                          {(alert.status || '').replace(/_/g, ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
