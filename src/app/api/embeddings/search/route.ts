import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/server-utils'
import { searchSimilarContent } from '@/lib/db'
import { generateEmbedding } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { query, threshold = 0.5, limit = 10 } = body

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query)

    // Search for similar content
    const results = await searchSimilarContent(
      user.id,
      queryEmbedding,
      threshold,
      limit
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('POST /api/embeddings/search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
