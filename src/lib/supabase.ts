import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { env } from './env'
import type { Database } from '@/types/database'

/**
 * Get Supabase client for Server Components
 */
export function getSupabaseServer() {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

/**
 * Get Supabase client for Client Components
 */
export function getSupabaseClient() {
  return createClientComponentClient<Database>()
}

/**
 * Get Supabase admin client (bypasses RLS)
 * Use with EXTREME caution - only for admin operations like cron jobs
 */
export function getSupabaseAdmin() {
  return createClient<Database>(
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

/**
 * Get current user from server
 */
export async function getCurrentUser() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated() {
  const user = await getCurrentUser()
  return user !== null
}
