'use client'

import { useState, useEffect } from 'react'
import { ReportCard, ReportCardSkeleton } from '@/components/ReportCard'
import type { PeriodicReport, ReportType } from '@/types/database'

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('weekly')
  const [reports, setReports] = useState<PeriodicReport[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadReports()
  }, [reportType])

  const loadReports = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports?type=${reportType}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          date: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        await loadReports()
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setGenerating(false)
    }
  }

  const reportTypes: { value: ReportType; label: string; icon: string }[] = [
    { value: 'weekly', label: 'Weekly', icon: '📅' },
    { value: 'monthly', label: 'Monthly', icon: '📊' },
    { value: 'quarterly', label: 'Quarterly', icon: '📈' },
    { value: 'yearly', label: 'Yearly', icon: '🎯' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Reports</h1>
        <p className="text-muted-foreground">
          AI-generated insights across different time periods
        </p>
      </div>

      {/* Report Type Selector */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {reportTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value)}
                className={`btn ${
                  reportType === type.value ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <span className="mr-2">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="btn btn-primary"
          >
            {generating ? 'Generating...' : 'Generate New'}
          </button>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="space-y-6">
          <ReportCardSkeleton />
          <ReportCardSkeleton />
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-6">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              reportType={report.report_type}
              startDate={report.start_date}
              endDate={report.end_date}
              content={report.content}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-muted-foreground mb-4">
            No {reportType} reports generated yet.
          </p>
          <button onClick={handleGenerateReport} className="btn btn-primary">
            Generate First Report
          </button>
        </div>
      )}
    </div>
  )
}
