'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { ChevronDown, X } from 'lucide-react'

export type AnimatedSelectOption = {
  id: string
  value: string
  label: string
  description?: string
  icon?: ReactNode
}

type AnimatedSelectProps = {
  label?: string
  required?: boolean
  error?: string
  data: AnimatedSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  headerLabel?: string
}

export function AnimatedSelect({
  label,
  required,
  error,
  data,
  value,
  onChange,
  placeholder = '— выберите',
  headerLabel,
}: AnimatedSelectProps) {
  const [open, setOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const selected = data.find(d => d.value === value)
  const borderColor = error ? '#DC2626' : 'var(--color-border)'

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {label}{required && <span style={{ color: '#DC2626' }}> *</span>}
        </label>
      )}

      <MotionConfig transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
        <div ref={ref} className="relative">
          <AnimatePresence mode="popLayout" initial={false}>
            {!open ? (
              <motion.button
                key="collapsed"
                type="button"
                layout
                layoutId="dropdown"
                animate={{ borderRadius: 12 }}
                onClick={() => setOpen(true)}
                aria-expanded={false}
                aria-haspopup="listbox"
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left overflow-hidden"
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: 12,
                }}
              >
                {selected ? (
                  <div className="flex items-center gap-3 min-w-0">
                    {selected.icon && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                      >
                        {selected.icon}
                      </div>
                    )}
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                      {selected.label}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {placeholder}
                  </span>
                )}
                <ChevronDown size={16} className="flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              </motion.button>
            ) : (
              <motion.div
                key="expanded"
                layout
                layoutId="dropdown"
                animate={{ borderRadius: 12 }}
                className="w-full overflow-hidden py-2"
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: `1.5px solid ${open ? 'var(--color-primary)' : borderColor}`,
                  borderRadius: 12,
                }}
              >
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {headerLabel ?? label ?? 'Выберите'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--bg-surface)', color: 'var(--color-text-muted)' }}
                  >
                    <X size={12} />
                  </button>
                </div>

                <div>
                  {data.map((item, i) => (
                    <motion.button
                      key={item.id}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { onChange(item.value); setOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{
                        background: item.value === value
                          ? 'var(--active-badge)'
                          : hoveredId === item.id
                            ? 'var(--bg-surface)'
                            : 'transparent',
                      }}
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {item.icon && (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                        >
                          {item.icon}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                            {item.description}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>

      {error && (
        <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>
      )}
    </div>
  )
}
