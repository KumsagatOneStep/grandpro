'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Loader2, Trash2, ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KZ_PHONE_RE } from '@/lib/validators'
import type { useCart } from '@/hooks/useCart'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  cart: ReturnType<typeof useCart>
}

export function CartDrawer({ open, onClose, cart }: CartDrawerProps) {
  const t = useTranslations('packingPage')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+7')
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup')
  const [address, setAddress] = useState('')
  const [comment, setComment] = useState('')
  const [nameError, setNameError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const [addressError, setAddressError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const submittingRef = useRef(false)

  // Focus first input on open
  useEffect(() => {
    if (open) document.getElementById('cart-name')?.focus()
  }, [open])

  // Escape key to close (not during loading)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [loading, onClose])

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value
    if (!v.startsWith('+7')) {
      if (v === '+')               v = '+7'
      else if (v.startsWith('8'))  v = '+7' + v.slice(1)
      else if (v.startsWith('77')) v = '+' + v
      else                         v = '+7' + v
    }
    if (!v.startsWith('+7') || v.length < 2) v = '+7'
    setPhone(v)
    if (phoneError) setPhoneError(false)
  }

  async function handleSubmit() {
    const nameOk = name.trim().length > 0
    const phoneOk = KZ_PHONE_RE.test(phone)
    const addressOk = deliveryType === 'pickup' || address.trim().length > 0
    setNameError(!nameOk)
    setPhoneError(!phoneOk)
    setAddressError(!addressOk)
    if (!nameOk || !phoneOk || !addressOk) return
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setSubmitError(false)
    try {
      const res = await fetch('/api/packing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map(i => ({ id: i.product.id, qty: i.qty })),
          name,
          phone,
          deliveryType,
          address: deliveryType === 'delivery' ? address : undefined,
          comment,
        }),
      })
      if (res.ok) {
        setSubmitted(true)
        cart.clearCart()
      } else {
        setSubmitError(true)
      }
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
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1099] bg-black/60 backdrop-blur-sm"
            onClick={loading ? undefined : onClose}
          />

          {/* Panel */}
          <motion.div
            key="cart-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] z-[1100] flex flex-col"
            style={{
              background: 'var(--bg-surface)',
              borderLeft: '1px solid var(--color-border)',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-dialog-title"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <h2
                id="cart-dialog-title"
                className="font-heading font-bold text-lg"
                style={{ color: 'var(--color-text)' }}
              >
                {t('cart.title')}
              </h2>
              <button
                type="button"
                onClick={loading ? undefined : onClose}
                disabled={loading}
                aria-label={t('form.closeLabel')}
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
                style={{ background: 'var(--bg-surface-elevated)', color: 'var(--color-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            {submitted ? (
              /* Success state */
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                <CheckCircle size={56} style={{ color: '#059669' }} />
                <p className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
                  {t('form.success')}
                </p>
                <button
                  onClick={() => { setSubmitted(false); onClose() }}
                  className="mt-2 px-6 py-3 rounded-xl font-medium text-white"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {t('form.successCta')}
                </button>
              </div>
            ) : cart.items.length === 0 ? (
              /* Empty cart state */
              <div
                className="flex flex-col items-center justify-center h-full gap-4"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <ShoppingCart size={48} strokeWidth={1.2} />
                <p className="text-sm">{t('cart.empty')}</p>
              </div>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Scrollable items list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.items.map(item => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 py-2"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      {/* Product name */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium leading-snug truncate"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {item.product.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {(item.product.price * item.qty).toLocaleString('ru-RU')} ₸
                        </p>
                      </div>

                      {/* Qty controls */}
                      <div
                        className="flex items-center rounded-lg overflow-hidden border"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <button
                          type="button"
                          onClick={() => cart.updateQty(item.product.id, item.qty - 1)}
                          className="w-7 h-7 flex items-center justify-center text-base"
                          style={{ color: 'var(--color-text)' }}
                          aria-label="Уменьшить количество"
                        >
                          −
                        </button>
                        <span
                          className="w-7 text-center text-sm font-medium"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => cart.updateQty(item.product.id, item.qty + 1)}
                          className="w-7 h-7 flex items-center justify-center text-base"
                          style={{ color: 'var(--color-text)' }}
                          aria-label="Увеличить количество"
                        >
                          +
                        </button>
                      </div>

                      {/* Trash button */}
                      <button
                        type="button"
                        onClick={() => cart.removeItem(item.product.id)}
                        aria-label={t('cart.remove')}
                        className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Divider + total */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {t('cart.total')}
                  </span>
                  <span className="font-heading font-bold text-base" style={{ color: 'var(--color-primary)' }}>
                    {cart.total.toLocaleString('ru-RU')} ₸
                  </span>
                </div>

                {/* Checkout form */}
                <div
                  className="p-4 space-y-3 overflow-y-auto border-t"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-sm font-medium"
                      htmlFor="cart-name"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {t('form.name')} <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      id="cart-name"
                      type="text"
                      value={name}
                      onChange={e => { setName(e.target.value); if (nameError) setNameError(false) }}
                      placeholder={t('form.namePlaceholder')}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={inputStyle(nameError)}
                      onFocus={e => (e.currentTarget.style.borderColor = nameError ? '#DC2626' : 'var(--color-primary)')}
                      onBlur={e => (e.currentTarget.style.borderColor = nameError ? '#DC2626' : 'var(--color-border)')}
                    />
                    {nameError && (
                      <p className="text-xs" style={{ color: '#DC2626' }}>{t('form.nameRequired')}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-sm font-medium"
                      htmlFor="cart-phone"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {t('form.phone')} <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      id="cart-phone"
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      onBlur={() => { if (phone !== '+7') setPhoneError(!KZ_PHONE_RE.test(phone)) }}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={inputStyle(phoneError)}
                      onFocus={e => (e.currentTarget.style.borderColor = phoneError ? '#DC2626' : 'var(--color-primary)')}
                    />
                    {phoneError && (
                      <p className="text-xs" style={{ color: '#DC2626' }}>{t('form.phoneInvalid')}</p>
                    )}
                  </div>

                  {/* Delivery type toggle */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      {t('form.deliveryType')}
                    </p>
                    <div className="flex gap-2">
                      {(['pickup', 'delivery'] as const).map(type => {
                        const active = deliveryType === type
                        return (
                          <button
                            key={type}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setDeliveryType(type)}
                            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
                            style={{
                              background: active ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
                              color: active ? '#fff' : 'var(--color-text-muted)',
                              border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            }}
                          >
                            {type === 'pickup' ? t('form.pickup') : t('form.delivery')}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Address (only for delivery) */}
                  {deliveryType === 'delivery' && (
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-sm font-medium"
                        htmlFor="cart-address"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {t('form.address')} <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        id="cart-address"
                        type="text"
                        value={address}
                        onChange={e => { setAddress(e.target.value); if (addressError) setAddressError(false) }}
                        placeholder={t('form.addressPlaceholder')}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                        style={inputStyle(addressError)}
                        onFocus={e => (e.currentTarget.style.borderColor = addressError ? '#DC2626' : 'var(--color-primary)')}
                        onBlur={e => (e.currentTarget.style.borderColor = addressError ? '#DC2626' : 'var(--color-border)')}
                      />
                      {addressError && (
                        <p className="text-xs" style={{ color: '#DC2626' }}>{t('form.addressRequired')}</p>
                      )}
                    </div>
                  )}

                  {/* Comment */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-sm font-medium"
                      htmlFor="cart-comment"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {t('form.comment')}
                    </label>
                    <textarea
                      id="cart-comment"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder={t('form.commentPlaceholder')}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                      style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                    />
                  </div>

                  {submitError && (
                    <p className="text-xs text-center" style={{ color: '#DC2626' }}>{t('form.error')}</p>
                  )}

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? t('form.submitting') : t('form.submit')}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
