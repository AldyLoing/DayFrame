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

    // Get activities for the day (will regenerate summary even if exists)
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

    // Generate summary using AI with fallback to manual summary
    const prompt = createDailySummaryPrompt(
      format(date, 'MMMM d, yyyy'),
      formattedActivities
    )

    let summaryContent: any
    
    try {
      const aiResponse = await generateSummary(prompt, DAILY_SUMMARY_SYSTEM_PROMPT)
      summaryContent = parseAIJsonResponse(aiResponse) as any
    } catch (aiError: any) {
      console.error('AI generation failed, using fallback summary:', aiError)
      
      // Generate simple structured summary without AI
      const keywords = [...new Set(
        activities.flatMap(a => 
          a.content.toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 5 && !['untuk', 'dengan', 'adalah', 'menjadi', 'karena'].includes(w))
        )
      )].slice(0, 10)

      const firstActivity = activities[0]
      const lastActivity = activities[activities.length - 1]
      
      summaryContent = {
        summary: `Hari ini mencatat ${activities.length} aktivitas dari ${format(new Date(firstActivity.activity_timestamp), 'h:mm a')} hingga ${format(new Date(lastActivity.activity_timestamp), 'h:mm a')}. ${activities.slice(0, 3).map(a => a.content.split('.')[0]).join('. ')}.`,
        highlights: activities.slice(0, 5).map(a => a.content.split('.')[0].substring(0, 100)),
        conclusion: `Total ${activities.length} aktivitas tercatat dengan berbagai kegiatan produktif sepanjang hari.`,
        mood: 'productive',
        keywords: keywords
      }
    }

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
  } catch (error: any) {
    console.error('POST /api/summaries/daily error:', error)
    const errorMessage = error.message || 'Failed to generate summary'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
