'use client'
import { motion } from 'framer-motion'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  className?: string
  align?: 'center' | 'left'
  animated?: boolean
}

export function SectionHeader({ title, subtitle, className, align = 'center', animated = true }: SectionHeaderProps) {
  return (
    <motion.div
      className={`mb-10 sm:mb-16 ${align === 'center' ? 'text-center' : ''} ${className ?? ''}`}
      initial={animated ? { opacity: 0, y: 32 } : false}
      whileInView={animated ? { opacity: 1, y: 0 } : undefined}
      viewport={animated ? { once: true, margin: '-60px' } : undefined}
      transition={animated ? { duration: 0.65, ease: [0.22, 1, 0.36, 1] } : undefined}
    >
      <h2
        className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4 inline-block relative"
        style={{ color: 'var(--color-text)' }}
      >
        {title}
        <motion.span
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 -bottom-3 block h-1 rounded-full"
          initial={animated ? { width: 0, opacity: 0 } : { width: '52px', opacity: 1 }}
          whileInView={animated ? { width: '52px', opacity: 1 } : undefined}
          viewport={animated ? { once: true, margin: '-60px' } : undefined}
          transition={animated ? { duration: 0.55, delay: 0.3, ease: [0.22, 1, 0.36, 1] } : undefined}
          style={{
            background:
              'linear-gradient(90deg, var(--color-primary), var(--color-accent, var(--color-primary-hover)))',
          }}
        />
      </h2>
      {subtitle && (
        <motion.p
          className={`text-sm sm:text-base lg:text-lg leading-relaxed mt-7 ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}
          style={{ color: 'var(--color-text-muted)' }}
          initial={animated ? { opacity: 0, y: 12 } : false}
          whileInView={animated ? { opacity: 1, y: 0 } : undefined}
          viewport={animated ? { once: true, margin: '-60px' } : undefined}
          transition={animated ? { duration: 0.5, delay: 0.18 } : undefined}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}
