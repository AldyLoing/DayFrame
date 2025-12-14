import type { PeriodicReportContent, ReportType } from '@/types/database'
import { format } from 'date-fns'

interface ReportCardProps {
  reportType: ReportType
  startDate: string
  endDate: string
  content: PeriodicReportContent
}

export function ReportCard({ reportType, startDate, endDate, content }: ReportCardProps) {
  const getReportTypeLabel = (type: ReportType) => {
    const labels = {
      weekly: 'Weekly Report',
      monthly: 'Monthly Report',
      quarterly: 'Quarterly Report',
      biannual: 'Biannual Report',
      yearly: 'Yearly Report',
    }
    return labels[type]
  }

  const getReportIcon = (type: ReportType) => {
    const icons = {
      weekly: '📅',
      monthly: '📊',
      quarterly: '📈',
      biannual: '📉',
      yearly: '🎯',
    }
    return icons[type]
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getReportIcon(reportType)}</span>
          <div>
            <h3 className="card-title">{getReportTypeLabel(reportType)}</h3>
            <p className="card-description">
              {format(new Date(startDate), 'MMM d, yyyy')} -{' '}
              {format(new Date(endDate), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {content.summary && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Overview</h4>
            <p className="text-base leading-relaxed">{content.summary}</p>
          </div>
        )}

        {content.patterns && content.patterns.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Patterns</h4>
            <ul className="space-y-2">
              {content.patterns.map((pattern, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2 mt-0.5">🔄</span>
                  <span>{pattern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.trends && content.trends.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Trends</h4>
            <ul className="space-y-2">
              {content.trends.map((trend, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2 mt-0.5">📊</span>
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.key_observations && content.key_observations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Key Observations</h4>
            <ul className="space-y-2">
              {content.key_observations.map((observation, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2 mt-0.5">🔍</span>
                  <span>{observation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.conclusion && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Conclusion</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content.conclusion}
            </p>
          </div>
        )}

        {content.suggestions && content.suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">
              Looking Forward
            </h4>
            <ul className="space-y-2">
              {content.suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2 mt-0.5">💡</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export function ReportCardSkeleton() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="skeleton h-6 w-48 mb-2"></div>
        <div className="skeleton h-4 w-32"></div>
      </div>
      <div className="space-y-6">
        <div className="skeleton h-4 w-full"></div>
        <div className="skeleton h-4 w-5/6"></div>
        <div className="skeleton h-4 w-4/6"></div>
      </div>
    </div>
  )
}
