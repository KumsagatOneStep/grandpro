'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { X, MapPin, Plus, ArrowRight } from 'lucide-react'
import { BookingMap } from './BookingMap'
import { SuggestionList } from './SuggestionList'
import { useAddressSuggest } from './useAddressSuggest'
import type { Suggestion } from './useAddressSuggest'
import type { MapPoint } from './BookingMap'

interface AddressDrawerProps {
  open: boolean
  addressFrom: string
  addressTo: string
  onConfirm: (from: string, to: string) => void
  onClose: () => void
}

type ActiveField = 'from' | 'to' | null

export function AddressDrawer({ open, addressFrom, addressTo, onConfirm, onClose }: AddressDrawerProps) {
  const t = useTranslations('booking')
  const [from, setFrom] = useState(addressFrom)
  const [to, setTo] = useState(addressTo)
  const [activeField, setActiveField] = useState<ActiveField>(null)
  const [fromPoint, setFromPoint] = useState<MapPoint | undefined>()
  const [toPoint, setToPoint] = useState<MapPoint | undefined>()
  const toInputRef = useRef<HTMLInputElement>(null)

  const fromQuery = activeField === 'from' ? from : ''
  const toQuery = activeField === 'to' ? to : ''

  const { suggestions: fromSuggestions, loading: fromLoading } = useAddressSuggest(fromQuery)
  const { suggestions: toSuggestions, loading: toLoading } = useAddressSuggest(toQuery)

  const showFrom = activeField === 'from' && (fromLoading || fromSuggestions.length > 0 || from.trim().length >= 2)
  const showTo = activeField === 'to' && (toLoading || toSuggestions.length > 0 || to.trim().length >= 2)

  const handleSelect = (s: Suggestion) => {
    if (activeField === 'from') {
      setFrom(s.fullName)
      if (s.lat && s.lon) setFromPoint({ lat: s.lat, lon: s.lon })
      setActiveField('to')
      setTimeout(() => toInputRef.current?.focus(), 50)
    } else {
      setTo(s.fullName)
      if (s.lat && s.lon) setToPoint({ lat: s.lat, lon: s.lon })
      setActiveField(null)
    }
  }

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

  const dropdownStyle = {
    top: '100%',
    background: 'var(--bg-surface)',
    border: '1px solid var(--color-border)',
    borderTop: 'none',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
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
          {/* Left / main panel */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative flex flex-col w-full md:max-w-[480px]"
            style={{ background: 'var(--bg-surface)', boxShadow: '4px 0 40px rgba(0,0,0,0.3)', overflowY: 'auto' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
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

            {/* Inputs */}
            <div className="px-6 py-5 space-y-4 flex-shrink-0">
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
                    autoComplete="off"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    onFocus={() => setActiveField('from')}
                    onBlur={() => setTimeout(() => setActiveField(f => f === 'from' ? null : f), 150)}
                    placeholder={t('addressPlaceholderFrom')}
                    style={{
                      ...inputStyle,
                      borderColor: activeField === 'from' ? 'var(--color-primary)' : 'var(--color-border)',
                      borderBottomLeftRadius: showFrom ? 0 : '0.75rem',
                      borderBottomRightRadius: showFrom ? 0 : '0.75rem',
                    }}
                  />
                  {showFrom && (
                    <div className="absolute left-0 right-0 z-50 rounded-b-xl overflow-hidden" style={dropdownStyle}>
                      <SuggestionList
                        suggestions={fromSuggestions}
                        loading={fromLoading}
                        onSelect={handleSelect}
                      />
                    </div>
                  )}
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
                    ref={toInputRef}
                    type="text"
                    autoComplete="off"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    onFocus={() => setActiveField('to')}
                    onBlur={() => setTimeout(() => setActiveField(f => f === 'to' ? null : f), 150)}
                    placeholder={t('addressPlaceholderTo')}
                    style={{
                      ...inputStyle,
                      borderColor: activeField === 'to' ? 'var(--color-primary)' : 'var(--color-border)',
                      borderBottomLeftRadius: showTo ? 0 : '0.75rem',
                      borderBottomRightRadius: showTo ? 0 : '0.75rem',
                    }}
                  />
                  {showTo && (
                    <div className="absolute left-0 right-0 z-50 rounded-b-xl overflow-hidden" style={dropdownStyle}>
                      <SuggestionList
                        suggestions={toSuggestions}
                        loading={toLoading}
                        onSelect={handleSelect}
                      />
                    </div>
                  )}
                </div>
              </div>

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

            {/* Mobile: map below inputs */}
            <div
              className="md:hidden flex-1 relative overflow-hidden"
              style={{ minHeight: '40vh', zIndex: 0 }}
            >
              <BookingMap fromPoint={fromPoint} toPoint={toPoint} containerId="booking-route-map-mobile" />
            </div>

            {/* Action buttons */}
            <div
              className="px-6 py-4 flex gap-3 flex-shrink-0"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <button
                onClick={() => onConfirm(from, to)}
                className="flex-1 py-3 rounded-xl font-bold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 16px rgba(14,165,233,0.3)' }}
              >
                {t('confirm')}
                <ArrowRight size={16} />
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

          {/* Desktop: right panel — always map */}
          <div className="hidden md:flex flex-1 relative overflow-hidden" style={{ zIndex: 0 }}>
            <BookingMap fromPoint={fromPoint} toPoint={toPoint} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
