import { getSupabaseServer } from './supabase/server-utils'
import type { Activity, DailySummary, PeriodicReport, ChatHistory, ReportType, Database } from '@/types/database'
import { format, startOfWeek, endOfWeek } from 'date-fns'

/**
 * Database query functions
 * All functions enforce RLS automatically through Supabase
 */

// =====================================================
// ACTIVITIES
// =====================================================

export async function createActivity(userId: string, content: string, activityDate: Date) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('activities')
    .insert({
      user_id: userId,
      content,
      activity_date: format(activityDate, 'yyyy-MM-dd'),
      activity_timestamp: activityDate.toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data as Activity
}

export async function getActivitiesByDate(userId: string, date: Date) {
  const supabase = await getSupabaseServer()
  const dateStr = format(date, 'yyyy-MM-dd')

  console.log('getActivitiesByDate - userId:', userId, 'dateStr:', dateStr)

  const { data, error } = await (supabase as any)
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .eq('activity_date', dateStr)
    .eq('is_deleted', false)
    .order('activity_timestamp', { ascending: true })

  if (error) {
    console.error('getActivitiesByDate error:', error)
    throw error
  }
  
  console.log('getActivitiesByDate - found:', data?.length || 0, 'activities')
  return (data as Activity[]) || []
}

export async function getActivitiesByDateRange(userId: string, startDate: Date, endDate: Date) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .gte('activity_date', format(startDate, 'yyyy-MM-dd'))
    .lte('activity_date', format(endDate, 'yyyy-MM-dd'))
    .eq('is_deleted', false)
    .order('activity_timestamp', { ascending: true })

  if (error) throw error
  return (data as Activity[]) || []
}

export async function getRecentActivities(userId: string, limit?: number) {
  const supabase = await getSupabaseServer()

  let query = (supabase as any)
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('activity_timestamp', { ascending: false })
  
  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return (data as Activity[]) || []
}

export async function updateActivity(activityId: string, content: string) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('activities')
    .update({ content })
    .eq('id', activityId)
    .select()
    .single()

  if (error) throw error
  return data as Activity
}

export async function deleteActivity(activityId: string) {
  const supabase = await getSupabaseServer()

  // First verify the activity belongs to the current user
  const { data: activity, error: fetchError } = await (supabase as any)
    .from('activities')
    .select('user_id')
    .eq('id', activityId)
    .single()

  if (fetchError || !activity) {
    console.error('Activity not found:', fetchError)
    throw new Error('Activity not found')
  }

  // Delete using the same client (will use RLS)
  const { error } = await (supabase as any)
    .from('activities')
    .delete()
    .eq('id', activityId)

  if (error) {
    console.error('deleteActivity error:', error)
    throw error
  }
}

// =====================================================
// DAILY SUMMARIES
// =====================================================

export async function createDailySummary(
  userId: string,
  summaryDate: Date,
  content: any,
  aiModel: string,
  tokenCount?: number
) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('daily_summaries')
    .upsert(
      {
        user_id: userId,
        summary_date: format(summaryDate, 'yyyy-MM-dd'),
        content,
        ai_model: aiModel,
        token_count: tokenCount || null,
      },
      {
        onConflict: 'user_id,summary_date',
        ignoreDuplicates: false, // Update existing record instead of ignoring
      }
    )
    .select()
    .single()

  if (error) throw error
  return data as DailySummary
}

export async function getDailySummary(userId: string, date: Date) {
  const supabase = await getSupabaseServer()
  const dateStr = format(date, 'yyyy-MM-dd')

  const { data, error } = await (supabase as any)
    .from('daily_summaries')
    .select('*')
    .eq('user_id', userId)
    .eq('summary_date', dateStr)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as DailySummary | null
}

export async function getDailySummariesByDateRange(userId: string, startDate: Date, endDate: Date) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('daily_summaries')
    .select('*')
    .eq('user_id', userId)
    .gte('summary_date', format(startDate, 'yyyy-MM-dd'))
    .lte('summary_date', format(endDate, 'yyyy-MM-dd'))
    .order('summary_date', { ascending: true })

  if (error) throw error
  return (data as DailySummary[]) || []
}

export async function getRecentSummaries(userId: string, limit?: number) {
  const supabase = await getSupabaseServer()

  let query = supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('summary_date', { ascending: false })
  
  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return (data as DailySummary[]) || []
}

export async function getRecentDailySummaries(userId: string, limit: number = 7) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('daily_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('summary_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data as DailySummary[]) || []
}

// =====================================================
// PERIODIC REPORTS
// =====================================================

export async function createPeriodicReport(
  userId: string,
  reportType: ReportType,
  startDate: Date,
  endDate: Date,
  content: any,
  aiModel: string,
  tokenCount?: number
) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('periodic_reports')
    .upsert(
      {
        user_id: userId,
        report_type: reportType,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        content,
        ai_model: aiModel,
        token_count: tokenCount || null,
      },
      {
        onConflict: 'user_id,report_type,start_date,end_date',
        ignoreDuplicates: false, // Update existing record instead of ignoring
      }
    )
    .select()
    .single()

  if (error) throw error
  return data as PeriodicReport
}

export async function getPeriodicReport(
  userId: string,
  reportType: ReportType,
  startDate: Date,
  endDate: Date
) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('periodic_reports')
    .select('*')
    .eq('user_id', userId)
    .eq('report_type', reportType)
    .eq('start_date', format(startDate, 'yyyy-MM-dd'))
    .eq('end_date', format(endDate, 'yyyy-MM-dd'))
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as PeriodicReport | null
}

export async function getPeriodicReportsByType(userId: string, reportType: ReportType, limit: number = 10) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('periodic_reports')
    .select('*')
    .eq('user_id', userId)
    .eq('report_type', reportType)
    .order('start_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data as PeriodicReport[]) || []
}

export async function getAllPeriodicReports(userId: string, limit: number = 50) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('periodic_reports')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data as PeriodicReport[]) || []
}

// =====================================================
// CHAT HISTORY
// =====================================================

export async function saveChatHistory(
  userId: string,
  question: string,
  answer: string,
  contextUsed: any,
  aiModel: string
) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('chat_history')
    .insert({
      user_id: userId,
      question,
      answer,
      context_used: contextUsed,
      ai_model: aiModel,
    } as Database['public']['Tables']['chat_history']['Insert'])
    .select()
    .single()

  if (error) throw error
  return data as ChatHistory
}

export async function getChatHistory(userId: string, limit: number = 50) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data as ChatHistory[]) || []
}

// =====================================================
// VECTOR EMBEDDINGS
// =====================================================

export async function createEmbedding(
  userId: string,
  contentType: string,
  contentId: string,
  contentText: string,
  contentDate: Date,
  embedding: number[]
) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('chat_embeddings')
    .upsert(
      {
        user_id: userId,
        content_type: contentType,
        content_id: contentId,
        content_text: contentText,
        content_date: format(contentDate, 'yyyy-MM-dd'),
        embedding,
      },
      {
        onConflict: 'content_type,content_id',
        ignoreDuplicates: false, // Update existing record instead of ignoring
      }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function searchSimilarContent(
  userId: string,
  queryEmbedding: number[],
  threshold: number = 0.5,
  limit: number = 10
) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any).rpc('match_embeddings', {
    query_embedding: queryEmbedding,
    match_user_id: userId,
    match_threshold: threshold,
    match_count: limit,
  } as Database['public']['Functions']['match_embeddings']['Args'])

  if (error) throw error
  return data || []
}

// =====================================================
// PROFILE
// =====================================================

export async function getProfile(userId: string) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createProfile(userId: string, email: string, displayName?: string) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('profiles')
    .insert({
      id: userId,
      email,
      display_name: displayName || null,
    } as Database['public']['Tables']['profiles']['Insert'])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProfile(userId: string, updates: { display_name?: string; timezone?: string; preferences?: any }) {
  const supabase = await getSupabaseServer()

  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updates as Database['public']['Tables']['profiles']['Update'])
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// =====================================================
// STATISTICS
// =====================================================

export async function getUserStats(userId: string) {
  const supabase = await getSupabaseServer()

  // Get total activities
  const { count: totalActivities } = await (supabase as any)
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_deleted', false)

  // Get total summaries
  const { count: totalSummaries } = await (supabase as any)
    .from('daily_summaries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get total reports
  const { count: totalReports } = await (supabase as any)
    .from('periodic_reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get activities this week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
  const { count: activitiesThisWeek } = await (supabase as any)
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('activity_date', format(weekStart, 'yyyy-MM-dd'))
    .lte('activity_date', format(weekEnd, 'yyyy-MM-dd'))
    .eq('is_deleted', false)

  return {
    totalActivities: totalActivities || 0,
    totalSummaries: totalSummaries || 0,
    totalReports: totalReports || 0,
    activitiesThisWeek: activitiesThisWeek || 0,
  }
}

/**
 * Delete a chat message
 */
export async function deleteChatMessage(userId: string, chatId: string) {
  const supabase = await getSupabaseServer()

  const { error } = await (supabase as any)
    .from('chat_history')
    .delete()
    .eq('id', chatId)
    .eq('user_id', userId)

  if (error) throw error
}
