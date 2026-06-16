'use client'
import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { StorageFilters, BoxSize } from '@/lib/storage-data'
import { DEFAULT_FILTERS } from '@/lib/storage-data'

const SIZES: BoxSize[] = ['S', 'M', 'L', 'XL']
const SIZE_LABELS: Record<BoxSize, string> = { S: 'S (<5 m²)', M: 'M (5–9 m²)', L: 'L (10–19 m²)', XL: 'XL (20+ m²)' }
const FLOOR_OPTIONS = [1, 2, 3]

interface StorageFiltersProps {
  filters: StorageFilters
  onChange: (f: StorageFilters) => void
}

export function StorageFilters({ filters, onChange }: StorageFiltersProps) {
  const t = useTranslations('storagePage.filters')
  const priceOptions = [
    { label: t('priceAny'), max: 0 },
    { label: t('priceUpTo10000'), max: 10000 },
    { label: t('priceUpTo20000'), max: 20000 },
    { label: t('priceUpTo40000'), max: 40000 },
  ]
  const [open, setOpen] = useState(false)

  const toggleSize = (size: BoxSize) => {
    const next = filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size]
    onChange({ ...filters, sizes: next })
  }

  const isDefault =
    filters.sizes.length === 0 &&
    filters.priceMax === 0 &&
    filters.floor === null &&
    !filters.availableOnly

  const activeCount = filters.sizes.length +
    (filters.priceMax > 0 ? 1 : 0) +
    (filters.floor !== null ? 1 : 0) +
    (filters.availableOnly ? 1 : 0)

  const inner = (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex gap-1.5 flex-wrap">
        {SIZES.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => toggleSize(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer"
            style={{
              background: filters.sizes.includes(s) ? 'var(--color-primary)' : 'var(--bg-surface)',
              color: filters.sizes.includes(s) ? '#fff' : 'var(--color-text-muted)',
              border: `1.5px solid ${filters.sizes.includes(s) ? 'var(--color-primary)' : 'var(--color-border)'}`,
            }}
          >
            {SIZE_LABELS[s]}
          </button>
        ))}
      </div>

      <select
        value={filters.priceMax}
        onChange={e => onChange({ ...filters, priceMax: Number(e.target.value) })}
        className="px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
        style={{
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        {priceOptions.map(o => (
          <option key={o.max} value={o.max}>{o.label}</option>
        ))}
      </select>

      <select
        value={filters.floor ?? ''}
        onChange={e => onChange({ ...filters, floor: e.target.value ? Number(e.target.value) : null })}
        className="px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
        style={{
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        <option value="">{t('anyFloor')}</option>
        {FLOOR_OPTIONS.map(f => (
          <option key={f} value={f}>{t('floor')} {f}</option>
        ))}
      </select>

      <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => onChange({ ...filters, availableOnly: !filters.availableOnly })}>
        <button
          type="button"
          role="switch"
          aria-checked={filters.availableOnly}
          aria-label={t('availableOnly')}
          className="w-10 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0"
          style={{ background: filters.availableOnly ? 'var(--color-primary)' : 'var(--color-border)' }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
            style={{ left: filters.availableOnly ? '18px' : '2px' }}
          />
        </button>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('availableOnly')}</span>
      </div>

      {!isDefault && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-primary)' }}
        >
          <X size={12} /> {t('reset')}
        </button>
      )}
    </div>
  )

  return (
    <div>
      <button
        type="button"
        className="sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mb-3 cursor-pointer"
        style={{
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
        onClick={() => setOpen(o => !o)}
      >
        <SlidersHorizontal size={15} />
        {t('toggle')}
        {activeCount > 0 && (
          <span
            className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            {activeCount}
          </span>
        )}
      </button>

      <div className="hidden sm:block">{inner}</div>
      {open && <div className="sm:hidden pb-2">{inner}</div>}
    </div>
  )
}
