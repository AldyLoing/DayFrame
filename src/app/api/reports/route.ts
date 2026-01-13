import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/server-utils'
import {
  getAllPeriodicReports,
  getPeriodicReportsByType,
  createPeriodicReport,
  getDailySummariesByDateRange,
  getActivitiesByDateRange,
} from '@/lib/db'
import { generateReport } from '@/lib/openrouter'
import {
  WEEKLY_REPORT_SYSTEM_PROMPT,
  MONTHLY_REPORT_SYSTEM_PROMPT,
  QUARTERLY_REPORT_SYSTEM_PROMPT,
  YEARLY_REPORT_SYSTEM_PROMPT,
  createWeeklyReportPrompt,
  createMonthlyReportPrompt,
  createQuarterlyReportPrompt,
  createYearlyReportPrompt,
  parseAIJsonResponse,
} from '@/lib/prompts'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'
import { env } from '@/lib/env'
import type { ReportType } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ReportType | null

    if (type && !['weekly', 'monthly', 'quarterly', 'biannual', 'yearly'].includes(type)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    const reports = type
      ? await getPeriodicReportsByType(user.id, type, 20)
      : await getAllPeriodicReports(user.id, 50)

    return NextResponse.json(reports)
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportType, date } = body

    if (!reportType || !date) {
      return NextResponse.json(
        { error: 'reportType and date required' },
        { status: 400 }
      )
    }

    const baseDate = new Date(date)
    let startDate: Date
    let endDate: Date
    let systemPrompt: string
    let prompt: string

    switch (reportType) {
      case 'weekly': {
        startDate = startOfWeek(baseDate, { weekStartsOn: 1 })
        endDate = endOfWeek(baseDate, { weekStartsOn: 1 })

        const summaries = await getDailySummariesByDateRange(user.id, startDate, endDate)
        const activities = await getActivitiesByDateRange(user.id, startDate, endDate)

        systemPrompt = WEEKLY_REPORT_SYSTEM_PROMPT
        prompt = createWeeklyReportPrompt(
          format(startDate, 'MMM d, yyyy'),
          format(endDate, 'MMM d, yyyy'),
          summaries.map((s) => ({ date: s.summary_date, summary: s.content })),
          activities.length
        )
        break
      }

      case 'monthly': {
        startDate = startOfMonth(baseDate)
        endDate = endOfMonth(baseDate)

        // Get weekly reports for the month
        const weeklyReports = await getPeriodicReportsByType(user.id, 'weekly', 10)
        const relevantWeeklyReports = weeklyReports.filter((r) => {
          const rStart = new Date(r.start_date)
          return rStart >= startDate && rStart <= endDate
        })

        const activities = await getActivitiesByDateRange(user.id, startDate, endDate)
        const uniqueDates = new Set(activities.map((a) => a.activity_date))

        systemPrompt = MONTHLY_REPORT_SYSTEM_PROMPT
        prompt = createMonthlyReportPrompt(
          format(startDate, 'MMM d, yyyy'),
          format(endDate, 'MMM d, yyyy'),
          relevantWeeklyReports.map((r) => ({
            weekStart: r.start_date,
            summary: r.content,
          })),
          activities.length,
          uniqueDates.size
        )
        break
      }

      case 'quarterly': {
        startDate = startOfQuarter(baseDate)
        endDate = endOfQuarter(baseDate)

        const monthlyReports = await getPeriodicReportsByType(user.id, 'monthly', 6)
        const relevantMonthlyReports = monthlyReports.filter((r) => {
          const rStart = new Date(r.start_date)
          return rStart >= startDate && rStart <= endDate
        })

        const activities = await getActivitiesByDateRange(user.id, startDate, endDate)

        systemPrompt = QUARTERLY_REPORT_SYSTEM_PROMPT
        prompt = createQuarterlyReportPrompt(
          format(startDate, 'MMM d, yyyy'),
          format(endDate, 'MMM d, yyyy'),
          relevantMonthlyReports.map((r) => ({
            month: format(new Date(r.start_date), 'MMMM yyyy'),
            summary: r.content,
          })),
          activities.length
        )
        break
      }

      case 'yearly': {
        startDate = startOfYear(baseDate)
        endDate = endOfYear(baseDate)

        const quarterlyReports = await getPeriodicReportsByType(user.id, 'quarterly', 8)
        const relevantQuarterlyReports = quarterlyReports.filter((r) => {
          const rStart = new Date(r.start_date)
          return rStart >= startDate && rStart <= endDate
        })

        const activities = await getActivitiesByDateRange(user.id, startDate, endDate)
        const uniqueDates = new Set(activities.map((a) => a.activity_date))

        systemPrompt = YEARLY_REPORT_SYSTEM_PROMPT
        prompt = createYearlyReportPrompt(
          format(baseDate, 'yyyy'),
          relevantQuarterlyReports.map((r) => ({
            quarter: `Q${Math.ceil((new Date(r.start_date).getMonth() + 1) / 3)} ${new Date(r.start_date).getFullYear()}`,
            summary: r.content,
          })),
          activities.length,
          uniqueDates.size
        )
        break
      }

      default:
        return NextResponse.json({ error: 'Unsupported report type' }, { status: 400 })
    }

    // Generate report using AI
    const aiResponse = await generateReport(prompt, systemPrompt)
    const reportContent = parseAIJsonResponse(aiResponse)

    // Save report to database
    const report = await createPeriodicReport(
      user.id,
      reportType as ReportType,
      startDate,
      endDate,
      reportContent,
      env.ai.models.summary
    )

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('POST /api/reports error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
