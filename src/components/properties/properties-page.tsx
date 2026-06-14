'use client'

import React, { useEffect, useState } from 'react'
import { ModulePage, FormField, formatDate, StatusBadge, LEASE_STATUS_MAP } from '@/components/common/module-page'
import { propertiesApi, companiesApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UnitsPage } from '@/components/units/units-page'

const PROPERTY_TYPES = [
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'MIXED_USE', label: 'Mixed Use' },
  { value: 'PLOT', label: 'Plot' },
]

const TYPE_BADGE_MAP: Record<string, { label: string; class: string }> = {
  WAREHOUSE: { label: 'Warehouse', class: 'bg-emerald-100 text-emerald-700' },
  INDUSTRIAL: { label: 'Industrial', class: 'bg-amber-100 text-amber-700' },
  COMMERCIAL: { label: 'Commercial', class: 'bg-blue-100 text-blue-700' },
  RESIDENTIAL: { label: 'Residential', class: 'bg-purple-100 text-purple-700' },
  MIXED_USE: { label: 'Mixed Use', class: 'bg-teal-100 text-teal-700' },
  PLOT: { label: 'Plot', class: 'bg-gray-100 text-gray-700' },
}

const LEASE_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'RENEWED', label: 'Renewed' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
]

const RENT_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
]

export function PropertiesPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const { setDetail, propertiesTab, setPropertiesTab } = useAppStore()

  useEffect(() => {
    companiesApi.list({ pageSize: 100, isActive: 'true' }).then(res => setCompanies(res.data || [])).catch(() => {})
  }, [])

  return (
    <Tabs value={propertiesTab} onValueChange={(v) => setPropertiesTab(v as any)} className="w-full space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="properties" className="px-4 py-2">Properties</TabsTrigger>
          <TabsTrigger value="units" className="px-4 py-2">Units</TabsTrigger>
        </TabsList>
      </div>


      <TabsContent value="properties" className="mt-0">
        <ModulePage
          title="Property"
          api={propertiesApi}
      searchPlaceholder="Search properties..."
      onRowView={(row) => setDetail('property', row.id)}
      columns={[
        {
          key: 'propertyCode',
          label: 'Plot No.',
          render: (v: any, row: any) => (
            <button
              onClick={() => setDetail('property', row.id)}
              className="font-mono text-xs text-emerald-600 hover:text-emerald-800 hover:underline text-left bg-transparent border-0 p-0 cursor-pointer"
            >
              {row.plotNumber || v || '—'}
            </button>
          )
        },
        {
          key: 'name',
          label: 'Name',
          render: (v: any, row: any) => (
            <button
              onClick={() => setDetail('property', row.id)}
              className="font-medium text-emerald-600 hover:text-emerald-800 hover:underline text-left bg-transparent border-0 p-0 cursor-pointer"
            >
              {v}
            </button>
          )
        },
        {
          key: 'propertyType',
          label: 'Type',
          render: (v: any) => <StatusBadge status={v} map={TYPE_BADGE_MAP} />
        },
        { key: 'leaseNumber', label: 'Lease #', render: (v: any) => v ? <span className="font-mono text-xs">{v}</span> : '-' },
        { key: 'leaseEndDate', label: 'Lease End', render: (v: any) => v ? formatDate(v) : '-' },
        { key: 'rentAmount', label: 'Annual Rent', render: (v: any) => v ? `AED ${v.toLocaleString()}` : '-' },
        {
          key: 'leaseStatus',
          label: 'Lease Status',
          render: (v: any) => v ? <StatusBadge status={v} map={LEASE_STATUS_MAP} /> : '-'
        },
        { key: 'company', label: 'Company', render: (_: any, row: any) => row.company?.name || '-' },
        { key: 'unitCount', label: 'Units', render: (v: any) => v || 0 },
      ]}
      filterOptions={[
        {
          key: 'companyId',
          label: 'Company',
          options: companies.map(c => ({ value: c.id, label: c.name }))
        },
        {
          key: 'propertyType',
          label: 'Type',
          options: PROPERTY_TYPES
        },
        {
          key: 'leaseStatus',
          label: 'Lease Status',
          options: LEASE_STATUSES
        }
      ]}
      renderForm={(data, setData) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-semibold text-gray-800 text-sm border-b pb-1">Property Information</h3>
          </div>
          
          <FormField label="Property Name">
            <Input value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} placeholder="Enter property name" />
          </FormField>
          <FormField label="Plot No.">
            <Input
              value={data.plotNumber || ''}
              onChange={e => {
                const val = e.target.value;
                setData({ ...data, plotNumber: val, propertyCode: val });
              }}
              placeholder="e.g. 0613-1208"
            />
          </FormField>
          <FormField label="Property Type">
            <Select value={data.propertyType || 'WAREHOUSE'} onValueChange={v => setData({...data, propertyType: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Company">
            <Select value={data.companyId || ''} onValueChange={v => setData({...data, companyId: v})}>
              <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
              <SelectContent>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <div className="col-span-1 md:col-span-2">
            <FormField label="Notes">
              <Textarea value={data.description || ''} onChange={e => setData({...data, description: e.target.value})} rows={2} />
            </FormField>
          </div>
          <div className="col-span-1 md:col-span-2">
            <FormField label="Address">
              <Textarea value={data.address || ''} onChange={e => setData({...data, address: e.target.value})} rows={2} />
            </FormField>
          </div>
          <FormField label="City">
            <Input value={data.city || 'Dubai'} onChange={e => setData({...data, city: e.target.value})} />
          </FormField>
          <FormField label="Area">
            <Input value={data.area || ''} onChange={e => setData({...data, area: e.target.value})} placeholder="e.g. Jebel Ali" />
          </FormField>
          <FormField label="Total Area (sqft)">
            <Input type="number" value={data.totalArea || ''} onChange={e => setData({...data, totalArea: parseFloat(e.target.value) || 0})} />
          </FormField>
          <FormField label="Built-up Area (sqft)">
            <Input type="number" value={data.builtUpArea || ''} onChange={e => setData({...data, builtUpArea: parseFloat(e.target.value) || 0})} />
          </FormField>
          <FormField label="Active">
            <div className="flex items-center gap-2 pt-1">
              <Switch checked={data.isActive !== false} onCheckedChange={v => setData({...data, isActive: v})} />
              <span className="text-sm text-gray-500">{data.isActive !== false ? 'Active' : 'Inactive'}</span>
            </div>
          </FormField>

          {/* Merged Lease Section */}
          <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
            <h3 className="font-semibold text-gray-800 text-sm border-b pb-1">Main Lease Information</h3>
          </div>

          <FormField label="Contract No">
            <Input type="number" value={data.contractNo || ''} onChange={e => setData({...data, contractNo: parseInt(e.target.value) || undefined})} placeholder="DREC Contract #" />
          </FormField>
          <FormField label="Lease Number">
            <Input value={data.leaseNumber || ''} onChange={e => setData({...data, leaseNumber: e.target.value})} placeholder="ML-YYYY-NNN" />
          </FormField>
          <FormField label="Lease Status">
            <Select value={data.leaseStatus || 'DRAFT'} onValueChange={v => setData({...data, leaseStatus: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEASE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Tenant Number">
            <Input value={data.tenantNumber || ''} onChange={e => setData({...data, tenantNumber: e.target.value})} placeholder="DREC Tenant #" />
          </FormField>
          <FormField label="Land Number">
            <Input value={data.landNumber || ''} onChange={e => setData({...data, landNumber: e.target.value})} placeholder="DREC Land #" />
          </FormField>
          <FormField label="Location">
            <Input value={data.location || ''} onChange={e => setData({...data, location: e.target.value})} placeholder="Location area" />
          </FormField>
          <FormField label="Lease Start Date">
            <Input type="date" value={data.leaseStartDate ? data.leaseStartDate.split('T')[0] : ''} onChange={e => setData({...data, leaseStartDate: e.target.value})} />
          </FormField>
          <FormField label="Lease End Date">
            <Input type="date" value={data.leaseEndDate ? data.leaseEndDate.split('T')[0] : ''} onChange={e => setData({...data, leaseEndDate: e.target.value})} />
          </FormField>
          <FormField label="Rent Amount (AED)">
            <Input type="number" value={data.rentAmount || ''} onChange={e => setData({...data, rentAmount: parseFloat(e.target.value) || 0})} />
          </FormField>
          <FormField label="Annual Rent/Sq.Ft (AED)">
            <Input type="number" value={data.annualRentPerSqFt || ''} onChange={e => setData({...data, annualRentPerSqFt: parseFloat(e.target.value) || undefined})} />
          </FormField>
          <FormField label="Rent Frequency">
            <Select value={data.rentFrequency || 'annual'} onValueChange={v => setData({...data, rentFrequency: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RENT_FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Security Deposit (AED)">
            <Input type="number" value={data.securityDeposit || ''} onChange={e => setData({...data, securityDeposit: parseFloat(e.target.value) || 0})} />
          </FormField>
          <FormField label="Increment %">
            <Input type="number" value={data.incrementPercent || ''} onChange={e => setData({...data, incrementPercent: parseFloat(e.target.value) || undefined})} />
          </FormField>
          <FormField label="Increment Freq (Years)">
            <Input type="number" value={data.incrementFrequency || ''} onChange={e => setData({...data, incrementFrequency: parseInt(e.target.value) || undefined})} />
          </FormField>
          <FormField label="Landlord Name">
            <Input value={data.landlordName || ''} onChange={e => setData({...data, landlordName: e.target.value})} />
          </FormField>
          <FormField label="Landlord Contact">
            <Input value={data.landlordContact || ''} onChange={e => setData({...data, landlordContact: e.target.value})} />
          </FormField>
          <FormField label="Landlord Email">
            <Input type="email" value={data.landlordEmail || ''} onChange={e => setData({...data, landlordEmail: e.target.value})} />
          </FormField>
          <div className="col-span-1 md:col-span-2">
            <FormField label="Terms (JSON)">
              <Textarea value={data.terms || ''} onChange={e => setData({...data, terms: e.target.value})} rows={2} />
            </FormField>
          </div>
          <div className="col-span-1 md:col-span-2">
            <FormField label="Notes">
              <Textarea value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})} rows={2} />
            </FormField>
          </div>
        </div>
      )}
      defaultData={() => ({ 
        name: '', 
        propertyCode: '', 
        propertyType: 'WAREHOUSE', 
        city: 'Dubai', 
        country: 'UAE', 
        isActive: true,
        landlordName: 'DREC Properties',
        leaseStatus: 'DRAFT',
        rentFrequency: 'annual'
      })}
        />
      </TabsContent>

      <TabsContent value="units" className="mt-0">
        <UnitsPage />
      </TabsContent>
    </Tabs>
  )
}
