# Address Autocomplete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить автокомплит адресов в `AddressDrawer` через 2GIS Suggest REST API с мобильной картой и autofocus-логикой.

**Architecture:** Новый хук `useAddressSuggest` делает debounced fetch на `suggest-api.2gis.com`; `SuggestionList` рендерит результаты. На desktop подсказки заменяют карту в правой панели; на mobile — абсолютный dropdown под инпутом. `BookingMap` расширяется props для маркеров. Никаких новых npm-пакетов.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 4, Framer Motion 12, 2GIS Suggest REST API (`suggest-api.2gis.com`), native `fetch` + `AbortController`.

**Spec:** `docs/superpowers/specs/2026-06-12-address-autocomplete-design.md`

---

## File Map

| Действие | Файл | Ответственность |
|---|---|---|
| Create | `components/forms/booking/useAddressSuggest.ts` | Debounced fetch к suggest-api.2gis.com, AbortController, типы |
| Create | `components/forms/booking/SuggestionList.tsx` | Presentational: skeleton / no-results / список подсказок |
| Modify | `components/forms/booking/BookingMap.tsx` | Добавить `fromPoint`/`toPoint` props, рисовать маркеры + маршрут |
| Modify | `components/forms/booking/AddressDrawer.tsx` | Переработать layout: activeField state, mobile map, desktop suggest panel |

---

## Task 1: Хук `useAddressSuggest`

**Files:**
- Create: `components/forms/booking/useAddressSuggest.ts`

- [ ] **Step 1: Создать файл хука**

```typescript
// components/forms/booking/useAddressSuggest.ts
'use client'
import { useState, useEffect, useRef } from 'react'

export interface Suggestion {
  name: string
  fullName: string
  type: string
  lat: number | null
  lon: number | null
}

interface SuggestItem {
  name?: string
  full_name?: string
  type?: string
  point?: { lat: number; lon: number }
}

interface SuggestResponse {
  result?: { items?: SuggestItem[] }
}

const SUGGEST_URL = 'https://suggest-api.2gis.com/1.0'
const REGION_ID = '68' // Almaty

export function useAddressSuggest(query: string): {
  suggestions: Suggestion[]
  loading: boolean
} {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const key = process.env.NEXT_PUBLIC_2GIS_KEY
      if (!key) {
        setSuggestions([])
        setLoading(false)
        return
      }

      const params = new URLSearchParams({
        q: trimmed,
        key,
        locale: 'ru_RU',
        region_id: REGION_ID,
        fields: 'items.point,items.full_name',
        limit: '5',
      })

      try {
        const res = await fetch(`${SUGGEST_URL}?${params}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: SuggestResponse = await res.json()
        const items = data?.result?.items ?? []
        setSuggestions(
          items.map(item => ({
            name: item.name ?? '',
            fullName: item.full_name ?? item.name ?? '',
            type: item.type ?? 'street_address',
            lat: item.point?.lat ?? null,
            lon: item.point?.lon ?? null,
          }))
        )
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  // Abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { suggestions, loading }
}
```

- [ ] **Step 2: Проверить TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1 | head -30
```

Ожидается: нет ошибок для нового файла.

- [ ] **Step 3: Коммит**

```bash
git add components/forms/booking/useAddressSuggest.ts
git commit -m "feat: add useAddressSuggest hook for 2GIS Suggest API"
```

---

## Task 2: Компонент `SuggestionList`

**Files:**
- Create: `components/forms/booking/SuggestionList.tsx`

- [ ] **Step 1: Создать файл компонента**

```typescript
// components/forms/booking/SuggestionList.tsx
'use client'
import { MapPin, Building2 } from 'lucide-react'
import type { Suggestion } from './useAddressSuggest'

interface SuggestionListProps {
  suggestions: Suggestion[]
  loading: boolean
  onSelect: (s: Suggestion) => void
}

const POI_TYPES = new Set(['poi', 'building', 'adm_div', 'branch'])

export function SuggestionList({ suggestions, loading, onSelect }: SuggestionListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-10 rounded-xl animate-pulse"
            style={{ background: 'var(--bg-main)' }}
          />
        ))}
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-24 text-sm"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Адрес не найден
      </div>
    )
  }

  return (
    <ul className="flex flex-col overflow-y-auto" style={{ maxHeight: 260 }}>
      {suggestions.map((s, i) => {
        const isPoi = POI_TYPES.has(s.type)
        return (
          <li key={i}>
            <button
              // preventDefault prevents input blur before click fires
              onMouseDown={e => e.preventDefault()}
              onClick={() => onSelect(s)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer"
              style={{ borderBottom: '1px solid var(--color-border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-main)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                className="flex-shrink-0"
                style={{ color: 'var(--color-primary)' }}
              >
                {isPoi ? <Building2 size={15} /> : <MapPin size={15} />}
              </span>
              <div className="min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--color-text)' }}
                >
                  {s.name}
                </p>
                {s.fullName !== s.name && (
                  <p
                    className="text-xs truncate"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {s.fullName}
                  </p>
                )}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 2: Проверить TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1 | head -30
```

Ожидается: нет ошибок.

- [ ] **Step 3: Коммит**

```bash
git add components/forms/booking/SuggestionList.tsx
git commit -m "feat: add SuggestionList component"
```

---

## Task 3: Расширить `BookingMap` props

**Files:**
- Modify: `components/forms/booking/BookingMap.tsx`

Текущий файл: `BookingMap()` без props, рендерит карту с центром Алматы.  
Нужно: принять `fromPoint` и `toPoint`, ставить маркеры, при обоих — рисовать линию.

- [ ] **Step 1: Заменить содержимое `BookingMap.tsx`**

```typescript
// components/forms/booking/BookingMap.tsx
'use client'
import { useEffect, useRef } from 'react'

const CONTAINER_ID = 'booking-route-map'
const SCRIPT_ID = '2gis-api'

export interface MapPoint {
  lat: number
  lon: number
}

interface BookingMapProps {
  fromPoint?: MapPoint
  toPoint?: MapPoint
}

export function BookingMap({ fromPoint, toPoint }: BookingMapProps) {
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylineRef = useRef<any>(null)

  const getMap = () => mapRef.current

  const clearOverlays = () => {
    markersRef.current.forEach(m => { try { m.remove() } catch {} })
    markersRef.current = []
    if (polylineRef.current) {
      try { polylineRef.current.remove() } catch {}
      polylineRef.current = null
    }
  }

  const drawOverlays = () => {
    const map = getMap()
    if (!map) return
    const DG = (window as any).DG
    if (!DG) return

    clearOverlays()

    const points: [number, number][] = []

    if (fromPoint) {
      const m = DG.marker([fromPoint.lat, fromPoint.lon]).addTo(map)
      markersRef.current.push(m)
      points.push([fromPoint.lat, fromPoint.lon])
    }
    if (toPoint) {
      const m = DG.marker([toPoint.lat, toPoint.lon]).addTo(map)
      markersRef.current.push(m)
      points.push([toPoint.lat, toPoint.lon])
    }
    if (points.length === 2) {
      polylineRef.current = DG.polyline(points, {
        color: '#0ea5e9',
        weight: 3,
        opacity: 0.8,
      }).addTo(map)
      map.fitBounds(DG.latLngBounds(points), { padding: [40, 40] })
    } else if (points.length === 1) {
      map.setView(points[0], 15)
    }
  }

  useEffect(() => {
    if (mapRef.current) return

    const init = () => {
      const DG = (window as any).DG
      if (!DG) return
      DG.then(function () {
        const dg = (window as any).DG
        if (!dg || mapRef.current) return
        const container = document.getElementById(CONTAINER_ID)
        if (!container) return
        mapRef.current = dg.map(CONTAINER_ID, {
          center: [43.2220, 76.8512],
          zoom: 12,
          fullscreenControl: false,
          zoomControl: true,
        })
        drawOverlays()
      })
    }

    if ((window as any).DG) {
      init()
    } else if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = 'https://maps.api.2gis.ru/2.0/loader.js?pkg=full'
      script.onload = init
      document.head.appendChild(script)
    } else {
      let attempts = 0
      const poll = setInterval(() => {
        attempts++
        if ((window as any).DG) { clearInterval(poll); init() }
        if (attempts >= 40) clearInterval(poll)
      }, 150)
      return () => clearInterval(poll)
    }

    return () => {
      clearOverlays()
      if (mapRef.current) {
        try { (mapRef.current as any).remove() } catch {}
        mapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-draw overlays whenever points change
  useEffect(() => {
    drawOverlays()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromPoint?.lat, fromPoint?.lon, toPoint?.lat, toPoint?.lon])

  return (
    <div
      id={CONTAINER_ID}
      style={{ width: '100%', height: '100%', minHeight: '300px' }}
    />
  )
}
```

- [ ] **Step 2: Проверить TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1 | head -30
```

Ожидается: нет ошибок.

- [ ] **Step 3: Коммит**

```bash
git add components/forms/booking/BookingMap.tsx
git commit -m "feat: BookingMap accepts fromPoint/toPoint, draws markers and polyline"
```

---

## Task 4: Переработать `AddressDrawer`

**Files:**
- Modify: `components/forms/booking/AddressDrawer.tsx`

Полная замена файла. Добавляет `activeField` state, хук `useAddressSuggest` для каждого поля, desktop suggestion panel, mobile карту под инпутами, autofocus ref.

- [ ] **Step 1: Заменить содержимое `AddressDrawer.tsx`**

```typescript
// components/forms/booking/AddressDrawer.tsx
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

  const activeSuggestions = activeField === 'from' ? fromSuggestions : toSuggestions
  const activeLoading = activeField === 'from' ? fromLoading : toLoading
  const showSuggestions = activeField !== null && (activeLoading || activeSuggestions.length > 0 || (activeField === 'from' ? from : to).trim().length >= 2)

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

  const rightPanelContent = showSuggestions ? (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-surface)' }}>
      <div
        className="px-4 py-3 text-xs font-semibold uppercase tracking-wide flex-shrink-0"
        style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}
      >
        Подсказки 2GIS
      </div>
      <div className="flex-1 overflow-y-auto">
        <SuggestionList
          suggestions={activeSuggestions}
          loading={activeLoading}
          onSelect={handleSelect}
        />
      </div>
    </div>
  ) : (
    <BookingMap fromPoint={fromPoint} toPoint={toPoint} />
  )

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
            style={{ background: 'var(--bg-surface)', boxShadow: '4px 0 40px rgba(0,0,0,0.3)' }}
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
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    onFocus={() => setActiveField('from')}
                    onBlur={() => setTimeout(() => setActiveField(f => f === 'from' ? null : f), 150)}
                    placeholder={t('addressPlaceholderFrom')}
                    style={{
                      ...inputStyle,
                      borderColor: activeField === 'from' ? 'var(--color-primary)' : 'var(--color-border)',
                    }}
                  />
                  {/* Mobile: dropdown suggestion list */}
                  {activeField === 'from' && showSuggestions && (
                    <div
                      className="md:hidden absolute left-0 right-0 z-10 rounded-b-xl overflow-hidden"
                      style={{
                        top: '100%',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--color-border)',
                        borderTop: 'none',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      }}
                    >
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
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    onFocus={() => setActiveField('to')}
                    onBlur={() => setTimeout(() => setActiveField(f => f === 'to' ? null : f), 150)}
                    placeholder={t('addressPlaceholderTo')}
                    style={{
                      ...inputStyle,
                      borderColor: activeField === 'to' ? 'var(--color-primary)' : 'var(--color-border)',
                    }}
                  />
                  {/* Mobile: dropdown suggestion list */}
                  {activeField === 'to' && showSuggestions && (
                    <div
                      className="md:hidden absolute left-0 right-0 z-10 rounded-b-xl overflow-hidden"
                      style={{
                        top: '100%',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--color-border)',
                        borderTop: 'none',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      }}
                    >
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
              style={{ minHeight: '40vh' }}
            >
              <BookingMap fromPoint={fromPoint} toPoint={toPoint} />
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

          {/* Desktop: right panel — suggestions or map */}
          <AnimatePresence mode="wait">
            <motion.div
              key={showSuggestions ? 'suggestions' : 'map'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="hidden md:flex flex-1 relative overflow-hidden"
            >
              {rightPanelContent}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Проверить TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1 | head -40
```

Ожидается: нет ошибок.

- [ ] **Step 3: Запустить dev-сервер и проверить вручную**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npm run dev
```

Открыть `http://localhost:3000`. Проверить:
1. Кнопка адреса в форме → открывается `AddressDrawer`
2. Desktop: при вводе ≥2 символов в поле "Откуда" — правая панель показывает подсказки
3. Desktop: без активного ввода — правая панель показывает карту
4. Mobile (DevTools → 375px): карта видна под инпутами; при вводе — dropdown под активным полем
5. Клик на подсказку → поле заполняется, фокус прыгает в следующее поле
6. Оба поля выбраны → `onMouseDown preventDefault` работает (список не исчезает до клика)

- [ ] **Step 4: Добавить `NEXT_PUBLIC_2GIS_KEY` в `.env.local`**

Если ключ ещё не добавлен:
```bash
echo "NEXT_PUBLIC_2GIS_KEY=your_key_here" >> /Users/kumsagat/Documents/grandpro-moving/.env.local
```

Получить ключ: [partners.2gis.com](https://partners.2gis.com) → API Keys. Без ключа подсказки не появятся, но форма работает.

- [ ] **Step 5: Коммит**

```bash
git add components/forms/booking/AddressDrawer.tsx
git commit -m "feat: AddressDrawer with 2GIS autocomplete, mobile map, autofocus"
```

---

## Task 5: Добавить `.superpowers/` в `.gitignore`

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Проверить наличие записи**

```bash
grep -n "superpowers" /Users/kumsagat/Documents/grandpro-moving/.gitignore || echo "not found"
```

- [ ] **Step 2: Добавить если отсутствует**

Если `not found` — добавить в конец `.gitignore`:
```
# Brainstorming mockups
.superpowers/
```

- [ ] **Step 3: Коммит**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm dir"
```

---

## Итоговая проверка

- [ ] `npx tsc --noEmit` — нет ошибок
- [ ] `npm run build` — сборка проходит без ошибок
- [ ] Открыть форму на desktop: подсказки появляются справа при вводе ≥2 символов
- [ ] Открыть форму на mobile (375px): карта видна снизу, dropdown под инпутом работает
- [ ] Выбор подсказки в поле "Откуда" → фокус прыгает в "Куда"
- [ ] Выбор обоих адресов → карта показывает два маркера и линию маршрута
- [ ] Ввод вручную (без выбора) → кнопка "Подтвердить" работает
