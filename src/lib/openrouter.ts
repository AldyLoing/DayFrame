import { env } from './env'

/**
 * OpenRouter API Client
 * Handles all AI model interactions with intelligent routing and fallback
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  model?: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  id: string
  model: string
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface EmbeddingOptions {
  input: string | string[]
  model?: string
}

export interface EmbeddingResponse {
  embeddings: number[][]
  model: string
  usage: {
    promptTokens: number
    totalTokens: number
  }
}

/**
 * OpenRouter client class
 */
class OpenRouterClient {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'
  private appName: string
  private appUrl: string

  constructor() {
    this.apiKey = env.openrouter.apiKey
    this.appName = env.openrouter.appName
    this.appUrl = env.openrouter.appUrl
  }

  /**
   * Make a chat completion request
   */
  async chatCompletion(
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResponse> {
    const {
      model,
      messages,
      temperature = 0.7,
      maxTokens = 2000,
      stream = false,
    } = options

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.appUrl,
          'X-Title': this.appName,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `OpenRouter API error: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`
        )
      }

      const data = await response.json()

      return {
        id: data.id,
        model: data.model,
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      }
    } catch (error) {
      console.error('OpenRouter chat completion error:', error)
      throw error
    }
  }

  /**
   * Generate embeddings for text
   */
  async createEmbedding(
    options: EmbeddingOptions
  ): Promise<EmbeddingResponse> {
    const { input, model = env.ai.models.embeddings } = options

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.appUrl,
          'X-Title': this.appName,
        },
        body: JSON.stringify({
          model,
          input,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `OpenRouter embeddings error: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`
        )
      }

      const data = await response.json()

      return {
        embeddings: data.data.map((item: any) => item.embedding),
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          totalTokens: data.usage.total_tokens,
        },
      }
    } catch (error) {
      console.error('OpenRouter embedding error:', error)
      throw error
    }
  }
}

// Export singleton instance
export const openrouter = new OpenRouterClient()

/**
 * AI Model Router
 * Routes requests to appropriate models with fallback logic
 */

export type AITaskType = 'summary' | 'report' | 'chat' | 'embedding'

export class AIModelRouter {
  private getPrimaryModel(taskType: AITaskType): string {
    switch (taskType) {
      case 'summary':
      case 'report':
        return env.ai.models.summary
      case 'chat':
        return env.ai.models.chat
      case 'embedding':
        return env.ai.models.embeddings
      default:
        return env.ai.models.fallback
    }
  }

  private getFallbackModel(): string {
    return env.ai.models.fallback
  }

  /**
   * Execute AI request with automatic fallback
   */
  async execute(
    taskType: AITaskType,
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResponse> {
    const primaryModel = this.getPrimaryModel(taskType)
    const fallbackModel = this.getFallbackModel()

    // Try primary model
    try {
      return await openrouter.chatCompletion({
        ...options,
        model: primaryModel,
      })
    } catch (primaryError) {
      console.error(`Primary model ${primaryModel} failed:`, primaryError)

      // Try fallback model
      try {
        console.warn(`Falling back to ${fallbackModel}`)
        return await openrouter.chatCompletion({
          ...options,
          model: fallbackModel,
        })
      } catch (fallbackError) {
        console.error(`Fallback model ${fallbackModel} failed:`, fallbackError)
        throw new Error(
          'AI service temporarily unavailable. Please try again later.'
        )
      }
    }
  }

  /**
   * Generate embeddings with error handling
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openrouter.createEmbedding({
        input: text,
      })
      return response.embeddings[0]
    } catch (error) {
      console.error('Embedding generation failed:', error)
      throw new Error('Failed to generate text embedding')
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await openrouter.createEmbedding({
        input: texts,
      })
      return response.embeddings
    } catch (error) {
      console.error('Batch embedding generation failed:', error)
      throw new Error('Failed to generate text embeddings')
    }
  }
}

// Export singleton instance
export const aiRouter = new AIModelRouter()

/**
 * Helper functions for common AI tasks
 */

export async function generateSummary(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: ChatMessage[] = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    { role: 'user', content: prompt },
  ]

  const response = await aiRouter.execute('summary', {
    messages,
    temperature: 0.7,
    maxTokens: 2000,
  })

  return response.content
}

export async function generateReport(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: ChatMessage[] = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    { role: 'user', content: prompt },
  ]

  const response = await aiRouter.execute('report', {
    messages,
    temperature: 0.7,
    maxTokens: 3000,
  })

  return response.content
}

export async function generateChatResponse(
  userMessage: string,
  context: string,
  systemPrompt?: string
): Promise<string> {
  const messages: ChatMessage[] = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    {
      role: 'user',
      content: `Context:\n${context}\n\nUser Question:\n${userMessage}`,
    },
  ]

  const response = await aiRouter.execute('chat', {
    messages,
    temperature: 0.5,
    maxTokens: 1500,
  })

  return response.content
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return aiRouter.generateEmbedding(text)
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return aiRouter.generateEmbeddings(texts)
}
