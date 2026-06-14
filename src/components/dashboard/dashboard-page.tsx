'use client'

import React, { useEffect, useState } from 'react'
import { dashboardApi, companiesApi, propertiesApi, ejariApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Building, Box, Percent, DollarSign, AlertCircle, FileText,
  FileSignature, Clock, Eye, RefreshCw, Mail, UserCheck, CheckSquare,
  ExternalLink, AlertTriangle, CheckCircle, HelpCircle, Loader2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { format, differenceInDays } from 'date-fns'

const CHART_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6']

const PROPERTY_TYPES = [
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'MIXED_USE', label: 'Mixed Use' },
  { value: 'PLOT', label: 'Plot' },
]

export function DashboardPage() {
  const { user, setActiveTab, setDetail, setGlobalFilters, setSearchQuery, propertiesTab, setPropertiesTab } = useAppStore()
  const isReadOnly = user?.role === 'READ_ONLY'

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Filters State
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('all')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('12m')

  // Notice Simulation Modal State
  const [noticeModalOpen, setNoticeModalOpen] = useState(false)
  const [noticeLeaseRef, setNoticeLeaseRef] = useState('')

  // Lease Renewal Modal State
  const [renewLeaseModalOpen, setRenewLeaseModalOpen] = useState(false)
  const [renewLeaseId, setRenewLeaseId] = useState('')
  const [renewLeaseRef, setRenewLeaseRef] = useState('')
  const [newRentAmount, setNewRentAmount] = useState('')
  const [newLeaseStartDate, setNewLeaseStartDate] = useState('')
  const [newLeaseEndDate, setNewLeaseEndDate] = useState('')
  const [renewingLease, setRenewingLease] = useState(false)

  // Lease Assignment Modal State
  const [assignLeaseModalOpen, setAssignLeaseModalOpen] = useState(false)
  const [assignLeaseId, setAssignLeaseId] = useState('')
  const [assignLeaseRef, setAssignLeaseRef] = useState('')
  const [assignCompanyId, setAssignCompanyId] = useState('')
  const [assigningLease, setAssigningLease] = useState(false)

  // EJARI Renewal Modal State
  const [renewEjariModalOpen, setRenewEjariModalOpen] = useState(false)
  const [renewEjariId, setRenewEjariId] = useState('')
  const [renewEjariNo, setRenewEjariNo] = useState('')
  const [newEjariNo, setNewEjariNo] = useState('')
  const [newEjariRegDate, setNewEjariRegDate] = useState('')
  const [newEjariExpDate, setNewEjariExpDate] = useState('')
  const [renewingEjari, setRenewingEjari] = useState(false)

  // EJARI Handle Confirmation State
  const [handledConfirmOpen, setHandledConfirmOpen] = useState(false)
  const [handledEjariId, setHandledEjariId] = useState('')
  const [handledEjariNo, setHandledEjariNo] = useState('')
  const [handlingEjari, setHandlingEjari] = useState(false)

  const handleSendNotice = (leaseRef: string) => {
    setNoticeLeaseRef(leaseRef)
    setNoticeModalOpen(true)
  }

  useEffect(() => {
    // Load companies list for filter
    companiesApi.list({ pageSize: 100, isActive: 'true' })
      .then(res => setCompanies(res.data || []))
      .catch(err => console.error('Error fetching companies:', err))
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [selectedCompany, selectedPropertyType, selectedDateRange])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        dateRange: selectedDateRange
      }
      if (selectedCompany !== 'all') params.companyId = selectedCompany
      if (selectedPropertyType !== 'all') params.propertyType = selectedPropertyType

      const result = await dashboardApi.get(params)
      setData(result)
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle Lease Renewal Submit
  const handleRenewLeaseSubmit = async () => {
    if (!renewLeaseId) return
    setRenewingLease(true)
    try {
      await propertiesApi.update(renewLeaseId, {
        rentAmount: parseFloat(newRentAmount) || undefined,
        leaseStartDate: newLeaseStartDate ? new Date(newLeaseStartDate).toISOString() : undefined,
        leaseEndDate: newLeaseEndDate ? new Date(newLeaseEndDate).toISOString() : undefined,
        leaseStatus: 'ACTIVE',
      })
      setRenewLeaseModalOpen(false)
      loadDashboard()
    } catch (err: any) {
      alert(err.message || 'Failed to renew lease')
    } finally {
      setRenewingLease(false)
    }
  }

  // Handle Lease Assignment Submit
  const handleAssignLeaseSubmit = async () => {
    if (!assignLeaseId) return
    setAssigningLease(true)
    try {
      await propertiesApi.update(assignLeaseId, {
        companyId: assignCompanyId,
      })
      setAssignLeaseModalOpen(false)
      loadDashboard()
    } catch (err: any) {
      alert(err.message || 'Failed to assign lease')
    } finally {
      setAssigningLease(false)
    }
  }

  // Handle EJARI Renewal Submit
  const handleRenewEjariSubmit = async () => {
    if (!renewEjariId) return
    setRenewingEjari(true)
    try {
      await ejariApi.update(renewEjariId, {
        ejariNumber: newEjariNo || undefined,
        registrationDate: newEjariRegDate ? new Date(newEjariRegDate).toISOString() : undefined,
        expiryDate: newEjariExpDate ? new Date(newEjariExpDate).toISOString() : undefined,
        status: 'REGISTERED',
      })
      setRenewEjariModalOpen(false)
      loadDashboard()
    } catch (err: any) {
      alert(err.message || 'Failed to renew EJARI')
    } finally {
      setRenewingEjari(false)
    }
  }

  // Handle EJARI Mark as Handled Submit
  const handleMarkHandledSubmit = async () => {
    if (!handledEjariId) return
    setHandlingEjari(true)
    try {
      await ejariApi.update(handledEjariId, {
        status: 'REGISTERED',
        notes: 'Marked as handled from dashboard.',
      })
      setHandledConfirmOpen(false)
      loadDashboard()
    } catch (err: any) {
      alert(err.message || 'Failed to update EJARI')
    } finally {
      setHandlingEjari(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-100 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return <div className="text-center py-12 text-gray-500">Failed to load dashboard</div>

  const kpis = data.kpis || {}

  // Helper function to build custom expiry badges with color coding
  const getExpiryBadge = (endDateStr: string) => {
    if (!endDateStr) return '-'
    const days = differenceInDays(new Date(endDateStr), new Date())
    if (days <= 15) {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 font-medium">{days <= 0 ? 'Expired' : `${days}d left`}</Badge>
    } else if (days <= 45) {
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0 font-medium">{days}d left</Badge>
    } else if (days <= 90) {
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 font-medium">{days}d left</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 font-medium">{days}d left</Badge>
  }

  // Handle KPI Click filtering
  const handleKpiClick = (type: string) => {
    switch (type) {
      case 'properties':
        setPropertiesTab('properties')
        setGlobalFilters(null)
        setActiveTab('properties')
        break
      case 'units':
        setPropertiesTab('units')
        setGlobalFilters(null)
        setActiveTab('properties')
        break
      case 'occupancy':
        setPropertiesTab('units')
        setGlobalFilters({ status: 'OCCUPIED' })
        setActiveTab('properties')
        break
      case 'contract_value':
        setGlobalFilters({ status: 'ACTIVE' })
        setActiveTab('subleases')
        break
      case 'expired_contracts':
        setGlobalFilters({ status: 'EXPIRED' })
        setActiveTab('subleases')
        break
      case 'active_leases':
        setPropertiesTab('properties')
        setGlobalFilters({ leaseStatus: 'ACTIVE' })
        setActiveTab('properties')
        break
      case 'active_subleases':
        setGlobalFilters({ status: 'ACTIVE' })
        setActiveTab('subleases')
        break
      case 'expiring_soon':
        setPropertiesTab('properties')
        setGlobalFilters({ expiringSoon: 'true' })
        setActiveTab('properties')
        break
    }
  }

  const kpiCards = [
    { type: 'properties', label: 'Total Properties', value: kpis.totalProperties || 0, icon: Building, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100/50' },
    { type: 'units', label: 'Total Units', value: kpis.totalUnits || 0, icon: Box, color: 'bg-teal-50 text-teal-600 hover:bg-teal-100/50' },
    { type: 'occupancy', label: 'Occupancy Rate', value: `${kpis.occupancyRate || 0}%`, icon: Percent, color: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100/50' },
    { type: 'contract_value', label: 'Contract Value (Active)', value: `AED ${((kpis.totalRevenue || 0)).toLocaleString()}`, icon: DollarSign, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100/50' },
    { type: 'expired_contracts', label: 'Expired Contracts', value: `AED ${((kpis.outstandingBalance || 0)).toLocaleString()}`, icon: AlertCircle, color: 'bg-red-50 text-red-600 hover:bg-red-100/50' },
    { type: 'active_leases', label: 'Active Leases', value: kpis.activeLeases || 0, icon: FileText, color: 'bg-violet-50 text-violet-600 hover:bg-violet-100/50' },
    { type: 'active_subleases', label: 'Active Subleases', value: kpis.activeSubleases || 0, icon: FileSignature, color: 'bg-pink-50 text-pink-600 hover:bg-pink-100/50' },
    { type: 'expiring_soon', label: 'Expiring Soon', subtitle: 'Within 90 days', value: kpis.expiringLeasesCount || 0, icon: Clock, color: 'bg-orange-50 text-orange-600 hover:bg-orange-100/50' },
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
  const expiringLeases = data.expiringLeases || []

  // Transform expiring EJARI
  const expiringEjari = data.expiringEjari || []

  // Prioritize Compliance Alerts sorting: ACTION_REQUIRED -> EXPIRED -> WARNING -> COMPLIANT
  const priorityOrder: Record<string, number> = {
    ACTION_REQUIRED: 1,
    EXPIRED: 2,
    WARNING: 3,
    COMPLIANT: 4,
  }
  const sortedComplianceAlerts = [...(data.recentComplianceAlerts || [])].sort((a: any, b: any) => {
    const aPriority = priorityOrder[a.status] || 99
    const bPriority = priorityOrder[b.status] || 99
    return aPriority - bPriority
  })

  const COMPLIANCE_STATUS_COLORS: Record<string, string> = {
    ACTION_REQUIRED: 'bg-orange-100 text-orange-700 border-0',
    EXPIRED: 'bg-red-100 text-red-700 border-0',
    WARNING: 'bg-yellow-100 text-yellow-700 border-0',
    COMPLIANT: 'bg-emerald-100 text-emerald-700 border-0',
  }

  const COMPLIANCE_STATUS_ICONS: Record<string, React.ElementType> = {
    ACTION_REQUIRED: AlertCircle,
    EXPIRED: XCircleIcon,
    WARNING: AlertTriangle,
    COMPLIANT: CheckCircle,
  }

  // Custom JSX for XCircle to avoid undefined lucide imports
  function XCircleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Executive Dashboard</h2>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <Card
              key={i}
              onClick={() => handleKpiClick(kpi.type)}
              className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group relative"
            >
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
                    {kpi.type === 'expiring_soon' && (
                      <div className="relative group/tooltip">
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                        <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover/tooltip:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
                          Active leases expiring in the next 90 days
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xl font-bold mt-1 text-gray-900 group-hover:text-emerald-600 transition-colors">{kpi.value}</p>
                  {kpi.subtitle && (
                    <p className="text-[10px] text-gray-400 font-normal mt-0.5">{kpi.subtitle}</p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
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
            <CardTitle className="text-sm font-semibold">Sub-Lease Fee Revenue</CardTitle>
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
        {/* Unit Status */}
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

        {/* Expiring Leases */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Expiring Leases (90 Days)</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto custom-scrollbar">
            {expiringLeases.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No expiring leases</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-[11px] text-gray-500 uppercase tracking-wider">
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Lease Ref</th>
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Tenant</th>
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Property</th>
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Days to Expiry</th>
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Status</th>
                      <th className="text-right py-2 px-3 font-semibold w-28 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringLeases.map((lease: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors text-xs">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <button
                            onClick={() => setDetail('property', lease.id)}
                            className="font-mono font-medium text-emerald-600 hover:text-emerald-800 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                          >
                            {lease.leaseNumber || `L-${lease.contractNo}`}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 max-w-[120px] truncate text-gray-700">{lease.company?.name || '-'}</td>
                        <td className="py-2.5 px-3 max-w-[120px] truncate text-gray-700">{lease.property?.name || '-'}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">{getExpiryBadge(lease.endDate)}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-0 font-medium">
                            {lease.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDetail('property', lease.id)}
                              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                              title="View Lease"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {!isReadOnly && (
                              <>
                                <button
                                  onClick={() => {
                                    setRenewLeaseId(lease.id)
                                    setRenewLeaseRef(lease.leaseNumber || `L-${lease.contractNo}`)
                                    setNewRentAmount(lease.rentAmount || '')
                                    setNewLeaseStartDate(lease.startDate ? lease.startDate.split('T')[0] : '')
                                    setNewLeaseEndDate(lease.endDate ? lease.endDate.split('T')[0] : '')
                                    setRenewLeaseModalOpen(true)
                                  }}
                                  className="p-1 hover:bg-emerald-50 rounded text-emerald-600 hover:text-emerald-800 transition-colors"
                                  title="Renew Lease"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleSendNotice(lease.leaseNumber || `L-${lease.contractNo}`)}
                                  className="p-1 hover:bg-blue-50 rounded text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Send Notice"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setAssignLeaseId(lease.id)
                                    setAssignLeaseRef(lease.leaseNumber || `L-${lease.contractNo}`)
                                    setAssignCompanyId(lease.company?.id || '')
                                    setAssignLeaseModalOpen(true)
                                  }}
                                  className="p-1 hover:bg-violet-50 rounded text-violet-600 hover:text-violet-800 transition-colors"
                                  title="Assign Lease"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
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

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Expiring EJARI */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Expiring EJARI (90 Days)</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto custom-scrollbar">
            {expiringEjari.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No expiring EJARI</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-[11px] text-gray-500 uppercase tracking-wider">
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">EJARI No.</th>
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Tenant</th>
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Property/Unit</th>
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Days to Expiry</th>
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Status</th>
                      <th className="text-right py-2 px-3 font-semibold w-28 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringEjari.map((ej: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors text-xs">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (ej.ejariNumber) {
                                setSearchQuery(ej.ejariNumber)
                              }
                              setActiveTab('ejari')
                            }}
                            className="font-mono font-medium text-emerald-600 hover:text-emerald-800 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                          >
                            {ej.ejariNumber || 'Pending'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 max-w-[120px] truncate text-gray-700">{ej.subtenant?.name || ej.subtenant?.tradeName || '-'}</td>
                        <td className="py-2.5 px-3 max-w-[150px] truncate text-gray-700">
                          {ej.sublease?.property?.name ? (
                            <button
                              onClick={() => setDetail('sublease', ej.subleaseId)}
                              className="text-left font-medium text-emerald-600 hover:text-emerald-800 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                            >
                              {ej.sublease.property.name} / {ej.sublease.unit?.unitNumber || '-'}
                            </button>
                          ) : '-'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">{getExpiryBadge(ej.expiryDate)}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-0 font-medium">
                            {ej.status?.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                if (ej.ejariNumber) setSearchQuery(ej.ejariNumber)
                                setActiveTab('ejari')
                              }}
                              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                              title="Open EJARI record"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            {!isReadOnly && (
                              <>
                                <button
                                  onClick={() => {
                                    setRenewEjariId(ej.id)
                                    setRenewEjariNo(ej.ejariNumber || '')
                                    setNewEjariNo(ej.ejariNumber || '')
                                    setNewEjariRegDate(ej.registrationDate ? ej.registrationDate.split('T')[0] : '')
                                    setNewEjariExpDate(ej.expiryDate ? ej.expiryDate.split('T')[0] : '')
                                    setRenewEjariModalOpen(true)
                                  }}
                                  className="p-1 hover:bg-emerald-50 rounded text-emerald-600 hover:text-emerald-800 transition-colors"
                                  title="Renew EJARI"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setHandledEjariId(ej.id)
                                    setHandledEjariNo(ej.ejariNumber || 'Pending')
                                    setHandledConfirmOpen(true)
                                  }}
                                  className="p-1 hover:bg-blue-50 rounded text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Mark as handled"
                                >
                                  <CheckSquare className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Alerts */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Compliance Alerts</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto custom-scrollbar">
            {sortedComplianceAlerts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No compliance alerts</p>
            ) : (
              <div className="space-y-2">
                {sortedComplianceAlerts.map((alert: any, i: number) => {
                  const AlertIcon = COMPLIANCE_STATUS_ICONS[alert.status] || AlertTriangle
                  const colorClass = COMPLIANCE_STATUS_COLORS[alert.status] || 'bg-gray-100 text-gray-700'
                  const getLinkType = (entType: string) => {
                    if (!entType) return null
                    const l = entType.toLowerCase()
                    if (l === 'mainlease') return 'property'
                    return l
                  }
                  const linkType = getLinkType(alert.entityType)
                  return (
                    <div key={i} className="flex items-start gap-2.5 p-2 bg-gray-50 rounded-lg hover:bg-gray-100/50 transition-colors text-xs">
                      <div className={`p-1.5 rounded-lg shrink-0 ${colorClass}`}>
                        <AlertIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {linkType && alert.entityId ? (
                          <button
                            onClick={() => setDetail(linkType, alert.entityId)}
                            className="text-left font-semibold text-emerald-600 hover:text-emerald-800 hover:underline bg-transparent border-0 p-0 cursor-pointer block truncate"
                          >
                            {alert.title}
                          </button>
                        ) : (
                          <p className="font-semibold text-gray-800 truncate">{alert.title}</p>
                        )}
                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{alert.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[9px] py-0 px-1">
                            {alert.entityType}
                          </Badge>
                          {alert.expiryDate && (
                            <span className="text-[9px] text-gray-400">
                              Exp: {format(new Date(alert.expiryDate), 'dd MMM yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notice Simulation Modal */}
      <Dialog open={noticeModalOpen} onOpenChange={setNoticeModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Send Notice
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm text-gray-600">
              You are about to simulate sending a formal lease renewal notice for lease <strong>{noticeLeaseRef}</strong>.
            </p>
            <p className="text-xs text-gray-400">
              An email notification will be generated and dispatched to the designated company contact persons with official lease terms.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoticeModalOpen(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                setNoticeModalOpen(false)
                alert(`Official Notice successfully dispatched for lease ${noticeLeaseRef}!`)
              }}
            >
              Confirm & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lease Renewal Modal */}
      <Dialog open={renewLeaseModalOpen} onOpenChange={setRenewLeaseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
              Renew Lease: {renewLeaseRef}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rentAmount">New Annual Rent (AED)</Label>
              <Input
                id="rentAmount"
                type="number"
                value={newRentAmount}
                onChange={e => setNewRentAmount(e.target.value)}
                placeholder="Enter new annual rent amount"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Lease Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newLeaseStartDate}
                  onChange={e => setNewLeaseStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">Lease End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newLeaseEndDate}
                  onChange={e => setNewLeaseEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewLeaseModalOpen(false)} disabled={renewingLease}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleRenewLeaseSubmit}
              disabled={renewingLease}
            >
              {renewingLease && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Renew Lease
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lease Assignment Modal */}
      <Dialog open={assignLeaseModalOpen} onOpenChange={setAssignLeaseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Reassign Lease: {assignLeaseRef}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="companySelect">Assign to Tenant Company</Label>
              <Select value={assignCompanyId} onValueChange={setAssignCompanyId}>
                <SelectTrigger id="companySelect"><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignLeaseModalOpen(false)} disabled={assigningLease}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAssignLeaseSubmit}
              disabled={assigningLease}
            >
              {assigningLease && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign Lease
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EJARI Renewal Modal */}
      <Dialog open={renewEjariModalOpen} onOpenChange={setRenewEjariModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
              Renew EJARI: {renewEjariNo || 'Pending'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ejariNumber">New EJARI Number</Label>
              <Input
                id="ejariNumber"
                value={newEjariNo}
                onChange={e => setNewEjariNo(e.target.value)}
                placeholder="EJ-YYYY-NNNNNN"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="regDate">Registration Date</Label>
                <Input
                  id="regDate"
                  type="date"
                  value={newEjariRegDate}
                  onChange={e => setNewEjariRegDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expDate">Expiry Date</Label>
                <Input
                  id="expDate"
                  type="date"
                  value={newEjariExpDate}
                  onChange={e => setNewEjariExpDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewEjariModalOpen(false)} disabled={renewingEjari}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleRenewEjariSubmit}
              disabled={renewingEjari}
            >
              {renewingEjari && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Register & Renew
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EJARI Mark as Handled Confirmation */}
      <Dialog open={handledConfirmOpen} onOpenChange={setHandledConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckSquare className="w-5 h-5" />
              Mark EJARI as Handled
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to mark EJARI <strong>{handledEjariNo}</strong> as handled? This will transition its status to **Registered**.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHandledConfirmOpen(false)} disabled={handlingEjari}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleMarkHandledSubmit}
              disabled={handlingEjari}
            >
              {handlingEjari && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Mark as Handled
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
