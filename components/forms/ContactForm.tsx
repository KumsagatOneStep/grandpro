'use client'
import { useState, useRef, useEffect, useCallback, type ElementType } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, CheckCircle, ChevronDown, Home, Building2, Plane, Wrench, Package, Warehouse, Check } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

type ServiceValue = 'apartment' | 'office' | 'international' | 'rigging' | 'packing' | 'storage'

const SERVICE_OPTIONS: { value: ServiceValue; icon: ElementType; label: string }[] = [
  { value: 'apartment',     icon: Home,      label: 'Квартирный переезд' },
  { value: 'office',        icon: Building2, label: 'Офисный переезд' },
  { value: 'international', icon: Plane,     label: 'Международный' },
  { value: 'rigging',       icon: Wrench,    label: 'Такелаж' },
  { value: 'packing',       icon: Package,   label: 'Упаковка' },
  { value: 'storage',       icon: Warehouse, label: 'Хранение' },
]

type CloseReason = 'escape' | 'select' | 'outside' | 'tab'

function ServiceDropdown({
  id,
  value,
  onChange,
  placeholder,
  hasError,
}: {
  id: string
  value: ServiceValue | ''
  onChange: (v: ServiceValue) => void
  placeholder: string
  hasError: boolean
}) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  // #1 fix: guard so focus-return effect doesn't fire on initial mount
  const mountedRef = useRef(false)
  // #5 fix: track close reason to distinguish Tab (don't steal focus) from Escape/select/outside
  const closeReasonRef = useRef<CloseReason>('outside')

  const selected = SERVICE_OPTIONS.find(o => o.value === value)
  const selectedIndex = SERVICE_OPTIONS.findIndex(o => o.value === value)

  const close = useCallback((reason: CloseReason) => {
    closeReasonRef.current = reason
    setOpen(false)
  }, [])

  // click-outside: mousedown + touchstart
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

  // #1 fix: return focus to trigger on close — but NOT on initial mount, and NOT on Tab
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    if (!open && closeReasonRef.current !== 'tab') {
      setFocusedIndex(-1)
      triggerRef.current?.focus()
    }
  }, [open])

  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // #6 fix: on open, focus the currently selected item (or first)
      setOpen(true)
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0)
    } else if (e.key === 'Escape') {
      close('escape')
    }
  }, [close, selectedIndex])

  const handleListKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(i => Math.min(i + 1, SERVICE_OPTIONS.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      // #4 fix: ArrowUp at index 0 closes the dropdown (APG pattern)
      if (focusedIndex === 0) {
        close('escape')
      } else {
        setFocusedIndex(i => i - 1)
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (focusedIndex >= 0) {
        onChange(SERVICE_OPTIONS[focusedIndex].value)
        close('select')
      }
    } else if (e.key === 'Escape') {
      close('escape')
    } else if (e.key === 'Tab') {
      // #5 fix: Tab lets browser handle focus movement naturally
      close('tab')
    }
  }, [focusedIndex, onChange, close])

  // move DOM focus to the focused list item
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
        // #6 fix: only set focusedIndex when opening, not closing
        onClick={() => {
          if (open) {
            close('outside')
          } else {
            setOpen(true)
            setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0)
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 cursor-pointer"
        style={{
          background: 'var(--bg-main)',
          // #7 fix: fully declarative border — no imperative onFocus/onBlur mutations
          border: `1px solid ${hasError ? '#ef4444' : open ? 'var(--color-primary)' : 'var(--color-border)'}`,
          color: selected ? 'var(--color-text)' : 'var(--color-text-muted)',
          outline: 'none',
          boxShadow: open ? '0 0 0 2px color-mix(in srgb, var(--color-primary) 30%, transparent)' : 'none',
        }}
      >
        {selected ? (
          <>
            <selected.icon size={16} strokeWidth={1.8} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
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
            // #3 fix: reset focusedIndex when mouse leaves the list
            onMouseLeave={() => setFocusedIndex(-1)}
            className="absolute z-50 w-full mt-1.5 rounded-xl"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 16px 48px var(--shadow-main)',
            }}
          >
            {SERVICE_OPTIONS.map(({ value: v, icon: Icon, label }, idx) => {
              const active = value === v
              const focused = focusedIndex === idx
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
                    background: active
                      ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!service) {
      setServiceError(true)
      return
    }

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
          {t('service')}{serviceError && ' — выберите услугу'}
        </label>
        <ServiceDropdown
          id="cf-service"
          value={service}
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
          hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
        style={{ background: 'var(--color-primary)' }}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? t('sending') : t('submit')}
      </button>
    </form>
  )
}
