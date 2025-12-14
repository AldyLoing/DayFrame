import { format } from 'date-fns'
import type { Activity } from '@/types/database'

interface ActivityCardProps {
  activity: Activity
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  return (
    <div className="card group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-2">
            {format(new Date(activity.activity_timestamp), 'h:mm a')}
          </div>
          <p className="text-base leading-relaxed">{activity.content}</p>
        </div>
        
        {(onEdit || onDelete) && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(activity.id)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Edit"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(activity.id)}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface ActivityListProps {
  activities: Activity[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  emptyMessage?: string
}

export function ActivityList({ activities, onEdit, onDelete, emptyMessage }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {emptyMessage || 'No activities logged yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
