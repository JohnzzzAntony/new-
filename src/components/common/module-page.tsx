'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Search, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Eye, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
  sortable?: boolean
}

interface FilterOption {
  key: string
  label: string
  options: { value: string; label: string }[]
}

interface ModulePageProps {
  title: string
  api: any
  columns: Column[]
  filterOptions?: FilterOption[]
  renderForm: (data: any, setData: (data: any) => void) => React.ReactNode
  defaultData: () => any
  searchPlaceholder?: string
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  onRowView?: (row: any) => void
}

export function ModulePage({
  title,
  api,
  columns,
  filterOptions,
  renderForm,
  defaultData,
  searchPlaceholder = 'Search...',
  canCreate = true,
  canEdit = true,
  canDelete = true,
  onRowView,
}: ModulePageProps) {
  const { user, searchQuery, setSearchQuery } = useAppStore()
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<any>(defaultData())
  const [editMode, setEditMode] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [viewData, setViewData] = useState<any>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize, search: searchQuery, ...filters }
      const result = await api.list(params)
      setData(result.data || [])
      setTotal(result.total || 0)
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchQuery, filters, api])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreate = () => {
    setFormData(defaultData())
    setEditMode(false)
    setShowForm(true)
  }

  const handleEdit = (row: any) => {
    setFormData({ ...row })
    setEditMode(true)
    setShowForm(true)
  }

  const handleView = (row: any) => {
    setViewData(row)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editMode) {
        await api.update(formData.id, formData)
      } else {
        await api.create(formData)
      }
      setShowForm(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(deleteId)
      setDeleteId(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Delete failed')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  const isReadOnly = user?.role === 'READ_ONLY'

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              className="pl-9 h-9"
            />
          </div>
          {filterOptions?.map((filter) => (
            <Select
              key={filter.key}
              value={filters[filter.key] || 'all'}
              onValueChange={(v) => {
                setFilters((prev) => ({ ...prev, [filter.key]: v === 'all' ? '' : v }))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
        {canCreate && !isReadOnly && (
          <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 h-9">
            <Plus className="w-4 h-4 mr-1" /> Add New
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {columns.map((col) => (
                    <th key={col.key} className="text-left py-3 px-4 font-medium text-gray-500 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="text-right py-3 px-4 font-medium text-gray-500 w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                      <p className="text-gray-400 mt-2">Loading...</p>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center py-12 text-gray-400">
                      No records found
                    </td>
                  </tr>
                ) : (
                  data.map((row, i) => (
                    <tr key={row.id || i} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-emerald-700 hover:bg-emerald-50/10 transition-colors"
                          onClick={() => onRowView ? onRowView(row) : handleView(row)}
                        >
                          {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '-')}
                        </td>
                      ))}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRowView ? onRowView(row) : handleView(row)}>
                            <Eye className="w-4 h-4 text-gray-400" />
                          </Button>
                          {canEdit && !isReadOnly && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(row)}>
                              <Pencil className="w-4 h-4 text-gray-400" />
                            </Button>
                          )}
                          {canDelete && !isReadOnly && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(row.id)}>
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit' : 'Create'} {title}</DialogTitle>
          </DialogHeader>
          {renderForm(formData, setFormData)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={!!viewData} onOpenChange={() => setViewData(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title} Details</DialogTitle>
          </DialogHeader>
          {viewData && (
            <div className="grid grid-cols-2 gap-3">
              {columns.map((col) => (
                <div key={col.key} className="space-y-1">
                  <Label className="text-xs text-gray-500">{col.label}</Label>
                  <div className="text-sm font-medium">
                    {col.render ? col.render(viewData[col.key], viewData) : String(viewData[col.key] ?? '-')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {title.toLowerCase()}? This action will archive the record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Shared form helpers
export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  )
}

export function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; class: string }> }) {
  const info = map[status] || { label: status, class: 'bg-gray-100 text-gray-700' }
  return <Badge className={`${info.class} text-xs border-0`}>{info.label}</Badge>
}

export const LEASE_STATUS_MAP: Record<string, { label: string; class: string }> = {
  DRAFT: { label: 'Draft', class: 'bg-gray-100 text-gray-700' },
  ACTIVE: { label: 'Active', class: 'bg-emerald-100 text-emerald-700' },
  EXPIRED: { label: 'Expired', class: 'bg-red-100 text-red-700' },
  TERMINATED: { label: 'Terminated', class: 'bg-red-100 text-red-700' },
  RENEWED: { label: 'Renewed', class: 'bg-blue-100 text-blue-700' },
  UNDER_REVIEW: { label: 'Under Review', class: 'bg-yellow-100 text-yellow-700' },
}

export const UNIT_STATUS_MAP: Record<string, { label: string; class: string }> = {
  VACANT: { label: 'Vacant', class: 'bg-emerald-100 text-emerald-700' },
  OCCUPIED: { label: 'Occupied', class: 'bg-blue-100 text-blue-700' },
  UNDER_MAINTENANCE: { label: 'Maintenance', class: 'bg-yellow-100 text-yellow-700' },
  RESERVED: { label: 'Reserved', class: 'bg-purple-100 text-purple-700' },
  INACTIVE: { label: 'Inactive', class: 'bg-gray-100 text-gray-700' },
}

export const INVOICE_STATUS_MAP: Record<string, { label: string; class: string }> = {
  DRAFT: { label: 'Draft', class: 'bg-gray-100 text-gray-700' },
  ISSUED: { label: 'Issued', class: 'bg-blue-100 text-blue-700' },
  PAID: { label: 'Paid', class: 'bg-emerald-100 text-emerald-700' },
  PARTIALLY_PAID: { label: 'Partial', class: 'bg-yellow-100 text-yellow-700' },
  OVERDUE: { label: 'Overdue', class: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelled', class: 'bg-gray-100 text-gray-700' },
}

export const EJARI_STATUS_MAP: Record<string, { label: string; class: string }> = {
  PENDING: { label: 'Pending', class: 'bg-yellow-100 text-yellow-700' },
  REGISTERED: { label: 'Registered', class: 'bg-emerald-100 text-emerald-700' },
  EXPIRED: { label: 'Expired', class: 'bg-red-100 text-red-700' },
  RENEWAL_PENDING: { label: 'Renewal Pending', class: 'bg-orange-100 text-orange-700' },
  CANCELLED: { label: 'Cancelled', class: 'bg-gray-100 text-gray-700' },
}

export const COMPLIANCE_STATUS_MAP: Record<string, { label: string; class: string }> = {
  COMPLIANT: { label: 'Compliant', class: 'bg-emerald-100 text-emerald-700' },
  WARNING: { label: 'Warning', class: 'bg-yellow-100 text-yellow-700' },
  EXPIRED: { label: 'Expired', class: 'bg-red-100 text-red-700' },
  ACTION_REQUIRED: { label: 'Action Required', class: 'bg-orange-100 text-orange-700' },
}

export function formatDate(d: string | Date | null | undefined) {
  if (!d) return '-'
  try {
    const date = typeof d === 'string' ? new Date(d) : d
    if (isNaN(date.getTime())) return '-'
    const day = date.getDate().toString().padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  } catch { return String(d) }
}

export function formatCurrency(n: number | null | undefined) {
  if (n == null) return '-'
  return `AED ${n.toLocaleString()}`
}
