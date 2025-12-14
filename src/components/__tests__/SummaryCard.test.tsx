import { SummaryCard } from '@/components/SummaryCard'
import { render, screen } from '@testing-library/react'
import type { DailySummaryContent } from '@/types/database'

describe('SummaryCard', () => {
  const mockContent: DailySummaryContent = {
    summary: 'Test daily summary',
    highlights: ['Highlight 1', 'Highlight 2'],
    problems: ['Problem 1'],
    conclusion: 'Test conclusion',
    suggestions: ['Suggestion 1', 'Suggestion 2'],
  }

  it('should render summary content', () => {
    render(<SummaryCard date="January 15, 2024" content={mockContent} />)
    
    expect(screen.getByText('Test daily summary')).toBeInTheDocument()
    expect(screen.getByText('Test conclusion')).toBeInTheDocument()
  })

  it('should render highlights section', () => {
    render(<SummaryCard date="January 15, 2024" content={mockContent} />)
    
    expect(screen.getByText('Highlights')).toBeInTheDocument()
    expect(screen.getByText('Highlight 1')).toBeInTheDocument()
    expect(screen.getByText('Highlight 2')).toBeInTheDocument()
  })

  it('should render problems section', () => {
    render(<SummaryCard date="January 15, 2024" content={mockContent} />)
    
    expect(screen.getByText('Challenges')).toBeInTheDocument()
    expect(screen.getByText('Problem 1')).toBeInTheDocument()
  })

  it('should render suggestions section', () => {
    render(<SummaryCard date="January 15, 2024" content={mockContent} />)
    
    expect(screen.getByText('Suggestions for Tomorrow')).toBeInTheDocument()
    expect(screen.getByText('Suggestion 1')).toBeInTheDocument()
  })

  it('should not render empty sections', () => {
    const emptyContent: DailySummaryContent = {
      summary: 'Test',
      highlights: [],
      problems: [],
      conclusion: '',
      suggestions: [],
    }

    render(<SummaryCard date="January 15, 2024" content={emptyContent} />)
    
    expect(screen.queryByText('Highlights')).not.toBeInTheDocument()
    expect(screen.queryByText('Challenges')).not.toBeInTheDocument()
    expect(screen.queryByText('Suggestions for Tomorrow')).not.toBeInTheDocument()
  })
})
