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
  { id: 'assets', label: 'Assets', icon: Package },
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
  const [assetsData, setAssetsData] = useState<any>(null)

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
      else if (tab === 'assets') setAssetsData(data)
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
              {company?.tradeName && (
                <p className="text-sm text-gray-500 mt-1">
                  Trade: {company.tradeName}
                </p>
              )}
            </div>
          </div>
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


                </div>

                {/* Company Details Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-3 border-0 shadow-sm bg-white">
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
                        <Label className="text-xs text-gray-400 uppercase">Trade License No</Label>
                        <p className="text-sm font-medium text-gray-900">{company?.tradeLicenseNo || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400 uppercase">License Expiry</Label>
                        <p className="text-sm font-medium text-gray-900">{formatDate(company?.tradeLicenseExpiry)}</p>
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
                          <th className="py-3 px-4 font-semibold text-gray-500">Plot No.</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Property Name</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Type</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Annual Rent (Main)</th>
                          <th className="py-3 px-4 font-semibold text-gray-500">Active Subleases Rent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {propertiesData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-gray-400">
                              No properties associated with this company
                            </td>
                          </tr>
                        ) : (
                          propertiesData.map(prop => (
                            <tr key={prop.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 px-4 font-mono font-bold text-emerald-800">{prop.plotNumber || prop.propertyCode || '—'}</td>
                              <td className="py-4 px-4 font-medium text-gray-900">{prop.name}</td>
                              <td className="py-4 px-4 uppercase text-xs text-gray-500 font-semibold">{prop.propertyType}</td>
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
                            <th className="py-3 px-4 font-semibold text-gray-500">Location</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Land No.</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Contract From</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Contract To</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Rent Amount</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Landlord</th>
                            <th className="py-3 px-4 font-semibold text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leasesData.mainLeases.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-8 text-gray-400">
                                No active DREC Main Leases found
                              </td>
                            </tr>
                          ) : (
                            leasesData.mainLeases.map((lease: any) => {
                              const displayLandlord = (lease.landlordName || '').trim() === 'DREC Property' || (lease.landlordName || '').trim() === 'DREC Properties'
                                ? 'DREC'
                                : (lease.landlordName || '-');
                              return (
                                <tr key={lease.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                                  <td className="py-3.5 px-4 font-mono font-bold text-gray-700">{lease.contractNo || lease.leaseNumber || '-'}</td>
                                  <td className="py-3.5 px-4 font-semibold text-gray-900">{lease.name}</td>
                                  <td className="py-3.5 px-4 text-gray-600">{lease.location || '-'}</td>
                                  <td className="py-3.5 px-4 font-mono text-gray-600">{lease.landNumber || '-'}</td>
                                  <td className="py-3.5 px-4 text-xs text-gray-500">{formatDate(lease.leaseStartDate)}</td>
                                  <td className="py-3.5 px-4 text-xs text-gray-500">{formatDate(lease.leaseEndDate)}</td>
                                  <td className="py-3.5 px-4 font-medium">{formatCurrency(lease.rentAmount)}</td>
                                  <td className="py-3.5 px-4 text-gray-500">{displayLandlord}</td>
                                  <td className="py-3.5 px-4">
                                    <Badge className={lease.leaseStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-red-100 text-red-700 border-0'}>
                                      {lease.leaseStatus}
                                    </Badge>
                                  </td>
                                </tr>
                              )
                            })
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
        { key: 'tradeLicenseNo', label: 'License No.', render: (v: any) => <span className="font-mono text-xs font-semibold text-gray-700">{v || '-'}</span> },
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
        { key: 'emiratesId', label: 'Emirates ID No.', render: (v: any) => <span className="font-mono text-xs">{v || '-'}</span> },
        {
          key: 'totalProperties',
          label: 'Properties',
          render: (v: any) => <span className="font-semibold">{v ?? 0}</span>
        },
        {
          key: 'activeLeases',
          label: 'Active Leases',
          render: (v: any, row: any) => {
            const count = v ?? 0
            const totalProps = row.totalProperties ?? 0
            const isLess = count < totalProps
            return (
              <Badge className={isLess ? 'bg-red-100 text-red-700 border-0 font-bold' : 'bg-emerald-100 text-emerald-700 border-0 font-bold'}>
                {count}
              </Badge>
            )
          }
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
          <FormField label="Trade License No">
            <Input value={data.tradeLicenseNo || ''} onChange={e => setData({...data, tradeLicenseNo: e.target.value})} placeholder="Enter license number" />
          </FormField>
          <FormField label="Trade License Expiry">
            <Input type="date" value={data.tradeLicenseExpiry ? data.tradeLicenseExpiry.split('T')[0] : ''} onChange={e => setData({...data, tradeLicenseExpiry: e.target.value})} />
          </FormField>
          <FormField label="Emirates ID No.">
            <Input value={data.emiratesId || ''} onChange={e => setData({...data, emiratesId: e.target.value})} placeholder="784-YYYY-NNNNNNN-N" />
          </FormField>
          <FormField label="City">
            <Input value={data.city || ''} onChange={e => setData({...data, city: e.target.value})} placeholder="City" />
          </FormField>
          <FormField label="Country">
            <Input value={data.country || 'UAE'} onChange={e => setData({...data, country: e.target.value})} />
          </FormField>
          <div className="col-span-1 md:col-span-2">
            <FormField label="Notes">
              <Textarea value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})} placeholder="Additional notes" rows={2} />
            </FormField>
          </div>
        </div>
      )}
      defaultData={() => ({ name: '', tradeName: '', country: 'UAE', city: 'Dubai', isActive: true })}
    />
  )
}
