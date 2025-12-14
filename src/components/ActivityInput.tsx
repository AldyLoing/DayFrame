'use client'

import { useState } from 'react'

interface ActivityInputProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
}

export function ActivityInput({ onSubmit, placeholder }: ActivityInputProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return

    setLoading(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } catch (error) {
      console.error('Failed to submit activity:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || "What's happening now? (Press Ctrl+Enter to submit)"}
        className="textarea min-h-[120px]"
        disabled={loading}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSubmit(e)
          }
        }}
      />
      
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-muted-foreground">
          {content.length} characters
        </p>
        
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="btn btn-primary"
        >
          {loading ? 'Logging...' : 'Log Activity'}
        </button>
      </div>
    </form>
  )
}
