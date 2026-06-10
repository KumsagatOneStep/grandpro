'use client'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const LOCALES = [
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'kz', label: 'Қазақша', short: 'KZ' },
  { code: 'en', label: 'English', short: 'EN' },
] as const

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('#lang-switcher')) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
    setOpen(false)
  }

  const current = LOCALES.find(l => l.code === locale)

  return (
    <div id="lang-switcher" className="relative hidden sm:block">
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-bold cursor-pointer"
        style={{
          background: open ? 'var(--active-badge)' : 'var(--bg-surface-elevated)',
          border: open ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
          color: 'var(--color-text)',
          boxShadow: open ? '0 0 0 3px rgba(14,165,233,0.13)' : 'none',
          transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        }}
        aria-label="Language selector"
        aria-expanded={open}
      >
        <Globe size={13} style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontSize: '12px', letterSpacing: '0.05em' }}>{current?.short}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="flex items-center"
        >
          <ChevronDown size={12} style={{ color: 'var(--color-text-muted)' }} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.94 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full mt-3 right-0 min-w-[168px] rounded-2xl overflow-hidden z-[200]"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 20px 56px var(--shadow-main), 0 0 0 1px var(--glass-border)',
            }}
          >
            {LOCALES.map((lang, i) => {
              const isActive = locale === lang.code
              return (
                <motion.button
                  key={lang.code}
                  onClick={() => switchLocale(lang.code)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.18 }}
                  whileHover={{ x: 3 }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm cursor-pointer"
                  style={{
                    background: isActive ? 'var(--active-badge)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-elevated)'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-extrabold shrink-0"
                    style={{
                      background: isActive ? 'var(--gradient-primary)' : 'var(--bg-surface-elevated)',
                      color: isActive ? 'white' : 'var(--color-text-muted)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {lang.short}
                  </span>
                  <span className="font-medium flex-grow text-left">{lang.label}</span>
                  {isActive && (
                    <motion.span
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      className="flex items-center"
                    >
                      <Check size={14} style={{ color: 'var(--color-primary)' }} />
                    </motion.span>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
