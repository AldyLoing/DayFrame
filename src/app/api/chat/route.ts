import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { saveChatHistory } from '@/lib/db'
import { generateChatResponse, generateEmbedding } from '@/lib/openrouter'
import { CHAT_AGENT_SYSTEM_PROMPT, createChatPrompt } from '@/lib/prompts'
import { searchSimilarContent } from '@/lib/db'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { question } = body

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: 'Question required' }, { status: 400 })
    }

    let relevantContext: any[] = []
    let contextUsed: any = {}

    try {
      // Try to generate embedding for the question
      const queryEmbedding = await generateEmbedding(question)

      // Search for relevant content using vector similarity
      const similarContent = await searchSimilarContent(
        user.id,
        queryEmbedding,
        0.6, // Higher threshold for better relevance
        15   // Get more results for comprehensive context
      )

      // Format context for AI
      relevantContext = similarContent.map((item) => ({
        type: item.content_type as 'activity' | 'summary' | 'report',
        date: item.content_date,
        content: item.content_text,
      }))

      contextUsed = {
        query: question,
        resultsCount: similarContent.length,
        contentIds: similarContent.map((item) => item.content_id),
      }
    } catch (embeddingError) {
      console.warn('Embeddings not available, using simple mode:', embeddingError)
      // Fallback: Get recent activities and summaries without vector search
      const { getRecentActivities, getRecentSummaries } = await import('@/lib/db')
      const [activities, summaries] = await Promise.all([
        getRecentActivities(user.id, 10),
        getRecentSummaries(user.id, 5),
      ])

      relevantContext = [
        ...activities.map((a: any) => ({
          type: 'activity' as const,
          date: a.activity_date,
          content: a.content,
        })),
        ...summaries.map((s: any) => ({
          type: 'summary' as const,
          date: s.summary_date,
          content: JSON.stringify(s.content),
        })),
      ]

      contextUsed = {
        query: question,
        mode: 'fallback',
        resultsCount: relevantContext.length,
      }
    }

    // Generate chat response
    const prompt = createChatPrompt(question, relevantContext)
    const answer = await generateChatResponse(
      question,
      prompt,
      CHAT_AGENT_SYSTEM_PROMPT
    )

    // Save chat history
    await saveChatHistory(
      user.id,
      question,
      answer,
      contextUsed,
      env.ai.models.chat
    )

    return NextResponse.json({
      answer,
      contextCount: relevantContext.length,
    })
  } catch (error) {
    console.error('POST /api/chat error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/chat
 * Delete a chat message by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('id')

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 })
    }

    const { deleteChatMessage } = await import('@/lib/db')
    await deleteChatMessage(user.id, chatId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/chat error:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat message' },
      { status: 500 }
    )
  }
}
