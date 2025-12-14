# Environment configuration for TypeScript
# This file provides type-safe access to environment variables

export const env = {
  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },

  // OpenRouter AI
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY!,
    appName: process.env.OPENROUTER_APP_NAME || 'DayFrame',
    appUrl: process.env.OPENROUTER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // AI Models
  ai: {
    models: {
      summary: process.env.AI_MODEL_SUMMARY || 'google/gemini-2.0-flash-exp:free',
      chat: process.env.AI_MODEL_CHAT || 'meta-llama/llama-3.3-70b-instruct:free',
      fallback: process.env.AI_MODEL_FALLBACK || 'mistralai/mistral-3.1-8b-instruct:free',
      embeddings: process.env.AI_MODEL_EMBEDDINGS || 'openai/text-embedding-3-small',
    },
  },

  // Application
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    env: process.env.NODE_ENV || 'development',
  },

  // Cron
  cron: {
    secret: process.env.CRON_SECRET || '',
  },

  // Rate Limiting
  rateLimit: {
    aiRequestsPerHour: parseInt(process.env.MAX_AI_REQUESTS_PER_HOUR || '50', 10),
    activitiesPerDay: parseInt(process.env.MAX_ACTIVITIES_PER_DAY || '100', 10),
  },

  // Feature Flags
  features: {
    chatEnabled: process.env.FEATURE_CHAT_ENABLED !== 'false',
    reportsEnabled: process.env.FEATURE_REPORTS_ENABLED !== 'false',
    embeddingsEnabled: process.env.FEATURE_EMBEDDINGS_ENABLED !== 'false',
  },
}

// Validation: Ensure required environment variables are set
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'OPENROUTER_API_KEY',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\nPlease check your .env.local file.`
    )
  }
}

// Run validation in development
if (process.env.NODE_ENV === 'development') {
  try {
    validateEnv()
  } catch (error) {
    console.error(error)
  }
}
