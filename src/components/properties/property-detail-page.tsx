'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { propertiesApi, mainLeasesApi, unitsApi, companiesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft, Building2, FileText, Box, Plus, Pencil, Check, X,
  MapPin, Calendar, DollarSign, Loader2, RefreshCw
} from 'lucide-react'
import { formatDate, formatCurrency, FormField } from '@/components/common/module-page'

const UNIT_TYPES = ['WAREHOUSE', 'OFFICE', 'SHOP', 'APARTMENT', 'VILLA', 'STORAGE_UNIT', 'PARKING']

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value || '—'}</span>
    </div>
  )
}

function UnitStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    OCCUPIED: 'bg-blue-100 text-blue-700',
    VACANT: 'bg-emerald-100 text-emerald-700',
    UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-700',
    RESERVED: 'bg-purple-100 text-purple-700',
    INACTIVE: 'bg-gray-100 text-gray-700',
  }
  return (
    <Badge className={`${map[status] || 'bg-gray-100 text-gray-700'} border-0 text-xs`}>
      {status?.replace('_', ' ') || 'VACANT'}
    </Badge>
  )
}

export function PropertyDetailPage() {
  const { detailId, clearDetail, setActiveTab } = useAppStore()
  const [property, setProperty] = useState<any>(null)
  const [mainLease, setMainLease] = useState<any>(null)
  const [renewals, setRenewals] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null)
  const [editingUnit, setEditingUnit] = useState<any>(null)
  const [addingUnit, setAddingUnit] = useState(false)
  const [newUnit, setNewUnit] = useState<any>({ unitNumber: '', unitCode: '', area: '', unitType: 'WAREHOUSE' })
  const [saving, setSaving] = useState(false)

  // Main Lease CRUD States
  const [companies, setCompanies] = useState<any[]>([])
  const [isEditingLease, setIsEditingLease] = useState(false)
  const [isAddingLease, setIsAddingLease] = useState(false)
  const [savingLease, setSavingLease] = useState(false)
  const [leaseForm, setLeaseForm] = useState<any>({
    contractNo: 0,
    leaseNumber: '',
    status: 'DRAFT',
    companyId: '',
    tenantNumber: '',
    landNumber: '',
    location: '',
    startDate: '',
    endDate: '',
    rentAmount: 0,
    annualRentPerSqFt: undefined,
    rentFrequency: 'annual',
    securityDeposit: 0,
    incrementPercent: undefined,
    incrementFrequency: undefined,
    landlordName: 'DREC Properties',
    landlordContact: '',
    landlordEmail: '',
    terms: '',
    notes: '',
  })

  const loadAll = useCallback(async () => {
    if (!detailId) return
    setLoading(true)
    try {
      const [propRes, leasesRes, unitsRes] = await Promise.all([
        propertiesApi.get(detailId),
        mainLeasesApi.list({ propertyId: detailId, pageSize: 1, sortBy: 'createdAt', sortOrder: 'asc' }),
        unitsApi.list({ propertyId: detailId, pageSize: 200 }),
      ])
      const propData = (propRes as any)?.data || propRes
      setProperty(propData)
      const leaseList = (leasesRes as any)?.data || []
      if (leaseList.length > 0) {
        setMainLease(leaseList[0])
        const allLeasesRes = await mainLeasesApi.list({ propertyId: detailId, pageSize: 100 })
        setRenewals((allLeasesRes as any)?.data || [])
      } else {
        setMainLease(null)
        setRenewals([])
      }
      setUnits((unitsRes as any)?.data || [])
    } catch (err) {
      console.error('PropertyDetail load error:', err)
    } finally {
      setLoading(false)
    }
  }, [detailId])

  // Load companies once on mount
  useEffect(() => {
    companiesApi.list({ pageSize: 100, isActive: 'true' })
      .then(res => setCompanies(res.data || []))
      .catch(err => console.error('Error loading companies:', err))
  }, [])

  const handleStartEditLease = () => {
    if (!mainLease) return
    setLeaseForm({
      contractNo: mainLease.contractNo,
      leaseNumber: mainLease.leaseNumber || '',
      status: mainLease.status || 'DRAFT',
      companyId: mainLease.companyId || '',
      tenantNumber: mainLease.tenantNumber || '',
      landNumber: mainLease.landNumber || '',
      location: mainLease.location || '',
      startDate: mainLease.startDate ? mainLease.startDate.split('T')[0] : '',
      endDate: mainLease.endDate ? mainLease.endDate.split('T')[0] : '',
      rentAmount: mainLease.rentAmount || 0,
      annualRentPerSqFt: mainLease.annualRentPerSqFt || undefined,
      rentFrequency: mainLease.rentFrequency || 'annual',
      securityDeposit: mainLease.securityDeposit || 0,
      incrementPercent: mainLease.incrementPercent || undefined,
      incrementFrequency: mainLease.incrementFrequency || undefined,
      landlordName: mainLease.landlordName || 'DREC Properties',
      landlordContact: mainLease.landlordContact || '',
      landlordEmail: mainLease.landlordEmail || '',
      terms: mainLease.terms || '',
      notes: mainLease.notes || '',
    })
    setIsEditingLease(true)
    setIsAddingLease(false)
  }

  const handleStartAddLease = () => {
    setLeaseForm({
      contractNo: 0,
      leaseNumber: '',
      status: 'DRAFT',
      companyId: '',
      tenantNumber: '',
      landNumber: '',
      location: property?.address || property?.area || property?.city || '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      rentAmount: 0,
      annualRentPerSqFt: undefined,
      rentFrequency: 'annual',
      securityDeposit: 0,
      incrementPercent: undefined,
      incrementFrequency: undefined,
      landlordName: 'DREC Properties',
      landlordContact: '',
      landlordEmail: '',
      terms: '',
      notes: '',
    })
    setIsAddingLease(true)
    setIsEditingLease(false)
  }

  const handleSaveLease = async () => {
    if (!leaseForm.contractNo) {
      alert('Contract number is required')
      return
    }
    setSavingLease(true)
    try {
      const payload = {
        contractNo: parseInt(leaseForm.contractNo) || 0,
        leaseNumber: leaseForm.leaseNumber || null,
        status: leaseForm.status || 'DRAFT',
        companyId: leaseForm.companyId || null,
        tenantNumber: leaseForm.tenantNumber || null,
        landNumber: leaseForm.landNumber || null,
        location: leaseForm.location || null,
        startDate: leaseForm.startDate ? new Date(leaseForm.startDate).toISOString() : null,
        endDate: leaseForm.endDate ? new Date(leaseForm.endDate).toISOString() : null,
        rentAmount: parseFloat(leaseForm.rentAmount) || 0,
        annualRentPerSqFt: leaseForm.annualRentPerSqFt ? parseFloat(leaseForm.annualRentPerSqFt) : null,
        rentFrequency: leaseForm.rentFrequency || 'annual',
        securityDeposit: parseFloat(leaseForm.securityDeposit) || 0,
        incrementPercent: leaseForm.incrementPercent ? parseFloat(leaseForm.incrementPercent) : null,
        incrementFrequency: leaseForm.incrementFrequency ? parseInt(leaseForm.incrementFrequency) : null,
        landlordName: leaseForm.landlordName || 'DREC Properties',
        landlordContact: leaseForm.landlordContact || null,
        landlordEmail: leaseForm.landlordEmail || null,
        terms: leaseForm.terms || null,
        notes: leaseForm.notes || null,
      }

      if (isEditingLease) {
        // Strip out Prisma auto-relation models
        const { id, property, company, documents, rentCollections, complianceAlerts, renewedFrom, renewals, ...cleanPayload } = leaseForm as any
        const updatePayload = {
          ...payload,
          companyId: cleanPayload.companyId || null
        }
        await mainLeasesApi.update(mainLease.id, updatePayload)
        setIsEditingLease(false)
      } else {
        await mainLeasesApi.create({
          ...payload,
          propertyId: detailId,
          isActive: true
        })
        setIsAddingLease(false)
      }
      loadAll()
    } catch (err: any) {
      alert(err.message || 'Save lease failed')
    } finally {
      setSavingLease(false)
    }
  }

  useEffect(() => { loadAll() }, [loadAll])

  const handleBack = () => {
    clearDetail()
    setActiveTab('properties')
  }

  const handleStartEditUnit = (unit: any) => {
    setEditingUnitId(unit.id)
    setEditingUnit({ ...unit })
  }

  const handleSaveUnit = async () => {
    if (!editingUnit) return
    setSaving(true)
    try {
      await unitsApi.update(editingUnit.id, {
        unitNumber: editingUnit.unitNumber,
        unitCode: editingUnit.unitCode,
        area: parseFloat(editingUnit.area) || null,
        unitType: editingUnit.unitType,
      })
      setEditingUnitId(null)
      setEditingUnit(null)
      loadAll()
    } catch (err: any) {
      alert(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleAddUnit = async () => {
    if (!newUnit.unitNumber) { alert('Unit number is required'); return }
    setSaving(true)
    try {
      await unitsApi.create({
        unitNumber: newUnit.unitNumber,
        unitCode: newUnit.unitCode || null,
        area: parseFloat(newUnit.area) || null,
        unitType: newUnit.unitType || 'WAREHOUSE',
        status: 'VACANT',
        propertyId: detailId,
        isActive: true,
      })
      setNewUnit({ unitNumber: '', unitCode: '', area: '', unitType: 'WAREHOUSE' })
      setAddingUnit(false)
      loadAll()
    } catch (err: any) {
      alert(err.message || 'Add unit failed')
    } finally {
      setSaving(false)
    }
  }

  const rentPerSqFt = mainLease && property?.totalArea
    ? (mainLease.rentAmount / property.totalArea).toFixed(2)
    : mainLease?.annualRentPerSqFt?.toFixed(2) || null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-gray-500">Loading property...</span>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">Property not found.</p>
        <Button onClick={handleBack} variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack} className="h-9 px-3 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Properties
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {property.address || property.area || property.city}
                {property.plotNumber && <span className="ml-2 font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">Plot: {property.plotNumber}</span>}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Property Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Property Code', value: property.propertyCode, icon: <Building2 className="w-4 h-4 text-blue-500" /> },
          { label: 'Total Area', value: property.totalArea ? `${property.totalArea.toLocaleString()} sqft` : '—', icon: <Box className="w-4 h-4 text-purple-500" /> },
          { label: 'Main Tenant', value: property.company?.name || '—', icon: <Building2 className="w-4 h-4 text-emerald-500" /> },
          { label: 'Units', value: units.length, icon: <Box className="w-4 h-4 text-amber-500" /> },
        ].map((card) => (
          <Card key={card.label} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">{card.icon}<span className="text-xs text-gray-500">{card.label}</span></div>
              <p className="font-bold text-gray-900">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="main-lease" className="w-full">
        <TabsList className="bg-gray-100 h-10">
          <TabsTrigger value="main-lease" className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Main Lease Details
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-1.5">
            <Box className="w-4 h-4" /> Units ({units.length})
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Main Lease ─── */}
        <TabsContent value="main-lease" className="mt-4">
          {isEditingLease || isAddingLease ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4 flex flex-row items-center justify-between border-b">
                <CardTitle className="text-base font-semibold text-gray-700">
                  {isEditingLease ? 'Edit Main Lease' : 'Add Main Lease'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setIsEditingLease(false); setIsAddingLease(false) }} className="h-8">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveLease} disabled={savingLease} className="bg-emerald-600 hover:bg-emerald-700 h-8">
                    {savingLease ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                    Save Lease
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Contract No">
                    <Input type="number" value={leaseForm.contractNo || ''} onChange={e => setLeaseForm({...leaseForm, contractNo: parseInt(e.target.value) || 0})} placeholder="DREC Contract #" />
                  </FormField>
                  <FormField label="Lease Number">
                    <Input value={leaseForm.leaseNumber || ''} onChange={e => setLeaseForm({...leaseForm, leaseNumber: e.target.value})} placeholder="ML-YYYY-NNN" />
                  </FormField>
                  <FormField label="Status">
                    <Select value={leaseForm.status || 'DRAFT'} onValueChange={v => setLeaseForm({...leaseForm, status: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED', 'UNDER_REVIEW'].map(s => (
                          <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Company">
                    <Select value={leaseForm.companyId || ''} onValueChange={v => setLeaseForm({...leaseForm, companyId: v})}>
                      <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                      <SelectContent>
                        {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Tenant Number">
                    <Input value={leaseForm.tenantNumber || ''} onChange={e => setLeaseForm({...leaseForm, tenantNumber: e.target.value})} placeholder="DREC Tenant #" />
                  </FormField>
                  <FormField label="Land Number">
                    <Input value={leaseForm.landNumber || ''} onChange={e => setLeaseForm({...leaseForm, landNumber: e.target.value})} placeholder="DREC Land #" />
                  </FormField>
                  <FormField label="Location">
                    <Input value={leaseForm.location || ''} onChange={e => setLeaseForm({...leaseForm, location: e.target.value})} placeholder="Location area" />
                  </FormField>
                  <FormField label="Start Date">
                    <Input type="date" value={leaseForm.startDate || ''} onChange={e => setLeaseForm({...leaseForm, startDate: e.target.value})} />
                  </FormField>
                  <FormField label="End Date">
                    <Input type="date" value={leaseForm.endDate || ''} onChange={e => setLeaseForm({...leaseForm, endDate: e.target.value})} />
                  </FormField>
                  <FormField label="Rent Amount (AED)">
                    <Input type="number" value={leaseForm.rentAmount || ''} onChange={e => setLeaseForm({...leaseForm, rentAmount: parseFloat(e.target.value) || 0})} />
                  </FormField>
                  <FormField label="Annual Rent/Sq.Ft (AED)">
                    <Input type="number" value={leaseForm.annualRentPerSqFt || ''} onChange={e => setLeaseForm({...leaseForm, annualRentPerSqFt: parseFloat(e.target.value) || undefined})} />
                  </FormField>
                  <FormField label="Rent Frequency">
                    <Select value={leaseForm.rentFrequency || 'annual'} onValueChange={v => setLeaseForm({...leaseForm, rentFrequency: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annual', label: 'Annual' }].map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Security Deposit (AED)">
                    <Input type="number" value={leaseForm.securityDeposit || ''} onChange={e => setLeaseForm({...leaseForm, securityDeposit: parseFloat(e.target.value) || 0})} />
                  </FormField>
                  <FormField label="Increment %">
                    <Input type="number" value={leaseForm.incrementPercent || ''} onChange={e => setLeaseForm({...leaseForm, incrementPercent: parseFloat(e.target.value) || undefined})} />
                  </FormField>
                  <FormField label="Increment Freq (Years)">
                    <Input type="number" value={leaseForm.incrementFrequency || ''} onChange={e => setLeaseForm({...leaseForm, incrementFrequency: parseInt(e.target.value) || undefined})} />
                  </FormField>
                  <FormField label="Landlord Name">
                    <Input value={leaseForm.landlordName || ''} onChange={e => setLeaseForm({...leaseForm, landlordName: e.target.value})} />
                  </FormField>
                  <FormField label="Landlord Contact">
                    <Input value={leaseForm.landlordContact || ''} onChange={e => setLeaseForm({...leaseForm, landlordContact: e.target.value})} />
                  </FormField>
                  <FormField label="Landlord Email">
                    <Input type="email" value={leaseForm.landlordEmail || ''} onChange={e => setLeaseForm({...leaseForm, landlordEmail: e.target.value})} />
                  </FormField>
                  <div className="col-span-2">
                    <FormField label="Terms (JSON)">
                      <Textarea value={leaseForm.terms || ''} onChange={e => setLeaseForm({...leaseForm, terms: e.target.value})} rows={2} />
                    </FormField>
                  </div>
                  <div className="col-span-2">
                    <FormField label="Notes">
                      <Textarea value={leaseForm.notes || ''} onChange={e => setLeaseForm({...leaseForm, notes: e.target.value})} rows={2} />
                    </FormField>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : !mainLease ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="mb-4">No main lease linked to this property yet.</p>
                <Button onClick={handleStartAddLease} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-1" /> Add Main Lease
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between border-b">
                  <CardTitle className="text-base font-semibold text-gray-700">Lease Contract Details</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleStartEditLease} className="h-8">
                    <Pencil className="w-4 h-4 mr-1" /> Edit Lease
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
                    <InfoRow label="Contract No." value={`#${mainLease.contractNo}`} />
                    <InfoRow label="Lease Number" value={mainLease.leaseNumber} />
                    <InfoRow label="Land No." value={mainLease.landNumber} />
                    <InfoRow label="Plot No." value={property.plotNumber} />
                    <InfoRow label="Location" value={mainLease.location || property.area || property.city} />
                    <InfoRow label="Company (Main Tenant)" value={mainLease.company?.name} />
                    <InfoRow label="Lease From" value={formatDate(mainLease.startDate)} />
                    <InfoRow label="Lease To" value={formatDate(mainLease.endDate)} />
                    <InfoRow label="Annual Rent" value={formatCurrency(mainLease.rentAmount)} />
                    <InfoRow label="Area (sqft)" value={property.totalArea ? property.totalArea.toLocaleString() : '—'} />
                    <InfoRow label="Rent / sqft" value={rentPerSqFt ? `AED ${rentPerSqFt}` : '—'} />
                    <InfoRow label="Status" value={
                      <Badge className={mainLease.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-gray-100 text-gray-700 border-0'}>
                        {mainLease.status}
                      </Badge>
                    } />
                  </div>
                </CardContent>
              </Card>

              {/* Renewal History */}
              {renewals.length > 1 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-500" /> Renewal History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left py-2 px-4 font-medium text-gray-500">Contract #</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-500">Lease No.</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-500">From</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-500">To</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-500">Annual Rent</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {renewals.map((lease, i) => (
                            <tr key={lease.id} className={`border-b last:border-0 ${i === renewals.length - 1 ? 'bg-emerald-50/40' : ''}`}>
                              <td className="py-2 px-4 font-mono">#{lease.contractNo}</td>
                              <td className="py-2 px-4">{lease.leaseNumber}</td>
                              <td className="py-2 px-4">{formatDate(lease.startDate)}</td>
                              <td className="py-2 px-4">{formatDate(lease.endDate)}</td>
                              <td className="py-2 px-4">{formatCurrency(lease.rentAmount)}</td>
                              <td className="py-2 px-4">
                                <Badge className={lease.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-0 text-xs' : 'bg-gray-100 text-gray-700 border-0 text-xs'}>
                                  {lease.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 2: Units ─── */}
        <TabsContent value="units" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">Property Units</CardTitle>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 h-8"
                onClick={() => { setAddingUnit(true); setEditingUnitId(null) }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Unit
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Premises No.</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Unit Code</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Size (sqft)</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Add new unit row */}
                    {addingUnit && (
                      <tr className="border-b bg-emerald-50/40">
                        <td className="py-2 px-3">
                          <Input
                            className="h-7 text-xs"
                            placeholder="e.g. S1"
                            value={newUnit.unitNumber}
                            onChange={e => setNewUnit({ ...newUnit, unitNumber: e.target.value })}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            className="h-7 text-xs"
                            placeholder="Code"
                            value={newUnit.unitCode}
                            onChange={e => setNewUnit({ ...newUnit, unitCode: e.target.value })}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Select value={newUnit.unitType} onValueChange={v => setNewUnit({ ...newUnit, unitType: v })}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {UNIT_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            className="h-7 text-xs"
                            type="number"
                            placeholder="sqft"
                            value={newUnit.area}
                            onChange={e => setNewUnit({ ...newUnit, area: e.target.value })}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">VACANT</Badge>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" className="h-7 w-7 bg-emerald-600 hover:bg-emerald-700" onClick={handleAddUnit} disabled={saving}>
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAddingUnit(false)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {units.length === 0 && !addingUnit && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-gray-400">
                          No units added yet. Click "Add Unit" to start.
                        </td>
                      </tr>
                    )}

                    {units.map(unit => (
                      <tr key={unit.id} className="border-b last:border-0 hover:bg-gray-50/50">
                        {editingUnitId === unit.id ? (
                          <>
                            <td className="py-2 px-3">
                              <Input className="h-7 text-xs" value={editingUnit.unitNumber} onChange={e => setEditingUnit({ ...editingUnit, unitNumber: e.target.value })} />
                            </td>
                            <td className="py-2 px-3">
                              <Input className="h-7 text-xs" value={editingUnit.unitCode || ''} onChange={e => setEditingUnit({ ...editingUnit, unitCode: e.target.value })} />
                            </td>
                            <td className="py-2 px-3">
                              <Select value={editingUnit.unitType} onValueChange={v => setEditingUnit({ ...editingUnit, unitType: v })}>
                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>{UNIT_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="py-2 px-3">
                              <Input className="h-7 text-xs" type="number" value={editingUnit.area || ''} onChange={e => setEditingUnit({ ...editingUnit, area: e.target.value })} />
                            </td>
                            <td className="py-2 px-3"><UnitStatusBadge status={unit.status} /></td>
                            <td className="py-2 px-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="icon" className="h-7 w-7 bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveUnit} disabled={saving}>
                                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingUnitId(null)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4 font-mono font-medium text-gray-800">{unit.unitNumber}</td>
                            <td className="py-3 px-4 text-gray-600">{unit.unitCode || '—'}</td>
                            <td className="py-3 px-4 text-gray-600 text-xs">{unit.unitType}</td>
                            <td className="py-3 px-4 text-gray-700">{unit.area ? unit.area.toLocaleString() : '—'}</td>
                            <td className="py-3 px-4"><UnitStatusBadge status={unit.status} /></td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStartEditUnit(unit)}>
                                  <Pencil className="w-4 h-4 text-gray-400" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
