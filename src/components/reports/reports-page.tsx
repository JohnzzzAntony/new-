'use client'

import React, { useState } from 'react'
import { reportsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, StatusBadge, LEASE_STATUS_MAP, EJARI_STATUS_MAP, COMPLIANCE_STATUS_MAP } from '@/components/common/module-page'
import { BarChart3, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'

const REPORT_TYPES = [
  { value: 'occupancy', label: 'Occupancy Report' },
  { value: 'revenue', label: 'Revenue Report' },
  { value: 'leases', label: 'Leases Report' },
  { value: 'ejari', label: 'EJARI Report' },
  { value: 'compliance', label: 'Compliance Report' },
]

export function ReportsPage() {
  const [reportType, setReportType] = useState('occupancy')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateReport = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await reportsApi.get(reportType, 'json')
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = async () => {
    try {
      const result = await reportsApi.get(reportType, 'csv')
      const blob = new Blob([result.csv || result.data || ''], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Export failed')
    }
  }

  const exportJSON = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderReportContent = () => {
    if (!data) return null

    // Handle different report types
    const reportData = data.data || data

    if (Array.isArray(reportData)) {
      if (reportData.length === 0) {
        return <p className="text-center py-8 text-gray-400">No data available for this report</p>
      }

      const keys = Object.keys(reportData[0])
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {keys.map((key) => (
                  <th key={key} className="text-left py-2 px-3 font-medium text-gray-500 whitespace-nowrap">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row: any, i: number) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50/50">
                  {keys.map((key) => (
                    <td key={key} className="py-2 px-3 whitespace-nowrap">
                      {typeof row[key] === 'number'
                        ? row[key] >= 1000 ? formatCurrency(row[key]) : row[key]
                        : row[key] instanceof Date
                          ? formatDate(row[key])
                          : String(row[key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    // Object data (summary)
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(reportData).map(([key, value]) => (
          <Card key={key} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</p>
              <p className="text-lg font-bold mt-1">
                {typeof value === 'number'
                  ? value >= 1000 ? formatCurrency(value) : value
                  : String(value ?? '-')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Report Controls */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1 space-y-1 w-full">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto items-stretch sm:items-end">
              <Button onClick={generateReport} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 h-9 flex-1 sm:flex-none">
                {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-1" />}
                Generate Report
              </Button>
              {data && (
                <>
                  <Button variant="outline" onClick={exportCSV} className="h-9 flex-1 sm:flex-none">
                    <FileSpreadsheet className="w-4 h-4 mr-1" /> CSV
                  </Button>
                  <Button variant="outline" onClick={exportJSON} className="h-9 flex-1 sm:flex-none">
                    <FileText className="w-4 h-4 mr-1" /> JSON
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {data && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              {REPORT_TYPES.find(t => t.value === reportType)?.label || 'Report'}
              <Badge variant="outline" className="text-xs ml-auto">{new Date().toLocaleDateString()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderReportContent()}
          </CardContent>
        </Card>
      )}

      {!data && !loading && !error && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-500 font-medium">Select a report type and click Generate</h3>
            <p className="text-gray-400 text-sm mt-1">Reports can be exported as CSV or JSON</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
