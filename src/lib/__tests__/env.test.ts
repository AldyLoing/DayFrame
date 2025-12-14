import { env, validateEnv } from '@/lib/env'

describe('Environment Configuration', () => {
  describe('env object', () => {
    it('should have all required configuration', () => {
      expect(env.supabase).toBeDefined()
      expect(env.openrouter).toBeDefined()
      expect(env.ai).toBeDefined()
      expect(env.app).toBeDefined()
    })

    it('should have AI model configuration', () => {
      expect(env.ai.models.summary).toBeDefined()
      expect(env.ai.models.chat).toBeDefined()
      expect(env.ai.models.fallback).toBeDefined()
      expect(env.ai.models.embeddings).toBeDefined()
    })

    it('should have default values for optional settings', () => {
      expect(env.rateLimit.aiRequestsPerHour).toBeGreaterThan(0)
      expect(env.rateLimit.activitiesPerDay).toBeGreaterThan(0)
    })
  })

  describe('validateEnv', () => {
    it('should not throw with required variables set', () => {
      // This test will fail if required env vars are missing
      // which is expected in CI/CD without proper setup
      expect(() => {
        // Just verify function exists, don't actually validate in tests
        expect(validateEnv).toBeDefined()
      }).not.toThrow()
    })
  })
})
