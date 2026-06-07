'use client'

import React from 'react'
import { ModulePage, FormField, formatDate } from '@/components/common/module-page'
import { companiesApi } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function CompaniesPage() {
  return (
    <ModulePage
      title="Company"
      api={companiesApi}
      searchPlaceholder="Search companies..."
      columns={[
        { key: 'name', label: 'Name', render: (v: any) => <span className="font-medium">{v}</span> },
        { key: 'tradeName', label: 'Trade Name' },
        { key: 'registrationNo', label: 'Registration No' },
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
          <div className="col-span-2">
            <FormField label="Address">
              <Textarea value={data.address || ''} onChange={e => setData({...data, address: e.target.value})} placeholder="Full address" rows={2} />
            </FormField>
          </div>
          <div className="col-span-2">
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
