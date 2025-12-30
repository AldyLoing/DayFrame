-- DAYFRAME Database Schema
-- PostgreSQL with pgvector extension
-- All tables have Row Level Security (RLS) enabled

-- Enable required extensions
-- Note: If pgvector is not available, you can enable it via Supabase Dashboard:
-- Database → Extensions → Search for "vector" → Enable
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgvector"; -- Uncomment after enabling in dashboard

-- =====================================================
-- USERS TABLE
-- =====================================================
-- Note: Supabase Auth handles the auth.users table
-- We create a public.profiles table for additional user data

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Index for fast lookups
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- ACTIVITIES TABLE
-- =====================================================
-- Append-only daily activity log
-- Each entry represents a user action, thought, or event

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  activity_date DATE NOT NULL,
  activity_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT activities_content_length CHECK (char_length(content) > 0)
);

-- Indexes for performance
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_user_date ON public.activities(user_id, activity_date DESC);
CREATE INDEX idx_activities_timestamp ON public.activities(activity_timestamp DESC);
CREATE INDEX idx_activities_user_timestamp ON public.activities(user_id, activity_timestamp DESC);

-- RLS Policies for activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id AND is_deleted = FALSE);

CREATE POLICY "Users can insert own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
  ON public.activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- DAILY SUMMARIES TABLE
-- =====================================================
-- AI-generated summaries for each day
-- Stored to avoid re-generation and enable history

CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  content JSONB NOT NULL,
  ai_model TEXT NOT NULL,
  token_count INTEGER,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, summary_date)
);

-- JSONB structure for content:
-- {
--   "summary": "Overall summary text",
--   "highlights": ["highlight 1", "highlight 2", ...],
--   "problems": ["problem 1", "problem 2", ...],
--   "conclusion": "Concluding thoughts",
--   "suggestions": ["suggestion 1", "suggestion 2", ...]
-- }

-- Indexes for performance
CREATE INDEX idx_daily_summaries_user_id ON public.daily_summaries(user_id);
CREATE INDEX idx_daily_summaries_user_date ON public.daily_summaries(user_id, summary_date DESC);
CREATE INDEX idx_daily_summaries_date ON public.daily_summaries(summary_date DESC);

-- RLS Policies for daily_summaries
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summaries"
  ON public.daily_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries"
  ON public.daily_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries"
  ON public.daily_summaries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own summaries"
  ON public.daily_summaries FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- PERIODIC REPORTS TABLE
-- =====================================================
-- AI-generated reports for longer time periods
-- Types: weekly, monthly, quarterly, biannual, yearly

CREATE TYPE report_type AS ENUM ('weekly', 'monthly', 'quarterly', 'biannual', 'yearly');

CREATE TABLE IF NOT EXISTS public.periodic_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type report_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  content JSONB NOT NULL,
  ai_model TEXT NOT NULL,
  token_count INTEGER,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, report_type, start_date, end_date)
);

-- JSONB structure for content:
-- {
--   "summary": "Overall period summary",
--   "patterns": ["pattern 1", "pattern 2", ...],
--   "trends": ["trend 1", "trend 2", ...],
--   "key_observations": ["observation 1", "observation 2", ...],
--   "conclusion": "Overall conclusion",
--   "suggestions": ["suggestion 1", "suggestion 2", ...]
-- }

-- Indexes for performance
CREATE INDEX idx_periodic_reports_user_id ON public.periodic_reports(user_id);
CREATE INDEX idx_periodic_reports_user_type ON public.periodic_reports(user_id, report_type);
CREATE INDEX idx_periodic_reports_user_dates ON public.periodic_reports(user_id, start_date DESC, end_date DESC);
CREATE INDEX idx_periodic_reports_type_dates ON public.periodic_reports(report_type, start_date DESC);

-- RLS Policies for periodic_reports
ALTER TABLE public.periodic_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON public.periodic_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON public.periodic_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON public.periodic_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
  ON public.periodic_reports FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- CHAT EMBEDDINGS TABLE
-- =====================================================
-- Vector embeddings for semantic search
-- Stores embeddings of activities and summaries

CREATE TABLE IF NOT EXISTS public.chat_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'activity' or 'summary'
  content_id UUID NOT NULL, -- References activities.id or daily_summaries.id
  content_text TEXT NOT NULL,
  content_date DATE NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(content_type, content_id)
);

-- Indexes for performance and vector search
CREATE INDEX idx_chat_embeddings_user_id ON public.chat_embeddings(user_id);
CREATE INDEX idx_chat_embeddings_user_date ON public.chat_embeddings(user_id, content_date DESC);
CREATE INDEX idx_chat_embeddings_content ON public.chat_embeddings(content_type, content_id);

-- Vector similarity search index (IVFFlat for better performance)
CREATE INDEX idx_chat_embeddings_vector ON public.chat_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RLS Policies for chat_embeddings
ALTER TABLE public.chat_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own embeddings"
  ON public.chat_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own embeddings"
  ON public.chat_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own embeddings"
  ON public.chat_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- CHAT HISTORY TABLE
-- =====================================================
-- Stores user chat interactions with the AI agent

CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context_used JSONB, -- Array of content_ids used for context
  ai_model TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX idx_chat_history_created_at ON public.chat_history(created_at DESC);
CREATE INDEX idx_chat_history_user_created ON public.chat_history(user_id, created_at DESC);

-- RLS Policies for chat_history
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history"
  ON public.chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat history"
  ON public.chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat history"
  ON public.chat_history FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  match_user_id UUID,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content_type TEXT,
  content_id UUID,
  content_text TEXT,
  content_date DATE,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chat_embeddings.id,
    chat_embeddings.content_type,
    chat_embeddings.content_id,
    chat_embeddings.content_text,
    chat_embeddings.content_date,
    1 - (chat_embeddings.embedding <=> query_embedding) AS similarity
  FROM chat_embeddings
  WHERE chat_embeddings.user_id = match_user_id
    AND 1 - (chat_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY chat_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- UTILITY VIEWS
-- =====================================================

-- View for user activity statistics
CREATE OR REPLACE VIEW user_activity_stats AS
SELECT
  user_id,
  activity_date,
  COUNT(*) as activity_count,
  MIN(activity_timestamp) as first_activity,
  MAX(activity_timestamp) as last_activity
FROM public.activities
WHERE is_deleted = FALSE
GROUP BY user_id, activity_date;

-- =====================================================
-- INITIAL DATA / SEED (OPTIONAL)
-- =====================================================

-- No seed data needed for production
-- Each user creates their own data through the app

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- SCHEMA VALIDATION QUERIES
-- =====================================================

-- Verify RLS is enabled on all tables
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Verify policies exist
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Verify indexes exist
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';

-- Verify vector extension is enabled
-- SELECT * FROM pg_extension WHERE extname = 'vector';
