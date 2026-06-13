'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { subleasesApi, propertiesApi, unitsApi, subtenantsApi, subleaseStagesApi, subleaseContractApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, FileSignature, Check, Clock, ChevronRight,
  Loader2, RefreshCw, FileDown, Plus, X, Building2, Box, User
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/components/common/module-page'

// ─── Pipeline Stage Config ────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: 'DRAFT',                label: 'Draft',                icon: '📝', description: 'Sublease agreement drafted' },
  { key: 'SENT_FOR_SIGNING',     label: 'Sent for Signing',     icon: '📤', description: 'Contract sent to tenant for signature' },
  { key: 'SIGNED',               label: 'Signed',               icon: '✍️', description: 'Contract signed by all parties' },
  { key: 'SUBMITTED_TO_DREC',    label: 'Submitted to DREC',    icon: '🏛️', description: 'Documents submitted to DREC authority' },
  { key: 'DREC_APPROVED',        label: 'DREC Approved',        icon: '✅', description: 'DREC has approved the sublease' },
  { key: 'EJARI_APPLIED',        label: 'EJARI Applied',        icon: '📋', description: 'EJARI registration applied' },
  { key: 'EJARI_REGISTERED',     label: 'EJARI Registered',     icon: '🛡️', description: 'EJARI registration confirmed' },
  { key: 'ACTIVE',               label: 'Active',               icon: '🟢', description: 'Sublease is live and active' },
]

function calcContractValue(annualRent: number, startDate: string, endDate: string): number {
  if (!annualRent || !startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  return parseFloat((annualRent * (days / 365)).toFixed(2))
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{children}</h3>
}

function FieldDisplay({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-gray-500">{label}</Label>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  )
}

// ─── Contract Print Template ──────────────────────────────────────────────────
function openContractPrintWindow(data: any) {
  const sl = data
  const property = sl.property
  const company = sl.property?.company
  const unit = sl.unit
  const subtenant = sl.subtenant
  const pdcDates: string[] = sl.pdcDates ? JSON.parse(sl.pdcDates) : []

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Sublease Contract — ${sl.subleaseNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #111; background: white; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 18pt; text-align: center; letter-spacing: 2px; margin-bottom: 4px; }
    h2 { font-size: 13pt; margin: 20px 0 8px; border-bottom: 1px solid #999; padding-bottom: 4px; }
    .subtitle { text-align: center; font-size: 10pt; color: #555; margin-bottom: 30px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 40px; margin: 12px 0; }
    .info-row { display: flex; flex-direction: column; gap: 2px; }
    .info-label { font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 11pt; font-weight: bold; }
    .highlight { background: #f0f9f0; border: 1px solid #c6e7c6; border-radius: 4px; padding: 12px; margin: 12px 0; }
    .clause { margin: 8px 0; line-height: 1.6; }
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 60px; }
    .sig-box { border-top: 1px solid #333; padding-top: 8px; text-align: center; font-size: 10pt; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10pt; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
    th { background: #f5f5f5; font-weight: bold; }
    @media print { body { print-color-adjust: exact; } }
  </style>
</head>
<body>
<div class="page">
  <h1>SUBLEASE AGREEMENT</h1>
  <p class="subtitle">Contract No. ${sl.subleaseNumber} &nbsp;|&nbsp; Dubai Real Estate Corporation</p>

  <h2>1. Property Information</h2>
  <div class="info-grid">
    <div class="info-row"><span class="info-label">Property</span><span class="info-value">${property?.name || '—'}</span></div>
    <div class="info-row"><span class="info-label">Plot No.</span><span class="info-value">${property?.plotNumber || '—'}</span></div>
    <div class="info-row"><span class="info-label">Unit / Premises</span><span class="info-value">${unit?.unitNumber || '—'} ${unit?.unitCode ? '(' + unit.unitCode + ')' : ''}</span></div>
    <div class="info-row"><span class="info-label">Area</span><span class="info-value">${unit?.area ? unit.area.toLocaleString() + ' sqft' : '—'}</span></div>
    <div class="info-row"><span class="info-label">Main Tenant</span><span class="info-value">${company?.name || '—'}</span></div>
    <div class="info-row"><span class="info-label">Contract No. (Main)</span><span class="info-value">${property?.contractNo || '—'}</span></div>
  </div>

  <h2>2. Sub-Tenant Details</h2>
  <div class="info-grid">
    <div class="info-row"><span class="info-label">Company Name</span><span class="info-value">${subtenant?.name || '—'}</span></div>
    <div class="info-row"><span class="info-label">Trade Name</span><span class="info-value">${subtenant?.tradeName || '—'}</span></div>
    <div class="info-row"><span class="info-label">Contact Person</span><span class="info-value">${subtenant?.contactPerson || subtenant?.company?.contactPerson || '—'}</span></div>
    <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${subtenant?.phone || '—'}</span></div>
    <div class="info-row"><span class="info-label">Email</span><span class="info-value">${subtenant?.email || '—'}</span></div>
    <div class="info-row"><span class="info-label">Trade License No.</span><span class="info-value">${subtenant?.tradeLicenseNo || '—'}</span></div>
  </div>

  <h2>3. Lease Terms</h2>
  <div class="highlight">
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Lease From</span><span class="info-value">${formatDate(sl.startDate)}</span></div>
      <div class="info-row"><span class="info-label">Lease To</span><span class="info-value">${formatDate(sl.endDate)}</span></div>
      <div class="info-row"><span class="info-label">Annual Rent</span><span class="info-value">AED ${(sl.rentAmount || 0).toLocaleString()}</span></div>
      <div class="info-row"><span class="info-label">Contract Value</span><span class="info-value">AED ${(sl.contractValue || 0).toLocaleString()}</span></div>
    </div>
  </div>

  <h2>4. Payment Schedule</h2>
  <p class="clause">Number of Cheques: <strong>${sl.numberOfCheques || '—'}</strong></p>
  ${pdcDates.length > 0 ? `
  <table>
    <thead><tr><th>#</th><th>Cheque Date</th></tr></thead>
    <tbody>${pdcDates.map((d, i) => `<tr><td>${i + 1}</td><td>${d}</td></tr>`).join('')}</tbody>
  </table>` : '<p class="clause">No post-dated cheques specified.</p>'}
  ${sl.paymentNotes ? `<p class="clause" style="margin-top:8px"><em>Notes: ${sl.paymentNotes}</em></p>` : ''}

  <h2>5. General Terms & Conditions</h2>
  <p class="clause">1. The sub-tenant agrees to use the premises solely for lawful commercial purposes as permitted by applicable UAE law and Dubai Emirate regulations.</p>
  <p class="clause">2. The sub-tenant shall maintain the premises in good condition and shall not make any structural alterations without prior written consent of the main tenant and DREC.</p>
  <p class="clause">3. This agreement is subject to the terms and conditions of the main lease agreement between DREC and the main tenant.</p>
  <p class="clause">4. The sub-tenant shall obtain and maintain all required business licenses and permits throughout the lease term.</p>
  <p class="clause">5. Any renewal of this sublease shall require a new written agreement and EJARI registration.</p>
  ${sl.notes ? `<p class="clause">Additional Notes: ${sl.notes}</p>` : ''}

  <div class="sig-grid">
    <div class="sig-box">
      <p><strong>Main Tenant (Lessor)</strong></p>
      <p>${company?.name || '________________________'}</p>
      <br/><p>Signature: ________________________</p>
      <p>Date: ________________________</p>
    </div>
    <div class="sig-box">
      <p><strong>Sub-Tenant (Lessee)</strong></p>
      <p>${subtenant?.name || '________________________'}</p>
      <br/><p>Signature: ________________________</p>
      <p>Date: ________________________</p>
    </div>
  </div>
</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (win) {
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
  }
}

// ─── Pipeline Step Component ──────────────────────────────────────────────────
function PipelineStep({
  stageConfig,
  stageData,
  index,
  total,
  isCompleted,
  isActive,
  canComplete,
  onMarkComplete,
  saving,
}: {
  stageConfig: typeof PIPELINE_STAGES[0]
  stageData: any
  index: number
  total: number
  isCompleted: boolean
  isActive: boolean
  canComplete: boolean
  onMarkComplete: (key: string) => void
  saving: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [doneBy, setDoneBy] = useState(stageData?.doneBy || '')
  const [notes, setNotes] = useState(stageData?.notes || '')
  const [docUrl, setDocUrl] = useState(stageData?.documentUrl || '')

  const bgColor = isCompleted
    ? 'bg-emerald-50 border-emerald-200'
    : isActive
      ? 'bg-blue-50 border-blue-200'
      : 'bg-gray-50 border-gray-200'

  const circleColor = isCompleted
    ? 'bg-emerald-500 text-white'
    : isActive
      ? 'bg-blue-500 text-white'
      : 'bg-gray-200 text-gray-500'

  return (
    <div className={`relative flex gap-3`}>
      {/* Connector line */}
      {index < total - 1 && (
        <div className={`absolute left-5 top-10 w-0.5 h-full -mb-2 ${isCompleted ? 'bg-emerald-300' : 'bg-gray-200'}`} style={{ height: 'calc(100% - 8px)' }} />
      )}
      {/* Circle */}
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 ${circleColor}`}>
        {isCompleted ? <Check className="w-5 h-5" /> : <span>{index + 1}</span>}
      </div>
      {/* Content */}
      <div className={`flex-1 mb-4 border rounded-xl p-4 ${bgColor} transition-all`}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2">
            <span className="text-base">{stageConfig.icon}</span>
            <div>
              <p className={`font-semibold text-sm ${isCompleted ? 'text-emerald-800' : isActive ? 'text-blue-800' : 'text-gray-600'}`}>
                {stageConfig.label}
              </p>
              <p className="text-xs text-gray-400">{stageConfig.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && stageData?.completedAt && (
              <span className="text-xs text-emerald-600 font-medium">{formatDate(stageData.completedAt)}</span>
            )}
            {isCompleted && stageData?.doneBy && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">{stageData.doneBy}</Badge>
            )}
            {canComplete && !isCompleted && (
              <Button
                size="sm"
                className="h-7 bg-emerald-600 hover:bg-emerald-700 text-xs"
                onClick={(e) => { e.stopPropagation(); onMarkComplete(stageConfig.key) }}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1" />Complete</>}
              </Button>
            )}
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-gray-500">Done By</Label>
              <Input className="h-7 text-xs mt-1" value={doneBy} onChange={e => setDoneBy(e.target.value)} placeholder="Name or role" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Document URL</Label>
              <Input className="h-7 text-xs mt-1" value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Notes</Label>
              <Input className="h-7 text-xs mt-1" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SubleaseDetailPage() {
  const { detailId, clearDetail, setActiveTab } = useAppStore()

  // Data
  const [sublease, setSublease] = useState<any>(null)
  const [stages, setStages] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [allUnits, setAllUnits] = useState<any[]>([])
  const [subtenants, setSubtenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stageSaving, setStageSaving] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // Form state
  const [form, setForm] = useState<any>({})
  const [isEditing, setIsEditing] = useState(false)

  // PDC dates
  const [pdcDates, setPdcDates] = useState<string[]>([])

  const loadSublease = useCallback(async () => {
    if (!detailId) return
    setLoading(true)
    try {
      const res = await subleasesApi.get(detailId)
      const data = (res as any)?.data || res
      setSublease(data)
      setForm(data)
      // Parse PDC dates
      try {
        setPdcDates(data.pdcDates ? JSON.parse(data.pdcDates) : [])
      } catch { setPdcDates([]) }
      // Load stages
      const stagesRes = await subleaseStagesApi.list(detailId)
      setStages((stagesRes as any)?.data || [])
    } catch (err) {
      console.error('SubleaseDetail load error:', err)
    } finally {
      setLoading(false)
    }
  }, [detailId])

  useEffect(() => {
    loadSublease()
    // Load reference data for selects
    propertiesApi.list({ pageSize: 100, isActive: 'true' }).then(r => setProperties((r as any).data || [])).catch(() => {})
    subtenantsApi.list({ pageSize: 100, isActive: 'true' }).then(r => setSubtenants((r as any).data || [])).catch(() => {})
  }, [loadSublease])

  // When form.propertyId changes, load units for that property
  useEffect(() => {
    if (form.propertyId) {
      unitsApi.list({ propertyId: form.propertyId, pageSize: 200 })
        .then(r => setAllUnits((r as any).data || []))
        .catch(() => {})
    }
  }, [form.propertyId])

  // Auto-calc contract value
  const contractValue = calcContractValue(
    parseFloat(form.rentAmount) || 0,
    form.startDate || '',
    form.endDate || ''
  )

  const handleFormChange = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }))

  // Auto-fill unit info when unit selected
  const handleUnitChange = (unitId: string) => {
    handleFormChange('unitId', unitId)
  }

  // Auto-fill subtenant info
  const handleSubtenantChange = (subtenantId: string) => {
    handleFormChange('subtenantId', subtenantId)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        contractValue,
        pdcDates: JSON.stringify(pdcDates),
        numberOfCheques: pdcDates.length || form.numberOfCheques,
      }
      await subleasesApi.update(detailId!, payload)
      setIsEditing(false)
      loadSublease()
    } catch (err: any) {
      alert(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkStageComplete = async (stageKey: string) => {
    setStageSaving(true)
    try {
      await subleaseStagesApi.upsert({
        subleaseId: detailId,
        stage: stageKey,
        completedAt: new Date().toISOString(),
        doneBy: 'Current User',
        notes: '',
      })
      const stagesRes = await subleaseStagesApi.list(detailId!)
      setStages((stagesRes as any)?.data || [])
    } catch (err: any) {
      alert(err.message || 'Failed to update stage')
    } finally {
      setStageSaving(false)
    }
  }

  const handleExportContract = async () => {
    setExportLoading(true)
    try {
      const res = await subleaseContractApi.get(detailId!)
      const data = (res as any)?.data
      if (data) {
        openContractPrintWindow(data)
      }
    } catch (err: any) {
      alert(err.message || 'Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  const handleAddPdcDate = () => setPdcDates(prev => [...prev, ''])
  const handlePdcDateChange = (i: number, v: string) => setPdcDates(prev => prev.map((d, idx) => idx === i ? v : d))
  const handleRemovePdcDate = (i: number) => setPdcDates(prev => prev.filter((_, idx) => idx !== i))

  const selectedUnit = allUnits.find((u: any) => u.id === form.unitId)
  const selectedSubtenant = subtenants.find((s: any) => s.id === form.subtenantId)
  const selectedProperty = properties.find((p: any) => p.id === form.propertyId)

  // Pipeline logic
  const getStageData = (key: string) => stages.find((s: any) => s.stage === key)
  const getCompletedIndex = () => {
    let last = -1
    PIPELINE_STAGES.forEach((s, i) => { if (getStageData(s.key)?.completedAt) last = i })
    return last
  }
  const completedIndex = getCompletedIndex()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-gray-500">Loading sublease...</span>
      </div>
    )
  }

  if (!sublease) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">Sublease not found.</p>
        <Button onClick={() => { clearDetail(); setActiveTab('subleases') }} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-4 flex-1 w-full min-w-0">
          <Button variant="ghost" onClick={() => { clearDetail(); setActiveTab('subleases') }} className="h-9 px-3 text-gray-500 hover:text-gray-900 shrink-0">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Subleases
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <FileSignature className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{sublease.subleaseNumber}</h1>
                <p className="text-sm text-gray-500 truncate">
                  {sublease.subtenant?.name} — {sublease.unit?.unitNumber} — {sublease.property?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
          <Button variant="outline" size="sm" onClick={loadSublease} className="flex-1 sm:flex-none">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportContract} disabled={exportLoading} className="flex-1 sm:flex-none">
            {exportLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />}
            Export
          </Button>
          {!isEditing
            ? <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none" onClick={() => setIsEditing(true)}>Edit</Button>
            : <>
              <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => { setIsEditing(false); setForm(sublease) }}>Cancel</Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Save
              </Button>
            </>
          }
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ─── Left: Form ─── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Property + Unit + Subtenant */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-700">Parties & Premises</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Property Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Property</Label>
                  {isEditing ? (
                    <Select value={form.propertyId || ''} onValueChange={v => handleFormChange('propertyId', v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select property" /></SelectTrigger>
                      <SelectContent>
                        {properties.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} {p.leaseNumber ? `(${p.leaseNumber})` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1 p-2.5 bg-gray-50 rounded-lg flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{sublease.property?.name || '—'}</span>
                    </div>
                  )}
                </div>
                {selectedProperty && (
                  <div className="space-y-1 text-sm">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Auto-filled: Property Info</Label>
                    <p className="text-gray-600">Plot: <strong>{selectedProperty.plotNumber || '—'}</strong></p>
                    <p className="text-gray-600">Location: <strong>{selectedProperty.area || selectedProperty.city}</strong></p>
                    <p className="text-gray-600">Area: <strong>{selectedProperty.totalArea ? selectedProperty.totalArea.toLocaleString() + ' sqft' : '—'}</strong></p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Unit</Label>
                  {isEditing ? (
                    <Select value={form.unitId || ''} onValueChange={handleUnitChange}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select unit" /></SelectTrigger>
                      <SelectContent>
                        {allUnits.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>{u.unitNumber} {u.unitCode ? `(${u.unitCode})` : ''} — {u.unitType}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1 p-2.5 bg-gray-50 rounded-lg flex items-center gap-2">
                      <Box className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{sublease.unit?.unitNumber} {sublease.unit?.unitCode ? `(${sublease.unit.unitCode})` : ''}</span>
                    </div>
                  )}
                </div>
                {(selectedUnit || sublease.unit) && (
                  <div className="space-y-1 text-sm">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Auto-filled: Unit Info</Label>
                    <p className="text-gray-600">Premises No.: <strong>{(selectedUnit || sublease.unit)?.unitNumber || '—'}</strong></p>
                    <p className="text-gray-600">Size: <strong>{(selectedUnit || sublease.unit)?.area ? (selectedUnit || sublease.unit).area.toLocaleString() + ' sqft' : '—'}</strong></p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Subtenant */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Sub-Tenant</Label>
                  {isEditing ? (
                    <Select value={form.subtenantId || ''} onValueChange={handleSubtenantChange}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select subtenant" /></SelectTrigger>
                      <SelectContent>
                        {subtenants.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1 p-2.5 bg-gray-50 rounded-lg flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{sublease.subtenant?.name || '—'}</span>
                    </div>
                  )}
                </div>
                {(selectedSubtenant || sublease.subtenant) && (
                  <div className="space-y-1 text-sm">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Auto-filled: Subtenant Info</Label>
                    <p className="text-gray-600">Phone: <strong>{(selectedSubtenant || sublease.subtenant)?.phone || '—'}</strong></p>
                    <p className="text-gray-600">Email: <strong>{(selectedSubtenant || sublease.subtenant)?.email || '—'}</strong></p>
                    <p className="text-gray-600">Contact: <strong>{(selectedSubtenant || sublease.subtenant)?.contactPerson || '—'}</strong></p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lease Terms */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-700">Lease Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Lease From</Label>
                  {isEditing
                    ? <Input type="date" className="mt-1" value={form.startDate ? form.startDate.split('T')[0] : ''} onChange={e => handleFormChange('startDate', e.target.value)} />
                    : <p className="mt-1 text-sm font-medium">{formatDate(sublease.startDate)}</p>}
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Lease To</Label>
                  {isEditing
                    ? <Input type="date" className="mt-1" value={form.endDate ? form.endDate.split('T')[0] : ''} onChange={e => handleFormChange('endDate', e.target.value)} />
                    : <p className="mt-1 text-sm font-medium">{formatDate(sublease.endDate)}</p>}
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Annual Rent (AED)</Label>
                  {isEditing
                    ? <Input type="number" className="mt-1" value={form.rentAmount || ''} onChange={e => handleFormChange('rentAmount', parseFloat(e.target.value) || 0)} />
                    : <p className="mt-1 text-sm font-medium">{formatCurrency(sublease.rentAmount)}</p>}
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Contract Value (Auto-Calculated)</Label>
                  <div className="mt-1 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm font-bold text-emerald-700">
                      AED {(isEditing ? contractValue : sublease.contractValue || 0).toLocaleString()}
                    </p>
                    {isEditing && (
                      <p className="text-xs text-emerald-500 mt-0.5">
                        = Annual Rent × (Days / 365)
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Sub-Lease Fee (AED)</Label>
                  {isEditing
                    ? <Input type="number" className="mt-1" value={form.subLeaseFee || ''} onChange={e => handleFormChange('subLeaseFee', parseFloat(e.target.value) || 0)} />
                    : <p className="mt-1 text-sm font-medium">{formatCurrency(sublease.subLeaseFee)}</p>}
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Rent Frequency</Label>
                  {isEditing ? (
                    <Select value={form.rentFrequency || 'monthly'} onValueChange={v => handleFormChange('rentFrequency', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-sm font-medium capitalize">{sublease.rentFrequency}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment / PDC */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-700">Mode of Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Number of Cheques</Label>
                  {isEditing
                    ? <Input type="number" className="mt-1" value={pdcDates.length || form.numberOfCheques || ''} readOnly placeholder="Set via PDC dates below" />
                    : <p className="mt-1 text-sm font-medium">{sublease.numberOfCheques || pdcDates.length || '—'}</p>}
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Payment Notes</Label>
                  {isEditing
                    ? <Input className="mt-1" value={form.paymentNotes || ''} onChange={e => handleFormChange('paymentNotes', e.target.value)} placeholder="e.g. PDC to be submitted by..." />
                    : <p className="mt-1 text-sm font-medium">{sublease.paymentNotes || '—'}</p>}
                </div>
              </div>

              {/* PDC Dates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-gray-500">Post-Dated Cheque Dates</Label>
                  {isEditing && (
                    <Button size="sm" variant="outline" className="h-7" onClick={handleAddPdcDate}>
                      <Plus className="w-3 h-3 mr-1" /> Add Date
                    </Button>
                  )}
                </div>
                {pdcDates.length === 0 && !isEditing && (
                  <p className="text-sm text-gray-400">No PDC dates recorded.</p>
                )}
                <div className="space-y-2">
                  {pdcDates.map((date, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-6">{i + 1}.</span>
                      {isEditing ? (
                        <>
                          <Input type="date" className="h-7 text-xs flex-1" value={date} onChange={e => handlePdcDateChange(i, e.target.value)} />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemovePdcDate(i)}>
                            <X className="w-3 h-3 text-red-400" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-sm font-medium">{date}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs text-gray-500">General Notes</Label>
                {isEditing
                  ? <Textarea className="mt-1" rows={2} value={form.notes || ''} onChange={e => handleFormChange('notes', e.target.value)} />
                  : <p className="mt-1 text-sm text-gray-600">{sublease.notes || '—'}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Right: Pipeline ─── */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" /> Process Pipeline
              </CardTitle>
              <p className="text-xs text-gray-400">
                {completedIndex + 1} of {PIPELINE_STAGES.length} stages completed
              </p>
              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100 rounded-full mt-2">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${((completedIndex + 1) / PIPELINE_STAGES.length) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {PIPELINE_STAGES.map((s, i) => {
                  const sd = getStageData(s.key)
                  const isCompleted = !!sd?.completedAt
                  const isActive = i === completedIndex + 1
                  const canComplete = isActive || (i === 0 && completedIndex === -1)
                  return (
                    <PipelineStep
                      key={s.key}
                      stageConfig={s}
                      stageData={sd}
                      index={i}
                      total={PIPELINE_STAGES.length}
                      isCompleted={isCompleted}
                      isActive={isActive}
                      canComplete={canComplete}
                      onMarkComplete={handleMarkStageComplete}
                      saving={stageSaving}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
