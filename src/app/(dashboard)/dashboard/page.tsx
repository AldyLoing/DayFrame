import { getCurrentUser } from '@/lib/supabase/server-utils'
import { getUserStats, getRecentActivities, getRecentDailySummaries } from '@/lib/db'
import { redirect } from 'next/navigation'
import { StatCard } from '@/components/StatCard'
import { ActivityList } from '@/components/ActivityCard'
import { SummaryCard } from '@/components/SummaryCard'
import { format } from 'date-fns'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const [stats, recentActivities, recentSummaries] = await Promise.all([
    getUserStats(user.id),
    getRecentActivities(user.id, 5),
    getRecentDailySummaries(user.id, 1),
  ])

  const latestSummary = recentSummaries[0]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here's what's happening.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Activities"
          value={stats.totalActivities}
          icon="📝"
          description="All time"
        />
        <StatCard
          title="This Week"
          value={stats.activitiesThisWeek}
          icon="📅"
          description="Activities logged"
        />
        <StatCard
          title="Daily Summaries"
          value={stats.totalSummaries}
          icon="✨"
          description="AI-generated"
        />
        <StatCard
          title="Reports"
          value={stats.totalReports}
          icon="📊"
          description="Period insights"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/log" className="card hover:shadow-elevated transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✍️</span>
            <div>
              <h3 className="font-semibold">Log Activity</h3>
              <p className="text-sm text-muted-foreground">Add today's entry</p>
            </div>
          </div>
        </Link>
        
        <Link href="/reports" className="card hover:shadow-elevated transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <h3 className="font-semibold">View Reports</h3>
              <p className="text-sm text-muted-foreground">Period insights</p>
            </div>
          </div>
        </Link>
        
        <Link href="/chat" className="card hover:shadow-elevated transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <h3 className="font-semibold">AI Chat</h3>
              <p className="text-sm text-muted-foreground">Ask questions</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Latest Summary */}
      {latestSummary && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">Latest Summary</h2>
            <Link href="/log" className="text-sm link">
              View all →
            </Link>
          </div>
          <SummaryCard
            date={format(new Date(latestSummary.summary_date), 'MMMM d, yyyy')}
            content={latestSummary.content}
          />
        </div>
      )}

      {/* Recent Activities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold tracking-tight">Recent Activities</h2>
          <Link href="/log" className="text-sm link">
            View all →
          </Link>
        </div>
        
        {recentActivities.length > 0 ? (
          <ActivityList activities={recentActivities} />
        ) : (
          <div className="card text-center py-12">
            <p className="text-muted-foreground mb-4">No activities yet</p>
            <Link href="/log" className="btn btn-primary">
              Log your first activity
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
