'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { complianceApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StatusBadge, COMPLIANCE_STATUS_MAP, formatDate } from '@/components/common/module-page'
import { Loader2, CheckCircle, AlertTriangle, XCircle, Shield, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'

const COMPLIANCE_TYPES = [
  { value: 'LEASE_EXPIRY', label: 'Lease Expiry' },
  { value: 'EJARI_EXPIRY', label: 'EJARI Expiry' },
  { value: 'TRADE_LICENSE_EXPIRY', label: 'Trade License Expiry' },
  { value: 'INSURANCE_EXPIRY', label: 'Insurance Expiry' },
  { value: 'OTHER', label: 'Other' },
]

const COMPLIANCE_STATUSES = [
  { value: 'COMPLIANT', label: 'Compliant' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'ACTION_REQUIRED', label: 'Action Required' },
]

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  LEASE_EXPIRY: AlertTriangle,
  EJARI_EXPIRY: Shield,
  TRADE_LICENSE_EXPIRY: XCircle,
  INSURANCE_EXPIRY: XCircle,
  OTHER: AlertTriangle,
}

export function CompliancePage() {
  const { searchQuery, setSearchQuery } = useAppStore()
  const [alerts, setAlerts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [resolveId, setResolveId] = useState<string | null>(null)
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolving, setResolving] = useState(false)

  const loadAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { search: searchQuery }
      if (typeFilter) params.type = typeFilter
      if (statusFilter) params.status = statusFilter
      const result = await complianceApi.list(params)
      setAlerts(result.data || [])
      setTotal(result.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [typeFilter, statusFilter, searchQuery])

  useEffect(() => { loadAlerts() }, [loadAlerts])

  const handleResolve = async () => {
    if (!resolveId) return
    setResolving(true)
    try {
      await complianceApi.update(resolveId, { status: 'COMPLIANT', notes: resolveNotes, resolvedAt: new Date().toISOString() })
      setResolveId(null)
      setResolveNotes('')
      loadAlerts()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setResolving(false)
    }
  }

  const expiredCount = alerts.filter(a => a.status === 'EXPIRED').length
  const actionCount = alerts.filter(a => a.status === 'ACTION_REQUIRED').length
  const warningCount = alerts.filter(a => a.status === 'WARNING').length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Expired</p>
              <p className="text-xl font-bold text-red-600">{expiredCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Action Required</p>
              <p className="text-xl font-bold text-orange-600">{actionCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Warnings</p>
              <p className="text-xl font-bold text-yellow-600">{warningCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search compliance alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-full"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={typeFilter || 'all'} onValueChange={v => setTypeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-[180px] h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {COMPLIANCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter || 'all'} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-[160px] h-9"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {COMPLIANCE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" /></div>
        ) : alerts.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center text-gray-400">No compliance alerts found</CardContent>
          </Card>
        ) : (
          alerts.map((alert) => {
            const Icon = TYPE_ICON_MAP[alert.type] || AlertTriangle
            return (
              <Card key={alert.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        alert.status === 'EXPIRED' ? 'bg-red-50' : alert.status === 'ACTION_REQUIRED' ? 'bg-orange-50' : alert.status === 'WARNING' ? 'bg-yellow-50' : 'bg-emerald-50'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          alert.status === 'EXPIRED' ? 'text-red-500' : alert.status === 'ACTION_REQUIRED' ? 'text-orange-500' : alert.status === 'WARNING' ? 'text-yellow-500' : 'text-emerald-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{alert.title}</h4>
                          <StatusBadge status={alert.status} map={COMPLIANCE_STATUS_MAP} />
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{alert.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                          <Badge variant="outline" className="text-xs">{(alert.type || '').replace(/_/g, ' ')}</Badge>
                          {alert.expiryDate && <span>Expires: {formatDate(alert.expiryDate)}</span>}
                          {alert.daysUntilExpiry != null && (
                            <span className={alert.daysUntilExpiry < 0 ? 'text-red-500 font-medium' : ''}>
                              {alert.daysUntilExpiry < 0 ? `${Math.abs(alert.daysUntilExpiry)}d overdue` : `${alert.daysUntilExpiry}d remaining`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {alert.status !== 'COMPLIANT' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setResolveId(alert.id); setResolveNotes('') }}
                        className="w-full sm:w-auto self-end sm:self-center shrink-0"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Resolve Dialog */}
      <AlertDialog open={!!resolveId} onOpenChange={() => setResolveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve Compliance Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this alert as compliant and add any resolution notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="text-sm">Resolution Notes</Label>
            <Textarea
              value={resolveNotes}
              onChange={e => setResolveNotes(e.target.value)}
              placeholder="Describe the action taken..."
              rows={3}
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResolve} disabled={resolving} className="bg-emerald-600 hover:bg-emerald-700">
              {resolving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Mark as Resolved
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
