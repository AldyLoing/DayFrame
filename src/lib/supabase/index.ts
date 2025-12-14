// Re-export client for browser use (safe to import anywhere)
export { createClient as createBrowserClient } from './client'

// Server exports - use dynamic imports to avoid bundling next/headers in client
export async function createServerClient() {
  const { createClient } = await import('./server')
  return createClient()
}

export function createAdminClient() {
  // Use require to avoid bundling issues
  const { createAdminClient: getAdmin } = require('./server')
  return getAdmin()
}

// Legacy compatibility exports (will be removed in future)
export async function getSupabaseServer() {
  return createServerClient()
}

export function getSupabaseClient() {
  const { createClient } = require('./client')
  return createClient()
}

export function getSupabaseAdmin() {
  return createAdminClient()
}

// Helper functions (server-side only)
export async function getCurrentUser() {
  const supabase = await createServerClient()
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
