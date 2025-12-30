import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/server-utils'
import { getChatHistory } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const history = await getChatHistory(user.id, limit)

    return NextResponse.json(history)
  } catch (error) {
    console.error('GET /api/chat/history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
