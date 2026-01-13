import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server-utils'
import { generateSummary } from '@/lib/openrouter'
import {
  DAILY_SUMMARY_SYSTEM_PROMPT,
  createDailySummaryPrompt,
  parseAIJsonResponse,
} from '@/lib/prompts'
import { format, subDays } from 'date-fns'
import { env } from '@/lib/env'

// Force dynamic to prevent static generation
export const dynamic = 'force-dynamic'

/**
 * Cron job to generate daily summaries for all users
 * Runs nightly at 2:00 AM
 * 
 * Vercel Cron: https://vercel.com/docs/cron-jobs
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${env.cron.secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const yesterday = subDays(new Date(), 1)
    const dateStr = format(yesterday, 'yyyy-MM-dd')

    // Get all users who have activities yesterday but no summary
    const { data: activitiesWithoutSummary, error: queryError } = await (supabase as any)
      .from('activities')
      .select('user_id')
      .eq('activity_date', dateStr)
      .eq('is_deleted', false)

    if (queryError) throw queryError

    // Get unique user IDs
    const userIds = [...new Set((activitiesWithoutSummary || []).map((a: any) => a.user_id))]

    let successCount = 0
    let errorCount = 0
    const errors: any[] = []

    for (const userId of userIds) {
      try {
        // Check if summary already exists
        const { data: existingSummary } = await (supabase as any)
          .from('daily_summaries')
          .select('id')
          .eq('user_id', userId)
          .eq('summary_date', dateStr)
          .single()

        if (existingSummary) {
          continue // Skip if summary already exists
        }

        // Get user's activities for yesterday
        const { data: activities, error: activitiesError } = await (supabase as any)
          .from('activities')
          .select('*')
          .eq('user_id', userId)
          .eq('activity_date', dateStr)
          .eq('is_deleted', false)
          .order('activity_timestamp', { ascending: true })

        if (activitiesError) throw activitiesError
        if (!activities || activities.length === 0) continue

        // Format activities for AI
        const formattedActivities = (activities as any[]).map((activity) => ({
          timestamp: format(new Date(activity.activity_timestamp), 'h:mm a'),
          content: activity.content,
        }))

        // Generate summary
        const prompt = createDailySummaryPrompt(
          format(yesterday, 'MMMM d, yyyy'),
          formattedActivities
        )

        const aiResponse = await generateSummary(prompt, DAILY_SUMMARY_SYSTEM_PROMPT)
        const summaryContent = parseAIJsonResponse(aiResponse)

        // Save summary
        const { error: insertError } = await (supabase as any)
          .from('daily_summaries')
          .insert({
            user_id: userId,
            summary_date: dateStr,
            content: summaryContent,
            ai_model: env.ai.models.summary,
          })

        if (insertError) throw insertError

        successCount++
      } catch (error) {
        console.error(`Failed to generate summary for user ${userId}:`, error)
        errorCount++
        errors.push({ userId, error: String(error) })
      }
    }

    return NextResponse.json({
      success: true,
      date: dateStr,
      totalUsers: userIds.length,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    )
  }
}
