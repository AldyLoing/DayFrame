import type { DailySummaryContent } from '@/types/database'

interface SummaryCardProps {
  date: string
  content: DailySummaryContent
  onRegenerate?: () => void
}

export function SummaryCard({ date, content, onRegenerate }: SummaryCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="card-title">Daily Summary</h3>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              title="Regenerate summary"
            >
              🔄
            </button>
          )}
        </div>
        <p className="card-description">{date}</p>
      </div>

      <div className="space-y-6">
        {content.summary && (
          <div>
            <p className="text-base leading-relaxed">{content.summary}</p>
          </div>
        )}

        {content.highlights && content.highlights.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">Highlights</h4>
            <ul className="space-y-1">
              {content.highlights.map((highlight, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2 mt-0.5">✨</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.problems && content.problems.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">Challenges</h4>
            <ul className="space-y-1">
              {content.problems.map((problem, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2 mt-0.5">⚠️</span>
                  <span>{problem}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.conclusion && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">Conclusion</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content.conclusion}
            </p>
          </div>
        )}

        {content.suggestions && content.suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">
              Suggestions for Tomorrow
            </h4>
            <ul className="space-y-1">
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

export function SummaryCardSkeleton() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="skeleton h-5 w-32 mb-2"></div>
        <div className="skeleton h-4 w-24"></div>
      </div>
      <div className="space-y-4">
        <div className="skeleton h-4 w-full"></div>
        <div className="skeleton h-4 w-5/6"></div>
        <div className="skeleton h-4 w-4/6"></div>
      </div>
    </div>
  )
}
