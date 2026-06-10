'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Phone, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { MobileDrawer } from './MobileDrawer'

const NAV_ITEMS = [
  { key: 'services', href: '#services' },
  { key: 'calculator', href: '#calculator' },
  { key: 'about', href: '#about' },
  { key: 'reviews', href: '#reviews' },
  { key: 'contacts', href: '#contact' },
] as const

export function Header() {
  const t = useTranslations('nav')
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className="fixed z-50 transition-all duration-300"
      style={{ top: '16px', left: '16px', right: '16px' }}
    >
      <div
        className="max-w-[1280px] mx-auto rounded-2xl transition-all duration-300"
        style={{
          padding: scrolled ? '0.625rem 1.5rem' : '0.875rem 1.5rem',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          boxShadow: scrolled
            ? '0 8px 40px var(--shadow-main), 0 0 0 1px var(--glass-border)'
            : '0 4px 24px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex items-center justify-between">
          <a href="#" className="font-heading text-2xl font-extrabold tracking-tight">
            Grand<span style={{ color: 'var(--color-primary)' }}>Pro</span>
          </a>

          <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
            {NAV_ITEMS.map(item => (
              <a
                key={item.key}
                href={item.href}
                className="relative font-medium text-sm group cursor-pointer transition-colors duration-200"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                {t(item.key)}
                <span
                  className="absolute bottom-0 left-0 w-0 h-0.5 rounded-full transition-[width] duration-200 group-hover:w-full"
                  style={{ background: 'var(--color-primary)' }}
                />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />

            <motion.a
              href="tel:+77077097422"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white cursor-pointer"
              style={{ background: 'var(--color-primary)', transition: 'background 0.2s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--color-primary-hover)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'var(--color-primary)')}
            >
              <Phone size={14} />
              {t('callUs')}
            </motion.a>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center cursor-pointer"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={menuOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center"
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  )
}
