'use client'
import { useTranslations } from 'next-intl'
import { MapPin } from 'lucide-react'
import type { StorageBox, RentalDuration, PricingKey } from '@/lib/storage-data'

interface BoxCardProps {
  box: StorageBox
  onBook: (box: StorageBox) => void
}

const DURATION_ROWS: { key: RentalDuration; tKey: 'm1' | 'm3' | 'm6' | 'm12' }[] = [
  { key: 1, tKey: 'm1' },
  { key: 3, tKey: 'm3' },
  { key: 6, tKey: 'm6' },
  { key: 12, tKey: 'm12' },
]

export function BoxCard({ box, onBook }: BoxCardProps) {
  const t = useTranslations('storagePage.box')

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 12px var(--shadow-main)',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 36px var(--shadow-main)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 12px var(--shadow-main)')}
    >
      {/* Photo */}
      <div className="relative w-full" style={{ paddingBottom: '75%' }}>
        <img
          src={box.photo}
          alt={box.number}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{
            background: box.available ? '#05966920' : '#DC262620',
            color: box.available ? '#059669' : '#DC2626',
            border: `1px solid ${box.available ? '#059669' : '#DC2626'}`,
          }}
        >
          {box.available ? t('available') : t('occupied')}
        </div>
        <div
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          {box.size}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <p className="font-heading font-bold text-base" style={{ color: 'var(--color-text)' }}>
            {box.number}
          </p>
          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
            <MapPin size={11} />
            {t('floor')} {box.floor} · {box.area} m²
          </p>
        </div>

        {/* Pricing table */}
        <div className="flex flex-col gap-1.5">
          {DURATION_ROWS.map(({ key, tKey }, i) => {
            const priceKey = `m${key}` as PricingKey
            const price = box.pricing[priceKey]
            const isBase = i === 0
            return (
              <div
                key={key}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                style={{
                  background: isBase ? 'var(--active-badge)' : 'transparent',
                  border: isBase ? '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)' : 'none',
                }}
              >
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {t(tKey)}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: isBase ? 'var(--color-primary)' : 'var(--color-text)' }}
                >
                  {price.toLocaleString('ru-RU')} ₸ {t('perMonth')}
                </span>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <button
          type="button"
          disabled={!box.available}
          onClick={() => onBook(box)}
          className="mt-auto w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--gradient-primary)', color: '#fff' }}
        >
          {t('book')} →
        </button>
      </div>
    </div>
  )
}
