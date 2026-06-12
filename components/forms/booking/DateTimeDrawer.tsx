'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ChevronLeft } from 'lucide-react'

interface DateTimeDrawerProps {
  open: boolean
  isAsap: boolean
  scheduledDate: string | null
  scheduledHour: number | null
  scheduledMinute: number | null
  onConfirm: (isAsap: boolean, date: string | null, hour: number | null, minute: number | null) => void
  onClose: () => void
}

function buildDates(count = 14) {
  const result: { iso: string; day: string; weekday: string; isWeekend: boolean }[] = []
  const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    result.push({
      iso: d.toISOString().slice(0, 10),
      day: String(d.getDate()),
      weekday: weekdays[d.getDay()],
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    })
  }
  return result
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)
const ITEM_H = 44

function ScrollDrum({
  items,
  value,
  onChange,
  format,
}: {
  items: number[]
  value: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const idx = items.indexOf(value)
    if (idx >= 0) {
      containerRef.current.scrollTop = Math.max(0, (idx - 2)) * ITEM_H
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleScroll = () => {
    if (!containerRef.current) return
    const rawIdx = Math.round(containerRef.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(items.length - 1, rawIdx + 2))
    if (items[clamped] !== undefined && items[clamped] !== value) {
      onChange(items[clamped])
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{ width: 72, height: ITEM_H * 5, background: 'var(--bg-main)', border: '1px solid var(--color-border)' }}
    >
      {/* Selection highlight */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-10"
        style={{
          top: ITEM_H * 2,
          height: ITEM_H,
          background: 'rgba(14,165,233,0.1)',
          borderTop: '1px solid var(--color-primary)',
          borderBottom: '1px solid var(--color-primary)',
        }}
      />
      <div
        ref={containerRef}
        className="overflow-y-scroll h-full"
        style={{ scrollbarWidth: 'none', scrollSnapType: 'y mandatory' }}
        onScroll={handleScroll}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {items.map(item => (
          <div
            key={item}
            onClick={() => onChange(item)}
            className="flex items-center justify-center cursor-pointer font-heading font-bold text-xl"
            style={{
              height: ITEM_H,
              scrollSnapAlign: 'center',
              color: item === value ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}
          >
            {format(item)}
          </div>
        ))}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  )
}

export function DateTimeDrawer({
  open, isAsap, scheduledDate, scheduledHour, scheduledMinute, onConfirm, onClose,
}: DateTimeDrawerProps) {
  const t = useTranslations('booking')
  const dates = buildDates()
  const now = new Date()

  const [localAsap, setLocalAsap] = useState(isAsap)
  const [localDate, setLocalDate] = useState(scheduledDate ?? dates[0].iso)
  const [localHour, setLocalHour] = useState(scheduledHour ?? now.getHours())
  const [localMinute, setLocalMinute] = useState(
    scheduledMinute ?? Math.ceil(now.getMinutes() / 5) * 5 % 60
  )

  const selectedDateObj = dates.find(d => d.iso === localDate)
  const isWeekend = selectedDateObj?.isWeekend ?? false

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="datetime-drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="absolute inset-0 z-10 flex flex-col rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: 'var(--bg-main)', color: 'var(--color-text-muted)' }}
              aria-label={t('back')}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-heading font-bold text-base" style={{ color: 'var(--color-text)' }}>
              {t('dateTimeTitle')}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Date strip */}
            <div
              className="flex gap-2 overflow-x-auto px-5 py-4"
              style={{ scrollbarWidth: 'none' }}
            >
              {dates.map(d => {
                const active = d.iso === localDate
                return (
                  <button
                    key={d.iso}
                    onClick={() => setLocalDate(d.iso)}
                    className="flex flex-col items-center gap-0.5 min-w-[48px] py-2.5 px-2 rounded-xl cursor-pointer flex-shrink-0 transition-all duration-150"
                    style={{
                      background: active ? 'var(--color-primary)' : 'var(--bg-main)',
                      border: active ? 'none' : '1px solid var(--color-border)',
                    }}
                  >
                    <span
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: active ? 'rgba(255,255,255,0.8)' : d.isWeekend ? '#ef4444' : 'var(--color-text-muted)' }}
                    >
                      {d.weekday}
                    </span>
                    <span
                      className="font-heading font-bold text-base leading-none"
                      style={{ color: active ? '#fff' : d.isWeekend ? '#ef4444' : 'var(--color-text)' }}
                    >
                      {d.day}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Weekend discount hint */}
            {isWeekend && (
              <div
                className="mx-5 mb-3 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(14,165,233,0.08)', color: 'var(--color-primary)' }}
              >
                {t('weekendDiscount')}
              </div>
            )}

            {/* ASAP / scheduled toggle */}
            <div className="px-5 pb-4">
              <div
                className="flex rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--color-border)', background: 'var(--bg-main)' }}
              >
                {([
                  { key: 'asap', label: t('asap'), value: true },
                  { key: 'sched', label: t('schedule'), value: false },
                ] as const).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setLocalAsap(opt.value)}
                    className="flex-1 py-2.5 text-sm font-semibold cursor-pointer transition-all duration-150"
                    style={{
                      background: localAsap === opt.value ? 'var(--color-primary)' : 'transparent',
                      color: localAsap === opt.value ? '#fff' : 'var(--color-text-muted)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time drum pickers */}
            {!localAsap && (
              <div className="px-5 pb-5">
                <div className="flex items-center justify-center gap-2">
                  <ScrollDrum
                    items={HOURS}
                    value={localHour}
                    onChange={setLocalHour}
                    format={v => String(v).padStart(2, '0')}
                  />
                  <span className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>:</span>
                  <ScrollDrum
                    items={MINUTES}
                    value={localMinute}
                    onChange={setLocalMinute}
                    format={v => String(v).padStart(2, '0')}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={() => onConfirm(
                localAsap,
                localDate,
                localAsap ? null : localHour,
                localAsap ? null : localMinute,
              )}
              className="w-full py-3.5 rounded-xl font-bold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 16px rgba(14,165,233,0.3)' }}
            >
              {t('confirm')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
