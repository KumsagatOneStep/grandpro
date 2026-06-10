'use client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function NotFound() {
  const t = useTranslations('notFound')

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--bg-main)', color: 'var(--color-text)' }}
    >
      <p
        className="font-heading font-extrabold leading-none mb-6 select-none"
        style={{ fontSize: 'clamp(6rem, 20vw, 12rem)', color: 'var(--color-primary)', opacity: 0.15 }}
        aria-hidden="true"
      >
        {t('code')}
      </p>

      <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4 -mt-16">
        {t('title')}
      </h1>

      <p className="text-lg max-w-md mb-10" style={{ color: 'var(--color-text-muted)' }}>
        {t('subtitle')}
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        style={{ background: 'var(--gradient-primary)' }}
      >
        {t('back')}
      </Link>
    </div>
  )
}
