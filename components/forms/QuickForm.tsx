'use client'
import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, CheckCircle, Home, Building2, Plane, Wrench } from 'lucide-react'

const KZ_PHONE_RE = /^(\+7|8)[\s-]?\(?7\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/

type ServiceValue = 'apartment' | 'office' | 'international' | 'rigging'

const SERVICE_OPTIONS: { value: ServiceValue; icon: React.ElementType }[] = [
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
  const [phoneError, setPhoneError] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)
  // double-submit guard
  const submittingRef = useRef(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const phoneVal = (form.elements.namedItem('phone') as HTMLInputElement).value
    if (!KZ_PHONE_RE.test(phoneVal)) { setPhoneError(true); return }
    if (!service) { setServiceError(true); return }
    if (submittingRef.current) return
    submittingRef.current = true

    setLoading(true)
    setError(false)
    setServiceError(false)
    setPhoneError(false)
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
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
      <input
        name="phone"
        type="tel"
        required
        placeholder={t('formPhone')}
        style={{
          ...inputStyle,
          borderColor: phoneFocused
            ? 'var(--color-primary)'
            : phoneError
              ? '#ef4444'
              : 'var(--color-border)',
        }}
        onFocus={() => setPhoneFocused(true)}
        onBlur={e => {
          setPhoneFocused(false)
          const v = e.target.value
          setPhoneError(!!v && !KZ_PHONE_RE.test(v))
        }}
        onChange={() => { if (phoneError) setPhoneError(false) }}
      />
      {phoneError && (
        <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{t('formPhoneInvalid')}</p>
      )}

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
