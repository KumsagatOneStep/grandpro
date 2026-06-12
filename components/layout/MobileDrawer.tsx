'use client'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { key: 'services', href: '#services' },
  { key: 'calculator', href: '#calculator' },
  { key: 'about', href: '#about' },
  { key: 'reviews', href: '#reviews' },
  { key: 'contacts', href: '#contact' },
] as const

const LOCALES = [
  { code: 'ru', short: 'RU' },
  { code: 'kz', short: 'KZ' },
  { code: 'en', short: 'EN' },
] as const

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
    onClose()
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[-1]"
            onClick={onClose}
            style={{ background: 'rgba(0,0,0,0.35)' }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="lg:hidden fixed top-0 right-0 h-screen w-72 z-[1001] pt-20 px-6"
            style={{
              background: 'var(--bg-surface)',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.25)',
            }}
          >
            <nav className="flex flex-col gap-5">
              {NAV_ITEMS.map((item, i) => (
                <motion.a
                  key={item.key}
                  href={item.href}
                  onClick={onClose}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.055 + 0.08 }}
                  className="text-lg font-semibold transition-colors cursor-pointer"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-primary)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)')}
                >
                  {t(item.key)}
                </motion.a>
              ))}

              <div className="flex gap-2 pt-2">
                {LOCALES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => switchLocale(lang.code)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200"
                    style={{
                      background: locale === lang.code ? 'var(--gradient-primary)' : 'var(--bg-surface-elevated)',
                      color: locale === lang.code ? 'white' : 'var(--color-text-muted)',
                      border: `1.5px solid ${locale === lang.code ? 'transparent' : 'var(--color-border)'}`,
                    }}
                  >
                    {lang.short}
                  </button>
                ))}
              </div>

              <a
                href="tel:+77077097422"
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-center justify-center text-white mt-2 cursor-pointer"
                style={{ background: 'var(--color-primary)' }}
              >
                <Phone size={16} />
                +7 707 709-74-22
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
