'use client'
import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MapPin, Truck, Users, Settings2, Clock, Wallet,
  ArrowLeftRight, Loader2, CheckCircle,
} from 'lucide-react'
import { AddressDrawer } from './booking/AddressDrawer'
import { VehicleDrawer } from './booking/VehicleDrawer'
import { OptionsDrawer } from './booking/OptionsDrawer'
import { DateTimeDrawer } from './booking/DateTimeDrawer'
import { PaymentSheet } from './booking/PaymentSheet'
import {
  BookingState, DEFAULT_BOOKING_STATE, VEHICLES,
  ActiveDrawer, BookingOptions,
} from './booking/types'
import { calcBookingPrice } from '@/lib/booking-price'
import { formatPrice } from '@/lib/utils'
import { KZ_PHONE_RE } from '@/lib/validators'

export function BookingForm() {
  const t = useTranslations('booking')
  const [state, setState] = useState<BookingState>({ ...DEFAULT_BOOKING_STATE })
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>(null)
  const [phoneError, setPhoneError] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)

  const vehicle = VEHICLES.find(v => v.id === state.vehicleId) ?? VEHICLES[0]
  const totalPrice = calcBookingPrice({
    vehicleBasePrice: vehicle.basePrice,
    workers: state.workers,
    options: state.options,
  })

  const update = <K extends keyof BookingState>(key: K, value: BookingState[K]) =>
    setState(s => ({ ...s, [key]: value }))

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value
    if (!v.startsWith('+7')) {
      if (v.startsWith('8'))        v = '+7' + v.slice(1)
      else if (v.startsWith('77'))  v = '+' + v
      else                          v = '+7' + v
    }
    if (v.length < 2) v = '+7'
    update('phone', v)
    if (phoneError) setPhoneError(false)
  }

  async function handleSubmit() {
    const invalid = !KZ_PHONE_RE.test(state.phone)
    if (invalid) { setPhoneError(true); return }
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setSubmitError(false)

    const activeOpts = Object.entries(state.options)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(', ')

    const timeStr = state.isAsap
      ? 'Ближайшее'
      : `${state.scheduledDate} ${String(state.scheduledHour).padStart(2, '0')}:${String(state.scheduledMinute ?? 0).padStart(2, '0')}`

    const messageParts = [
      state.addressFrom ? `Откуда: ${state.addressFrom}` : '',
      state.addressTo ? `Куда: ${state.addressTo}` : '',
      `Машина: ${vehicle.label}`,
      state.workers > 0 ? `Грузчики: ${state.workers}` : '',
      activeOpts ? `Опции: ${activeOpts}` : '',
      state.comment ? `Комментарий: ${state.comment}` : '',
      `Время: ${timeStr}`,
      `Оплата: ${state.payment === 'cash' ? 'наличные' : 'карта'}`,
      `Сумма: ${formatPrice(totalPrice)}`,
    ].filter(Boolean).join('\n')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Заявка с формы бронирования',
          phone: state.phone,
          service: 'booking',
          message: messageParts,
        }),
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

  const rowStyle = {
    background: 'var(--bg-main)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.875rem',
    padding: '0.875rem 1rem',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
    width: '100%',
    textAlign: 'left' as const,
  }

  const activeOptions = Object.values(state.options).filter(Boolean).length

  if (submitted) {
    return (
      <div
        className="p-8 rounded-2xl text-center"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 60px var(--shadow-main)',
        }}
      >
        <CheckCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
        <p className="font-heading font-bold text-lg" style={{ color: 'var(--color-text)' }}>
          {t('success')}
        </p>
      </div>
    )
  }

  return (
    <div
      className="relative p-5 rounded-2xl"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 20px 60px var(--shadow-main)',
      }}
    >
      <h3 className="font-heading text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
        {t('formTitle')}
      </h3>

      <div className="space-y-3">

        {/* ── Address row ── */}
        <div className="flex gap-2">
          <button
            style={{ ...rowStyle, flex: 1 }}
            onClick={() => setActiveDrawer('address')}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {t('addressFrom')}
            </p>
            <div className="flex items-center gap-2">
              <MapPin size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span
                className="text-sm font-medium truncate"
                style={{ color: state.addressFrom ? 'var(--color-text)' : 'var(--color-text-muted)' }}
              >
                {state.addressFrom || t('addressPlaceholderFrom')}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveDrawer('address')}
            className="w-9 flex items-center justify-center rounded-xl cursor-pointer flex-shrink-0 transition-colors"
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--color-border)',
              minHeight: 60,
            }}
            aria-label="Open address editor"
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            <ArrowLeftRight size={13} style={{ color: 'var(--color-text-muted)' }} />
          </button>

          <button
            style={{ ...rowStyle, flex: 1 }}
            onClick={() => setActiveDrawer('address')}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {t('addressTo')}
            </p>
            <div className="flex items-center gap-2">
              <MapPin size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <span
                className="text-sm font-medium truncate"
                style={{ color: state.addressTo ? 'var(--color-text)' : 'var(--color-text-muted)' }}
              >
                {state.addressTo || t('addressPlaceholderTo')}
              </span>
            </div>
          </button>
        </div>

        {/* ── Vehicle row ── */}
        <button
          style={rowStyle}
          onClick={() => setActiveDrawer('vehicle')}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
        >
          <div className="flex items-center gap-3">
            <Truck size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{vehicle.label}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {vehicle.capacity}{t('tonnes')} · {vehicle.volume}{t('volume')}
              </p>
            </div>
            <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--color-primary)' }}>
              {formatPrice(vehicle.basePrice)}
            </span>
          </div>
        </button>

        {/* ── Workers row (inline) ── */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: 'var(--bg-main)', border: '1px solid var(--color-border)', borderRadius: '0.875rem' }}
        >
          <Users size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text)' }}>{t('workersLabel')}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('workersHint')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => update('workers', Math.max(0, state.workers - 1))}
              disabled={state.workers === 0}
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer border font-bold text-lg leading-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--bg-surface)' }}
              aria-label="Decrease movers"
            >
              −
            </button>
            <span className="font-heading font-bold text-base w-5 text-center" style={{ color: 'var(--color-text)' }}>
              {state.workers}
            </span>
            <button
              onClick={() => update('workers', Math.min(8, state.workers + 1))}
              disabled={state.workers === 8}
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer font-bold text-lg leading-none transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
              aria-label="Increase movers"
            >
              +
            </button>
          </div>
        </div>

        {/* ── Options + DateTime row ── */}
        <div className="grid grid-cols-2 gap-2">
          <button
            style={rowStyle}
            onClick={() => setActiveDrawer('options')}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Settings2 size={13} style={{ color: 'var(--color-text-muted)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{t('optionsTitle')}</span>
            </div>
            <p className="text-[10px]" style={{ color: activeOptions > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
              {activeOptions > 0 ? `${activeOptions} выбрано` : '—'}
            </p>
          </button>

          <button
            style={rowStyle}
            onClick={() => setActiveDrawer('datetime')}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Clock size={13} style={{ color: 'var(--color-text-muted)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{t('dateTimeTitle')}</span>
            </div>
            <p className="text-[10px] truncate" style={{ color: 'var(--color-primary)' }}>
              {state.isAsap
                ? t('asap')
                : state.scheduledDate
                  ? `${state.scheduledDate} ${String(state.scheduledHour ?? 0).padStart(2, '0')}:${String(state.scheduledMinute ?? 0).padStart(2, '0')}`
                  : t('schedule')}
            </p>
          </button>
        </div>

        {/* ── Phone input ── */}
        <div>
          <label className="sr-only" htmlFor="bf-phone">{t('phoneLabel')}</label>
          <input
            id="bf-phone"
            type="tel"
            value={state.phone}
            onChange={handlePhoneChange}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => {
              setPhoneFocused(false)
              if (state.phone !== '+7') setPhoneError(!KZ_PHONE_RE.test(state.phone))
            }}
            aria-invalid={phoneError}
            aria-describedby={phoneError ? 'bf-phone-error' : undefined}
            className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all"
            style={{
              background: 'var(--bg-main)',
              border: `1px solid ${phoneFocused ? 'var(--color-primary)' : phoneError ? '#ef4444' : 'var(--color-border)'}`,
              color: 'var(--color-text)',
              boxShadow: phoneFocused ? '0 0 0 2px rgba(14,165,233,0.2)' : 'none',
            }}
          />
          {phoneError && (
            <p id="bf-phone-error" className="text-xs mt-1" style={{ color: '#ef4444' }}>
              {t('phoneInvalid')}
            </p>
          )}
        </div>

        {/* ── Submit + error ── */}
        {submitError && (
          <p className="text-xs text-center" style={{ color: '#ef4444' }}>{t('error')}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
            style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 20px rgba(14,165,233,0.35)' }}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {t('submitBtn')} {formatPrice(totalPrice)}
          </button>

          <button
            onClick={() => setActiveDrawer('payment')}
            className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0 transition-all"
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
            aria-label={t('paymentTitle')}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            <Wallet size={17} />
          </button>
        </div>

        <p className="text-[10px] text-center" style={{ color: 'var(--color-text-muted)' }}>
          {state.payment === 'cash' ? t('paymentCash') : t('paymentCard')}
        </p>
      </div>

      {/* ── Overlay drawers (absolute — overlay the card) ── */}
      <VehicleDrawer
        open={activeDrawer === 'vehicle'}
        selectedId={state.vehicleId}
        onConfirm={id => { update('vehicleId', id); setActiveDrawer(null) }}
        onClose={() => setActiveDrawer(null)}
      />
      <OptionsDrawer
        open={activeDrawer === 'options'}
        workers={state.workers}
        options={state.options}
        comment={state.comment}
        onConfirm={(workers, opts, comment) => {
          setState(s => ({ ...s, workers, options: opts, comment }))
          setActiveDrawer(null)
        }}
        onClose={() => setActiveDrawer(null)}
      />
      <DateTimeDrawer
        open={activeDrawer === 'datetime'}
        isAsap={state.isAsap}
        scheduledDate={state.scheduledDate}
        scheduledHour={state.scheduledHour}
        scheduledMinute={state.scheduledMinute}
        onConfirm={(isAsap, date, hour, minute) => {
          setState(s => ({ ...s, isAsap, scheduledDate: date, scheduledHour: hour, scheduledMinute: minute }))
          setActiveDrawer(null)
        }}
        onClose={() => setActiveDrawer(null)}
      />

      {/* ── Fixed overlays (escape the card's stacking context) ── */}
      <AddressDrawer
        open={activeDrawer === 'address'}
        addressFrom={state.addressFrom}
        addressTo={state.addressTo}
        onConfirm={(from, to) => {
          setState(s => ({ ...s, addressFrom: from, addressTo: to }))
          setActiveDrawer(null)
        }}
        onClose={() => setActiveDrawer(null)}
      />
      <PaymentSheet
        open={activeDrawer === 'payment'}
        value={state.payment}
        onChange={v => update('payment', v)}
        onClose={() => setActiveDrawer(null)}
      />
    </div>
  )
}
