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
      
      // Intelligent Fallback: Deep analysis and contextual responses
      
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
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0]
        const lastWeekStr = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0]
        const lastMonthStr = new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0]
        
        const todayActivities = activities.filter(a => a.date === todayStr)
        const yesterdayActivities = activities.filter(a => a.date === yesterdayStr)
        const lastWeekActivities = activities.filter(a => a.date >= lastWeekStr)
        const lastMonthActivities = activities.filter(a => a.date >= lastMonthStr)
        
        const questionLower = question.toLowerCase()
        
        // Advanced intent detection
        const isGreeting = /^(hai|halo|hi|hello|hey|test|tes)$/i.test(questionLower)
        const isAskingAboutToday = /(hari ini|today)/i.test(questionLower)
        const isAskingAboutYesterday = /(kemarin|yesterday)/i.test(questionLower)
        const isAskingAboutWeek = /(minggu|week|7 hari)/i.test(questionLower)
        const isAskingAboutMonth = /(bulan|month|30 hari)/i.test(questionLower)
        const isAskingProgress = /progress|kemajuan|perkembangan|bagaimana/i.test(questionLower)
        const isAskingCount = /berapa|how many|jumlah|total/i.test(questionLower)
        const isAskingTrend = /trend|tren|perubahan|naik|turun/i.test(questionLower)
        const isAskingSummary = /ringkas|summary|rangkum|kesimpulan/i.test(questionLower)
        
        // Helper: Calculate activity keywords
        const extractKeywords = (acts: typeof activities) => {
          const text = acts.map(a => a.content.toLowerCase()).join(' ')
          const words = text.match(/\b\w{5,}\b/g) || []
          const freq: Record<string, number> = {}
          words.forEach(w => freq[w] = (freq[w] || 0) + 1)
          return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word)
        }
        
        // Generate intelligent response based on intent
        if (isGreeting) {
          answer = `Halo! 👋 Saya asisten AI DayFrame Anda.\n\n`
          answer += `📊 **Status Aktivitas Anda:**\n`
          answer += `• Hari ini: ${todayActivities.length} aktivitas\n`
          answer += `• Kemarin: ${yesterdayActivities.length} aktivitas\n`
          answer += `• 7 hari terakhir: ${lastWeekActivities.length} aktivitas\n`
          answer += `• Total keseluruhan: ${activities.length} aktivitas\n`
          answer += `• Ringkasan dibuat: ${summaries.length} ringkasan\n\n`
          
          const avgPerDay = Math.round(activities.length / Math.max(summaries.length, 1))
          answer += `📈 **Insight:** Rata-rata Anda mencatat ${avgPerDay} aktivitas per hari. `
          
          if (avgPerDay >= 5) {
            answer += `Luar biasa! Produktivitas Anda sangat tinggi! 🎉`
          } else if (avgPerDay >= 3) {
            answer += `Bagus! Terus pertahankan konsistensi ini! 👍`
          } else {
            answer += `Coba tingkatkan pencatatan aktivitas untuk insight yang lebih baik.`
          }
          
          answer += `\n\n💡 **Contoh Pertanyaan:**\n`
          answer += `• "Bagaimana progress saya minggu ini?"\n`
          answer += `• "Apa yang saya lakukan kemarin?"\n`
          answer += `• "Berapa total aktivitas saya bulan ini?"\n`
          answer += `• "Apa trend aktivitas saya?"`
          
        } else if (isAskingAboutWeek || (isAskingProgress && /minggu|week/i.test(questionLower))) {
          answer = `📈 **Progress & Analisis Minggu Ini:**\n\n`
          
          // Calculate stats for last 7 days
          const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date(today.getTime() - i * 86400000)
            const dateStr = date.toISOString().split('T')[0]
            const acts = activities.filter(a => a.date === dateStr)
            return { date: dateStr, count: acts.length, activities: acts }
          }).reverse()
          
          answer += `**Total aktivitas 7 hari terakhir:** ${lastWeekActivities.length} aktivitas\n`
          answer += `**Rata-rata per hari:** ${Math.round(lastWeekActivities.length / 7)} aktivitas\n\n`
          
          // Daily breakdown
          answer += `**Breakdown Harian:**\n`
          last7Days.forEach(day => {
            const dayName = new Date(day.date).toLocaleDateString('id-ID', { weekday: 'short' })
            const bar = '█'.repeat(Math.min(day.count, 10))
            answer += `• ${dayName} (${day.date}): ${bar} ${day.count} aktivitas\n`
          })
          
          // Find most productive day
          const maxDay = last7Days.reduce((max, day) => day.count > max.count ? day : max, last7Days[0])
          if (maxDay.count > 0) {
            answer += `\n🏆 **Hari paling produktif:** ${new Date(maxDay.date).toLocaleDateString('id-ID', { weekday: 'long' })} dengan ${maxDay.count} aktivitas\n`
          }
          
          // Activity samples
          if (lastWeekActivities.length > 0) {
            answer += `\n**Contoh Aktivitas Minggu Ini:**\n`
            lastWeekActivities.slice(0, 3).forEach((act, idx) => {
              const preview = act.content.substring(0, 120)
              answer += `${idx + 1}. [${act.date}] ${preview}${act.content.length > 120 ? '...' : ''}\n\n`
            })
          }
          
          // Keywords analysis
          const keywords = extractKeywords(lastWeekActivities)
          if (keywords.length > 0) {
            answer += `\n🔍 **Tema/Topik Utama:** ${keywords.join(', ')}\n`
          }
          
          // Trend analysis
          const firstHalf = last7Days.slice(0, 3).reduce((sum, d) => sum + d.count, 0)
          const secondHalf = last7Days.slice(4, 7).reduce((sum, d) => sum + d.count, 0)
          
          if (secondHalf > firstHalf * 1.2) {
            answer += `\n📊 **Trend:** Aktivitas Anda meningkat di akhir minggu! Pertahankan momentum! 🚀`
          } else if (secondHalf < firstHalf * 0.8) {
            answer += `\n📊 **Trend:** Aktivitas menurun di akhir minggu. Mungkin perlu lebih fokus? 🤔`
          } else {
            answer += `\n📊 **Trend:** Aktivitas Anda stabil sepanjang minggu. Konsistensi yang bagus! ✨`
          }
          
          answer += `\n\n💪 **Rekomendasi:** ${lastWeekActivities.length >= 21 ? 'Luar biasa! Terus pertahankan produktivitas tinggi!' : lastWeekActivities.length >= 14 ? 'Bagus! Coba tingkatkan sedikit lagi untuk hasil optimal.' : 'Coba targetkan minimal 3 aktivitas per hari untuk tracking yang lebih baik.'}`
          
        } else if (isAskingAboutMonth || (isAskingProgress && /bulan|month/i.test(questionLower))) {
          answer = `📊 **Progress & Analisis Bulan Ini:**\n\n`
          
          const totalDays = Math.ceil((today.getTime() - new Date(lastMonthStr).getTime()) / 86400000)
          const avgPerDay = Math.round(lastMonthActivities.length / totalDays)
          
          answer += `**Total aktivitas 30 hari terakhir:** ${lastMonthActivities.length} aktivitas\n`
          answer += `**Rata-rata per hari:** ${avgPerDay} aktivitas\n`
          answer += `**Hari aktif:** ${summaries.filter(s => s.date >= lastMonthStr).length} hari (${Math.round((summaries.filter(s => s.date >= lastMonthStr).length / totalDays) * 100)}%)\n\n`
          
          // Weekly breakdown
          answer += `**Breakdown Mingguan:**\n`
          for (let i = 0; i < 4; i++) {
            const weekStart = new Date(today.getTime() - (i * 7 + 7) * 86400000).toISOString().split('T')[0]
            const weekEnd = new Date(today.getTime() - i * 7 * 86400000).toISOString().split('T')[0]
            const weekActivities = activities.filter(a => a.date >= weekStart && a.date <= weekEnd)
            answer += `• Minggu ${4-i}: ${weekActivities.length} aktivitas\n`
          }
          
          // Recent activities
          if (lastMonthActivities.length > 0) {
            answer += `\n**Aktivitas Terkini:**\n`
            lastMonthActivities.slice(0, 5).forEach((act, idx) => {
              const preview = act.content.substring(0, 100)
              answer += `${idx + 1}. [${act.date}] ${preview}${act.content.length > 100 ? '...' : ''}\n\n`
            })
          }
          
          // Keywords analysis
          const keywords = extractKeywords(lastMonthActivities)
          if (keywords.length > 0) {
            answer += `\n🏷️ **Fokus Utama Bulan Ini:** ${keywords.join(', ')}\n`
          }
          
          // Performance assessment
          answer += `\n📈 **Assessment:**\n`
          if (avgPerDay >= 5) {
            answer += `Produktivitas Anda LUAR BIASA! 🌟 Anda konsisten mencatat detail aktivitas setiap hari.`
          } else if (avgPerDay >= 3) {
            answer += `Produktivitas Anda BAGUS! 👍 Tracking aktivitas sudah cukup konsisten.`
          } else if (avgPerDay >= 1) {
            answer += `Anda sudah memulai kebiasaan baik! 💫 Coba tingkatkan frekuensi pencatatan untuk insight lebih dalam.`
          } else {
            answer += `Yuk mulai lebih rajin mencatat aktivitas! 📝 Minimal 2-3 aktivitas per hari akan sangat membantu.`
          }
          
        } else if (isAskingAboutYesterday) {
          answer = `📅 **Aktivitas Kemarin (${yesterdayStr}):**\n\n`
          
          if (yesterdayActivities.length === 0) {
            answer += `Tidak ada aktivitas tercatat untuk kemarin.\n\n`
            answer += `💡 **Tip:** Anda masih bisa menambahkan aktivitas untuk tanggal sebelumnya di halaman Daily Log!`
          } else {
            answer += `Total: ${yesterdayActivities.length} aktivitas tercatat\n\n`
            yesterdayActivities.forEach((act, idx) => {
              answer += `${idx + 1}. ${act.content}\n\n`
            })
            
            answer += `\n✅ **Kesimpulan:** Kemarin Anda produktif dengan ${yesterdayActivities.length} aktivitas. `
            if (yesterdayActivities.length > todayActivities.length) {
              answer += `Kemarin lebih produktif dari hari ini. Ayo kejar!`
            } else {
              answer += `Hari ini lebih produktif, pertahankan!`
            }
          }
          
        } else if (isAskingAboutToday) {
          answer = `📅 **Aktivitas Hari Ini (${todayStr}):**\n\n`
          
          if (todayActivities.length === 0) {
            answer += `Belum ada aktivitas tercatat untuk hari ini.\n\n`
            answer += `💡 Yuk mulai catat aktivitas Anda hari ini di halaman Daily Log!`
          } else {
            answer += `Total: ${todayActivities.length} aktivitas\n\n`
            todayActivities.forEach((act, idx) => {
              answer += `${idx + 1}. ${act.content}\n\n`
            })
            
            const keywords = extractKeywords(todayActivities)
            if (keywords.length > 0) {
              answer += `\n🎯 **Fokus hari ini:** ${keywords.join(', ')}\n`
            }
            
            answer += `\n📊 **Perbandingan:**\n`
            answer += `• Kemarin: ${yesterdayActivities.length} aktivitas\n`
            answer += `• Rata-rata 7 hari: ${Math.round(lastWeekActivities.length / 7)} aktivitas\n\n`
            
            if (todayActivities.length >= Math.round(lastWeekActivities.length / 7)) {
              answer += `✨ Anda di atas rata-rata! Produktivitas bagus!`
            } else {
              answer += `💪 Yuk tambah lagi beberapa aktivitas untuk mencapai target!`
            }
          }
          
        } else if (isAskingCount) {
          answer = `📊 **Statistik Lengkap Aktivitas Anda:**\n\n`
          answer += `**📈 Ringkasan Total:**\n`
          answer += `• Total aktivitas tercatat: **${activities.length}** aktivitas\n`
          answer += `• Hari aktif: **${summaries.length}** hari\n`
          answer += `• Ringkasan dibuat: **${summaries.length}** ringkasan\n\n`
          
          answer += `**📅 Breakdown Periode:**\n`
          answer += `• Hari ini: ${todayActivities.length} aktivitas\n`
          answer += `• Kemarin: ${yesterdayActivities.length} aktivitas\n`
          answer += `• 7 hari terakhir: ${lastWeekActivities.length} aktivitas\n`
          answer += `• 30 hari terakhir: ${lastMonthActivities.length} aktivitas\n\n`
          
          answer += `**📊 Statistik Lanjutan:**\n`
          const avgPerDay = Math.round(activities.length / Math.max(summaries.length, 1))
          const avgPerWeek = Math.round(lastWeekActivities.length / 7)
          const avgPerMonth = Math.round(lastMonthActivities.length / 30)
          
          answer += `• Rata-rata per hari (keseluruhan): ${avgPerDay} aktivitas\n`
          answer += `• Rata-rata per hari (7 hari): ${avgPerWeek} aktivitas\n`
          answer += `• Rata-rata per hari (30 hari): ${avgPerMonth} aktivitas\n\n`
          
          // Performance badge
          if (avgPerDay >= 5) {
            answer += `🏆 **Level:** SUPER PRODUKTIF! Anda konsisten mencatat 5+ aktivitas per hari!`
          } else if (avgPerDay >= 3) {
            answer += `⭐ **Level:** PRODUKTIF! Tracking aktivitas Anda sudah sangat baik!`
          } else if (avgPerDay >= 1) {
            answer += `💫 **Level:** PEMULA AKTIF! Terus tingkatkan konsistensi Anda!`
          } else {
            answer += `🌱 **Level:** MEMULAI! Yuk lebih rajin mencatat aktivitas!`
          }
          
        } else if (isAskingTrend) {
          answer = `📈 **Analisis Trend Aktivitas Anda:**\n\n`
          
          // Calculate weekly trends
          const weeks = []
          for (let i = 0; i < 4; i++) {
            const weekStart = new Date(today.getTime() - (i * 7 + 7) * 86400000).toISOString().split('T')[0]
            const weekEnd = new Date(today.getTime() - i * 7 * 86400000).toISOString().split('T')[0]
            const weekActivities = activities.filter(a => a.date >= weekStart && a.date <= weekEnd)
            weeks.push({ week: 4-i, count: weekActivities.length })
          }
          
          answer += `**Trend 4 Minggu Terakhir:**\n`
          weeks.forEach(w => {
            const bar = '▓'.repeat(Math.floor(w.count / 5)) + '░'.repeat(Math.max(0, 10 - Math.floor(w.count / 5)))
            answer += `Minggu ${w.week}: ${bar} ${w.count} aktivitas\n`
          })
          
          // Calculate trend direction
          const firstWeek = weeks[0].count
          const lastWeek = weeks[3].count
          const trendPercent = Math.round(((lastWeek - firstWeek) / Math.max(firstWeek, 1)) * 100)
          
          answer += `\n📊 **Analisis Trend:**\n`
          if (trendPercent > 20) {
            answer += `🚀 **NAIK ${Math.abs(trendPercent)}%** - Produktivitas Anda meningkat signifikan! Luar biasa!`
          } else if (trendPercent > 0) {
            answer += `📈 **NAIK ${Math.abs(trendPercent)}%** - Ada peningkatan positif. Pertahankan momentum!`
          } else if (trendPercent < -20) {
            answer += `📉 **TURUN ${Math.abs(trendPercent)}%** - Aktivitas menurun cukup banyak. Perlu fokus lebih?`
          } else if (trendPercent < 0) {
            answer += `📊 **TURUN ${Math.abs(trendPercent)}%** - Sedikit penurunan. Tetap semangat!`
          } else {
            answer += `➡️ **STABIL** - Konsistensi yang baik! Terus pertahankan ritme ini.`
          }
          
          // Prediction
          const projected = lastWeek + Math.round((lastWeek - firstWeek) / 3)
          answer += `\n\n🔮 **Proyeksi Minggu Depan:** Jika trend berlanjut, Anda mungkin akan mencatat sekitar ${projected} aktivitas minggu depan.`
          
        } else {
          // Default: Smart contextual response
          answer = `Berdasarkan pertanyaan Anda, berikut analisis data yang relevan:\n\n`
          
          answer += `📊 **Status Terkini:**\n`
          answer += `• Total aktivitas: ${activities.length} aktivitas\n`
          answer += `• Hari ini: ${todayActivities.length} aktivitas\n`
          answer += `• 7 hari terakhir: ${lastWeekActivities.length} aktivitas\n`
          answer += `• Ringkasan tersedia: ${summaries.length} ringkasan\n\n`
          
          if (todayActivities.length > 0) {
            answer += `**Aktivitas Terbaru Hari Ini:**\n`
            todayActivities.slice(0, 2).forEach((act, idx) => {
              const preview = act.content.substring(0, 150)
              answer += `${idx + 1}. ${preview}${act.content.length > 150 ? '...' : ''}\n\n`
            })
          }
          
          if (lastWeekActivities.length > todayActivities.length) {
            answer += `**Aktivitas Minggu Ini:**\n`
            lastWeekActivities.slice(0, 3).forEach((act, idx) => {
              const preview = act.content.substring(0, 120)
              answer += `${idx + 1}. [${act.date}] ${preview}${act.content.length > 120 ? '...' : ''}\n\n`
            })
          }
          
          const keywords = extractKeywords(lastWeekActivities)
          if (keywords.length > 0) {
            answer += `\n🔍 **Fokus utama minggu ini:** ${keywords.join(', ')}\n`
          }
          
          answer += `\n💡 **Saran pertanyaan yang bisa Anda tanyakan:**\n`
          answer += `• "Bagaimana progress saya minggu ini?"\n`
          answer += `• "Apa yang saya lakukan kemarin?"\n`
          answer += `• "Berapa total aktivitas saya?"\n`
          answer += `• "Apa trend aktivitas saya?"`
        }
        
        answer += `\n\n⚠️ *Mode fallback aktif. Untuk analisis AI yang lebih mendalam dengan insight personalisasi, pastikan model AI berbayar sudah diaktifkan di environment variables.*`
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
