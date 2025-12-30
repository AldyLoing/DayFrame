'use client'

import { useState, useRef, useEffect } from 'react'
import type { DailySummaryContent } from '@/types/database'

interface SummaryCardProps {
  date: string
  content: DailySummaryContent
  onRegenerate?: () => void
}

export function SummaryCard({ date, content, onRegenerate }: SummaryCardProps) {
  const [displayContent, setDisplayContent] = useState(content)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false)
      }
    }

    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLanguageMenu])

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
  ]

  const handleTranslate = async (targetLanguage: string) => {
    setIsTranslating(true)
    setShowLanguageMenu(false)
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          targetLanguage,
        }),
      })

      if (response.ok) {
        const { translatedContent } = await response.json()
        setDisplayContent(translatedContent)
      } else {
        alert('Failed to translate. Please try again.')
      }
    } catch (error) {
      console.error('Translation error:', error)
      alert('Failed to translate. Please try again.')
    } finally {
      setIsTranslating(false)
    }
  }

  const resetToOriginal = () => {
    setDisplayContent(content)
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="card-title">Daily Summary</h3>
          <div className="flex items-center gap-2">
            {displayContent !== content && (
              <button
                onClick={resetToOriginal}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Reset to original"
              >
                ↺
              </button>
            )}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                disabled={isTranslating}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Translate"
              >
                {isTranslating ? '⏳' : '🌐'}
              </button>
              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleTranslate(lang.name)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
        </div>
        <p className="card-description">{date}</p>
      </div>

      <div className="space-y-6">
        {displayContent.summary && (
          <div>
            <p className="text-base leading-relaxed">{displayContent.summary}</p>
          </div>
        )}

        {displayContent.highlights && displayContent.highlights.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">Highlights</h4>
            <ul className="space-y-1">
              {displayContent.highlights.map((highlight, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2 mt-0.5">✨</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {displayContent.problems && displayContent.problems.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">Challenges</h4>
            <ul className="space-y-1">
              {displayContent.problems.map((problem, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2 mt-0.5">⚠️</span>
                  <span>{problem}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {displayContent.conclusion && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">Conclusion</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displayContent.conclusion}
            </p>
          </div>
        )}

        {displayContent.suggestions && displayContent.suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">
              Suggestions for Tomorrow
            </h4>
            <ul className="space-y-1">
              {displayContent.suggestions.map((suggestion, idx) => (
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
