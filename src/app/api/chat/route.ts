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
      console.log('📝 Creating intelligent fallback response with', relevantContext.length, 'context items')
      
      // Intelligent Fallback: Analyze and respond based on question intent
      
      if (relevantContext.length === 0) {
        answer = `Saya belum menemukan aktivitas atau ringkasan dalam log Anda.

Untuk memulai:
1. Buka halaman Daily Log
2. Tambahkan aktivitas hari ini
3. Generate ringkasan harian
4. Kemudian kembali ke sini untuk bertanya!`
      } else {
        const activities = relevantContext.filter(c => c.type === 'activity')
        const summaries = relevantContext.filter(c => c.type === 'summary')
        const today = new Date().toISOString().split('T')[0]
        const todayActivities = activities.filter(a => a.date === today)
        const questionLower = question.toLowerCase()
        
        // Detect question intent
        const isGreeting = /^(hai|halo|hi|hello|hey|test|tes)/i.test(questionLower)
        const isAskingAboutToday = /hari ini|today|kemarin|yesterday/i.test(questionLower)
        const isAskingProgress = /progress|kemajuan|perkembangan|bagaimana/i.test(questionLower)
        const isAskingCount = /berapa|how many|jumlah|total/i.test(questionLower)
        
        // Generate intelligent response based on intent
        if (isGreeting) {
          answer = `Halo! 👋 Saya asisten AI Anda untuk DayFrame.\n\n`
          answer += `📊 Saat ini Anda memiliki:\n`
          answer += `• ${todayActivities.length} aktivitas hari ini\n`
          answer += `• ${activities.length - todayActivities.length} aktivitas dari hari lainnya\n`
          answer += `• ${summaries.length} ringkasan harian yang telah dibuat\n\n`
          answer += `Silakan tanyakan apa saja tentang aktivitas Anda, misalnya:\n`
          answer += `• "Apa yang saya lakukan hari ini?"\n`
          answer += `• "Berapa total aktivitas saya?"\n`
          answer += `• "Bagaimana progress saya minggu ini?"`
        } else if (isAskingAboutToday && todayActivities.length > 0) {
          answer = `📅 **Aktivitas Hari Ini (${todayActivities.length} aktivitas):**\n\n`
          todayActivities.forEach((act, idx) => {
            answer += `${idx + 1}. ${act.content}\n\n`
          })
          if (summaries.length > 0) {
            const latestSummary = summaries[0]
            answer += `\n💡 **Insight:** Anda sudah membuat ${summaries.length} ringkasan. `
            answer += `Terus konsisten mencatat aktivitas untuk tracking yang lebih baik!`
          }
        } else if (isAskingCount) {
          answer = `📊 **Statistik Aktivitas Anda:**\n\n`
          answer += `• Total aktivitas tercatat: **${activities.length}** aktivitas\n`
          answer += `• Aktivitas hari ini: **${todayActivities.length}** aktivitas\n`
          answer += `• Aktivitas hari lainnya: **${activities.length - todayActivities.length}** aktivitas\n`
          answer += `• Ringkasan yang dibuat: **${summaries.length}** ringkasan\n\n`
          const avgPerDay = Math.round(activities.length / Math.max(summaries.length, 1))
          answer += `📈 Rata-rata ${avgPerDay} aktivitas per hari. `
          if (avgPerDay >= 3) {
            answer += `Produktivitas Anda sangat baik! 🎉`
          } else {
            answer += `Coba tingkatkan pencatatan aktivitas untuk insight yang lebih baik.`
          }
        } else if (isAskingProgress) {
          answer = `📈 **Progress & Perkembangan Anda:**\n\n`
          if (todayActivities.length > 0) {
            answer += `Hari ini Anda sudah mencatat ${todayActivities.length} aktivitas. `
          }
          answer += `Total ${activities.length} aktivitas tercatat dengan ${summaries.length} ringkasan.\n\n`
          
          if (todayActivities.length > 0) {
            answer += `**Aktivitas Terbaru:**\n${todayActivities[0].content.substring(0, 200)}${todayActivities[0].content.length > 200 ? '...' : ''}\n\n`
          }
          
          answer += `💪 Teruskan konsistensi Anda dalam mencatat aktivitas untuk tracking yang lebih akurat!`
        } else {
          // Default: Show relevant context
          answer = `Berdasarkan pertanyaan Anda, berikut data yang relevan:\n\n`
          
          if (todayActivities.length > 0) {
            answer += `📅 **Aktivitas Hari Ini (${todayActivities.length}):**\n`
            todayActivities.slice(0, 3).forEach((act, idx) => {
              const preview = act.content.substring(0, 150)
              answer += `${idx + 1}. ${preview}${act.content.length > 150 ? '...' : ''}\n\n`
            })
          }
          
          if (activities.length > todayActivities.length) {
            answer += `\n📝 **Aktivitas Sebelumnya:** ${activities.length - todayActivities.length} aktivitas dari hari lainnya\n`
          }
          
          if (summaries.length > 0) {
            answer += `\n✨ **Ringkasan Tersedia:** ${summaries.length} ringkasan harian telah dibuat\n`
          }
          
          answer += `\n💡 Coba tanyakan lebih spesifik, misalnya: "Apa yang saya lakukan hari ini?" atau "Berapa total aktivitas saya?"`
        }
        
        answer += `\n\n⚠️ *Catatan: Sedang menggunakan mode fallback karena AI service rate limit. Untuk respons AI penuh, top-up $10 di OpenRouter untuk unlock 1000 requests/day.*`
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
