# BookingForm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simple `QuickForm` in the Hero section with a multi-step booking form (адрес → машина → опции → дата/время → оплата) с живым расчётом цены и отправкой заявки через `/api/contact`.

**Architecture:** Main card `BookingForm` always visible; each complex step opens as an overlay/drawer controlled by `activeDrawer` state. Drawers are animated via Framer Motion. Price is calculated client-side from vehicle base price + workers + option prices, displayed live in the submit button.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Framer Motion 12, next-intl 4, Tailwind CSS 4, lucide-react, existing 2GIS DG API (window.DG).

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `lib/booking-price.ts` | Shared price constants + `calcBookingPrice()` |
| Create | `components/forms/booking/types.ts` | `BookingState`, `Vehicle`, `VEHICLES`, `BOOKING_OPTIONS` |
| Create | `components/forms/booking/BookingMap.tsx` | 2GIS map for address drawer (unique container ID) |
| Create | `components/forms/booking/AddressDrawer.tsx` | Full-screen overlay: from/to inputs + map |
| Create | `components/forms/booking/VehicleDrawer.tsx` | Slide panel: vehicle card list |
| Create | `components/forms/booking/OptionsDrawer.tsx` | Slide panel: workers counter + option toggles + comment |
| Create | `components/forms/booking/DateTimeDrawer.tsx` | Slide panel: date strip + time scroll picker |
| Create | `components/forms/booking/PaymentSheet.tsx` | Bottom sheet: cash/card radio |
| Create | `components/forms/BookingForm.tsx` | Main orchestrator: card UI + drawer controller |
| Modify | `components/sections/HeroSection.tsx` | Replace `<QuickForm />` → `<BookingForm />` |
| Modify | `app/api/contact/route.ts` | Accept new booking fields |
| Modify | `messages/ru.json` | Add `booking.*` keys |
| Modify | `messages/kz.json` | Add `booking.*` keys (Kazakh) |
| Modify | `messages/en.json` | Add `booking.*` keys (English) |

---

## Task 1 — Shared price logic `lib/booking-price.ts`

**Files:**
- Create: `lib/booking-price.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/booking-price.ts
export const WORKER_PRICE = 5000

export const BOOKING_OPTION_PRICES: Record<string, number> = {
  lift: 8000,
  pack: 15000,
  assemble: 10000,
  truck: 20000,
}

export interface CalcInput {
  vehicleBasePrice: number
  workers: number
  options: Record<string, boolean>
}

export function calcBookingPrice({ vehicleBasePrice, workers, options }: CalcInput): number {
  const workersTotal = workers * WORKER_PRICE
  const optsTotal = Object.entries(options)
    .filter(([, v]) => v)
    .reduce((sum, [k]) => sum + (BOOKING_OPTION_PRICES[k] ?? 0), 0)
  return vehicleBasePrice + workersTotal + optsTotal
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors on the new file (existing errors are pre-existing and OK).

- [ ] **Step 3: Commit**

```bash
git add lib/booking-price.ts
git commit -m "feat: extract booking price logic to lib/booking-price.ts"
```

---

## Task 2 — i18n keys in `messages/*.json`

**Files:**
- Modify: `messages/ru.json`
- Modify: `messages/kz.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add `booking` object to `messages/ru.json`** (insert after the `"hero"` block, before `"services"`)

```json
"booking": {
  "formTitle": "Оформить заявку",
  "addressFrom": "Адрес погрузки",
  "addressTo": "Адрес выгрузки",
  "addressPlaceholderFrom": "Введите адрес погрузки",
  "addressPlaceholderTo": "Введите адрес выгрузки",
  "addStop": "Добавить промежуточный адрес",
  "confirm": "Подтвердить",
  "clarify": "Уточнить",
  "back": "Назад",
  "vehicleTitle": "Выберите транспорт",
  "vehicleNone": "Выберите транспорт",
  "workersLabel": "Грузчики",
  "workersHint": "Грузчики помогут сэкономить время",
  "optionsTitle": "Опции к заказу",
  "optLift": "Подъёмник",
  "optPack": "Упаковка",
  "optAssemble": "Сборка / разборка",
  "optTruck": "Большегрузный транспорт",
  "optComment": "Комментарий к заказу",
  "dateTimeTitle": "Время подачи",
  "asap": "Ближайшее (5–15 мин)",
  "schedule": "Выбрать дату",
  "paymentTitle": "Способ оплаты",
  "paymentCash": "Наличные",
  "paymentCard": "Карта",
  "submitBtn": "Оформить за",
  "submitBtnNoPrice": "Оформить заявку",
  "phoneLabel": "Номер телефона",
  "phoneInvalid": "Неверный формат (+7 7XX XXX XX XX)",
  "success": "Заявка принята! Перезвоним в течение 15 минут.",
  "error": "Ошибка. Позвоните: +7 707 709-74-22",
  "weekendDiscount": "В выходные дни заказать машину будет дешевле!",
  "tonnes": "т",
  "metres": "м",
  "volume": "м³"
}
```

- [ ] **Step 2: Add `booking` object to `messages/kz.json`** (same position)

```json
"booking": {
  "formTitle": "Өтінім рәсімдеу",
  "addressFrom": "Тиеу мекенжайы",
  "addressTo": "Түсіру мекенжайы",
  "addressPlaceholderFrom": "Тиеу мекенжайын енгізіңіз",
  "addressPlaceholderTo": "Түсіру мекенжайын енгізіңіз",
  "addStop": "Аралық мекенжай қосу",
  "confirm": "Растау",
  "clarify": "Нақтылау",
  "back": "Артқа",
  "vehicleTitle": "Көлік таңдаңыз",
  "vehicleNone": "Көлік таңдаңыз",
  "workersLabel": "Жүк тасушылар",
  "workersHint": "Жүк тасушылар уақытты үнемдеуге көмектеседі",
  "optionsTitle": "Тапсырыс опциялары",
  "optLift": "Жеткізу көтергіші",
  "optPack": "Орау",
  "optAssemble": "Жинау / бөлшектеу",
  "optTruck": "Ауыр жүк көлігі",
  "optComment": "Тапсырысқа түсініктеме",
  "dateTimeTitle": "Берілу уақыты",
  "asap": "Жақын арада (5–15 мин)",
  "schedule": "Күн таңдау",
  "paymentTitle": "Төлем әдісі",
  "paymentCash": "Қолма-қол ақша",
  "paymentCard": "Карта",
  "submitBtn": "Рәсімдеу:",
  "submitBtnNoPrice": "Өтінім беру",
  "phoneLabel": "Телефон нөмірі",
  "phoneInvalid": "Қате формат (+7 7XX XXX XX XX)",
  "success": "Өтінім қабылданды! 15 минут ішінде қоңырау шаламыз.",
  "error": "Қате. Қоңырау шалыңыз: +7 707 709-74-22",
  "weekendDiscount": "Демалыс күндері көлік тапсырысы арзанырақ болады!",
  "tonnes": "т",
  "metres": "м",
  "volume": "м³"
}
```

- [ ] **Step 3: Add `booking` object to `messages/en.json`** (same position)

```json
"booking": {
  "formTitle": "Book a Move",
  "addressFrom": "Pickup address",
  "addressTo": "Dropoff address",
  "addressPlaceholderFrom": "Enter pickup address",
  "addressPlaceholderTo": "Enter dropoff address",
  "addStop": "Add a stop",
  "confirm": "Confirm",
  "clarify": "Clarify on map",
  "back": "Back",
  "vehicleTitle": "Select vehicle",
  "vehicleNone": "Select vehicle",
  "workersLabel": "Movers",
  "workersHint": "Movers will save you time and effort",
  "optionsTitle": "Order options",
  "optLift": "Freight elevator",
  "optPack": "Packing",
  "optAssemble": "Assembly / disassembly",
  "optTruck": "Heavy-duty truck",
  "optComment": "Order comment",
  "dateTimeTitle": "Pickup time",
  "asap": "ASAP (5–15 min)",
  "schedule": "Choose date",
  "paymentTitle": "Payment method",
  "paymentCash": "Cash",
  "paymentCard": "Card",
  "submitBtn": "Book for",
  "submitBtnNoPrice": "Submit request",
  "phoneLabel": "Phone number",
  "phoneInvalid": "Invalid format (+7 7XX XXX XX XX)",
  "success": "Request received! We'll call back within 15 minutes.",
  "error": "Error. Call us: +7 707 709-74-22",
  "weekendDiscount": "Weekend bookings are cheaper!",
  "tonnes": "t",
  "metres": "m",
  "volume": "m³"
}
```

- [ ] **Step 4: Commit**

```bash
git add messages/ru.json messages/kz.json messages/en.json
git commit -m "feat: add booking i18n keys to all three locales"
```

---

## Task 3 — Shared types and vehicle data

**Files:**
- Create: `components/forms/booking/types.ts`

- [ ] **Step 1: Create the file**

```typescript
// components/forms/booking/types.ts
import { BOOKING_OPTION_PRICES } from '@/lib/booking-price'

export interface Vehicle {
  id: string
  label: string
  capacity: number   // tonnes
  length: number     // metres
  volume: number     // m³
  basePrice: number  // KZT base fare
}

export const VEHICLES: Vehicle[] = [
  { id: 'gazel-15',  label: 'Газель 1.5т',      capacity: 1.5, length: 3,  volume: 9,  basePrice: 25000 },
  { id: 'gazel-4m',  label: 'Газель 4м',         capacity: 1.5, length: 4,  volume: 16, basePrice: 30000 },
  { id: 'furgon-3t', label: 'Фургон 3т',         capacity: 3,   length: 5,  volume: 24, basePrice: 45000 },
  { id: 'euro-5t',   label: 'Еврофургон 5т',     capacity: 5,   length: 6,  volume: 36, basePrice: 65000 },
]

export type PaymentMethod = 'cash' | 'card'

export type ActiveDrawer = 'address' | 'vehicle' | 'options' | 'datetime' | 'payment' | null

export interface BookingOptions {
  lift: boolean
  pack: boolean
  assemble: boolean
  truck: boolean
}

export const DEFAULT_OPTIONS: BookingOptions = {
  lift: false,
  pack: false,
  assemble: false,
  truck: false,
}

export interface BookingState {
  addressFrom: string
  addressTo: string
  vehicleId: string
  workers: number
  options: BookingOptions
  comment: string
  isAsap: boolean
  scheduledDate: string | null   // 'YYYY-MM-DD'
  scheduledHour: number | null
  scheduledMinute: number | null
  payment: PaymentMethod
  phone: string
}

export const DEFAULT_BOOKING_STATE: BookingState = {
  addressFrom: '',
  addressTo: '',
  vehicleId: VEHICLES[0].id,
  workers: 0,
  options: { ...DEFAULT_OPTIONS },
  comment: '',
  isAsap: true,
  scheduledDate: null,
  scheduledHour: null,
  scheduledMinute: null,
  payment: 'cash',
  phone: '+7',
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add components/forms/booking/types.ts
git commit -m "feat: add booking form types and vehicle data"
```

---

## Task 4 — BookingMap component

**Files:**
- Create: `components/forms/booking/BookingMap.tsx`

The existing `Map2GIS` uses a hardcoded `id="grandpro-2gis-map"`. This component uses `id="booking-route-map"` to avoid DOM conflicts.

- [ ] **Step 1: Create the file**

```typescript
// components/forms/booking/BookingMap.tsx
'use client'
import { useEffect, useRef } from 'react'

const CONTAINER_ID = 'booking-route-map'
const SCRIPT_ID = '2gis-api'

export function BookingMap() {
  const mapRef = useRef<unknown>(null)

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
      if (mapRef.current) {
        try { (mapRef.current as any).remove() } catch {}
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div
      id={CONTAINER_ID}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '300px',
      }}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/forms/booking/BookingMap.tsx
git commit -m "feat: add BookingMap component with unique container ID"
```

---

## Task 5 — AddressDrawer

**Files:**
- Create: `components/forms/booking/AddressDrawer.tsx`

Full-screen fixed overlay. Left panel: two address inputs + confirm/clarify buttons. Right panel: `BookingMap`. On mobile: inputs full width, map hidden.

- [ ] **Step 1: Create the file**

```typescript
// components/forms/booking/AddressDrawer.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { X, MapPin, Plus } from 'lucide-react'
import { BookingMap } from './BookingMap'

interface AddressDrawerProps {
  open: boolean
  addressFrom: string
  addressTo: string
  onConfirm: (from: string, to: string) => void
  onClose: () => void
}

export function AddressDrawer({ open, addressFrom, addressTo, onConfirm, onClose }: AddressDrawerProps) {
  const t = useTranslations('booking')
  const [from, setFrom] = useState(addressFrom)
  const [to, setTo] = useState(addressTo)

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
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative flex w-full max-w-[480px] flex-col"
            style={{
              background: 'var(--bg-surface)',
              boxShadow: '4px 0 40px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
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

            {/* Address inputs */}
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
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
                    placeholder={t('addressPlaceholderFrom')}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                  />
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
                    type="text"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    placeholder={t('addressPlaceholderTo')}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                  />
                </div>
              </div>

              {/* Add stop hint */}
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

            {/* Action buttons */}
            <div
              className="px-6 py-4 flex gap-3"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <button
                onClick={() => onConfirm(from, to)}
                className="flex-1 py-3 rounded-xl font-bold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 16px rgba(14,165,233,0.3)' }}
              >
                {t('confirm')}
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

          {/* Right: map — hidden on mobile */}
          <div className="hidden md:flex flex-1 relative overflow-hidden">
            <BookingMap />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/forms/booking/AddressDrawer.tsx
git commit -m "feat: add AddressDrawer with 2GIS map panel"
```

---

## Task 6 — VehicleDrawer

**Files:**
- Create: `components/forms/booking/VehicleDrawer.tsx`

Slide-in panel (absolute, overlays main card). Lists vehicles with specs. Selected vehicle highlighted.

- [ ] **Step 1: Create the file**

```typescript
// components/forms/booking/VehicleDrawer.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ChevronLeft, Truck } from 'lucide-react'
import { VEHICLES } from './types'
import { formatPrice } from '@/lib/utils'

interface VehicleDrawerProps {
  open: boolean
  selectedId: string
  onConfirm: (vehicleId: string) => void
  onClose: () => void
}

export function VehicleDrawer({ open, selectedId, onConfirm, onClose }: VehicleDrawerProps) {
  const t = useTranslations('booking')

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="vehicle-drawer"
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
              {t('vehicleTitle')}
            </span>
          </div>

          {/* Vehicle list */}
          <div className="flex-1 overflow-y-auto py-3 px-4 space-y-2">
            {VEHICLES.map(v => {
              const active = v.id === selectedId
              return (
                <button
                  key={v.id}
                  onClick={() => onConfirm(v.id)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-150 text-left"
                  style={{
                    background: active ? 'rgba(14,165,233,0.1)' : 'var(--bg-main)',
                    border: active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  }}
                >
                  <div
                    className="w-12 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? 'rgba(14,165,233,0.15)' : 'var(--bg-surface-elevated)' }}
                  >
                    <Truck size={22} style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      {v.label}
                    </p>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {v.capacity} {t('tonnes')}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {v.length} {t('metres')}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {v.volume} {t('volume')}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>
                    {formatPrice(v.basePrice)}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Confirm button */}
          <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={() => onConfirm(selectedId)}
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
```

- [ ] **Step 2: Commit**

```bash
git add components/forms/booking/VehicleDrawer.tsx
git commit -m "feat: add VehicleDrawer with vehicle card list"
```

---

## Task 7 — OptionsDrawer

**Files:**
- Create: `components/forms/booking/OptionsDrawer.tsx`

Slide-in panel. Workers counter (0–8), 4 option toggles (lift/pack/assemble/truck), comment textarea.

- [ ] **Step 1: Create the file**

```typescript
// components/forms/booking/OptionsDrawer.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ChevronLeft, Minus, Plus } from 'lucide-react'
import { BookingOptions, DEFAULT_OPTIONS } from './types'
import { BOOKING_OPTION_PRICES } from '@/lib/booking-price'
import { formatPrice } from '@/lib/utils'

interface OptionsDrawerProps {
  open: boolean
  workers: number
  options: BookingOptions
  comment: string
  onConfirm: (workers: number, options: BookingOptions, comment: string) => void
  onClose: () => void
}

const OPTION_KEYS = ['lift', 'pack', 'assemble', 'truck'] as const

export function OptionsDrawer({ open, workers, options, comment, onConfirm, onClose }: OptionsDrawerProps) {
  const t = useTranslations('booking')
  const [localWorkers, setLocalWorkers] = useState(workers)
  const [localOptions, setLocalOptions] = useState<BookingOptions>({ ...options })
  const [localComment, setLocalComment] = useState(comment)

  const toggleOption = (key: keyof BookingOptions) =>
    setLocalOptions(o => ({ ...o, [key]: !o[key] }))

  const OPTION_LABELS: Record<keyof BookingOptions, string> = {
    lift: t('optLift'),
    pack: t('optPack'),
    assemble: t('optAssemble'),
    truck: t('optTruck'),
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="options-drawer"
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
              {t('optionsTitle')}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-5 px-5 space-y-5">
            {/* Workers counter */}
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{t('workersLabel')}</p>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{t('workersHint')}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setLocalWorkers(w => Math.max(0, w - 1))}
                  className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors border"
                  style={{
                    background: localWorkers === 0 ? 'var(--bg-main)' : 'var(--bg-surface-elevated)',
                    borderColor: 'var(--color-border)',
                    color: localWorkers === 0 ? 'var(--color-text-muted)' : 'var(--color-text)',
                  }}
                  disabled={localWorkers === 0}
                  aria-label="Decrease workers"
                >
                  <Minus size={16} />
                </button>
                <span className="font-heading text-2xl font-bold w-8 text-center" style={{ color: 'var(--color-text)' }}>
                  {localWorkers}
                </span>
                <button
                  onClick={() => setLocalWorkers(w => Math.min(8, w + 1))}
                  className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors border"
                  style={{
                    background: 'var(--color-primary)',
                    borderColor: 'var(--color-primary)',
                    color: '#fff',
                  }}
                  disabled={localWorkers === 8}
                  aria-label="Increase workers"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Option toggles */}
            <div className="space-y-2">
              {OPTION_KEYS.map(key => {
                const active = localOptions[key]
                const price = BOOKING_OPTION_PRICES[key]
                return (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-colors"
                    style={{
                      background: 'var(--bg-main)',
                      border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{OPTION_LABELS[key]}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-primary)' }}>+{formatPrice(price)}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleOption(key)}
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                  </label>
                )
              })}
            </div>

            {/* Comment */}
            <div>
              <textarea
                value={localComment}
                onChange={e => setLocalComment(e.target.value)}
                placeholder={t('optComment')}
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none transition-colors"
                style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
              />
            </div>
          </div>

          {/* Confirm */}
          <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={() => onConfirm(localWorkers, localOptions, localComment)}
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
```

- [ ] **Step 2: Commit**

```bash
git add components/forms/booking/OptionsDrawer.tsx
git commit -m "feat: add OptionsDrawer with workers counter and option toggles"
```

---

## Task 8 — DateTimeDrawer

**Files:**
- Create: `components/forms/booking/DateTimeDrawer.tsx`

Slide-in panel. Horizontal scrollable date strip (today + next 13 days). "Ближайшее / +30 / +45 / +60 min" time mode tabs. Scroll-drum pickers for hour/minute (only shown when not ASAP).

- [ ] **Step 1: Create the file**

```typescript
// components/forms/booking/DateTimeDrawer.tsx
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

function buildDates(count = 14): { iso: string; day: string; weekday: string; isWeekend: boolean }[] {
  const result = []
  const now = new Date()
  const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  for (let i = 0; i < count; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const day = String(d.getDate())
    const weekday = weekdays[d.getDay()]
    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    result.push({ iso, day, weekday, isWeekend })
  }
  return result
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7)  // 07..23
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

export function DateTimeDrawer({
  open, isAsap, scheduledDate, scheduledHour, scheduledMinute, onConfirm, onClose,
}: DateTimeDrawerProps) {
  const t = useTranslations('booking')
  const dates = buildDates()
  const now = new Date()

  const [localAsap, setLocalAsap] = useState(isAsap)
  const [localDate, setLocalDate] = useState(scheduledDate ?? dates[0].iso)
  const [localHour, setLocalHour] = useState(scheduledHour ?? now.getHours())
  const [localMinute, setLocalMinute] = useState(scheduledMinute ?? Math.ceil(now.getMinutes() / 5) * 5 % 60)

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
              className="flex gap-2 overflow-x-auto px-5 py-4 scrollbar-hide"
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
                {[
                  { key: 'asap', label: t('asap'), value: true },
                  { key: 'sched', label: t('schedule'), value: false },
                ].map(opt => (
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

            {/* Time drum pickers — only when not ASAP */}
            {!localAsap && (
              <div className="px-5 pb-4">
                <div className="flex items-center justify-center gap-2">
                  {/* Hour drum */}
                  <ScrollDrum
                    items={HOURS}
                    value={localHour}
                    onChange={setLocalHour}
                    format={v => String(v).padStart(2, '0')}
                  />
                  <span className="font-heading text-2xl font-bold" style={{ color: 'var(--color-text)' }}>:</span>
                  {/* Minute drum */}
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

// Scroll drum picker sub-component (inline, used only here)
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
  const ITEM_H = 44
  const VISIBLE = 5
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startScroll = useRef(0)

  const currentIdx = items.indexOf(value)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = Math.max(0, currentIdx - 2) * ITEM_H
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleScroll = () => {
    if (!containerRef.current) return
    const idx = Math.round(containerRef.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(items.length - 1, idx + 2))
    if (items[clamped] !== undefined && items[clamped] !== value) {
      onChange(items[clamped])
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ width: 72, height: ITEM_H * VISIBLE, background: 'var(--bg-main)', border: '1px solid var(--color-border)' }}>
      {/* Selection highlight */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: ITEM_H * 2,
          height: ITEM_H,
          background: 'rgba(14,165,233,0.1)',
          borderTop: '1px solid var(--color-primary)',
          borderBottom: '1px solid var(--color-primary)',
          zIndex: 1,
        }}
      />
      <div
        ref={containerRef}
        className="overflow-y-scroll"
        style={{ height: '100%', scrollbarWidth: 'none', scrollSnapType: 'y mandatory' }}
        onScroll={handleScroll}
      >
        {/* Top padding */}
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
        {/* Bottom padding */}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/forms/booking/DateTimeDrawer.tsx
git commit -m "feat: add DateTimeDrawer with date strip and scroll drum time picker"
```

---

## Task 9 — PaymentSheet

**Files:**
- Create: `components/forms/booking/PaymentSheet.tsx`

Bottom sheet (fixed position), appears over main card. Cash/Card radio select.

- [ ] **Step 1: Create the file**

```typescript
// components/forms/booking/PaymentSheet.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Banknote, CreditCard } from 'lucide-react'
import { PaymentMethod } from './types'

interface PaymentSheetProps {
  open: boolean
  value: PaymentMethod
  onChange: (v: PaymentMethod) => void
  onClose: () => void
}

const METHODS: { value: PaymentMethod; icon: typeof Banknote; labelKey: 'paymentCash' | 'paymentCard' }[] = [
  { value: 'cash', icon: Banknote, labelKey: 'paymentCash' },
  { value: 'card', icon: CreditCard, labelKey: 'paymentCard' },
]

export function PaymentSheet({ open, value, onChange, onClose }: PaymentSheetProps) {
  const t = useTranslations('booking')

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="payment-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            key="payment-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-2xl"
            style={{
              background: 'var(--bg-surface)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
              maxWidth: '480px',
              margin: '0 auto',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
            </div>

            <div className="px-5 pb-6">
              <p className="font-heading font-bold text-base mb-4" style={{ color: 'var(--color-text)' }}>
                {t('paymentTitle')}
              </p>
              {METHODS.map(m => {
                const active = value === m.value
                const Icon = m.icon
                return (
                  <label
                    key={m.value}
                    className="flex items-center justify-between p-4 rounded-xl mb-2 cursor-pointer transition-all"
                    style={{
                      background: active ? 'rgba(14,165,233,0.08)' : 'var(--bg-main)',
                      border: active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                      <span className="font-semibold text-sm" style={{ color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {t(m.labelKey)}
                      </span>
                    </div>
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: active ? 'var(--color-primary)' : 'var(--color-border)' }}
                    >
                      {active && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      value={m.value}
                      checked={active}
                      onChange={() => { onChange(m.value); onClose() }}
                      className="sr-only"
                    />
                  </label>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/forms/booking/PaymentSheet.tsx
git commit -m "feat: add PaymentSheet bottom sheet with cash/card options"
```

---

## Task 10 — Main BookingForm orchestrator

**Files:**
- Create: `components/forms/BookingForm.tsx`

The main card. Controls `activeDrawer` state. Renders the card with all field-rows. Shows price live in submit button. Handles form submission to `/api/contact`.

- [ ] **Step 1: Create the file**

```typescript
// components/forms/BookingForm.tsx
'use client'
import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
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

    const body = {
      name: 'Заявка с формы бронирования',
      phone: state.phone,
      service: 'booking',
      message: [
        state.addressFrom ? `Откуда: ${state.addressFrom}` : '',
        state.addressTo ? `Куда: ${state.addressTo}` : '',
        `Машина: ${vehicle.label}`,
        state.workers > 0 ? `Грузчики: ${state.workers}` : '',
        Object.entries(state.options).filter(([, v]) => v).map(([k]) => k).join(', '),
        state.comment ? `Комментарий: ${state.comment}` : '',
        state.isAsap ? 'Время: ближайшее' : `Дата: ${state.scheduledDate} ${state.scheduledHour}:${String(state.scheduledMinute).padStart(2,'0')}`,
        `Оплата: ${state.payment === 'cash' ? 'наличные' : 'карта'}`,
        `Сумма: ${formatPrice(totalPrice)}`,
      ].filter(Boolean).join('\n'),
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        <p className="font-heading font-bold text-lg mb-2" style={{ color: 'var(--color-text)' }}>
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
              <MapPin size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
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
            className="w-9 h-full flex items-center justify-center rounded-xl cursor-pointer flex-shrink-0 transition-colors"
            style={{ background: 'var(--bg-main)', border: '1px solid var(--color-border)', minHeight: 60 }}
            aria-label="Swap addresses"
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            <ArrowLeftRight size={14} style={{ color: 'var(--color-text-muted)' }} />
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
              <MapPin size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
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
            <Truck size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{vehicle.label}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {vehicle.capacity}т · {vehicle.volume}м³
              </p>
            </div>
            <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--color-primary)' }}>
              {formatPrice(vehicle.basePrice)}
            </span>
          </div>
        </button>

        {/* ── Workers row ── */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: 'var(--bg-main)', border: '1px solid var(--color-border)' }}
        >
          <Users size={16} style={{ color: 'var(--color-primary)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{t('workersLabel')}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('workersHint')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => update('workers', Math.max(0, state.workers - 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--bg-surface)' }}
              disabled={state.workers === 0}
              aria-label="Decrease"
            >
              <span className="text-base leading-none mb-0.5">−</span>
            </button>
            <span className="font-heading font-bold text-base w-5 text-center" style={{ color: 'var(--color-text)' }}>
              {state.workers}
            </span>
            <button
              onClick={() => update('workers', Math.min(8, state.workers + 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
              aria-label="Increase"
            >
              <span className="text-base leading-none mb-0.5">+</span>
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
            <div className="flex items-center gap-2">
              <Settings2 size={14} style={{ color: 'var(--color-text-muted)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{t('optionsTitle')}</span>
            </div>
            {Object.values(state.options).some(Boolean) && (
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-primary)' }}>
                {Object.values(state.options).filter(Boolean).length} выбрано
              </p>
            )}
          </button>
          <button
            style={rowStyle}
            onClick={() => setActiveDrawer('datetime')}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{t('dateTimeTitle')}</span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: state.isAsap ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
              {state.isAsap
                ? t('asap')
                : state.scheduledDate
                  ? `${state.scheduledDate} ${String(state.scheduledHour).padStart(2,'0')}:${String(state.scheduledMinute).padStart(2,'0')}`
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

        {/* ── Submit + payment ── */}
        {submitError && (
          <p className="text-sm text-center" style={{ color: '#ef4444' }}>{t('error')}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
            style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 20px rgba(14,165,233,0.35)' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>{t('submitBtn')} {formatPrice(totalPrice)}</span>
          </button>

          {/* Payment method button */}
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
            <Wallet size={18} />
          </button>
        </div>

        <p className="text-[10px] text-center" style={{ color: 'var(--color-text-muted)' }}>
          {state.payment === 'cash' ? t('paymentCash') : t('paymentCard')}
        </p>
      </div>

      {/* ── Overlay drawers ── */}
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

      {/* ── Fixed overlays (outside relative container) ── */}
      <AddressDrawer
        open={activeDrawer === 'address'}
        addressFrom={state.addressFrom}
        addressTo={state.addressTo}
        onConfirm={(from, to) => { setState(s => ({ ...s, addressFrom: from, addressTo: to })); setActiveDrawer(null) }}
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
```

- [ ] **Step 2: Commit**

```bash
git add components/forms/BookingForm.tsx
git commit -m "feat: add main BookingForm orchestrator with drawer controller and live price"
```

---

## Task 11 — Wire BookingForm into HeroSection

**Files:**
- Modify: `components/sections/HeroSection.tsx`

Replace the `QuickForm` import and usage with `BookingForm`.

- [ ] **Step 1: Edit `HeroSection.tsx`**

Change line 4:
```typescript
// BEFORE
import { QuickForm } from '@/components/forms/QuickForm'

// AFTER
import { BookingForm } from '@/components/forms/BookingForm'
```

Change line 173 in the right column:
```typescript
// BEFORE
<QuickForm />

// AFTER
<BookingForm />
```

Also change the wrapper `h3` title — the `BookingForm` renders its own title, so remove:
```typescript
// BEFORE (lines 169–174)
<h3 className="font-heading text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
  {t('formTitle')}
</h3>
<QuickForm />

// AFTER
<BookingForm />
```

- [ ] **Step 2: Run dev server and visually verify the form renders**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npm run dev
```

Open http://localhost:3000/ru — check:
- BookingForm card visible in Hero right column
- Address row shows placeholder text
- Vehicle row shows "Газель 1.5т" with price
- Workers +/− works inline
- Options and DateTime rows show labels
- Phone input accepts +7 prefix
- Submit button shows "Оформить за 25 000 ₸" (default: Газель + 0 workers + no options)
- Clicking address row opens AddressDrawer (full-screen)
- Clicking vehicle row opens VehicleDrawer (slides over card)
- Clicking options row opens OptionsDrawer
- Clicking datetime row opens DateTimeDrawer
- Clicking wallet button opens PaymentSheet (bottom)
- Selecting vehicle updates price in button
- Selecting options updates price in button
- Adding workers updates price (+5000 per worker)

- [ ] **Step 3: Commit**

```bash
git add components/sections/HeroSection.tsx
git commit -m "feat: replace QuickForm with BookingForm in HeroSection"
```

---

## Task 12 — Extend `/api/contact` route

**Files:**
- Modify: `app/api/contact/route.ts`

Accept `service: 'booking'` as a valid service value. The `BookingForm` sends all booking details packed into `message` field, so no structural API change is needed — only add `'booking'` to `VALID_SERVICES`.

- [ ] **Step 1: Edit `app/api/contact/route.ts`**

Change:
```typescript
// BEFORE
const VALID_SERVICES = new Set([
  'apartment', 'office', 'international', 'rigging', 'packing', 'storage',
])

// AFTER
const VALID_SERVICES = new Set([
  'apartment', 'office', 'international', 'rigging', 'packing', 'storage', 'booking',
])
```

Also increase `message` max length to 3000 (booking details are longer):
```typescript
// BEFORE
const safeMessage = typeof message === 'string' ? message : undefined

// AFTER
const safeMessage = typeof message === 'string'
  ? message.slice(0, 3000)
  : undefined
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1 | head -20
```
Expected: 0 new errors.

- [ ] **Step 3: Test API with curl**

```bash
curl -X POST http://localhost:3000/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","phone":"+77071234567","service":"booking","message":"Машина: Газель 1.5т"}'
```
Expected: `{"success":true}` or `{"error":"Failed to send email"}` (if Resend not configured — both are OK, no 400/422).

- [ ] **Step 4: Commit**

```bash
git add app/api/contact/route.ts
git commit -m "feat: add booking service type to contact API, extend message length"
```

---

## Self-Review

**Spec coverage:**
- ✅ Replaces QuickForm in Hero → Task 11
- ✅ Address step with 2GIS map → Tasks 4, 5
- ✅ Vehicle selection with specs → Task 6
- ✅ Workers counter + options → Task 7
- ✅ Date/time with calendar strip + scroll drums → Task 8
- ✅ Payment bottom sheet (cash/card) → Task 9
- ✅ Live price calculation in submit button → Task 10 (`calcBookingPrice`)
- ✅ Sends to `/api/contact` → Tasks 10, 12
- ✅ i18n (ru/kz/en) → Task 2
- ✅ CSS variables only, no hardcoded hex except error red `#ef4444` (consistent with existing codebase)

**Placeholder scan:**
- All file paths are exact
- All code blocks are complete
- No "TBD" / "TODO" patterns
- Types defined in Task 3, used consistently across Tasks 5–10

**Type consistency:**
- `BookingOptions` defined in `types.ts` (Task 3), used in `OptionsDrawer` (Task 7) and `BookingForm` (Task 10) ✅
- `ActiveDrawer` union includes all drawer keys used in `setActiveDrawer` calls ✅
- `calcBookingPrice` signature in Task 1 matches usage in Task 10 ✅
- `VEHICLES[0].id` default in `DEFAULT_BOOKING_STATE` matches first entry `'gazel-15'` ✅
