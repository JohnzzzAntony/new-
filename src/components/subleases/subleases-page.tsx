'use client'

import React, { useEffect, useState } from 'react'
import { ModulePage, FormField, formatDate, formatCurrency, StatusBadge, LEASE_STATUS_MAP } from '@/components/common/module-page'
import { subleasesApi, mainLeasesApi, unitsApi, subtenantsApi } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SUBLEASE_STATUSES = [
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

export function SubleasesPage() {
  const [mainLeases, setMainLeases] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [subtenants, setSubtenants] = useState<any[]>([])

  useEffect(() => {
    mainLeasesApi.list({ pageSize: 100 }).then(res => setMainLeases(res.data || [])).catch(() => {})
    unitsApi.list({ pageSize: 200 }).then(res => setUnits(res.data || [])).catch(() => {})
    subtenantsApi.list({ pageSize: 100, isActive: 'true' }).then(res => setSubtenants(res.data || [])).catch(() => {})
  }, [])

  return (
    <ModulePage
      title="Sublease"
      api={subleasesApi}
      searchPlaceholder="Search subleases..."
      columns={[
        { key: 'subleaseNumber', label: 'Contract #', render: (v: any) => <span className="font-mono font-medium">{v}</span> },
        { key: 'mainLease', label: 'Main Lease', render: (_: any, row: any) => row.mainLease?.contractNo || row.mainLease?.leaseNumber || '-' },
        { key: 'property', label: 'Property', render: (_: any, row: any) => row.mainLease?.property?.name || '-' },
        { key: 'subtenant', label: 'Subtenant', render: (_: any, row: any) => row.subtenant?.name || '-' },
        { key: 'unit', label: 'Unit', render: (_: any, row: any) => row.unit?.unitNumber || '-' },
        { key: 'endDate', label: 'Expires On', render: (v: any) => formatDate(v) },
        { key: 'contractValue', label: 'Contract Value', render: (v: any) => formatCurrency(v) },
        { key: 'subLeaseFee', label: 'Sub-Lease Fee', render: (v: any) => formatCurrency(v) },
        { key: 'status', label: 'Status', render: (v: any) => <StatusBadge status={v} map={LEASE_STATUS_MAP} /> },
      ]}
      filterOptions={[
        { key: 'status', label: 'Status', options: SUBLEASE_STATUSES },
      ]}
      renderForm={(data, setData) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Sublease Number">
            <Input value={data.subleaseNumber || ''} onChange={e => setData({...data, subleaseNumber: e.target.value})} placeholder="SL-YYYY-NNN" />
          </FormField>
          <FormField label="Status">
            <Select value={data.status || 'DRAFT'} onValueChange={v => setData({...data, status: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUBLEASE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Main Lease">
            <Select value={data.mainLeaseId || ''} onValueChange={v => setData({...data, mainLeaseId: v})}>
              <SelectTrigger><SelectValue placeholder="Select main lease" /></SelectTrigger>
              <SelectContent>
                {mainLeases.map(l => <SelectItem key={l.id} value={l.id}>{l.contractNo} - {l.leaseNumber}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Unit">
            <Select value={data.unitId || ''} onValueChange={v => setData({...data, unitId: v})}>
              <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
              <SelectContent>
                {units.map(u => <SelectItem key={u.id} value={u.id}>{u.unitNumber} - {u.unitType}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Subtenant">
            <Select value={data.subtenantId || ''} onValueChange={v => setData({...data, subtenantId: v})}>
              <SelectTrigger><SelectValue placeholder="Select subtenant" /></SelectTrigger>
              <SelectContent>
                {subtenants.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Contract Value (AED)">
            <Input type="number" value={data.contractValue || ''} onChange={e => setData({...data, contractValue: parseFloat(e.target.value) || 0})} />
          </FormField>
          <FormField label="Sub-Lease Fee (AED)">
            <Input type="number" value={data.subLeaseFee || ''} onChange={e => setData({...data, subLeaseFee: parseFloat(e.target.value) || 0})} />
          </FormField>
          <FormField label="Rent Frequency">
            <Select value={data.rentFrequency || 'monthly'} onValueChange={v => setData({...data, rentFrequency: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RENT_FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Start Date">
            <Input type="date" value={data.startDate ? data.startDate.split('T')[0] : ''} onChange={e => setData({...data, startDate: e.target.value})} />
          </FormField>
          <FormField label="End Date">
            <Input type="date" value={data.endDate ? data.endDate.split('T')[0] : ''} onChange={e => setData({...data, endDate: e.target.value})} />
          </FormField>
          <FormField label="Rent Amount (AED)">
            <Input type="number" value={data.rentAmount || ''} onChange={e => setData({...data, rentAmount: parseFloat(e.target.value) || 0})} />
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
          <div className="col-span-2">
            <FormField label="Terms (JSON)">
              <Textarea value={data.terms || ''} onChange={e => setData({...data, terms: e.target.value})} rows={2} />
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
      defaultData={() => ({
        subleaseNumber: '',
        status: 'DRAFT',
        rentFrequency: 'monthly',
        contractValue: 0,
        subLeaseFee: 0,
        isActive: true,
      })}
    />
  )
}
