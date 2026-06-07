'use client'

import React, { useEffect, useState } from 'react'
import { ModulePage, FormField, formatDate, formatCurrency, StatusBadge, UNIT_STATUS_MAP } from '@/components/common/module-page'
import { unitsApi, propertiesApi } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const UNIT_TYPES = [
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'SHOP', label: 'Shop' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'STORAGE_UNIT', label: 'Storage Unit' },
  { value: 'PARKING', label: 'Parking' },
]

const UNIT_STATUSES = [
  { value: 'VACANT', label: 'Vacant' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export function UnitsPage() {
  const [properties, setProperties] = useState<any[]>([])

  useEffect(() => {
    propertiesApi.list({ pageSize: 100, isActive: 'true' }).then(res => setProperties(res.data || [])).catch(() => {})
  }, [])

  return (
    <ModulePage
      title="Unit"
      api={unitsApi}
      searchPlaceholder="Search units..."
      columns={[
        { key: 'unitNumber', label: 'Unit #', render: (v: any) => <span className="font-mono font-medium">{v}</span> },
        { key: 'unitType', label: 'Type', render: (v: any) => <Badge variant="outline" className="text-xs">{(v || '').replace('_', ' ')}</Badge> },
        { key: 'status', label: 'Status', render: (v: any) => <StatusBadge status={v} map={UNIT_STATUS_MAP} /> },
        { key: 'area', label: 'Area (sqft)', render: (v: any) => v ? v.toLocaleString() : '-' },
        { key: 'rentAmount', label: 'Rent', render: (v: any) => formatCurrency(v) },
        { key: 'property', label: 'Property', render: (_: any, row: any) => row.property?.name || '-' },
      ]}
      filterOptions={[
        { key: 'unitType', label: 'Type', options: UNIT_TYPES },
        { key: 'status', label: 'Status', options: UNIT_STATUSES },
      ]}
      renderForm={(data, setData) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Unit Number">
            <Input value={data.unitNumber || ''} onChange={e => setData({...data, unitNumber: e.target.value})} placeholder="e.g. WH-A01" />
          </FormField>
          <FormField label="Unit Code">
            <Input value={data.unitCode || ''} onChange={e => setData({...data, unitCode: e.target.value})} placeholder="Auto or custom" />
          </FormField>
          <FormField label="Unit Type">
            <Select value={data.unitType || 'WAREHOUSE'} onValueChange={v => setData({...data, unitType: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={data.status || 'VACANT'} onValueChange={v => setData({...data, status: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Property">
            <Select value={data.propertyId || ''} onValueChange={v => setData({...data, propertyId: v})}>
              <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
              <SelectContent>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.propertyCode})</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Floor">
            <Input type="number" value={data.floor || ''} onChange={e => setData({...data, floor: parseInt(e.target.value) || undefined})} />
          </FormField>
          <FormField label="Area (sqft)">
            <Input type="number" value={data.area || ''} onChange={e => setData({...data, area: parseFloat(e.target.value) || 0})} />
          </FormField>
          <FormField label="Rent Amount (AED)">
            <Input type="number" value={data.rentAmount || ''} onChange={e => setData({...data, rentAmount: parseFloat(e.target.value) || 0})} />
          </FormField>
          <FormField label="Security Deposit (AED)">
            <Input type="number" value={data.securityDeposit || ''} onChange={e => setData({...data, securityDeposit: parseFloat(e.target.value) || 0})} />
          </FormField>
          <FormField label="Amenities (JSON)">
            <Input value={data.amenities || ''} onChange={e => setData({...data, amenities: e.target.value})} placeholder='["Loading Dock", "AC"]' />
          </FormField>
          <div className="col-span-2">
            <FormField label="Description">
              <Textarea value={data.description || ''} onChange={e => setData({...data, description: e.target.value})} rows={2} />
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="Notes">
              <Textarea value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})} rows={2} />
            </FormField>
          </div>
          <FormField label="Active">
            <div className="flex items-center gap-2 pt-1">
              <Switch checked={data.isActive !== false} onCheckedChange={v => setData({...data, isActive: v})} />
              <span className="text-sm text-gray-500">{data.isActive !== false ? 'Active' : 'Inactive'}</span>
            </div>
          </FormField>
        </div>
      )}
      defaultData={() => ({ unitNumber: '', unitType: 'WAREHOUSE', status: 'VACANT', isActive: true })}
    />
  )
}
