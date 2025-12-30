// Server-side utilities (ONLY import in Server Components or API routes)
// All functions use dynamic imports to prevent next/headers from being bundled

/**
 * Get Supabase server client - use in API routes and Server Components
 */
export async function getSupabaseServer() {
  const { createClient } = await import('./server')
  return createClient()
}

/**
 * Get Supabase admin client - bypasses RLS, use with caution
 */
export async function getSupabaseAdmin() {
  const { createAdminClient } = await import('./server')
  return createAdminClient()
}

// Aliases for compatibility
export const createServerClient = getSupabaseServer

/**
 * Get current authenticated user - safe to call, returns null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch {
    // During build/prerender, cookies() may not be available
    return null
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser()
  return user !== null
}
