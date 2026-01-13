import { createServerClient } from '@supabase/ssr'
import { env } from '../env'
import type { Database } from '@/types/database'

/**
 * Create a Supabase client for Server Components
 * This function uses next/headers and should ONLY be called in Server Components
 */
export async function createClient() {
  // Dynamic import to avoid bundling next/headers in client-side code
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.supabase.url,
    env.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase admin client (bypasses RLS)
 * Use with EXTREME caution - only for admin operations like cron jobs
 */
export function createAdminClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  
  return createSupabaseClient(
    env.supabase.url,
    env.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
