'use client'
import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { PACKING_CATEGORIES, type PackingCategory } from '@/lib/packing-data'

interface CategoryTabsProps {
  active: PackingCategory | 'all'
  onChange: (c: PackingCategory | 'all') => void
}

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  const t = useTranslations('packingPage')
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    tabRefs.current[active]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active])

  const tabs: { id: PackingCategory | 'all'; label: string }[] = [
    { id: 'all', label: t('tabs.all') },
    ...PACKING_CATEGORIES.map(c => ({ id: c.id, label: t(c.labelKey as 'tabs.film' | 'tabs.boxes' | 'tabs.protection' | 'tabs.tools') })),
  ]

  return (
    <div
      className="sticky top-16 z-40 border-b overflow-x-auto"
      style={{ borderColor: 'var(--color-border)', background: 'var(--bg-surface)' }}
    >
      <div className="flex min-w-max px-4 sm:px-6" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              ref={el => { tabRefs.current[tab.id] = el }}
              onClick={() => onChange(tab.id)}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
              style={{
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderBottomColor: isActive ? 'var(--color-primary)' : 'transparent',
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
