'use client'

import React, { useEffect, useState } from 'react'
import { ModulePage, FormField, formatDate, StatusBadge, EJARI_STATUS_MAP } from '@/components/common/module-page'
import { ejariApi, subleasesApi, subtenantsApi } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const EJARI_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'REGISTERED', label: 'Registered' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'RENEWAL_PENDING', label: 'Renewal Pending' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export function EjariPage() {
  const [subleases, setSubleases] = useState<any[]>([])
  const [subtenants, setSubtenants] = useState<any[]>([])

  useEffect(() => {
    subleasesApi.list({ pageSize: 100 }).then(res => setSubleases(res.data || [])).catch(() => {})
    subtenantsApi.list({ pageSize: 100 }).then(res => setSubtenants(res.data || [])).catch(() => {})
  }, [])

  return (
    <ModulePage
      title="EJARI"
      api={ejariApi}
      searchPlaceholder="Search EJARI registrations..."
      columns={[
        { key: 'ejariNumber', label: 'EJARI #', render: (v: any) => <span className="font-mono font-medium">{v || 'Pending'}</span> },
        { key: 'sublease', label: 'Sublease', render: (_: any, row: any) => row.sublease?.subleaseNumber || '-' },
        { key: 'subtenant', label: 'Subtenant', render: (_: any, row: any) => row.subtenant?.name || '-' },
        { key: 'registrationDate', label: 'Registration', render: (v: any) => v ? formatDate(v) : '-' },
        { key: 'expiryDate', label: 'Expiry', render: (v: any) => {
          if (!v) return '-'
          const isExpired = new Date(v) < new Date()
          const isWarning = !isExpired && differenceInDays(new Date(v), new Date()) < 90
          return <span className={isExpired ? 'text-red-600 font-medium' : isWarning ? 'text-amber-600' : ''}>{formatDate(v)}</span>
        }},
        { key: 'status', label: 'Status', render: (v: any) => <StatusBadge status={v} map={EJARI_STATUS_MAP} /> },
      ]}
      filterOptions={[
        { key: 'status', label: 'Status', options: EJARI_STATUSES },
      ]}
      renderForm={(data, setData) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="EJARI Number">
            <Input value={data.ejariNumber || ''} onChange={e => setData({...data, ejariNumber: e.target.value})} placeholder="EJ-YYYY-NNNNNN" />
          </FormField>
          <FormField label="Status">
            <Select value={data.status || 'PENDING'} onValueChange={v => setData({...data, status: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EJARI_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Sublease">
            <Select value={data.subleaseId || 'none'} onValueChange={v => setData({...data, subleaseId: v === 'none' ? null : v})}>
              <SelectTrigger><SelectValue placeholder="Select sublease" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Select none —</SelectItem>
                {subleases.map(s => <SelectItem key={s.id} value={s.id}>{s.subleaseNumber}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Subtenant">
            <Select value={data.subtenantId || 'none'} onValueChange={v => setData({...data, subtenantId: v === 'none' ? null : v})}>
              <SelectTrigger><SelectValue placeholder="Select subtenant" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Select none —</SelectItem>
                {subtenants.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Registration Date">
            <Input type="date" value={data.registrationDate ? data.registrationDate.split('T')[0] : ''} onChange={e => setData({...data, registrationDate: e.target.value})} />
          </FormField>
          <FormField label="Expiry Date">
            <Input type="date" value={data.expiryDate ? data.expiryDate.split('T')[0] : ''} onChange={e => setData({...data, expiryDate: e.target.value})} />
          </FormField>
          <FormField label="Certificate URL">
            <Input value={data.certificateUrl || ''} onChange={e => setData({...data, certificateUrl: e.target.value})} placeholder="Upload or enter URL" />
          </FormField>
          <div className="col-span-1 md:col-span-2">
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
      defaultData={() => ({ status: 'PENDING', isActive: true })}
    />
  )
}

function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const diffTime = dateLeft.getTime() - dateRight.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
