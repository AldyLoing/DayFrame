import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/server-utils'
import { createEmbedding } from '@/lib/db'
import { generateEmbedding } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contentType, contentId, contentText, contentDate } = body

    if (!contentType || !contentId || !contentText || !contentDate) {
      return NextResponse.json(
        { error: 'All fields required' },
        { status: 400 }
      )
    }

    // Generate embedding using OpenRouter
    const embedding = await generateEmbedding(contentText)

    // Save embedding to database
    await createEmbedding(
      user.id,
      contentType,
      contentId,
      contentText,
      new Date(contentDate),
      embedding
    )

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('POST /api/embeddings/generate error:', error)
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    )
  }
}
