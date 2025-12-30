'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ActivityInput } from '@/components/ActivityInput'
import { ActivityList } from '@/components/ActivityCard'
import { SummaryCard, SummaryCardSkeleton } from '@/components/SummaryCard'
import type { Activity, DailySummary } from '@/types/database'

export default function DailyLogPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activities, setActivities] = useState<Activity[]>([])
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      
      const [activitiesRes, summaryRes] = await Promise.all([
        fetch(`/api/activities?date=${dateStr}`),
        fetch(`/api/summaries/daily?date=${dateStr}`),
      ])

      if (activitiesRes.ok) {
        const data = await activitiesRes.json()
        setActivities(data)
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data)
      } else {
        setSummary(null)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddActivity = async (content: string) => {
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        activityDate: selectedDate.toISOString(),
      }),
    })

    if (response.ok) {
      await loadData()
    } else {
      throw new Error('Failed to add activity')
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return
    }

    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadData()
      } else {
        alert('Failed to delete activity')
      }
    } catch (error) {
      console.error('Failed to delete activity:', error)
      alert('Failed to delete activity')
    }
  }

  const handleGenerateSummary = async () => {
    setSummaryLoading(true)
    try {
      const response = await fetch('/api/summaries/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      } else {
        const errorData = await response.json()
        console.error('Failed to generate summary:', errorData)
        alert(`Failed to generate summary: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to generate summary:', error)
      alert('Failed to generate summary. Please check the console for details.')
    } finally {
      setSummaryLoading(false)
    }
  }

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Daily Log</h1>
        <p className="text-muted-foreground">
          Record your activities and reflections
        </p>
      </div>

      {/* Date Selector */}
      <div className="card">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const newDate = new Date(selectedDate)
              newDate.setDate(newDate.getDate() - 1)
              setSelectedDate(newDate)
            }}
            className="btn btn-ghost"
          >
            ← Previous
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-semibold">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            {isToday && (
              <span className="badge badge-accent mt-2">Today</span>
            )}
          </div>

          <button
            onClick={() => {
              const newDate = new Date(selectedDate)
              newDate.setDate(newDate.getDate() + 1)
              if (newDate <= new Date()) {
                setSelectedDate(newDate)
              }
            }}
            disabled={isToday}
            className="btn btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Activity Input (for today and past dates) */}
      {!isToday && selectedDate > new Date() ? null : (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {isToday ? 'Log Activity' : 'Add Activity'}
          </h2>
          <ActivityInput onSubmit={handleAddActivity} />
        </div>
      )}

      {/* Activities List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Activities</h2>
        {loading ? (
          <div className="space-y-4">
            <div className="card skeleton h-24"></div>
            <div className="card skeleton h-24"></div>
          </div>
        ) : (
          <ActivityList
            activities={activities}
            onDelete={handleDeleteActivity}
            emptyMessage="No activities logged for this day."
          />
        )}
      </div>

      {/* Daily Summary */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Daily Summary</h2>
          {activities.length > 0 && (
            <button
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              className="btn btn-secondary"
            >
              {summaryLoading ? 'Generating...' : summary ? 'Regenerate' : 'Generate Summary'}
            </button>
          )}
        </div>

        {summaryLoading ? (
          <SummaryCardSkeleton />
        ) : summary ? (
          <SummaryCard
            date={format(selectedDate, 'MMMM d, yyyy')}
            content={summary.content}
            onRegenerate={handleGenerateSummary}
          />
        ) : activities.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">
              Log some activities first to generate a summary.
            </p>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-muted-foreground mb-4">
              No summary generated yet for this day.
            </p>
            <button onClick={handleGenerateSummary} className="btn btn-primary">
              Generate Summary
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
