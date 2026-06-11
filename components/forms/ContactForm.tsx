'use client'
import { useState, useRef, useEffect, useCallback, type ElementType } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, CheckCircle, ChevronDown, Home, Building2, Plane, Wrench, Package, Warehouse, Check } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

type ServiceValue = 'apartment' | 'office' | 'international' | 'rigging' | 'packing' | 'storage'

const SERVICE_ICONS: Record<ServiceValue, ElementType> = {
  apartment:     Home,
  office:        Building2,
  international: Plane,
  rigging:       Wrench,
  packing:       Package,
  storage:       Warehouse,
}

const SERVICE_VALUES: ServiceValue[] = ['apartment', 'office', 'international', 'rigging', 'packing', 'storage']

type CloseReason = 'escape' | 'select' | 'outside' | 'toggle' | 'tab'

function ServiceDropdown({
  id,
  value,
  options,
  onChange,
  placeholder,
  hasError,
}: {
  id: string
  value: ServiceValue | ''
  options: { value: ServiceValue; label: string }[]
  onChange: (v: ServiceValue) => void
  placeholder: string
  hasError: boolean
}) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const mountedRef = useRef(false)
  const closeReasonRef = useRef<CloseReason>('outside')

  const selected = options.find(o => o.value === value)
  const selectedIndex = options.findIndex(o => o.value === value)
  const SelectedIcon = value ? SERVICE_ICONS[value] : null

  const close = useCallback((reason: CloseReason) => {
    closeReasonRef.current = reason
    setOpen(false)
  }, [])

  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close('outside')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [close])

  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    if (!open && closeReasonRef.current !== 'tab') {
      setFocusedIndex(-1)
      triggerRef.current?.focus()
    }
  }, [open])

  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0)
    } else if (e.key === 'Escape') {
      close('escape')
    }
  }, [close, selectedIndex])

  const handleListKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(i => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (focusedIndex === 0) close('escape')
      else setFocusedIndex(i => i - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (focusedIndex >= 0) { onChange(options[focusedIndex].value); close('select') }
    } else if (e.key === 'Escape') {
      close('escape')
    } else if (e.key === 'Tab') {
      close('tab')
    }
  }, [focusedIndex, onChange, close, options])

  useEffect(() => {
    if (open && focusedIndex >= 0) {
      const items = listRef.current?.querySelectorAll('[role=option]')
      ;(items?.[focusedIndex] as HTMLElement)?.focus()
    }
  }, [open, focusedIndex])

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={open && focusedIndex >= 0 ? `${id}-option-${focusedIndex}` : undefined}
        onClick={() => {
          if (open) {
            close('toggle')
          } else {
            setOpen(true)
            setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0)
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 cursor-pointer"
        style={{
          background: 'var(--bg-main)',
          border: `1px solid ${hasError ? '#ef4444' : open ? 'var(--color-primary)' : 'var(--color-border)'}`,
          color: selected ? 'var(--color-text)' : 'var(--color-text-muted)',
          outline: 'none',
          // color-mix() removed — safe rgba fallback for all browsers
          boxShadow: open ? '0 0 0 2px rgba(14,165,233,0.3)' : 'none',
        }}
      >
        {selected && SelectedIcon ? (
          <>
            <SelectedIcon size={16} strokeWidth={1.8} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span className="flex-1 text-left font-medium">{selected.label}</span>
          </>
        ) : (
          <span className="flex-1 text-left">{placeholder}</span>
        )}
        <ChevronDown
          size={16}
          strokeWidth={2}
          style={{
            color: 'var(--color-text-muted)',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            aria-label={placeholder}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onKeyDown={handleListKeyDown}
            onMouseLeave={() => setFocusedIndex(-1)}
            className="absolute z-50 w-full mt-1.5 rounded-xl"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 16px 48px var(--shadow-main)',
            }}
          >
            {options.map(({ value: v, label }, idx) => {
              const active = value === v
              const focused = focusedIndex === idx
              const Icon = SERVICE_ICONS[v]
              return (
                <li
                  key={v}
                  id={`${id}-option-${idx}`}
                  role="option"
                  aria-selected={active}
                  tabIndex={-1}
                  onClick={() => { onChange(v); close('select') }}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl outline-none"
                  style={{
                    // color-mix() removed — safe rgba fallback
                    background: active
                      ? 'rgba(14,165,233,0.12)'
                      : focused
                        ? 'var(--bg-surface-elevated)'
                        : 'transparent',
                    color: active ? 'var(--color-primary)' : 'var(--color-text)',
                  }}
                >
                  <Icon size={16} strokeWidth={1.8} style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)', flexShrink: 0 }} />
                  <span className="flex-1 font-medium">{label}</span>
                  {active && <Check size={14} strokeWidth={2.5} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ContactForm() {
  const t = useTranslations('contact.form')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [service, setService] = useState<ServiceValue | ''>('')
  const [serviceError, setServiceError] = useState(false)
  // double-submit guard
  const submittingRef = useRef(false)

  // build translated options inside component so t() is in scope
  const serviceOptions = SERVICE_VALUES.map(v => ({
    value: v,
    label: t(`serviceOptions.${v}` as Parameters<typeof t>[0]),
  }))

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!service) { setServiceError(true); return }
    if (submittingRef.current) return
    submittingRef.current = true

    setLoading(true)
    setStatus('idle')
    setServiceError(false)
    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      service,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setService('')
        form.reset()
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const fieldStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    background: 'var(--bg-main)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    outline: 'none',
    transition: 'border-color 0.2s',
  } as React.CSSProperties

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--color-primary)'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--color-border)'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="cf-name" style={{ color: 'var(--color-text)' }}>
            {t('name')}
          </label>
          <input id="cf-name" name="name" type="text" required style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="cf-phone" style={{ color: 'var(--color-text)' }}>
            {t('phone')}
          </label>
          <input id="cf-phone" name="phone" type="tel" required style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
        </div>
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          htmlFor="cf-service"
          style={{ color: serviceError ? '#ef4444' : 'var(--color-text)' }}
        >
          {t('service')}{serviceError && t('serviceRequired')}
        </label>
        <ServiceDropdown
          id="cf-service"
          value={service}
          options={serviceOptions}
          onChange={v => { setService(v); setServiceError(false) }}
          placeholder={t('servicePlaceholder')}
          hasError={serviceError}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="cf-message" style={{ color: 'var(--color-text)' }}>
          {t('message')}
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={4}
          placeholder={t('messagePlaceholder')}
          style={{ ...fieldStyle, resize: 'vertical' } as React.CSSProperties}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-2 text-emerald-500 font-medium text-sm">
          <CheckCircle size={16} />
          {t('success')}
        </div>
      )}
      {status === 'error' && (
        <p className="text-red-500 font-medium text-sm">{t('error')}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-lg font-semibold text-white flex items-center
          justify-center gap-2 cursor-pointer transition-all duration-200
          [@media(hover:hover)]:hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
        style={{ background: 'var(--color-primary)' }}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? t('sending') : t('submit')}
      </button>
    </form>
  )
}
