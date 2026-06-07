'use client'

import React, { useEffect, useState } from 'react'
import { ModulePage, FormField, formatDate, formatCurrency, StatusBadge, LEASE_STATUS_MAP } from '@/components/common/module-page'
import { mainLeasesApi, propertiesApi, companiesApi } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

export function MainLeasesPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])

  useEffect(() => {
    propertiesApi.list({ pageSize: 100, isActive: 'true' }).then(res => setProperties(res.data || [])).catch(() => {})
    companiesApi.list({ pageSize: 100, isActive: 'true' }).then(res => setCompanies(res.data || [])).catch(() => {})
  }, [])

  return (
    <ModulePage
      title="Main Lease"
      api={mainLeasesApi}
      searchPlaceholder="Search main leases..."
      columns={[
        { key: 'leaseNumber', label: 'Lease #', render: (v: any) => <span className="font-mono font-medium">{v}</span> },
        { key: 'propertyName', label: 'Property', render: (v: any) => v || '-' },
        { key: 'companyName', label: 'Company', render: (v: any) => v || '-' },
        { key: 'startDate', label: 'Start', render: (v: any) => formatDate(v) },
        { key: 'endDate', label: 'End', render: (v: any) => formatDate(v) },
        { key: 'rentAmount', label: 'Rent', render: (v: any) => formatCurrency(v) },
        { key: 'status', label: 'Status', render: (v: any) => <StatusBadge status={v} map={LEASE_STATUS_MAP} /> },
      ]}
      filterOptions={[
        { key: 'status', label: 'Status', options: LEASE_STATUSES },
      ]}
      renderForm={(data, setData) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Lease Number">
            <Input value={data.leaseNumber || ''} onChange={e => setData({...data, leaseNumber: e.target.value})} placeholder="ML-YYYY-NNN" />
          </FormField>
          <FormField label="Status">
            <Select value={data.status || 'DRAFT'} onValueChange={v => setData({...data, status: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEASE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Property">
            <Select value={data.propertyId || ''} onValueChange={v => setData({...data, propertyId: v})}>
              <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
              <SelectContent>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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
          <FormField label="Start Date">
            <Input type="date" value={data.startDate ? data.startDate.split('T')[0] : ''} onChange={e => setData({...data, startDate: e.target.value})} />
          </FormField>
          <FormField label="End Date">
            <Input type="date" value={data.endDate ? data.endDate.split('T')[0] : ''} onChange={e => setData({...data, endDate: e.target.value})} />
          </FormField>
          <FormField label="Rent Amount (AED)">
            <Input type="number" value={data.rentAmount || ''} onChange={e => setData({...data, rentAmount: parseFloat(e.target.value) || 0})} />
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
      defaultData={() => ({ leaseNumber: '', status: 'DRAFT', rentFrequency: 'annual', landlordName: 'DREC Properties', isActive: true })}
    />
  )
}
