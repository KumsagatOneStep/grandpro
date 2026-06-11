'use client'
import { useState, useRef, type ElementType } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, CheckCircle, Home, Building2, Plane, Wrench } from 'lucide-react'
import { KZ_PHONE_RE } from '@/lib/validators'

type ServiceValue = 'apartment' | 'office' | 'international' | 'rigging'

const SERVICE_OPTIONS: { value: ServiceValue; icon: ElementType }[] = [
  { value: 'apartment',     icon: Home },
  { value: 'office',        icon: Building2 },
  { value: 'international', icon: Plane },
  { value: 'rigging',       icon: Wrench },
]

const SERVICE_LABELS: Record<ServiceValue, 'formOptions.apartment' | 'formOptions.office' | 'formOptions.international' | 'formOptions.rigging'> = {
  apartment:     'formOptions.apartment',
  office:        'formOptions.office',
  international: 'formOptions.international',
  rigging:       'formOptions.rigging',
}

export function QuickForm() {
  const t = useTranslations('hero')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(false)
  const [service, setService] = useState<ServiceValue | ''>('')
  const [serviceError, setServiceError] = useState(false)
  const [phoneValue, setPhoneValue] = useState('+7')
  const [phoneError, setPhoneError] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)
  // double-submit guard
  const submittingRef = useRef(false)

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value
    if (!v.startsWith('+7')) {
      if (v.startsWith('8'))       v = '+7' + v.slice(1)  // 87071234567 → +77071234567
      else if (v.startsWith('77')) v = '+' + v            // 77071234567 → +77071234567
      else                         v = '+7' + v           // 7071234567 or bare digits
    }
    if (v.length < 2) v = '+7'
    setPhoneValue(v)
    if (phoneError) setPhoneError(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    // Validate all fields before early return so user sees all errors at once
    const phoneInvalid = !KZ_PHONE_RE.test(phoneValue)
    const serviceEmpty = !service
    if (phoneInvalid) setPhoneError(true)
    if (serviceEmpty) setServiceError(true)
    if (phoneInvalid || serviceEmpty) return
    if (submittingRef.current) return
    submittingRef.current = true

    setLoading(true)
    setError(false)
    setServiceError(false)
    setPhoneError(false)
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      phone: phoneValue,
      service,
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) setSent(true)
      else setError(true)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    background: 'var(--bg-main)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    transition: 'border-color 0.2s',
    outline: 'none',
  } as React.CSSProperties

  if (sent) {
    return (
      <div className="text-center py-8">
        <CheckCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
        <p className="font-semibold text-lg">{t('formSuccess')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="name"
        type="text"
        required
        placeholder={t('formName')}
        style={inputStyle}
        onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
        onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
      />

      <div>
        {/* sr-only label satisfies WCAG 1.3.1 without changing visual layout */}
        <label htmlFor="qf-phone" className="sr-only">{t('formPhone')}</label>
        <input
          id="qf-phone"
          name="phone"
          type="tel"
          required
          value={phoneValue}
          aria-invalid={phoneError}
          aria-describedby={phoneError ? 'qf-phone-error' : undefined}
          style={{
            ...inputStyle,
            borderColor: phoneFocused
              ? 'var(--color-primary)'
              : phoneError
                ? '#ef4444'
                : 'var(--color-border)',
          }}
          onFocus={() => setPhoneFocused(true)}
          onBlur={() => {
            setPhoneFocused(false)
            // Treat bare prefix as empty — show error only if user started typing
            if (phoneValue !== '+7') setPhoneError(!KZ_PHONE_RE.test(phoneValue))
          }}
          onChange={handlePhoneChange}
        />
        {phoneError && (
          <p id="qf-phone-error" className="text-xs mt-1" style={{ color: '#ef4444' }}>
            {t('formPhoneInvalid')}
          </p>
        )}
      </div>

      {/* Service type — icon card radio group */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend
          id="service-label"
          className="text-xs font-medium mb-2 w-full"
          style={{ color: serviceError ? '#ef4444' : 'var(--color-text-muted)' }}
        >
          {t('formService')}{serviceError && t('formServiceRequired')}
        </legend>
        {/* role="radiogroup" on fieldset is implicit; aria-required removed (invalid on radiogroup) */}
        <div role="radiogroup" aria-labelledby="service-label" className="grid grid-cols-2 gap-2">
          {SERVICE_OPTIONS.map(({ value, icon: Icon }) => {
            const active = service === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => { setService(value); setServiceError(false) }}
                // sticky-hover fix: translate only on hover-capable devices
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer [@media(hover:hover)]:hover:-translate-y-0.5"
                style={{
                  background: active ? 'var(--color-primary)' : 'var(--bg-main)',
                  border: active
                    ? '1.5px solid var(--color-primary)'
                    : serviceError
                      ? '1.5px solid #ef4444'
                      : '1.5px solid var(--color-border)',
                  color: active ? '#0c4a6e' : 'var(--color-text)',
                  boxShadow: active ? '0 4px 16px rgba(14,165,233,0.3)' : 'none',
                }}
              >
                <Icon size={20} strokeWidth={1.8} />
                {t(SERVICE_LABELS[value])}
              </button>
            )
          })}
        </div>
      </fieldset>

      {error && (
        <p className="text-red-500 text-sm">{t('formError')}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center
          gap-2 cursor-pointer transition-all duration-200 [@media(hover:hover)]:hover:-translate-y-0.5
          disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
        style={{ background: 'var(--color-primary)' }}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {t('formSubmit')}
      </button>
    </form>
  )
}
