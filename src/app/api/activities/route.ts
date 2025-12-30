import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/server-utils'
import { createActivity, getActivitiesByDate } from '@/lib/db'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')

    if (!dateStr) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 })
    }

    const date = new Date(dateStr)
    const activities = await getActivitiesByDate(user.id, date)

    return NextResponse.json(activities)
  } catch (error) {
    console.error('GET /api/activities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, activityDate } = body

    if (!content || !activityDate) {
      return NextResponse.json(
        { error: 'Content and activityDate required' },
        { status: 400 }
      )
    }

    const date = new Date(activityDate)
    const activity = await createActivity(user.id, content, date)

    // Trigger embedding generation in background (don't await)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/embeddings/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: 'activity',
        contentId: activity.id,
        contentText: content,
        contentDate: format(date, 'yyyy-MM-dd'),
      }),
    }).catch(console.error)

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('POST /api/activities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
