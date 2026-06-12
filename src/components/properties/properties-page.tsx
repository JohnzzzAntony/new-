'use client'

import React, { useEffect, useState } from 'react'
import { ModulePage, FormField, formatDate, StatusBadge } from '@/components/common/module-page'
import { propertiesApi, companiesApi } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

export function PropertiesPage() {
  const [companies, setCompanies] = useState<any[]>([])

  useEffect(() => {
    companiesApi.list({ pageSize: 100, isActive: 'true' }).then(res => setCompanies(res.data || [])).catch(() => {})
  }, [])

  return (
    <ModulePage
      title="Property"
      api={propertiesApi}
      searchPlaceholder="Search properties..."
      columns={[
        { key: 'propertyCode', label: 'Code', render: (v: any) => <span className="font-mono text-xs">{v}</span> },
        { key: 'name', label: 'Name', render: (v: any) => <span className="font-medium">{v}</span> },
        {
          key: 'propertyType',
          label: 'Type',
          render: (v: any) => <StatusBadge status={v} map={TYPE_BADGE_MAP} />
        },
        { key: 'totalArea', label: 'Area (sqft)', render: (v: any) => v ? v.toLocaleString() : '-' },
        { key: 'company', label: 'Company', render: (_: any, row: any) => row.company?.name || '-' },
        { key: 'unitCount', label: 'Units', render: (v: any) => v || 0 },
        {
          key: 'isActive',
          label: 'Status',
          render: (v: any) => <Badge className={v ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-red-100 text-red-700 border-0'}>{v ? 'Active' : 'Inactive'}</Badge>
        },
      ]}
      filterOptions={[
        {
          key: 'propertyType',
          label: 'Type',
          options: PROPERTY_TYPES
        }
      ]}
      renderForm={(data, setData) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Property Name">
            <Input value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} placeholder="Enter property name" />
          </FormField>
          <FormField label="Property Code">
            <Input value={data.propertyCode || ''} onChange={e => setData({...data, propertyCode: e.target.value})} placeholder="PROP-XXX-NNN" />
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
          <div className="col-span-2">
            <FormField label="Description">
              <Textarea value={data.description || ''} onChange={e => setData({...data, description: e.target.value})} rows={2} />
            </FormField>
          </div>
          <div className="col-span-2">
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
          <FormField label="Plot Number">
            <Input value={data.plotNumber || ''} onChange={e => setData({...data, plotNumber: e.target.value})} />
          </FormField>
          <FormField label="Total Area (sqft)">
            <Input type="number" value={data.totalArea || ''} onChange={e => setData({...data, totalArea: parseFloat(e.target.value) || 0})} />
          </FormField>
          <FormField label="Built-up Area (sqft)">
            <Input type="number" value={data.builtUpArea || ''} onChange={e => setData({...data, builtUpArea: parseFloat(e.target.value) || 0})} />
          </FormField>
          <FormField label="Year Built">
            <Input type="number" value={data.yearBuilt || ''} onChange={e => setData({...data, yearBuilt: parseInt(e.target.value) || 0})} />
          </FormField>
          <FormField label="Active">
            <div className="flex items-center gap-2 pt-1">
              <Switch checked={data.isActive !== false} onCheckedChange={v => setData({...data, isActive: v})} />
              <span className="text-sm text-gray-500">{data.isActive !== false ? 'Active' : 'Inactive'}</span>
            </div>
          </FormField>
        </div>
      )}
      defaultData={() => ({ name: '', propertyCode: '', propertyType: 'WAREHOUSE', city: 'Dubai', country: 'UAE', isActive: true })}
    />
  )
}
