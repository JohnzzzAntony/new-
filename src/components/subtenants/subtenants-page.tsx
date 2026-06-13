'use client'

import React, { useEffect, useState } from 'react'
import { ModulePage, FormField, formatDate } from '@/components/common/module-page'
import { subtenantsApi, companiesApi } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function SubtenantsPage() {
  const [companies, setCompanies] = useState<any[]>([])

  useEffect(() => {
    companiesApi.list({ pageSize: 200, isActive: 'true' }).then(res => setCompanies(res.data || [])).catch(() => {})
  }, [])

  return (
    <ModulePage
      title="Subtenant"
      api={subtenantsApi}
      searchPlaceholder="Search subtenants..."
      columns={[
        { key: 'name', label: 'Name', render: (v: any) => <span className="font-medium">{v}</span> },
        { key: 'tradeName', label: 'Trade Name' },
        { key: 'company', label: 'Linked Company', render: (_: any, row: any) => row.company?.name
          ? <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">{row.company.name}</Badge>
          : <span className="text-gray-400 text-xs">—</span> },
        { key: 'contactPerson', label: 'Contact' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        {
          key: 'tradeLicenseExpiry',
          label: 'License Expiry',
          render: (v: any) => {
            if (!v) return '-'
            const isExpired = new Date(v) < new Date()
            return <Badge className={isExpired ? 'bg-red-100 text-red-700 border-0' : 'bg-emerald-100 text-emerald-700 border-0'}>{formatDate(v)}</Badge>
          }
        },
        {
          key: 'isActive',
          label: 'Status',
          render: (v: any) => <Badge className={v ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-red-100 text-red-700 border-0'}>{v ? 'Active' : 'Inactive'}</Badge>
        },
      ]}
      renderForm={(data, setData) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Name">
            <Input value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} placeholder="Full name or company name" />
          </FormField>
          <FormField label="Trade Name">
            <Input value={data.tradeName || ''} onChange={e => setData({...data, tradeName: e.target.value})} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Linked Company (Optional — subtenant is always a company)">
              <Select value={data.companyId || 'none'} onValueChange={v => setData({...data, companyId: v === 'none' ? null : v})}>
                <SelectTrigger><SelectValue placeholder="Link to existing Company record (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Not linked —</SelectItem>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField label="Trade License No">
            <Input value={data.tradeLicenseNo || ''} onChange={e => setData({...data, tradeLicenseNo: e.target.value})} />
          </FormField>
          <FormField label="Trade License Expiry">
            <Input type="date" value={data.tradeLicenseExpiry ? data.tradeLicenseExpiry.split('T')[0] : ''} onChange={e => setData({...data, tradeLicenseExpiry: e.target.value})} />
          </FormField>
          <FormField label="Registration No">
            <Input value={data.registrationNo || ''} onChange={e => setData({...data, registrationNo: e.target.value})} />
          </FormField>
          <FormField label="Contact Person">
            <Input value={data.contactPerson || ''} onChange={e => setData({...data, contactPerson: e.target.value})} />
          </FormField>
          <FormField label="Phone">
            <Input value={data.phone || ''} onChange={e => setData({...data, phone: e.target.value})} placeholder="+971-" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={data.email || ''} onChange={e => setData({...data, email: e.target.value})} />
          </FormField>
          <FormField label="Nationality">
            <Input value={data.nationality || ''} onChange={e => setData({...data, nationality: e.target.value})} />
          </FormField>
          <FormField label="Emirates ID">
            <Input value={data.emiratesId || ''} onChange={e => setData({...data, emiratesId: e.target.value})} placeholder="784-YYYY-NNNNNNN-N" />
          </FormField>
          <FormField label="Passport No">
            <Input value={data.passportNo || ''} onChange={e => setData({...data, passportNo: e.target.value})} />
          </FormField>
          <FormField label="City">
            <Input value={data.city || 'Dubai'} onChange={e => setData({...data, city: e.target.value})} />
          </FormField>
          <FormField label="Country">
            <Input value={data.country || 'UAE'} onChange={e => setData({...data, country: e.target.value})} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Address">
              <Textarea value={data.address || ''} onChange={e => setData({...data, address: e.target.value})} rows={2} />
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
      defaultData={() => ({ name: '', contactPerson: '', country: 'UAE', city: 'Dubai', isActive: true })}
    />
  )
}
