'use client'

import { useState, useRef, useEffect } from 'react'
import type { PeriodicReportContent, ReportType } from '@/types/database'
import { format } from 'date-fns'

interface ReportCardProps {
  reportType: ReportType
  startDate: string
  endDate: string
  content: PeriodicReportContent
}

export function ReportCard({ reportType, startDate, endDate, content }: ReportCardProps) {
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
        <div className="flex items-center justify-between">
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
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {displayContent.summary && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Overview</h4>
            <p className="text-base leading-relaxed">{displayContent.summary}</p>
          </div>
        )}

        {displayContent.patterns && displayContent.patterns.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Patterns</h4>
            <ul className="space-y-2">
              {displayContent.patterns.map((pattern, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2 mt-0.5">🔄</span>
                  <span>{pattern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {displayContent.trends && displayContent.trends.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Trends</h4>
            <ul className="space-y-2">
              {displayContent.trends.map((trend, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2 mt-0.5">📊</span>
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {displayContent.key_observations && displayContent.key_observations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Key Observations</h4>
            <ul className="space-y-2">
              {displayContent.key_observations.map((observation, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2 mt-0.5">🔍</span>
                  <span>{observation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {displayContent.conclusion && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Conclusion</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displayContent.conclusion}
            </p>
          </div>
        )}

        {displayContent.suggestions && displayContent.suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">
              Looking Forward
            </h4>
            <ul className="space-y-2">
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
