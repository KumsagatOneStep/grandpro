'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ChevronLeft, Minus, Plus } from 'lucide-react'
import { BookingOptions } from './types'
import { BOOKING_OPTION_PRICES } from '@/lib/booking-price'
import { formatPrice } from '@/lib/utils'

interface OptionsDrawerProps {
  open: boolean
  workers: number
  options: BookingOptions
  comment: string
  onConfirm: (workers: number, options: BookingOptions, comment: string) => void
  onClose: () => void
}

const OPTION_KEYS = ['lift', 'pack', 'assemble', 'truck'] as const

export function OptionsDrawer({ open, workers, options, comment, onConfirm, onClose }: OptionsDrawerProps) {
  const t = useTranslations('booking')
  const [localWorkers, setLocalWorkers] = useState(workers)
  const [localOptions, setLocalOptions] = useState<BookingOptions>({ ...options })
  const [localComment, setLocalComment] = useState(comment)

  const toggleOption = (key: keyof BookingOptions) =>
    setLocalOptions(o => ({ ...o, [key]: !o[key] }))

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="options-drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="absolute inset-0 z-10 flex flex-col rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: 'var(--bg-main)', color: 'var(--color-text-muted)' }}
              aria-label={t('back')}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-heading font-bold text-base" style={{ color: 'var(--color-text)' }}>
              {t('optionsTitle')}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-5 px-5 space-y-5">
            {/* Workers counter */}
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{t('workersLabel')}</p>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{t('workersHint')}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setLocalWorkers(w => Math.max(0, w - 1))}
                  disabled={localWorkers === 0}
                  className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors border disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                  aria-label="Decrease workers"
                >
                  <Minus size={16} />
                </button>
                <span className="font-heading text-2xl font-bold w-8 text-center" style={{ color: 'var(--color-text)' }}>
                  {localWorkers}
                </span>
                <button
                  onClick={() => setLocalWorkers(w => Math.min(8, w + 1))}
                  disabled={localWorkers === 8}
                  className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}
                  aria-label="Increase workers"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Option toggles */}
            <div className="space-y-2">
              {OPTION_KEYS.map(key => {
                const active = localOptions[key]
                const price = BOOKING_OPTION_PRICES[key]
                const labelMap: Record<typeof key, string> = {
                  lift: t('optLift'),
                  pack: t('optPack'),
                  assemble: t('optAssemble'),
                  truck: t('optTruck'),
                }
                return (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-colors"
                    style={{
                      background: 'var(--bg-main)',
                      border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{labelMap[key]}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-primary)' }}>+{formatPrice(price)}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleOption(key)}
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                  </label>
                )
              })}
            </div>

            {/* Comment */}
            <textarea
              value={localComment}
              onChange={e => setLocalComment(e.target.value)}
              placeholder={t('optComment')}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none transition-colors"
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
            />
          </div>

          {/* Confirm */}
          <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={() => onConfirm(localWorkers, localOptions, localComment)}
              className="w-full py-3.5 rounded-xl font-bold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 16px rgba(14,165,233,0.3)' }}
            >
              {t('confirm')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
