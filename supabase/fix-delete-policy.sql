-- Fix RLS policy untuk allow DELETE activities
-- Jalankan di Supabase Dashboard > SQL Editor

-- Hapus policy lama yang conflict
DROP POLICY IF EXISTS "Users can soft delete own activities" ON public.activities;

-- Tambahkan policy baru untuk DELETE
CREATE POLICY "Users can delete own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = user_id);
