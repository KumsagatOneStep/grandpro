'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { X, MapPin, Plus } from 'lucide-react'
import { BookingMap } from './BookingMap'

interface AddressDrawerProps {
  open: boolean
  addressFrom: string
  addressTo: string
  onConfirm: (from: string, to: string) => void
  onClose: () => void
}

export function AddressDrawer({ open, addressFrom, addressTo, onConfirm, onClose }: AddressDrawerProps) {
  const t = useTranslations('booking')
  const [from, setFrom] = useState(addressFrom)
  const [to, setTo] = useState(addressTo)

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem 0.875rem 2.5rem',
    borderRadius: '0.75rem',
    background: 'var(--bg-main)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    outline: 'none',
    fontSize: '0.9375rem',
    transition: 'border-color 0.2s',
  } as React.CSSProperties

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="address-drawer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
          {/* Left panel */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative flex flex-col w-full max-w-[480px]"
            style={{
              background: 'var(--bg-surface)',
              boxShadow: '4px 0 40px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <span className="font-heading font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                {t('addressFrom')} / {t('addressTo')}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors"
                style={{ background: 'var(--bg-main)', color: 'var(--color-text-muted)' }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Address inputs */}
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              {/* From */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    1
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                    {t('addressFrom')}
                  </span>
                </div>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-primary)' }}
                  />
                  <input
                    type="text"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    placeholder={t('addressPlaceholderFrom')}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                  />
                </div>
              </div>

              {/* To */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: 'var(--color-text-muted)' }}
                  >
                    2
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                    {t('addressTo')}
                  </span>
                </div>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                  <input
                    type="text"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    placeholder={t('addressPlaceholderTo')}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                  />
                </div>
              </div>

              {/* Add stop hint */}
              <button
                className="flex items-center gap-2 text-sm cursor-pointer transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                <Plus size={16} />
                {t('addStop')}
              </button>
            </div>

            {/* Action buttons */}
            <div
              className="px-6 py-4 flex gap-3"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <button
                onClick={() => onConfirm(from, to)}
                className="flex-1 py-3 rounded-xl font-bold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 16px rgba(14,165,233,0.3)' }}
              >
                {t('confirm')}
              </button>
              <button
                onClick={onClose}
                className="px-5 py-3 rounded-xl font-semibold cursor-pointer transition-colors"
                style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                {t('clarify')}
              </button>
            </div>
          </motion.div>

          {/* Right: map — hidden on mobile */}
          <div className="hidden md:flex flex-1 relative overflow-hidden">
            <BookingMap />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
