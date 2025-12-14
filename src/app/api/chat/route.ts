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

    // Generate embedding for the question
    const queryEmbedding = await generateEmbedding(question)

    // Search for relevant content using vector similarity
    const similarContent = await searchSimilarContent(
      user.id,
      queryEmbedding,
      0.6, // Higher threshold for better relevance
      15   // Get more results for comprehensive context
    )

    // Format context for AI
    const relevantContext = similarContent.map((item) => ({
      type: item.content_type as 'activity' | 'summary' | 'report',
      date: item.content_date,
      content: item.content_text,
    }))

    // Generate chat response
    const prompt = createChatPrompt(question, relevantContext)
    const answer = await generateChatResponse(
      question,
      prompt,
      CHAT_AGENT_SYSTEM_PROMPT
    )

    // Save chat history
    const contextUsed = {
      query: question,
      resultsCount: similarContent.length,
      contentIds: similarContent.map((item) => item.content_id),
    }

    await saveChatHistory(
      user.id,
      question,
      answer,
      contextUsed,
      env.ai.models.chat
    )

    return NextResponse.json({
      answer,
      contextCount: similarContent.length,
    })
  } catch (error) {
    console.error('POST /api/chat error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
