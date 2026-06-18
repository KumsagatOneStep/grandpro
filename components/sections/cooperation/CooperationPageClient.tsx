'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Phone, Mail, MessageCircle, Send, Music2, MapPin, CheckCircle2 } from 'lucide-react'

type TabId = 'b2b' | 'partner'

const CONTACTS = [
  { icon: Phone,         labelKey: 'phone',     value: '+7 707 709 74 22', href: 'tel:+77077097422' },
  { icon: Mail,          labelKey: 'email',     value: 'info@grandpro.kz', href: 'mailto:info@grandpro.kz' },
  { icon: MessageCircle, labelKey: 'whatsapp',  value: '+7 707 709 74 22', href: 'https://wa.me/77077097422' },
  { icon: Send,          labelKey: 'telegram',  value: '@grandpro_kz',     href: 'https://t.me/grandpro_kz' },
  { icon: ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1" fill={color} stroke="none"/>
      </svg>
    ), labelKey: 'instagram', value: '@grandpro_moving', href: 'https://instagram.com/grandpro_moving' },
  { icon: Music2,        labelKey: 'tiktok',    value: '@grandpro_moving', href: 'https://tiktok.com/@grandpro_moving' },
]

export function CooperationPageClient() {
  const t = useTranslations('cooperation')
  const [tab, setTab] = useState<TabId>('b2b')

  const raw = t.raw(`${tab}.bullets`)
  const bullets = Array.isArray(raw) ? (raw as string[]) : []

  return (
    <section className="pt-36 pb-20 px-4">
      <div className="max-w-3xl mx-auto">

        {/* ── Page header ── */}
        <div className="text-center mb-12">
          <h1
            className="font-heading text-4xl sm:text-5xl font-extrabold mb-4 leading-tight"
            style={{ color: 'var(--color-text)' }}
          >
            {t('title')}
          </h1>
          <p
            className="text-base sm:text-lg max-w-xl mx-auto"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('subtitle')}
          </p>
        </div>

        {/* ── Tabs ── */}
        <div
          className="flex p-1 rounded-2xl gap-1 mb-6"
          style={{ background: 'var(--bg-surface)' }}
        >
          {(['b2b', 'partner'] as TabId[]).map(id => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: tab === id ? 'var(--gradient-primary)' : 'transparent',
                color: tab === id ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              {t(`tabs.${id}`)}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 32px var(--shadow-main)',
          }}
        >
          <p className="text-base mb-5" style={{ color: 'var(--color-text-muted)' }}>
            {t(`${tab}.text`)}
          </p>
          <ul className="space-y-3">
            {bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2
                  size={16}
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: 'var(--color-primary)' }}
                />
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Contact cards title ── */}
        <h2
          className="font-heading text-xl font-bold mb-5"
          style={{ color: 'var(--color-text)' }}
        >
          {t('contacts.title')}
        </h2>

        {/* ── Contact grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {CONTACTS.map(({ icon: Icon, labelKey, value, href }) => (
            <a
              key={labelKey}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-3 p-4 rounded-2xl transition-colors duration-150"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 4px 16px var(--shadow-main)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <Icon size={16} color="#fff" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {t(`contacts.${labelKey}`)}
                </p>
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--color-text)' }}
                >
                  {value}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* ── Address ── */}
        <div className="flex items-center gap-2">
          <MapPin size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t('contacts.address')}
          </span>
        </div>

      </div>
    </section>
  )
}
