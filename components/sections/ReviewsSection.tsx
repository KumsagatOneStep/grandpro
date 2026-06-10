'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'

type Review = { name: string; role: string; avatar: string; rating: number; text: string }

export function ReviewsSection() {
  const t = useTranslations('reviews')
  const [page, setPage] = useState(0)
  const perPage = 2

  const raw = t.raw('items')
  const reviews: Review[] = Array.isArray(raw)
    ? raw.filter((item): item is Review =>
        typeof item === 'object' && item !== null &&
        typeof (item as Record<string, unknown>).name === 'string' &&
        typeof (item as Record<string, unknown>).text === 'string'
      )
    : []

  const totalPages = Math.ceil(reviews.length / perPage)
  const visible = reviews.slice(page * perPage, page * perPage + perPage)

  return (
    <section id="reviews" className="py-16 md:py-28" style={{ background: 'var(--bg-surface)' }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {visible.map((r, i) => (
            <div
              key={i}
              className="rounded-2xl p-8 flex flex-col transition-all duration-300"
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--color-border)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-primary)'
                e.currentTarget.style.boxShadow = '0 12px 36px var(--shadow-main)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="flex gap-1 mb-5" aria-label={t('ratingLabel', { rating: r.rating })}>
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} size={16} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                ))}
              </div>
              <p className="leading-relaxed mb-6 flex-grow" style={{ color: 'var(--color-text)', fontSize: '0.95rem', lineHeight: 1.8, fontStyle: 'italic' }}>
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{
                    background: 'var(--gradient-primary)',
                    color: 'white',
                  }}
                >
                  {r.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{r.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setPage(p => (p - 1 + totalPages) % totalPages)}
            aria-label={t('prev')}
            className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer
              transition-all duration-200"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-primary)'
              e.currentTarget.style.color = 'white'
              e.currentTarget.style.borderColor = 'var(--color-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-surface)'
              e.currentTarget.style.color = 'var(--color-text)'
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="w-2 h-2 rounded-full transition-all cursor-pointer"
                style={{
                  background: i === page ? 'var(--color-primary)' : 'var(--color-border)',
                  transform: i === page ? 'scale(1.4)' : 'scale(1)',
                }}
                aria-label={t('pageLabel', { page: i + 1 })}
              />
            ))}
          </div>

          <button
            onClick={() => setPage(p => (p + 1) % totalPages)}
            aria-label={t('next')}
            className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer
              transition-all duration-200"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-primary)'
              e.currentTarget.style.color = 'white'
              e.currentTarget.style.borderColor = 'var(--color-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-surface)'
              e.currentTarget.style.color = 'var(--color-text)'
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  )
}
