import { parseAIJsonResponse } from '@/lib/prompts'

describe('Prompt Utilities', () => {
  describe('parseAIJsonResponse', () => {
    it('should parse plain JSON', () => {
      const jsonString = JSON.stringify({
        summary: 'Test summary',
        highlights: ['highlight 1', 'highlight 2'],
      })

      const result = parseAIJsonResponse(jsonString)
      expect(result).toEqual({
        summary: 'Test summary',
        highlights: ['highlight 1', 'highlight 2'],
      })
    })

    it('should parse JSON from markdown code block', () => {
      const markdown = '```json\n{"summary": "Test", "highlights": []}\n```'
      
      const result = parseAIJsonResponse(markdown)
      expect(result).toEqual({
        summary: 'Test',
        highlights: [],
      })
    })

    it('should parse JSON from plain code block', () => {
      const markdown = '```\n{"summary": "Test", "highlights": []}\n```'
      
      const result = parseAIJsonResponse(markdown)
      expect(result).toEqual({
        summary: 'Test',
        highlights: [],
      })
    })

    it('should throw error for invalid JSON', () => {
      const invalidJson = 'not valid json'
      
      expect(() => parseAIJsonResponse(invalidJson)).toThrow()
    })
  })
})
