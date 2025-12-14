/**
 * Database Type Definitions
 * Generated from Supabase schema
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          created_at: string
          updated_at: string
          timezone: string
          preferences: Record<string, any>
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
          timezone?: string
          preferences?: Record<string, any>
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
          timezone?: string
          preferences?: Record<string, any>
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          content: string
          activity_date: string
          activity_timestamp: string
          created_at: string
          updated_at: string
          is_deleted: boolean
          metadata: Record<string, any>
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          activity_date: string
          activity_timestamp?: string
          created_at?: string
          updated_at?: string
          is_deleted?: boolean
          metadata?: Record<string, any>
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          activity_date?: string
          activity_timestamp?: string
          created_at?: string
          updated_at?: string
          is_deleted?: boolean
          metadata?: Record<string, any>
        }
      }
      daily_summaries: {
        Row: {
          id: string
          user_id: string
          summary_date: string
          content: DailySummaryContent
          ai_model: string
          token_count: number | null
          generated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          summary_date: string
          content: DailySummaryContent
          ai_model: string
          token_count?: number | null
          generated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          summary_date?: string
          content?: DailySummaryContent
          ai_model?: string
          token_count?: number | null
          generated_at?: string
          created_at?: string
        }
      }
      periodic_reports: {
        Row: {
          id: string
          user_id: string
          report_type: ReportType
          start_date: string
          end_date: string
          content: PeriodicReportContent
          ai_model: string
          token_count: number | null
          generated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_type: ReportType
          start_date: string
          end_date: string
          content: PeriodicReportContent
          ai_model: string
          token_count?: number | null
          generated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_type?: ReportType
          start_date?: string
          end_date?: string
          content?: PeriodicReportContent
          ai_model?: string
          token_count?: number | null
          generated_at?: string
          created_at?: string
        }
      }
      chat_embeddings: {
        Row: {
          id: string
          user_id: string
          content_type: string
          content_id: string
          content_text: string
          content_date: string
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_type: string
          content_id: string
          content_text: string
          content_date: string
          embedding?: number[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_type?: string
          content_id?: string
          content_text?: string
          content_date?: string
          embedding?: number[] | null
          created_at?: string
        }
      }
      chat_history: {
        Row: {
          id: string
          user_id: string
          question: string
          answer: string
          context_used: Record<string, any> | null
          ai_model: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question: string
          answer: string
          context_used?: Record<string, any> | null
          ai_model: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question?: string
          answer?: string
          context_used?: Record<string, any> | null
          ai_model?: string
          created_at?: string
        }
      }
    }
    Views: {
      user_activity_stats: {
        Row: {
          user_id: string
          activity_date: string
          activity_count: number
          first_activity: string
          last_activity: string
        }
      }
    }
    Functions: {
      match_embeddings: {
        Args: {
          query_embedding: number[]
          match_user_id: string
          match_threshold?: number
          match_count?: number
        }
        Returns: Array<{
          id: string
          content_type: string
          content_id: string
          content_text: string
          content_date: string
          similarity: number
        }>
      }
    }
  }
}

export type ReportType = 'weekly' | 'monthly' | 'quarterly' | 'biannual' | 'yearly'

export interface DailySummaryContent {
  summary: string
  highlights: string[]
  problems: string[]
  conclusion: string
  suggestions: string[]
}

export interface PeriodicReportContent {
  summary: string
  patterns: string[]
  trends: string[]
  key_observations: string[]
  conclusion: string
  suggestions: string[]
}

export interface Activity {
  id: string
  user_id: string
  content: string
  activity_date: string
  activity_timestamp: string
  created_at: string
  updated_at: string
  is_deleted: boolean
  metadata: Record<string, any>
}

export interface DailySummary {
  id: string
  user_id: string
  summary_date: string
  content: DailySummaryContent
  ai_model: string
  token_count: number | null
  generated_at: string
  created_at: string
}

export interface PeriodicReport {
  id: string
  user_id: string
  report_type: ReportType
  start_date: string
  end_date: string
  content: PeriodicReportContent
  ai_model: string
  token_count: number | null
  generated_at: string
  created_at: string
}

export interface ChatEmbedding {
  id: string
  user_id: string
  content_type: string
  content_id: string
  content_text: string
  content_date: string
  embedding: number[] | null
  created_at: string
}

export interface ChatHistory {
  id: string
  user_id: string
  question: string
  answer: string
  context_used: Record<string, any> | null
  ai_model: string
  created_at: string
}

export interface Profile {
  id: string
  email: string
  display_name: string | null
  created_at: string
  updated_at: string
  timezone: string
  preferences: Record<string, any>
}
