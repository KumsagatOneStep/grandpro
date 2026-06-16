'use client'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { StorageBox, StorageLocation, RentalDuration, PricingKey } from '@/lib/storage-data'
import { KZ_PHONE_RE } from '@/lib/validators'

interface BookingModalProps {
  box: StorageBox
  location: StorageLocation
  onClose: () => void
}

const DURATIONS: RentalDuration[] = [1, 3, 6, 12]

export function BookingModal({ box, location, onClose }: BookingModalProps) {
  const t = useTranslations('storagePage.booking')
  const tBox = useTranslations('storagePage.box')

  const [duration, setDuration] = useState<RentalDuration>(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+7')
  const [comment, setComment] = useState('')
  const [nameError, setNameError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const submittingRef = useRef(false)

  const priceKey = `m${duration}` as PricingKey
  const pricePerMonth = box.pricing[priceKey]

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value
    if (!v.startsWith('+7')) {
      if (v.startsWith('8'))       v = '+7' + v.slice(1)
      else if (v.startsWith('77')) v = '+' + v
      else                         v = '+7' + v
    }
    if (v.length < 2) v = '+7'
    setPhone(v)
    if (phoneError) setPhoneError(false)
  }

  async function handleSubmit() {
    const nameOk = name.trim().length > 0
    const phoneOk = KZ_PHONE_RE.test(phone)
    setNameError(!nameOk)
    setPhoneError(!phoneOk)
    if (!nameOk || !phoneOk) return
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setSubmitError(false)
    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId: box.id, locationId: location.id, duration, name, phone, comment }),
      })
      if (res.ok) setSubmitted(true)
      else setSubmitError(true)
    } catch {
      setSubmitError(true)
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    background: 'var(--bg-surface)',
    border: `1.5px solid ${hasError ? '#DC2626' : 'var(--color-border)'}`,
    color: 'var(--color-text)',
  })

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[1001] pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:pb-6 max-h-[90vh] overflow-y-auto"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 -20px 60px var(--shadow-main)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-heading font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                {t('title')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {box.number} · {location.name} · {box.area} m²
              </p>
            </div>
            <button
              type="button" onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{ background: 'var(--bg-surface-elevated)', color: 'var(--color-text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>

          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle size={48} className="mx-auto mb-3" style={{ color: '#059669' }} />
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{t('success')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Duration selector */}
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {t('duration')}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {DURATIONS.map(d => {
                    const active = d === duration
                    return (
                      <button
                        key={d} type="button"
                        onClick={() => setDuration(d)}
                        className="py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer"
                        style={{
                          background: active ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
                          color: active ? '#fff' : 'var(--color-text-muted)',
                          border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        }}
                      >
                        {tBox(`m${d}` as 'm1' | 'm3' | 'm6' | 'm12')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Total */}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'var(--active-badge)', border: '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {t('total')}
                </span>
                <span className="font-heading font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
                  {pricePerMonth.toLocaleString('ru-RU')} ₸ {t('totalPerMonth')}
                </span>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" htmlFor="booking-name" style={{ color: 'var(--color-text-muted)' }}>
                  {t('name')} <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  id="booking-name"
                  type="text" value={name}
                  onChange={e => { setName(e.target.value); if (nameError) setNameError(false) }}
                  placeholder={t('namePlaceholder')}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle(nameError)}
                  onFocus={e => (e.currentTarget.style.borderColor = nameError ? '#DC2626' : 'var(--color-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = nameError ? '#DC2626' : 'var(--color-border)')}
                />
                {nameError && <p className="text-xs" style={{ color: '#DC2626' }}>{t('nameRequired')}</p>}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" htmlFor="booking-phone" style={{ color: 'var(--color-text-muted)' }}>
                  {t('phone')} <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  id="booking-phone"
                  type="tel" value={phone}
                  onChange={handlePhoneChange}
                  onBlur={() => { if (phone !== '+7') setPhoneError(!KZ_PHONE_RE.test(phone)) }}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle(phoneError)}
                  onFocus={e => (e.currentTarget.style.borderColor = phoneError ? '#DC2626' : 'var(--color-primary)')}
                />
                {phoneError && <p className="text-xs" style={{ color: '#DC2626' }}>{t('phoneInvalid')}</p>}
              </div>

              {/* Comment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" htmlFor="booking-comment" style={{ color: 'var(--color-text-muted)' }}>
                  {t('comment')}
                </label>
                <textarea
                  id="booking-comment"
                  value={comment} onChange={e => setComment(e.target.value)}
                  placeholder={t('commentPlaceholder')} rows={2}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                  style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                />
              </div>

              {submitError && (
                <p className="text-xs text-center" style={{ color: '#DC2626' }}>{t('error')}</p>
              )}

              <button
                type="button" onClick={handleSubmit} disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'var(--gradient-primary)' }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? t('submitting') : t('submit')}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
