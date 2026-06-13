'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ModulePage, FormField, formatDate, formatCurrency } from '@/components/common/module-page'
import { companiesApi } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Building2,
  Phone,
  Mail,
  FileText,
  DollarSign,
  TrendingUp,
  Percent,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  ArrowLeft,
  Loader2,
  Calendar,
  Briefcase,
  Users,
  ShieldCheck,
  Package,
  Wrench,
  Download,
  CheckCircle,
  HelpCircle,
  FileDown
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'properties', label: 'Properties', icon: Briefcase },
  { id: 'leases', label: 'Leases', icon: FileText },
  { id: 'tenants', label: 'Tenants/Subtenants', icon: Users },
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'assets', label: 'Assets', icon: Package },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet }
]

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280']

export function CompaniesPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Detailed views state
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [propertiesData, setPropertiesData] = useState<any[]>([])
  const [leasesData, setLeasesData] = useState<any>({ mainLeases: [], subleases: [] })
  const [subtenantsData, setSubtenantsData] = useState<any[]>([])
  const [financialsData, setFinancialsData] = useState<any>(null)
  const [assetsData, setAssetsData] = useState<any>(null)
  const [complianceData, setComplianceData] = useState<any>(null)

  // Loaders
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [loadingTab, setLoadingTab] = useState(false)

  // Add Asset modal state
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [assetFormData, setAssetFormData] = useState({
    name: '',
    category: 'HVAC',
    value: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    propertyId: '',
    notes: ''
  })
  const [savingAsset, setSavingAsset] = useState(false)

  // Fetch Dashboard details
  const fetchDashboard = useCallback(async (id: string) => {
    setLoadingDashboard(true)
    try {
      const res = await fetch(`/api/companies/${id}/dashboard`)
      if (!res.ok) throw new Error('Failed to load dashboard')
      const data = await res.json()
      setDashboardData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDashboard(false)
    }
  }, [])

  // Fetch individual tab data
  const fetchTabData = useCallback(async (id: string, tab: string) => {
    setLoadingTab(true)
    try {
      let endpoint = `/api/companies/${id}/${tab}`
      if (tab === 'tenants') endpoint = `/api/companies/${id}/subtenants`

      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(`Failed to load ${tab} data`)
      const data = await res.json()

      if (tab === 'properties') setPropertiesData(data.data || [])
      else if (tab === 'leases') setLeasesData(data)
      else if (tab === 'tenants') setSubtenantsData(data.data || [])
      else if (tab === 'revenue') setFinancialsData(data)
      else if (tab === 'assets') setAssetsData(data)
      else if (tab === 'compliance') setComplianceData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTab(false)
    }
  }, [])

  // Effect to load dashboard and first active tab on select
  useEffect(() => {
    if (selectedCompanyId) {
      fetchDashboard(selectedCompanyId)
      fetchTabData(selectedCompanyId, activeTab)
    }
  }, [selectedCompanyId, activeTab, fetchDashboard, fetchTabData])

  // Save new asset
  const handleSaveAsset = async () => {
    if (!selectedCompanyId) return
    setSavingAsset(true)
    try {
      const res = await fetch(`/api/companies/${selectedCompanyId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetFormData)
      })
      if (!res.ok) throw new Error('Failed to save asset')
      setShowAssetModal(false)
      // reset form
      setAssetFormData({
        name: '',
        category: 'HVAC',
        value: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        propertyId: '',
        notes: ''
      })
      // reload assets tab
      fetchTabData(selectedCompanyId, 'assets')
      fetchDashboard(selectedCompanyId) // Update overall valuations KPI
    } catch (err: any) {
      alert(err.message || 'Error saving asset')
    } finally {
      setSavingAsset(false)
    }
  }

  // Trigger Excel/PDF exports
  const handleExport = async (format: 'pdf' | 'xlsx') => {
    if (!selectedCompanyId) return
    try {
      window.open(`/api/companies/${selectedCompanyId}/export?format=${format}`, '_blank')
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  // If a company is selected, render the Detail Dashboard View
  if (selectedCompanyId) {
    const kpis = dashboardData?.kpis
    const company = dashboardData?.company

    return (
      <div className="space-y-6">
        {/* Detail Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all duration-200">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 border-gray-200 hover:border-emerald-600 hover:text-emerald-700"
              onClick={() => {
                setSelectedCompanyId(null)
                setDashboardData(null)
                setActiveTab('overview')
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                  {company?.name || 'Loading Company...'}
                </h1>
                {company?.isActive ? (
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0 font-medium">Active</Badge>
                ) : (
                  <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-0 font-medium">Archived</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {company?.tradeName && `Trade: ${company.tradeName} | `}
                Reg: {company?.registrationNo || 'N/A'}
              </p>
            </div>
          </div>
          {kpis && (
            <div className="flex items-center gap-2 bg-emerald-50/50 px-4 py-2 rounded-lg border border-emerald-100">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-emerald-700 font-medium">Compliance Score</p>
                <p className="text-lg font-bold text-emerald-900">{kpis.complianceScore}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-none bg-white rounded-lg p-1 border shadow-sm gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            )
          })}
        </div>

        {/* Tab Content Panels */}
        {loadingTab && !dashboardData ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-gray-400 mt-4 text-sm">Loading module details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && kpis && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Properties</CardTitle>
                      <Building2 className="w-4 h-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpis.totalProperties}</div>
                      <p className="text-xs text-gray-400 mt-1">
                        {kpis.occupiedProperties} Occupied / {kpis.vacantProperties} Vacant
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Leases</CardTitle>
                      <FileText className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpis.activeLeases}</div>
                      <p className="text-xs text-gray-400 mt-1">{kpis.expiredLeases} Expired Leases</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Monthly Revenue</CardTitle>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(kpis.monthlyRevenue)}</div>
                      <p className="text-xs text-gray-400 mt-1">Est. {formatCurrency(kpis.annualRevenue)} /yr</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Outstanding Balance</CardTitle>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">{formatCurrency(kpis.outstandingPayments)}</div>
                      <p className="text-xs text-gray-400 mt-1">{kpis.collectionRate}% Collection Rate</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Total Assets</CardTitle>
                      <Package className="w-4 h-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpis.totalAssets}</div>
                      <p className="text-xs text-gray-400 mt-1">Value: {formatCurrency(kpis.assetValue)}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Active Ejari</CardTitle>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpis.activeEjari}</div>
                      <p className="text-xs text-emerald-600 mt-1 font-medium">Fully Registered</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Expiring Documents</CardTitle>
                      <Calendar className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{kpis.expiringDocuments}</div>
                      <p className="text-xs text-gray-400 mt-1">Requires urgent renewal</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Total Tenants</CardTitle>
                      <Users className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpis.totalTenants}</div>
                      <p className="text-xs text-gray-400 mt-1">Subtenants and Sponsors</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Company Details Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2 border-0 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold text-gray-900">Corporate Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400 uppercase">Company Name</Label>
                        <p className="text-sm font-medium text-gray-900">{company?.name || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400 uppercase">Trade Name</Label>
                        <p className="text-sm font-medium text-gray-900">{company?.tradeName || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400 uppercase">Registration No</Label>
                        <p className="text-sm font-medium text-gray-900">{company?.registrationNo || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400 uppercase">Trade License No</Label>
                        <p className="text-sm font-medium text-gray-900">{company?.tradeLicenseNo || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400 uppercase">License Expiry</Label>
                        <p className="text-sm font-medium text-gray-900">{formatDate(company?.tradeLicenseExpiry)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400 uppercase">Website</Label>
                        <p className="text-sm font-medium text-blue-600 hover:underline">
                          {company?.website ? (
                            <a href={`https://${company.website}`} target="_blank" rel="noreferrer">
                              {company.website}
                            </a>
                          ) : (
                            '-'
                          )}
                        </p>
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs text-gray-400 uppercase">Office Address</Label>
                        <p className="text-sm font-medium text-gray-900">{company?.address || '-'}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold text-gray-900">Primary Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase">Contact Person</p>
                          <p className="text-sm font-semibold text-gray-950">{company?.contactPerson || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase">Contact Phone</p>
                          <p className="text-sm font-semibold text-gray-950">{company?.contactPhone || company?.phone || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase">Contact Email</p>
                          <p className="text-sm font-semibold text-gray-950 break-all">{company?.contactEmail || company?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* 2. PROPERTIES TAB */}
            {activeTab === 'properties' && (
              <Card className="border-0 shadow-sm bg-white overflow-hidden animate-in fade-in duration-300">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-gray-500">Property Code</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Property Name</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Type</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Total Units</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Occupancy Rate</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Annual Rent (Main)</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Active Subleases Rent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {propertiesData.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-gray-400">
                              No properties associated with this company
                            </td>
                          </tr>
                        ) : (
                          propertiesData.map(prop => (
                            <tr key={prop.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 px-4 font-mono font-bold text-emerald-800">{prop.propertyCode}</td>
                              <td className="py-4 px-4 font-medium text-gray-900">{prop.name}</td>
                              <td className="py-4 px-4 uppercase text-xs text-gray-500 font-semibold">{prop.propertyType}</td>
                              <td className="py-4 px-4">{prop.totalUnits} Units</td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full ${prop.occupancyRate > 75 ? 'bg-emerald-500' : prop.occupancyRate > 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                                      style={{ width: `${prop.occupancyRate}%` }}
                                    />
                                  </div>
                                  <span className="font-semibold text-gray-750">{prop.occupancyRate}%</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 font-medium">{formatCurrency(prop.rentAmount)}</td>
                              <td className="py-4 px-4 font-medium text-emerald-700">{formatCurrency(prop.totalSubleasesRent)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. LEASES TAB */}
            {activeTab === 'leases' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Main Leases (Properties) */}
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900">DREC Main Leases (DREC to Company)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-gray-500">Contract No</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Property</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Lease Dates</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Rent Amount</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Landlord</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leasesData.mainLeases.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-gray-400">
                                No active DREC Main Leases found
                              </td>
                            </tr>
                          ) : (
                            leasesData.mainLeases.map((lease: any) => (
                              <tr key={lease.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-gray-700">{lease.contractNo || lease.leaseNumber || '-'}</td>
                                <td className="py-3.5 px-4 font-semibold text-gray-900">{lease.name}</td>
                                <td className="py-3.5 px-4">
                                  <span className="text-xs text-gray-500">
                                    {formatDate(lease.leaseStartDate)} to {formatDate(lease.leaseEndDate)}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-medium">{formatCurrency(lease.rentAmount)}</td>
                                <td className="py-3.5 px-4 text-gray-500">{lease.landlordName || '-'}</td>
                                <td className="py-3.5 px-4">
                                  <Badge className={lease.leaseStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-red-100 text-red-700 border-0'}>
                                    {lease.leaseStatus}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Subleases */}
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900">Active Subleases (Company to Subtenant)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-gray-500">Sublease Ref No</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Subtenant</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Property / Unit</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Lease Period</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Rent Amount</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leasesData.subleases.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-gray-400">
                                No active subleases found
                              </td>
                            </tr>
                          ) : (
                            leasesData.subleases.map((sub: any) => (
                              <tr key={sub.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-emerald-750">{sub.subleaseNumber}</td>
                                <td className="py-3.5 px-4 font-semibold text-gray-900">{sub.subtenant?.name || 'N/A'}</td>
                                <td className="py-3.5 px-4">
                                  <div className="text-sm font-medium text-gray-900">{sub.property?.name}</div>
                                  <div className="text-xs text-gray-500 font-mono">Unit {sub.unit?.unitNumber}</div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="text-xs text-gray-500">
                                    {formatDate(sub.startDate)} to {formatDate(sub.endDate)}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-medium text-emerald-700">{formatCurrency(sub.rentAmount)}</td>
                                <td className="py-3.5 px-4">
                                  <Badge className={sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-red-100 text-red-700 border-0'}>
                                    {sub.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 4. TENANTS / SUBTENANTS TAB */}
            {activeTab === 'tenants' && (
              <Card className="border-0 shadow-sm bg-white overflow-hidden animate-in fade-in duration-300">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-gray-500">Tenant Name</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Trade Name</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Contact Person</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Phone</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Active Leases</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Rent Contribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subtenantsData.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-gray-400">
                              No sponsored tenants found
                            </td>
                          </tr>
                        ) : (
                          subtenantsData.map(sub => (
                            <tr key={sub.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 px-4 font-semibold text-gray-900">{sub.name}</td>
                              <td className="py-4 px-4 text-gray-600">{sub.tradeName || '-'}</td>
                              <td className="py-4 px-4">{sub.contactPerson || '-'}</td>
                              <td className="py-4 px-4 text-xs font-mono">{sub.phone}</td>
                              <td className="py-4 px-4">
                                <Badge className="bg-blue-50 text-blue-700 border-0">{sub.activeLeases} Active</Badge>
                              </td>
                              <td className="py-4 px-4 font-semibold text-emerald-700">{formatCurrency(sub.totalRentContribution)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 5. REVENUE TAB */}
            {activeTab === 'revenue' && financialsData && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-gray-500 uppercase">Total Invoiced</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialsData.summary.totalInvoiced)}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-gray-500 uppercase">Total Collected</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(financialsData.summary.totalCollected)}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-gray-500 uppercase">Outstanding Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-red-500">{formatCurrency(financialsData.summary.outstanding)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm bg-white p-4">
                    <CardHeader className="px-2 pb-4">
                      <CardTitle className="text-sm font-semibold text-gray-900">Monthly Revenue Trend (Last 12 Months)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                      {financialsData.revenueTrends?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={financialsData.revenueTrends}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <ChartTooltip formatter={value => `AED ${Number(value).toLocaleString()}`} />
                            <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">No transaction records found</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white p-4">
                    <CardHeader className="px-2 pb-4">
                      <CardTitle className="text-sm font-semibold text-gray-900">Revenue Contribution by Property</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                      {financialsData.revenueByProperty?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={financialsData.revenueByProperty}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {financialsData.revenueByProperty.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip formatter={value => `AED ${Number(value).toLocaleString()}`} />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">No active property subleases found</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Invoices List */}
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900">Invoices History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-gray-500">Invoice No</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Subtenant</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Property / Unit</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Due Date</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Total Amount</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Paid Amount</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financialsData.invoices.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-gray-400">
                                No invoice history found
                              </td>
                            </tr>
                          ) : (
                            financialsData.invoices.map((inv: any) => (
                              <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 px-4 font-mono font-bold text-gray-800">{inv.invoiceNumber}</td>
                                <td className="py-3 px-4 font-medium">{inv.sublease?.subtenant?.name || 'N/A'}</td>
                                <td className="py-3 px-4 text-xs">
                                  <div className="font-semibold">{inv.sublease?.property?.name}</div>
                                  <div className="text-gray-500">Unit {inv.sublease?.unit?.unitNumber}</div>
                                </td>
                                <td className="py-3 px-4 text-xs font-mono">{formatDate(inv.dueDate)}</td>
                                <td className="py-3 px-4 font-semibold">{formatCurrency(inv.totalAmount)}</td>
                                <td className="py-3 px-4 font-semibold text-emerald-600">{formatCurrency(inv.amountPaid)}</td>
                                <td className="py-3 px-4">
                                  <Badge className={
                                    inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 border-0' :
                                    inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700 border-0' :
                                    'bg-yellow-100 text-yellow-700 border-0'
                                  }>
                                    {inv.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 6. ASSETS TAB */}
            {activeTab === 'assets' && assetsData && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Assets Header */}
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Total Asset Valuation</h2>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(assetsData.summary.totalValue)}</p>
                  </div>
                  <Button onClick={() => setShowAssetModal(true)} className="bg-emerald-600 hover:bg-emerald-700 h-9">
                    <Plus className="w-4 h-4 mr-1" /> Add Asset
                  </Button>
                </div>

                {/* Assets Table */}
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-gray-500">Asset Code</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Asset Name</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Category</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Property Location</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Purchase Date</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Valuation</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assetsData.assets.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-gray-400">
                                No physical assets registered for this company
                              </td>
                            </tr>
                          ) : (
                            assetsData.assets.map((asset: any) => (
                              <tr key={asset.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-gray-700">{asset.assetCode}</td>
                                <td className="py-3.5 px-4 font-semibold text-gray-900">{asset.name}</td>
                                <td className="py-3.5 px-4 text-xs font-semibold uppercase text-gray-500">{asset.category}</td>
                                <td className="py-3.5 px-4 text-gray-600">{asset.property?.name || 'Central Office'}</td>
                                <td className="py-3.5 px-4 text-xs font-mono">{formatDate(asset.purchaseDate)}</td>
                                <td className="py-3.5 px-4 font-semibold text-emerald-700">{formatCurrency(asset.value)}</td>
                                <td className="py-3.5 px-4">
                                  <Badge className={
                                    asset.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-0' :
                                    asset.status === 'UNDER_MAINTENANCE' ? 'bg-amber-50 text-amber-700 border-0' :
                                    'bg-red-50 text-red-700 border-0'
                                  }>
                                    {asset.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Add Asset Dialog */}
                <Dialog open={showAssetModal} onOpenChange={setShowAssetModal}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Register New Company Asset</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <FormField label="Asset Name">
                        <Input
                          placeholder="e.g. Server AC unit 4"
                          value={assetFormData.name}
                          onChange={e => setAssetFormData({ ...assetFormData, name: e.target.value })}
                        />
                      </FormField>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Category">
                          <Select
                            value={assetFormData.category}
                            onValueChange={v => setAssetFormData({ ...assetFormData, category: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HVAC">HVAC</SelectItem>
                              <SelectItem value="Machinery">Machinery</SelectItem>
                              <SelectItem value="Furniture">Furniture</SelectItem>
                              <SelectItem value="Vehicle">Vehicle</SelectItem>
                              <SelectItem value="Safety">Safety</SelectItem>
                              <SelectItem value="Electrical">Electrical</SelectItem>
                              <SelectItem value="Security">Security</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>

                        <FormField label="Valuation (AED)">
                          <Input
                            type="number"
                            placeholder="Value"
                            value={assetFormData.value}
                            onChange={e => setAssetFormData({ ...assetFormData, value: e.target.value })}
                          />
                        </FormField>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Purchase Date">
                          <Input
                            type="date"
                            value={assetFormData.purchaseDate}
                            onChange={e => setAssetFormData({ ...assetFormData, purchaseDate: e.target.value })}
                          />
                        </FormField>

                        <FormField label="Status">
                          <Select
                            value={assetFormData.status}
                            onValueChange={v => setAssetFormData({ ...assetFormData, status: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                              <SelectItem value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</SelectItem>
                              <SelectItem value="RETIRED">RETIRED</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>

                      <FormField label="Link to Property (Optional)">
                        <Select
                          value={assetFormData.propertyId}
                          onValueChange={v => setAssetFormData({ ...assetFormData, propertyId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="None (Central Office)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None (Central Office)</SelectItem>
                            {propertiesData.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField label="Additional Notes">
                        <Textarea
                          placeholder="Maintenance records, supplier info, warranty dates..."
                          value={assetFormData.notes}
                          onChange={e => setAssetFormData({ ...assetFormData, notes: e.target.value })}
                          rows={3}
                        />
                      </FormField>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAssetModal(false)} disabled={savingAsset}>Cancel</Button>
                      <Button onClick={handleSaveAsset} disabled={savingAsset} className="bg-emerald-600 hover:bg-emerald-700">
                        {savingAsset && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                        Save Asset
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* 7. COMPLIANCE TAB */}
            {activeTab === 'compliance' && complianceData && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Trade License Card */}
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-gray-900">Trade License & Registration Status</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between">
                      <span className="text-xs text-emerald-800 uppercase font-semibold">Trade License No</span>
                      <p className="text-lg font-bold text-emerald-950 mt-1">{complianceData.licenseInfo.tradeLicenseNo || 'N/A'}</p>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col justify-between">
                      <span className="text-xs text-blue-800 uppercase font-semibold">Corporate Registration No</span>
                      <p className="text-lg font-bold text-blue-950 mt-1">{complianceData.licenseInfo.registrationNo || 'N/A'}</p>
                    </div>

                    <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex flex-col justify-between">
                      <span className="text-xs text-purple-800 uppercase font-semibold">License Expiration</span>
                      <p className="text-lg font-bold text-purple-950 mt-1">{formatDate(complianceData.licenseInfo.tradeLicenseExpiry)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Alerts & Warnings */}
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900">Active Compliance Alerts</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-gray-500">Alert Title</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Type</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Expiry Date</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {complianceData.alerts.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-8 text-gray-400">
                                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                                All documents and licenses are fully compliant!
                              </td>
                            </tr>
                          ) : (
                            complianceData.alerts.map((alert: any) => (
                              <tr key={alert.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-gray-950">{alert.title}</div>
                                  <div className="text-xs text-gray-500">{alert.description}</div>
                                </td>
                                <td className="py-3.5 px-4 text-xs font-semibold text-gray-600">{alert.type}</td>
                                <td className="py-3.5 px-4 font-mono text-xs">{formatDate(alert.expiryDate)}</td>
                                <td className="py-3.5 px-4">
                                  <Badge className={
                                    alert.status === 'COMPLIANT' ? 'bg-emerald-100 text-emerald-700 border-0' :
                                    alert.status === 'WARNING' ? 'bg-yellow-100 text-yellow-700 border-0' :
                                    'bg-red-100 text-red-700 border-0'
                                  }>
                                    {alert.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Documents Vault */}
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900">Document Vault</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-gray-500">Document Name</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Type</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Upload Date</th>
                            <th className="py-3 px-4 font-semibold text-gray-500 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {complianceData.documents.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-8 text-gray-400">
                                No uploaded documents found for this company
                              </td>
                            </tr>
                          ) : (
                            complianceData.documents.map((doc: any) => (
                              <tr key={doc.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 px-4 font-medium text-gray-900">{doc.name}</td>
                                <td className="py-3 px-4 uppercase text-xs font-semibold text-gray-500">{doc.documentType}</td>
                                <td className="py-3 px-4 text-xs font-mono text-gray-400">{formatDate(doc.createdAt)}</td>
                                <td className="py-3 px-4 text-right">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(doc.fileUrl, '_blank')}>
                                    <Download className="w-4 h-4 text-gray-500" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 8. REPORTS TAB */}
            {activeTab === 'reports' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="bg-red-50 text-red-700 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                      <FileDown className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-base font-semibold text-gray-900">Executive PDF Brief</CardTitle>
                    <CardDescription>
                      Download a structured PDF summary including all primary KPIs, active DREC leases, sublease summaries, and outstanding collection statuses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <Button onClick={() => handleExport('pdf')} className="w-full bg-red-600 hover:bg-red-700 text-white font-medium h-10">
                      <Download className="w-4 h-4 mr-2" /> Download PDF Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="bg-emerald-50 text-emerald-700 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-base font-semibold text-gray-900">Financial Ledger Export (Excel)</CardTitle>
                    <CardDescription>
                      Download a raw dataset spreadsheet containing multiple tabs mapping property occupancy lists, lease history ledger, and invoice payment entries.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <Button onClick={() => handleExport('xlsx')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-10">
                      <Download className="w-4 h-4 mr-2" /> Export Excel Sheet
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Otherwise, render the main Company List view
  return (
    <ModulePage
      title="Company"
      api={companiesApi}
      searchPlaceholder="Search companies..."
      onRowView={(row) => {
        setSelectedCompanyId(row.id)
        setActiveTab('overview')
      }}
      columns={[
        { key: 'name', label: 'Company Name', render: (v: any) => <span className="font-semibold text-emerald-950">{v}</span> },
        { key: 'tradeName', label: 'Trade Name' },
        { key: 'registrationNo', label: 'Registration No', render: (v: any) => <span className="font-mono text-xs font-semibold text-gray-700">{v || '-'}</span> },
        { key: 'contactPerson', label: 'Contact Person' },
        { key: 'phone', label: 'Phone', render: (v: any) => <span className="font-mono text-xs">{v || '-'}</span> },
        { key: 'email', label: 'Email' },
        {
          key: 'tradeLicenseExpiry',
          label: 'License Expiry',
          render: (v: any) => {
            if (!v) return <span className="text-gray-400 text-xs">—</span>
            const isExpired = new Date(v) < new Date()
            return (
              <Badge className={isExpired ? 'bg-red-100 text-red-700 border-0 font-medium' : 'bg-emerald-100 text-emerald-700 border-0 font-medium'}>
                {formatDate(v)}
              </Badge>
            )
          }
        },
        {
          key: 'totalProperties',
          label: 'Properties',
          render: (v: any) => <span className="font-semibold">{v ?? 0}</span>
        },
        {
          key: 'activeLeases',
          label: 'Active Leases',
          render: (v: any) => <span className="font-semibold text-blue-600">{v ?? 0}</span>
        },
        {
          key: 'monthlyRevenue',
          label: 'Monthly Revenue',
          render: (v: any) => <span className="font-medium text-emerald-700">{v != null ? formatCurrency(v) : '-'}</span>
        },
        {
          key: 'outstandingAmount',
          label: 'Outstanding',
          render: (v: any) => <span className="font-semibold text-amber-600">{v != null ? formatCurrency(v) : '-'}</span>
        },
        {
          key: 'complianceStatus',
          label: 'Compliance',
          render: (v: any) => {
            const status = v || 'COMPLIANT'
            return (
              <Badge className={
                status === 'COMPLIANT' ? 'bg-emerald-100 text-emerald-700 border-0' :
                status === 'WARNING' ? 'bg-yellow-100 text-yellow-700 border-0' :
                'bg-red-100 text-red-700 border-0'
              }>
                {status}
              </Badge>
            )
          }
        },
        {
          key: 'isActive',
          label: 'Status',
          render: (v: any) => <Badge className={v ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-red-100 text-red-700 border-0'}>{v ? 'Active' : 'Archived'}</Badge>
        },
      ]}
      filterOptions={[
        {
          key: 'isActive',
          label: 'Status',
          options: [
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Archived' },
          ]
        }
      ]}
      renderForm={(data, setData) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Company Name">
            <Input value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} placeholder="Enter company name" />
          </FormField>
          <FormField label="Trade Name">
            <Input value={data.tradeName || ''} onChange={e => setData({...data, tradeName: e.target.value})} placeholder="Enter trade name" />
          </FormField>
          <FormField label="Registration No">
            <Input value={data.registrationNo || ''} onChange={e => setData({...data, registrationNo: e.target.value})} placeholder="REG-YYYY-NNN" />
          </FormField>
          <FormField label="Trade License No">
            <Input value={data.tradeLicenseNo || ''} onChange={e => setData({...data, tradeLicenseNo: e.target.value})} placeholder="Enter license number" />
          </FormField>
          <FormField label="Trade License Expiry">
            <Input type="date" value={data.tradeLicenseExpiry ? data.tradeLicenseExpiry.split('T')[0] : ''} onChange={e => setData({...data, tradeLicenseExpiry: e.target.value})} />
          </FormField>
          <FormField label="City">
            <Input value={data.city || ''} onChange={e => setData({...data, city: e.target.value})} placeholder="City" />
          </FormField>
          <FormField label="Country">
            <Input value={data.country || 'UAE'} onChange={e => setData({...data, country: e.target.value})} />
          </FormField>
          <FormField label="Phone">
            <Input value={data.phone || ''} onChange={e => setData({...data, phone: e.target.value})} placeholder="+971-" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={data.email || ''} onChange={e => setData({...data, email: e.target.value})} placeholder="email@example.com" />
          </FormField>
          <FormField label="Website">
            <Input value={data.website || ''} onChange={e => setData({...data, website: e.target.value})} placeholder="www.example.com" />
          </FormField>
          <FormField label="Contact Person">
            <Input value={data.contactPerson || ''} onChange={e => setData({...data, contactPerson: e.target.value})} placeholder="Contact name" />
          </FormField>
          <FormField label="Contact Phone">
            <Input value={data.contactPhone || ''} onChange={e => setData({...data, contactPhone: e.target.value})} placeholder="+971-" />
          </FormField>
          <FormField label="Contact Email">
            <Input type="email" value={data.contactEmail || ''} onChange={e => setData({...data, contactEmail: e.target.value})} />
          </FormField>
          <div className="col-span-1 md:col-span-2">
            <FormField label="Address">
              <Textarea value={data.address || ''} onChange={e => setData({...data, address: e.target.value})} placeholder="Full address" rows={2} />
            </FormField>
          </div>
          <div className="col-span-1 md:col-span-2">
            <FormField label="Notes">
              <Textarea value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})} placeholder="Additional notes" rows={2} />
            </FormField>
          </div>
          <FormField label="Active">
            <div className="flex items-center gap-2 pt-1">
              <Switch checked={data.isActive !== false} onCheckedChange={v => setData({...data, isActive: v})} />
              <span className="text-sm text-gray-500">{data.isActive !== false ? 'Active' : 'Archived'}</span>
            </div>
          </FormField>
        </div>
      )}
      defaultData={() => ({ name: '', tradeName: '', registrationNo: '', country: 'UAE', city: 'Dubai', isActive: true })}
    />
  )
}
