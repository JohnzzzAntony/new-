'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { invoicesApi, receiptsApi, subleasesApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatCurrency, FormField, StatusBadge, INVOICE_STATUS_MAP } from '@/components/common/module-page'
import { Plus, Loader2, ChevronLeft, ChevronRight, Search, FileText, Receipt } from 'lucide-react'
import { useAppStore } from '@/lib/store'

const INVOICE_STATUSES = [
  { value: 'ISSUED', label: 'Issued' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'OTHER', label: 'Other' },
]

export function RentCollectionPage() {
  const { searchQuery, setSearchQuery } = useAppStore()
  const [activeTab, setActiveTab] = useState('invoices')

  // Invoice state
  const [invoices, setInvoices] = useState<any[]>([])
  const [invoiceTotal, setInvoiceTotal] = useState(0)
  const [invoicePage, setInvoicePage] = useState(1)
  const [invoiceStatus, setInvoiceStatus] = useState('')
  const [invoiceLoading, setInvoiceLoading] = useState(true)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [invoiceData, setInvoiceData] = useState<any>({})
  const [savingInvoice, setSavingInvoice] = useState(false)
  const [subleases, setSubleases] = useState<any[]>([])

  // Receipt state
  const [receipts, setReceipts] = useState<any[]>([])
  const [receiptTotal, setReceiptTotal] = useState(0)
  const [receiptPage, setReceiptPage] = useState(1)
  const [receiptLoading, setReceiptLoading] = useState(true)
  const [showReceiptForm, setShowReceiptForm] = useState(false)
  const [receiptData, setReceiptData] = useState<any>({})
  const [savingReceipt, setSavingReceipt] = useState(false)

  const pageSize = 10

  const loadInvoices = useCallback(async () => {
    setInvoiceLoading(true)
    try {
      const params: any = { page: invoicePage, pageSize, search: searchQuery }
      if (invoiceStatus) params.status = invoiceStatus
      const result = await invoicesApi.list(params)
      setInvoices(result.data || [])
      setInvoiceTotal(result.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setInvoiceLoading(false)
    }
  }, [invoicePage, searchQuery, invoiceStatus])

  const loadReceipts = useCallback(async () => {
    setReceiptLoading(true)
    try {
      const result = await receiptsApi.list({ page: receiptPage, pageSize })
      setReceipts(result.data || [])
      setReceiptTotal(result.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setReceiptLoading(false)
    }
  }, [receiptPage])

  useEffect(() => {
    subleasesApi.list({ pageSize: 200 }).then(res => setSubleases(res.data || [])).catch(() => {})
  }, [])

  useEffect(() => { loadInvoices() }, [loadInvoices])
  useEffect(() => { loadReceipts() }, [loadReceipts])

  const handleSubleaseChange = (subleaseId: string) => {
    const sub = subleases.find(s => s.id === subleaseId)
    if (!sub) return

    const rent = sub.rentAmount || 0
    const vat = Math.round((rent * 0.05) * 100) / 100 // 5% VAT in UAE
    const total = rent + vat

    const issueDateStr = new Date().toISOString().split('T')[0]
    
    // Default due date: 30 days from now
    const due = new Date()
    due.setDate(due.getDate() + 30)
    const dueDateStr = due.toISOString().split('T')[0]

    // Formatted date inputs (YYYY-MM-DD)
    const periodStartStr = sub.startDate ? sub.startDate.split('T')[0] : ''
    const periodEndStr = sub.endDate ? sub.endDate.split('T')[0] : ''

    // Generate a clean invoice number
    const rand = Math.floor(1000 + Math.random() * 9000)
    const invoiceNum = `INV-${sub.subleaseNumber}-${rand}`

    setInvoiceData({
      ...invoiceData,
      subleaseId,
      invoiceNumber: invoiceNum,
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      periodStart: periodStartStr,
      periodEnd: periodEndStr,
      rentAmount: rent,
      otherCharges: 0,
      vatAmount: vat,
      totalAmount: total,
      balanceDue: total
    })
  }

  const updateInvoiceField = (field: string, val: any) => {
    setInvoiceData(prev => {
      const updated = { ...prev, [field]: val }
      if (['rentAmount', 'otherCharges', 'vatAmount', 'amountPaid'].includes(field)) {
        const rent = parseFloat(updated.rentAmount) || 0
        const other = parseFloat(updated.otherCharges) || 0
        const vat = parseFloat(updated.vatAmount) || 0
        const paid = parseFloat(updated.amountPaid) || 0
        const total = Math.round((rent + other + vat) * 100) / 100
        updated.totalAmount = total
        updated.balanceDue = Math.round((total - paid) * 100) / 100
      } else if (['rentAmount', 'otherCharges', 'vatAmount'].includes(field)) {
        const rent = parseFloat(updated.rentAmount) || 0
        const other = parseFloat(updated.otherCharges) || 0
        const vat = parseFloat(updated.vatAmount) || 0
        const total = Math.round((rent + other + vat) * 100) / 100
        updated.totalAmount = total
        updated.balanceDue = total
      }
      return updated
    })
  }

  const handleSaveInvoice = async () => {
    setSavingInvoice(true)
    try {
      await invoicesApi.create(invoiceData)
      setShowInvoiceForm(false)
      loadInvoices()
    } catch (err: any) {
      alert(err.message || 'Failed')
    } finally {
      setSavingInvoice(false)
    }
  }

  const handleSaveReceipt = async () => {
    setSavingReceipt(true)
    try {
      await receiptsApi.create(receiptData)
      setShowReceiptForm(false)
      loadReceipts()
      loadInvoices()
    } catch (err: any) {
      alert(err.message || 'Failed')
    } finally {
      setSavingReceipt(false)
    }
  }

  const invoiceTotalPages = Math.ceil(invoiceTotal / pageSize)
  const receiptTotalPages = Math.ceil(receiptTotal / pageSize)

  // Summary stats
  const totalOutstanding = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((sum, i) => sum + (i.balanceDue || 0), 0)
  const totalCollected = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.totalAmount || 0), 0)
  const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total Collected</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalCollected)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Outstanding Balance</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Overdue Invoices</p>
            <p className="text-xl font-bold text-amber-600">{overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices"><FileText className="w-4 h-4 mr-1" /> Invoices</TabsTrigger>
          <TabsTrigger value="receipts"><Receipt className="w-4 h-4 mr-1" /> Receipts</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search invoices..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setInvoicePage(1) }} className="pl-9 h-9" />
              </div>
              <Select value={invoiceStatus || 'all'} onValueChange={v => { setInvoiceStatus(v === 'all' ? '' : v); setInvoicePage(1) }}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {INVOICE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { setInvoiceData({}); setShowInvoiceForm(true) }} className="bg-emerald-600 hover:bg-emerald-700 h-9">
              <Plus className="w-4 h-4 mr-1" /> Create Invoice
            </Button>
          </div>

          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Invoice #</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Subtenant</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Issue Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Due Date</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Paid</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Balance</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceLoading ? (
                      <tr><td colSpan={8} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" /></td></tr>
                    ) : invoices.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-12 text-gray-400">No invoices found</td></tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-mono text-xs font-medium">{inv.invoiceNumber}</td>
                          <td className="py-3 px-4">{inv.subtenantName || '-'}</td>
                          <td className="py-3 px-4">{formatDate(inv.issueDate)}</td>
                          <td className="py-3 px-4">{formatDate(inv.dueDate)}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(inv.totalAmount)}</td>
                          <td className="py-3 px-4 text-right text-emerald-600">{formatCurrency(inv.amountPaid)}</td>
                          <td className="py-3 px-4 text-right text-red-600 font-medium">{formatCurrency(inv.balanceDue)}</td>
                          <td className="py-3 px-4 text-center"><StatusBadge status={inv.status} map={INVOICE_STATUS_MAP} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {invoiceTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Showing {((invoicePage - 1) * pageSize) + 1}-{Math.min(invoicePage * pageSize, invoiceTotal)} of {invoiceTotal}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={invoicePage <= 1} onClick={() => setInvoicePage(invoicePage - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="text-sm">{invoicePage} / {invoiceTotalPages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={invoicePage >= invoiceTotalPages} onClick={() => setInvoicePage(invoicePage + 1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setReceiptData({}); setShowReceiptForm(true) }} className="bg-emerald-600 hover:bg-emerald-700 h-9">
              <Plus className="w-4 h-4 mr-1" /> Record Payment
            </Button>
          </div>

          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Receipt #</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Invoice</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Payment Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Method</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptLoading ? (
                      <tr><td colSpan={6} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" /></td></tr>
                    ) : receipts.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-gray-400">No receipts found</td></tr>
                    ) : (
                      receipts.map((rct) => (
                        <tr key={rct.id} className="border-b last:border-0 hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-mono text-xs font-medium">{rct.receiptNumber}</td>
                          <td className="py-3 px-4">{rct.invoice?.invoiceNumber || '-'}</td>
                          <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatCurrency(rct.amount)}</td>
                          <td className="py-3 px-4">{formatDate(rct.paymentDate)}</td>
                          <td className="py-3 px-4"><Badge variant="outline" className="text-xs">{(rct.paymentMethod || '').replace('_', ' ')}</Badge></td>
                          <td className="py-3 px-4 text-gray-500">{rct.referenceNo || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {receiptTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Showing {((receiptPage - 1) * pageSize) + 1}-{Math.min(receiptPage * pageSize, receiptTotal)} of {receiptTotal}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={receiptPage <= 1} onClick={() => setReceiptPage(receiptPage - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="text-sm">{receiptPage} / {receiptTotalPages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={receiptPage >= receiptTotalPages} onClick={() => setReceiptPage(receiptPage + 1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Invoice Dialog */}
      <Dialog open={showInvoiceForm} onOpenChange={setShowInvoiceForm}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Invoice Number">
              <Input value={invoiceData.invoiceNumber || ''} onChange={e => updateInvoiceField('invoiceNumber', e.target.value)} placeholder="INV-YYYY-NNNN" />
            </FormField>
            <FormField label="Sublease">
              <Select value={invoiceData.subleaseId || ''} onValueChange={handleSubleaseChange}>
                <SelectTrigger><SelectValue placeholder="Select sublease" /></SelectTrigger>
                <SelectContent>
                  {subleases.map(s => <SelectItem key={s.id} value={s.id}>{s.subleaseNumber} - {s.subtenant?.name || s.subtenantName || ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Issue Date">
              <Input type="date" value={invoiceData.issueDate || ''} onChange={e => updateInvoiceField('issueDate', e.target.value)} />
            </FormField>
            <FormField label="Due Date">
              <Input type="date" value={invoiceData.dueDate || ''} onChange={e => updateInvoiceField('dueDate', e.target.value)} />
            </FormField>
            <FormField label="Period Start">
              <Input type="date" value={invoiceData.periodStart || ''} onChange={e => updateInvoiceField('periodStart', e.target.value)} />
            </FormField>
            <FormField label="Period End">
              <Input type="date" value={invoiceData.periodEnd || ''} onChange={e => updateInvoiceField('periodEnd', e.target.value)} />
            </FormField>
            <FormField label="Rent Amount">
              <Input type="number" value={invoiceData.rentAmount || ''} onChange={e => updateInvoiceField('rentAmount', parseFloat(e.target.value) || 0)} />
            </FormField>
            <FormField label="Other Charges">
              <Input type="number" value={invoiceData.otherCharges || 0} onChange={e => updateInvoiceField('otherCharges', parseFloat(e.target.value) || 0)} />
            </FormField>
            <FormField label="VAT Amount">
              <Input type="number" value={invoiceData.vatAmount || 0} onChange={e => updateInvoiceField('vatAmount', parseFloat(e.target.value) || 0)} />
            </FormField>
            <FormField label="Total Amount">
              <Input type="number" value={invoiceData.totalAmount || ''} onChange={e => updateInvoiceField('totalAmount', parseFloat(e.target.value) || 0)} />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceForm(false)}>Cancel</Button>
            <Button onClick={handleSaveInvoice} disabled={savingInvoice} className="bg-emerald-600 hover:bg-emerald-700">
              {savingInvoice && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showReceiptForm} onOpenChange={setShowReceiptForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <FormField label="Invoice">
              <Select value={receiptData.invoiceId || ''} onValueChange={v => setReceiptData({...receiptData, invoiceId: v})}>
                <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                <SelectContent>
                  {invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.invoiceNumber} - {formatCurrency(i.balanceDue)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Amount">
              <Input type="number" value={receiptData.amount || ''} onChange={e => setReceiptData({...receiptData, amount: parseFloat(e.target.value) || 0})} />
            </FormField>
            <FormField label="Payment Date">
              <Input type="date" value={receiptData.paymentDate || ''} onChange={e => setReceiptData({...receiptData, paymentDate: e.target.value})} />
            </FormField>
            <FormField label="Payment Method">
              <Select value={receiptData.paymentMethod || 'BANK_TRANSFER'} onValueChange={v => setReceiptData({...receiptData, paymentMethod: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Reference No">
              <Input value={receiptData.referenceNo || ''} onChange={e => setReceiptData({...receiptData, referenceNo: e.target.value})} />
            </FormField>
            <FormField label="Bank Name">
              <Input value={receiptData.bankName || ''} onChange={e => setReceiptData({...receiptData, bankName: e.target.value})} />
            </FormField>
            <FormField label="Notes">
              <Input value={receiptData.notes || ''} onChange={e => setReceiptData({...receiptData, notes: e.target.value})} />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptForm(false)}>Cancel</Button>
            <Button onClick={handleSaveReceipt} disabled={savingReceipt} className="bg-emerald-600 hover:bg-emerald-700">
              {savingReceipt && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
