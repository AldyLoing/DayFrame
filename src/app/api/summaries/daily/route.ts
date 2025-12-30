import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/server-utils'
import { getDailySummary, createDailySummary, getActivitiesByDate } from '@/lib/db'
import { generateSummary } from '@/lib/openrouter'
import {
  DAILY_SUMMARY_SYSTEM_PROMPT,
  createDailySummaryPrompt,
  parseAIJsonResponse,
} from '@/lib/prompts'
import { format } from 'date-fns'
import { env } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')

    if (!dateStr) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 })
    }

    const date = new Date(dateStr)
    const summary = await getDailySummary(user.id, date)

    if (!summary) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 })
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('GET /api/summaries/daily error:', error)
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
    const { date: dateStr } = body

    if (!dateStr) {
      return NextResponse.json({ error: 'Date required' }, { status: 400 })
    }

    // Parse date as UTC to avoid timezone issues
    const date = new Date(dateStr + 'T00:00:00.000Z')

    console.log('Generating summary for date:', dateStr, 'parsed as:', date.toISOString())

    // Get activities for the day
    const activities = await getActivitiesByDate(user.id, date)

    console.log('Found activities:', activities.length)

    if (activities.length === 0) {
      return NextResponse.json(
        { error: 'No activities found for this day' },
        { status: 400 }
      )
    }

    // Format activities for AI
    const formattedActivities = activities.map((activity) => ({
      timestamp: format(new Date(activity.activity_timestamp), 'h:mm a'),
      content: activity.content,
    }))

    // Generate summary using AI
    const prompt = createDailySummaryPrompt(
      format(date, 'MMMM d, yyyy'),
      formattedActivities
    )

    const aiResponse = await generateSummary(prompt, DAILY_SUMMARY_SYSTEM_PROMPT)
    const summaryContent = parseAIJsonResponse(aiResponse) as any

    // Save summary to database
    const summary = await createDailySummary(
      user.id,
      date,
      summaryContent,
      env.ai.models.summary
    )

    // Trigger embedding generation in background (don't await)
    const summaryText = `${summaryContent?.summary || ''} ${summaryContent?.highlights?.join(' ') || ''} ${summaryContent?.conclusion || ''}`
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/embeddings/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: 'summary',
        contentId: summary.id,
        contentText: summaryText,
        contentDate: format(date, 'yyyy-MM-dd'),
      }),
    }).catch(console.error)

    return NextResponse.json(summary, { status: 201 })
  } catch (error) {
    console.error('POST /api/summaries/daily error:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
