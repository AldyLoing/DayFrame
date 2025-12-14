import { ActivityCard } from '@/components/ActivityCard'
import { render, screen } from '@testing-library/react'
import type { Activity } from '@/types/database'

describe('ActivityCard', () => {
  const mockActivity: Activity = {
    id: '123',
    user_id: 'user-123',
    content: 'Test activity content',
    activity_date: '2024-01-15',
    activity_timestamp: '2024-01-15T14:30:00Z',
    created_at: '2024-01-15T14:30:00Z',
    updated_at: '2024-01-15T14:30:00Z',
    is_deleted: false,
    metadata: {},
  }

  it('should render activity content', () => {
    render(<ActivityCard activity={mockActivity} />)
    
    expect(screen.getByText('Test activity content')).toBeInTheDocument()
  })

  it('should show edit and delete buttons when handlers provided', () => {
    const onEdit = jest.fn()
    const onDelete = jest.fn()
    
    render(
      <ActivityCard
        activity={mockActivity}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    
    // Buttons should exist (even if hidden by CSS)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(2)
  })

  it('should not show buttons when handlers not provided', () => {
    render(<ActivityCard activity={mockActivity} />)
    
    const buttons = screen.queryAllByRole('button')
    expect(buttons.length).toBe(0)
  })
})
