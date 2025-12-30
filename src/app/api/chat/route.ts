import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/server-utils'
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
        0.5, // Lower threshold for better recall
        20   // Get more results for comprehensive context
      )

      console.log('🔍 Vector search results:', similarContent?.length || 0)

      // If no results from vector search, fall back to direct database query
      if (!similarContent || similarContent.length === 0) {
        throw new Error('No vector results, using fallback')
      }

      // Format context for AI
      relevantContext = similarContent.map((item: any) => ({
        type: item.content_type as 'activity' | 'summary' | 'report',
        date: item.content_date,
        content: item.content_text,
      }))

      contextUsed = {
        query: question,
        mode: 'vector',
        resultsCount: similarContent.length,
        contentIds: similarContent.map((item: any) => item.content_id),
      }

      console.log('✅ Using vector search context:', relevantContext.length, 'items')
    } catch (embeddingError) {
      console.log('⚠️  Vector search unavailable, using direct database query')
      // Fallback: Get recent activities and summaries from today
      const { getRecentActivities, getRecentSummaries } = await import('@/lib/db')
      const [activities, summaries] = await Promise.all([
        getRecentActivities(user.id, 50), // Get more activities
        getRecentSummaries(user.id, 30),  // Get more summaries
      ])

      console.log('📊 Fallback query results:', {
        activities: activities.length,
        summaries: summaries.length
      })

      relevantContext = [
        ...activities.map((a: any) => ({
          type: 'activity' as const,
          date: a.activity_date,
          content: a.content,
        })),
        ...summaries.map((s: any) => ({
          type: 'summary' as const,
          date: s.summary_date,
          content: typeof s.content === 'string' ? s.content : JSON.stringify(s.content),
        })),
      ]

      contextUsed = {
        query: question,
        mode: 'fallback',
        resultsCount: relevantContext.length,
      }

      console.log('✅ Using fallback context:', relevantContext.length, 'items')
    }

    // Generate chat response
    let answer: string
    try {
      const prompt = createChatPrompt(question, relevantContext)
      console.log('🤖 Generating AI response with', relevantContext.length, 'context items')
      
      answer = await generateChatResponse(
        question,
        prompt,
        CHAT_AGENT_SYSTEM_PROMPT
      )
      
      console.log('✅ AI response generated successfully')
    } catch (aiError) {
      console.log('⚠️  AI service unavailable:', aiError)
      console.log('📝 Using simple response with', relevantContext.length, 'context items')
      
      // Fallback: Create simple summary without AI
      
      if (relevantContext.length === 0) {
        answer = `I don't see any activities or summaries in your logs yet. 

To get started:
1. Go to the Daily Log page
2. Add your activities for today
3. Generate a daily summary
4. Then come back and ask me questions about your logged data!`
      } else {
        const activities = relevantContext.filter(c => c.type === 'activity')
        const summaries = relevantContext.filter(c => c.type === 'summary')
        const today = new Date().toISOString().split('T')[0]
        const todayActivities = activities.filter(a => a.date === today)
        
        answer = `Based on your logged data, I found:\n\n`
        
        if (todayActivities.length > 0) {
          answer += `📅 **Today's Activities (${todayActivities.length}):**\n`
          todayActivities.slice(0, 5).forEach((act, idx) => {
            const preview = act.content.substring(0, 150)
            answer += `${idx + 1}. ${preview}${act.content.length > 150 ? '...' : ''}\n\n`
          })
        }
        
        if (activities.length > todayActivities.length) {
          answer += `\n📝 **Previous Activities:** ${activities.length - todayActivities.length} activities from other days\n`
        }
        
        if (summaries.length > 0) {
          answer += `\n✨ **Daily Summaries:** ${summaries.length} generated summaries\n`
        }
        
        answer += `\n💡 *Note: AI service is temporarily limited. The full AI assistant will provide more detailed analysis.*`
      }
    }

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
