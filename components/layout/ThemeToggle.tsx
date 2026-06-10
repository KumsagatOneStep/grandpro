'use client'
import { useEffect, useState } from 'react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <motion.button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      whileHover={{ scale: 1.1, rotate: 8 }}
      whileTap={{ scale: 0.9, rotate: -8 }}
      className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
      style={{
        background: 'var(--bg-surface-elevated)',
        border: '1.5px solid var(--color-border)',
        color: 'var(--color-text)',
      }}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait">
        {mounted ? (
          <motion.span
            key={theme ?? 'init'}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </motion.span>
        ) : (
          <span className="w-4 h-4 block" />
        )}
      </AnimatePresence>
    </motion.button>
  )
}
