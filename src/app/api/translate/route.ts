import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { generateChatResponse } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, targetLanguage } = body

    if (!content || !targetLanguage) {
      return NextResponse.json(
        { error: 'Content and target language required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are a professional translator. Translate the provided content to ${targetLanguage} while maintaining the exact JSON structure. Keep the same formatting, bullet points, and structure. Only translate the text values, not the keys.`

    const prompt = `Translate this JSON content to ${targetLanguage}. Return the same JSON structure with translated values:

${JSON.stringify(content, null, 2)}

Return ONLY valid JSON, no additional text.`

    const translatedText = await generateChatResponse(prompt, '', systemPrompt)
    
    // Parse the response to ensure it's valid JSON
    let translatedContent
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = translatedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      if (jsonMatch) {
        translatedContent = JSON.parse(jsonMatch[1])
      } else {
        translatedContent = JSON.parse(translatedText)
      }
    } catch (parseError) {
      console.error('Failed to parse translated content:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse translation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ translatedContent })
  } catch (error) {
    console.error('POST /api/translate error:', error)
    return NextResponse.json(
      { error: 'Failed to translate content' },
      { status: 500 }
    )
  }
}
