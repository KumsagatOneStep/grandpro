'use client'
import { useRef } from 'react'
import type { StorageLocation } from '@/lib/storage-data'

interface LocationTabsProps {
  locations: StorageLocation[]
  activeId: string
  onChange: (id: string) => void
}

export function LocationTabs({ locations, activeId, onChange }: LocationTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
    >
      {locations.map(loc => {
        const active = loc.id === activeId
        return (
          <button
            key={loc.id}
            type="button"
            onClick={() => onChange(loc.id)}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: active ? 'var(--color-primary)' : 'var(--bg-surface)',
              color: active ? '#fff' : 'var(--color-text-muted)',
              border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
            }}
          >
            {loc.name}
          </button>
        )
      })}
    </div>
  )
}
