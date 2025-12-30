// Server-side utilities (ONLY import in Server Components or API routes)
export { createClient as createServerClient, createAdminClient, createAdminClient as getSupabaseAdmin } from './server'

// Legacy compatibility
export { createClient as getSupabaseServer } from './server'

// Helper functions (server-side only)
export async function getCurrentUser() {
  const { createClient } = await import('./server')
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function isAuthenticated() {
  const user = await getCurrentUser()
  return user !== null
}
