'use client'
import { useTranslations } from 'next-intl'
import { MapPin, Building2 } from 'lucide-react'
import type { Suggestion } from './useAddressSuggest'

interface SuggestionListProps {
  suggestions: Suggestion[]
  loading: boolean
  onSelect: (s: Suggestion) => void
}

const POI_TYPES = new Set(['poi', 'building', 'adm_div', 'branch'])

export function SuggestionList({ suggestions, loading, onSelect }: SuggestionListProps) {
  const t = useTranslations('booking')

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-10 rounded-xl animate-pulse"
            style={{ background: 'var(--bg-main)' }}
          />
        ))}
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-24 text-sm"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {t('addressNotFound')}
      </div>
    )
  }

  return (
    <ul className="flex flex-col overflow-y-auto" style={{ maxHeight: 260 }}>
      {suggestions.map((s, i) => {
        const isPoi = POI_TYPES.has(s.type)
        return (
          <li key={i}>
            <button
              onMouseDown={e => e.preventDefault()}
              onClick={() => onSelect(s)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer"
              style={{ borderBottom: '1px solid var(--color-border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-main)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                className="flex-shrink-0"
                style={{ color: 'var(--color-primary)' }}
              >
                {isPoi ? <Building2 size={15} /> : <MapPin size={15} />}
              </span>
              <div className="min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--color-text)' }}
                >
                  {s.name}
                </p>
                {s.fullName !== s.name && (
                  <p
                    className="text-xs truncate"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {s.fullName}
                  </p>
                )}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
