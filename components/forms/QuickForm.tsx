'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, CheckCircle, Home, Building2, Plane, Wrench } from 'lucide-react'

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // #1 fix: require service selection
    if (!service) {
      setServiceError(true)
      return
    }

    setLoading(true)
    setError(false)
    setServiceError(false)
    const form = e.currentTarget
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
        style={inputStyle}
        onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
        onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
      />

      {/* Service type — icon card radio group */}
      <div>
        {/* #4 fix: associate label + radiogroup role */}
        <p
          id="service-label"
          className="text-xs font-medium mb-2"
          style={{ color: serviceError ? '#ef4444' : 'var(--color-text-muted)' }}
        >
          {t('formService')}{serviceError && ' — выберите тип'}
        </p>
        <div
          role="radiogroup"
          aria-labelledby="service-label"
          aria-required="true"
          className="grid grid-cols-2 gap-2"
        >
          {SERVICE_OPTIONS.map(({ value, icon: Icon }) => {
            const active = service === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                // #2 fix: no toggle-off — radio buttons don't deselect
                onClick={() => { setService(value); setServiceError(false) }}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                style={{
                  // #5 fix: dark background on active for sufficient contrast
                  background: active ? 'var(--color-primary)' : 'var(--bg-main)',
                  border: active
                    ? `1.5px solid var(--color-primary)`
                    : serviceError
                      ? '1.5px solid #ef4444'
                      : '1.5px solid var(--color-border)',
                  // dark text on active (#0c4a6e) passes WCAG AA at 12px
                  color: active ? '#0c4a6e' : 'var(--color-text)',
                  boxShadow: active ? '0 4px 16px rgba(14,165,233,0.3)' : 'none',
                }}
              >
                <Icon size={20} strokeWidth={1.8} />
                {/* #3 fix: explicit key per value, no unsafe cast */}
                {t(SERVICE_LABELS[value])}
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{t('formError')}</p>
      )}

      {/* #6 fix: removed inline hover handlers, use CSS-only via Tailwind to avoid disabled state glitch */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center
          gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5
          disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
        style={{ background: 'var(--color-primary)' }}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {t('formSubmit')}
      </button>
    </form>
  )
}
