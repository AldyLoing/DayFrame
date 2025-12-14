'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import type { ChatHistory } from '@/types/database'

interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadChatHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/chat/history?limit=20')
      if (response.ok) {
        const history: ChatHistory[] = await response.json()
        console.log('Chat history loaded:', history)
        const historyMessages: Message[] = history
          .reverse()
          .flatMap((item) => [
            {
              id: item.id,
              role: 'user' as const,
              content: item.question,
              timestamp: new Date(item.created_at),
            },
            {
              id: item.id,
              role: 'assistant' as const,
              content: item.answer,
              timestamp: new Date(item.created_at),
            },
          ])
        console.log('Messages with IDs:', historyMessages.map(m => ({ role: m.role, hasId: !!m.id })))
        setMessages(historyMessages)
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('Hapus pesan ini? Ini akan menghapus pertanyaan dan jawaban terkait.')) {
      return
    }

    try {
      const response = await fetch(`/api/chat?id=${messageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove both user and assistant messages with this ID
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      } else {
        throw new Error('Failed to delete message')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Gagal menghapus pesan. Silakan coba lagi.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">AI Chat</h1>
        <p className="text-muted-foreground">
          Ask questions about your logged activities and summaries
        </p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-4 scrollbar-hide">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading chat history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-6xl mb-4">💬</span>
            <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
            <p className="text-muted-foreground max-w-md">
              Ask me anything about your activities, patterns, or insights from your logs.
              I'll answer based only on your personal data.
            </p>
            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <p className="font-medium">Example questions:</p>
              <ul className="space-y-1">
                <li>"What did I do last week?"</li>
                <li>"When was I most productive?"</li>
                <li>"What patterns do you see in my activities?"</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 relative group ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white border border-border'
                }`}
              >
                {message.id && message.role === 'user' && (
                  <button
                    onClick={() => handleDelete(message.id!)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 text-lg font-bold flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                    title="Hapus pesan"
                  >
                    ×
                  </button>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user'
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                >
                  {format(message.timestamp, 'h:mm a')}
                </p>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-border rounded-lg p-4 max-w-[80%]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your activities..."
            className="input flex-1"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-3">
          The AI will only answer based on your logged activities and summaries.
        </p>
      </form>
    </div>
  )
}
