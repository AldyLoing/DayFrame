import { createBrowserClient } from '@supabase/ssr'
import { env } from '../env'
import type { Database } from '@/types/database'

/**
 * Create a Supabase client for Client Components
 * This is safe to use in Client Components and browser environments
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.supabase.url,
    env.supabase.anonKey
  )
}
