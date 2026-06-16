# Storage Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-storage rental catalog at `/[locale]/storage` — 4+ locations, filterable box grid, booking request modal, email notification via Resend.

**Architecture:** Static data file (`lib/storage-data.ts`) feeds a client-side filtered catalog. Booking submissions hit `POST /api/storage` which sends email via Resend (same pattern as `/api/contact`). No database, no online payment.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Framer Motion, next-intl, Resend, shadcn accordion, 2GIS Maps SDK

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `lib/storage-data.ts` | Types + seed data (locations & boxes) |
| Modify | `messages/ru.json` | Add `storagePage` translations |
| Modify | `messages/kz.json` | Add `storagePage` translations |
| Modify | `messages/en.json` | Add `storagePage` translations |
| Create | `app/api/storage/route.ts` | POST handler → validate → Resend email |
| Create | `app/[locale]/storage/page.tsx` | SSR page with metadata |
| Create | `components/sections/storage/StorageMap.tsx` | 2GIS map for storage locations |
| Create | `components/sections/storage/LocationTabs.tsx` | Horizontal scrollable location tabs |
| Create | `components/sections/storage/StorageFilters.tsx` | Filter bar (size/price/floor/available) |
| Create | `components/sections/storage/BoxCard.tsx` | Single box card with pricing table |
| Create | `components/sections/storage/BoxCatalog.tsx` | Filtered grid + empty state |
| Create | `components/sections/storage/BookingModal.tsx` | Bottom-sheet booking form |
| Create | `components/sections/storage/StoragePageClient.tsx` | Root client component — holds all state |

---

## Task 1: Data Layer

**Files:**
- Create: `lib/storage-data.ts`

- [ ] **Step 1: Create types and seed data**

```ts
// lib/storage-data.ts

export type BoxSize = 'S' | 'M' | 'L' | 'XL'
export type RentalDuration = 1 | 3 | 6 | 12

export interface StorageLocation {
  id: string
  name: string
  address: string
  lat: number
  lon: number
  hours: string
  phone: string
}

export interface StorageBox {
  id: string
  locationId: string
  number: string
  floor: number
  area: number        // м²
  size: BoxSize       // S<5, M<10, L<20, XL≥20
  available: boolean
  photo: string
  pricing: {
    m1: number        // ₸/мес при оплате за 1 мес
    m3: number        // ₸/мес при оплате за 3 мес
    m6: number        // ₸/мес при оплате за 6 мес
    m12: number       // ₸/мес при оплате за 12 мес
  }
}

export interface StorageFilters {
  sizes: BoxSize[]
  priceMin: number
  priceMax: number    // 0 = no upper limit
  floor: number | null
  availableOnly: boolean
}

export const DEFAULT_FILTERS: StorageFilters = {
  sizes: [],
  priceMin: 0,
  priceMax: 0,
  floor: null,
  availableOnly: false,
}

export const STORAGE_LOCATIONS: StorageLocation[] = [
  {
    id: 'bostandyk',
    name: 'Бостандык',
    address: 'пр. Достык 5, Алматы',
    lat: 43.234,
    lon: 76.969,
    hours: 'Пн–Вс 00:00–24:00',
    phone: '+7 707 709 74 22',
  },
  {
    id: 'alatau',
    name: 'Алатауский',
    address: 'ул. Момышулы 12, Алматы',
    lat: 43.315,
    lon: 76.899,
    hours: 'Пн–Вс 00:00–24:00',
    phone: '+7 707 709 74 22',
  },
  {
    id: 'medeu',
    name: 'Медеуский',
    address: 'ул. Горная 3, Алматы',
    lat: 43.194,
    lon: 76.959,
    hours: 'Пн–Вс 00:00–24:00',
    phone: '+7 707 709 74 22',
  },
  {
    id: 'zhetysu',
    name: 'Жетысуский',
    address: 'ул. Саина 42, Алматы',
    lat: 43.293,
    lon: 77.027,
    hours: 'Пн–Вс 00:00–24:00',
    phone: '+7 707 709 74 22',
  },
]

export const STORAGE_BOXES: StorageBox[] = [
  // ── Бостандык ─────────────────────────────────────
  { id: 'b-01', locationId: 'bostandyk', number: 'Бокс №01', floor: 1, area: 3, size: 'S', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 8000,  m3: 7200,  m6: 6400,  m12: 5600 } },
  { id: 'b-02', locationId: 'bostandyk', number: 'Бокс №02', floor: 1, area: 7, size: 'M', available: false, photo: '/images/storage-placeholder.jpg', pricing: { m1: 15000, m3: 13500, m6: 12000, m12: 10500 } },
  { id: 'b-03', locationId: 'bostandyk', number: 'Бокс №03', floor: 2, area: 12, size: 'L', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 28000, m3: 25200, m6: 22400, m12: 19600 } },
  { id: 'b-04', locationId: 'bostandyk', number: 'Бокс №04', floor: 2, area: 4,  size: 'S', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 8000,  m3: 7200,  m6: 6400,  m12: 5600 } },
  { id: 'b-05', locationId: 'bostandyk', number: 'Бокс №05', floor: 3, area: 25, size: 'XL', available: true, photo: '/images/storage-placeholder.jpg', pricing: { m1: 50000, m3: 45000, m6: 40000, m12: 35000 } },
  // ── Алатауский ────────────────────────────────────
  { id: 'a-01', locationId: 'alatau', number: 'Бокс №01', floor: 1, area: 4, size: 'S', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 8000,  m3: 7200,  m6: 6400,  m12: 5600 } },
  { id: 'a-02', locationId: 'alatau', number: 'Бокс №02', floor: 1, area: 9, size: 'M', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 15000, m3: 13500, m6: 12000, m12: 10500 } },
  { id: 'a-03', locationId: 'alatau', number: 'Бокс №03', floor: 2, area: 15, size: 'L', available: false, photo: '/images/storage-placeholder.jpg', pricing: { m1: 28000, m3: 25200, m6: 22400, m12: 19600 } },
  { id: 'a-04', locationId: 'alatau', number: 'Бокс №04', floor: 2, area: 6,  size: 'M', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 15000, m3: 13500, m6: 12000, m12: 10500 } },
  { id: 'a-05', locationId: 'alatau', number: 'Бокс №05', floor: 3, area: 30, size: 'XL', available: true, photo: '/images/storage-placeholder.jpg', pricing: { m1: 50000, m3: 45000, m6: 40000, m12: 35000 } },
  // ── Медеуский ─────────────────────────────────────
  { id: 'm-01', locationId: 'medeu', number: 'Бокс №01', floor: 1, area: 2, size: 'S', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 8000,  m3: 7200,  m6: 6400,  m12: 5600 } },
  { id: 'm-02', locationId: 'medeu', number: 'Бокс №02', floor: 1, area: 8, size: 'M', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 15000, m3: 13500, m6: 12000, m12: 10500 } },
  { id: 'm-03', locationId: 'medeu', number: 'Бокс №03', floor: 2, area: 18, size: 'L', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 28000, m3: 25200, m6: 22400, m12: 19600 } },
  { id: 'm-04', locationId: 'medeu', number: 'Бокс №04', floor: 1, area: 3,  size: 'S', available: false, photo: '/images/storage-placeholder.jpg', pricing: { m1: 8000,  m3: 7200,  m6: 6400,  m12: 5600 } },
  { id: 'm-05', locationId: 'medeu', number: 'Бокс №05', floor: 3, area: 22, size: 'XL', available: true, photo: '/images/storage-placeholder.jpg', pricing: { m1: 50000, m3: 45000, m6: 40000, m12: 35000 } },
  // ── Жетысуский ────────────────────────────────────
  { id: 'z-01', locationId: 'zhetysu', number: 'Бокс №01', floor: 1, area: 5, size: 'M', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 15000, m3: 13500, m6: 12000, m12: 10500 } },
  { id: 'z-02', locationId: 'zhetysu', number: 'Бокс №02', floor: 1, area: 3, size: 'S', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 8000,  m3: 7200,  m6: 6400,  m12: 5600 } },
  { id: 'z-03', locationId: 'zhetysu', number: 'Бокс №03', floor: 2, area: 14, size: 'L', available: true,  photo: '/images/storage-placeholder.jpg', pricing: { m1: 28000, m3: 25200, m6: 22400, m12: 19600 } },
  { id: 'z-04', locationId: 'zhetysu', number: 'Бокс №04', floor: 2, area: 8,  size: 'M', available: false, photo: '/images/storage-placeholder.jpg', pricing: { m1: 15000, m3: 13500, m6: 12000, m12: 10500 } },
  { id: 'z-05', locationId: 'zhetysu', number: 'Бокс №05', floor: 3, area: 35, size: 'XL', available: true, photo: '/images/storage-placeholder.jpg', pricing: { m1: 50000, m3: 45000, m6: 40000, m12: 35000 } },
]

export function filterBoxes(boxes: StorageBox[], f: StorageFilters): StorageBox[] {
  return boxes.filter(box => {
    if (f.sizes.length > 0 && !f.sizes.includes(box.size)) return false
    if (f.availableOnly && !box.available) return false
    if (f.floor !== null && box.floor !== f.floor) return false
    if (box.pricing.m1 < f.priceMin) return false
    if (f.priceMax > 0 && box.pricing.m1 > f.priceMax) return false
    return true
  })
}

export function getBoxById(id: string): StorageBox | undefined {
  return STORAGE_BOXES.find(b => b.id === id)
}

export function getLocationById(id: string): StorageLocation | undefined {
  return STORAGE_LOCATIONS.find(l => l.id === id)
}

export const VALID_BOX_IDS = new Set(STORAGE_BOXES.map(b => b.id))
export const VALID_LOCATION_IDS = new Set(STORAGE_LOCATIONS.map(l => l.id))
export const VALID_DURATIONS = new Set([1, 3, 6, 12])
```

- [ ] **Step 2: Add placeholder image**

Create a 1×1px placeholder so `next/image` doesn't throw. The file path `/images/storage-placeholder.jpg` must exist in `public/images/`.

Run:
```bash
cp /Users/kumsagat/Documents/grandpro-moving/public/images/gallery/boxes-room.jpg \
   /Users/kumsagat/Documents/grandpro-moving/public/images/storage-placeholder.jpg
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit
```
Expected: no output (zero errors).

- [ ] **Step 4: Commit**

```bash
git add lib/storage-data.ts public/images/storage-placeholder.jpg
git commit -m "feat(storage): add static data layer — locations, boxes, filter util"
```

---

## Task 2: i18n Keys

**Files:**
- Modify: `messages/ru.json`
- Modify: `messages/kz.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add `storagePage` to `messages/ru.json`**

Add the following block inside the root JSON object (before the closing `}`):

```json
"storagePage": {
  "hero": {
    "title": "Хранение вещей в Алматы",
    "subtitle": "Безопасные боксы от 2 м². Доступ 24/7. Видеонаблюдение.",
    "cta": "Выбрать бокс"
  },
  "mapTitle": "Как добраться",
  "filters": {
    "toggle": "Фильтры",
    "allSizes": "Все размеры",
    "anyFloor": "Любой этаж",
    "floor": "Этаж",
    "priceLabel": "Макс. цена",
    "priceAny": "Любая",
    "availableOnly": "Только свободные",
    "reset": "Сбросить"
  },
  "box": {
    "available": "Свободен",
    "occupied": "Занят",
    "floor": "Этаж",
    "book": "Забронировать",
    "m1": "1 мес",
    "m3": "3 мес",
    "m6": "6 мес",
    "m12": "12 мес",
    "perMonth": "/ мес"
  },
  "booking": {
    "title": "Бронирование бокса",
    "duration": "Срок аренды",
    "total": "Итого",
    "totalPerMonth": "/ мес",
    "name": "Ваше имя",
    "namePlaceholder": "Иван Иванов",
    "phone": "Номер телефона",
    "comment": "Комментарий",
    "commentPlaceholder": "Дополнительная информация...",
    "submit": "Отправить заявку",
    "submitting": "Отправляем...",
    "success": "Заявка принята! Перезвоним в течение 15 минут.",
    "error": "Не удалось отправить. Попробуйте ещё раз.",
    "phoneInvalid": "Неверный формат (+7 7XX XXX XX XX)"
  },
  "howItWorks": {
    "title": "Как это работает",
    "step1title": "Выбери бокс",
    "step1desc": "Фильтруй по размеру, цене и этажу",
    "step2title": "Оставь заявку",
    "step2desc": "Менеджер перезвонит в течение 15 минут",
    "step3title": "Подпиши договор",
    "step3desc": "При первом визите на склад",
    "step4title": "Получи доступ",
    "step4desc": "Ключ + пропуск, режим работы 24/7"
  },
  "faq": {
    "title": "Частые вопросы",
    "q1": "Какой минимальный срок аренды?",
    "a1": "Минимальный срок — 1 месяц. Вы можете продлевать аренду помесячно без ограничений.",
    "q2": "Можно ли продлить аренду онлайн?",
    "a2": "Продление оформляется по звонку менеджеру или лично при визите на склад.",
    "q3": "Есть ли видеонаблюдение и охрана?",
    "a3": "Да, все склады оснащены круглосуточным видеонаблюдением и имеют охрану на въезде.",
    "q4": "Что нельзя хранить на складе?",
    "a4": "Запрещено хранить продукты питания, взрывчатые и легковоспламеняющиеся вещества, животных и растения.",
    "q5": "Как получить доступ в нерабочее время?",
    "a5": "Все арендаторы получают персональный магнитный пропуск для круглосуточного доступа на территорию."
  },
  "empty": "По заданным фильтрам боксов не найдено. Попробуйте изменить параметры поиска."
}
```

- [ ] **Step 2: Add `storagePage` to `messages/kz.json`**

```json
"storagePage": {
  "hero": {
    "title": "Алматыда заттарды сақтау",
    "subtitle": "2 м²-ден бастап қауіпсіз боксалар. Тәулік бойы қол жетімді.",
    "cta": "Бокс таңдау"
  },
  "mapTitle": "Қалай жетуге болады",
  "filters": {
    "toggle": "Сүзгілер",
    "allSizes": "Барлық өлшемдер",
    "anyFloor": "Кез келген қабат",
    "floor": "Қабат",
    "priceLabel": "Макс. баға",
    "priceAny": "Кез келген",
    "availableOnly": "Тек бос боксалар",
    "reset": "Тазалау"
  },
  "box": {
    "available": "Бос",
    "occupied": "Бос емес",
    "floor": "Қабат",
    "book": "Брондау",
    "m1": "1 ай",
    "m3": "3 ай",
    "m6": "6 ай",
    "m12": "12 ай",
    "perMonth": "/ ай"
  },
  "booking": {
    "title": "Бокс брондау",
    "duration": "Жалдау мерзімі",
    "total": "Барлығы",
    "totalPerMonth": "/ ай",
    "name": "Сіздің атыңыз",
    "namePlaceholder": "Иван Иванов",
    "phone": "Телефон нөміріңіз",
    "comment": "Пікір",
    "commentPlaceholder": "Қосымша ақпарат...",
    "submit": "Өтінімді жіберу",
    "submitting": "Жіберілуде...",
    "success": "Өтінім қабылданды! 15 минут ішінде қоңырау шаламыз.",
    "error": "Жіберу мүмкін болмады. Қайталап көріңіз.",
    "phoneInvalid": "Формат қате (+7 7XX XXX XX XX)"
  },
  "howItWorks": {
    "title": "Бұл қалай жұмыс істейді",
    "step1title": "Бокс таңдаңыз",
    "step1desc": "Өлшем, баға және қабат бойынша сүзіңіз",
    "step2title": "Өтінім қалдырыңыз",
    "step2desc": "Менеджер 15 минут ішінде қоңырау шалады",
    "step3title": "Шартқа қол қойыңыз",
    "step3desc": "Қоймаға алғашқы келу кезінде",
    "step4title": "Қол жеткізу алыңыз",
    "step4desc": "Кілт + өткізу, 24/7 жұмыс режимі"
  },
  "faq": {
    "title": "Жиі қойылатын сұрақтар",
    "q1": "Жалдаудың ең аз мерзімі қандай?",
    "a1": "Ең аз мерзім — 1 ай. Шектеусіз ай сайын ұзарта аласыз.",
    "q2": "Жалдауды онлайн ұзартуға бола ма?",
    "a2": "Ұзарту менеджерге қоңырау арқылы немесе қоймаға келіп рәсімделеді.",
    "q3": "Бейнебақылау мен күзет бар ма?",
    "a3": "Иә, барлық қоймаларда тәулік бойы бейнебақылау және күзет бар.",
    "q4": "Қоймада не сақтауға болмайды?",
    "a4": "Тамақ өнімдерін, жарылғыш заттарды, жануарлар мен өсімдіктерді сақтауға тыйым салынады.",
    "q5": "Жұмыс уақытынан тыс кіруге бола ма?",
    "a5": "Барлық жалдаушылар аумаққа тәулік бойы кіру үшін жеке магниттік өткізгі алады."
  },
  "empty": "Берілген сүзгілер бойынша боксалар табылмады. Іздеу параметрлерін өзгертіп көріңіз."
}
```

- [ ] **Step 3: Add `storagePage` to `messages/en.json`**

```json
"storagePage": {
  "hero": {
    "title": "Storage Units in Almaty",
    "subtitle": "Secure units from 2 m². 24/7 access. CCTV surveillance.",
    "cta": "Find a Unit"
  },
  "mapTitle": "How to Get There",
  "filters": {
    "toggle": "Filters",
    "allSizes": "All Sizes",
    "anyFloor": "Any Floor",
    "floor": "Floor",
    "priceLabel": "Max Price",
    "priceAny": "Any",
    "availableOnly": "Available Only",
    "reset": "Reset"
  },
  "box": {
    "available": "Available",
    "occupied": "Occupied",
    "floor": "Floor",
    "book": "Book Now",
    "m1": "1 mo",
    "m3": "3 mo",
    "m6": "6 mo",
    "m12": "12 mo",
    "perMonth": "/ mo"
  },
  "booking": {
    "title": "Book a Unit",
    "duration": "Rental Period",
    "total": "Total",
    "totalPerMonth": "/ mo",
    "name": "Your Name",
    "namePlaceholder": "John Smith",
    "phone": "Phone Number",
    "comment": "Comment",
    "commentPlaceholder": "Additional information...",
    "submit": "Submit Request",
    "submitting": "Sending...",
    "success": "Request received! We will call you within 15 minutes.",
    "error": "Failed to send. Please try again.",
    "phoneInvalid": "Invalid format (+7 7XX XXX XX XX)"
  },
  "howItWorks": {
    "title": "How It Works",
    "step1title": "Choose a Unit",
    "step1desc": "Filter by size, price and floor",
    "step2title": "Submit a Request",
    "step2desc": "A manager calls back within 15 minutes",
    "step3title": "Sign the Contract",
    "step3desc": "On your first visit to the warehouse",
    "step4title": "Get Access",
    "step4desc": "Key + pass, 24/7 access"
  },
  "faq": {
    "title": "Frequently Asked Questions",
    "q1": "What is the minimum rental period?",
    "a1": "The minimum period is 1 month. You can extend month by month without limits.",
    "q2": "Can I extend my rental online?",
    "a2": "Extensions are arranged by calling your manager or visiting the warehouse.",
    "q3": "Is there CCTV and security?",
    "a3": "Yes, all warehouses have 24/7 CCTV and a security guard at the entrance.",
    "q4": "What cannot be stored?",
    "a4": "Food, explosives, flammable substances, animals, and plants are prohibited.",
    "q5": "Can I access the unit outside business hours?",
    "a5": "All tenants receive a personal magnetic pass for round-the-clock access."
  },
  "empty": "No units found for the selected filters. Try adjusting your search."
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add messages/ru.json messages/kz.json messages/en.json
git commit -m "feat(storage): add storagePage i18n keys (ru/kz/en)"
```

---

## Task 3: API Route

**Files:**
- Create: `app/api/storage/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/storage/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { Resend } from 'resend'
import { KZ_PHONE_RE } from '@/lib/validators'
import {
  VALID_BOX_IDS, VALID_LOCATION_IDS, VALID_DURATIONS,
  getBoxById, getLocationById,
} from '@/lib/storage-data'

function getRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    prefix: 'grandpro:storage',
  })
}

function esc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const rl = getRatelimit()
  if (rl) {
    try {
      const { success } = await rl.limit(ip)
      if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    } catch {
      // Redis unavailable — allow request through
    }
  }

  try {
    const body = await request.json()
    const { boxId, locationId, duration, name, phone, comment } = body

    // Validate types
    if (typeof name !== 'string' || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    if (!name.trim() || !phone.trim()) {
      return NextResponse.json({ error: 'Name and phone required' }, { status: 400 })
    }
    if (!KZ_PHONE_RE.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone' }, { status: 400 })
    }
    if (name.length > 200) {
      return NextResponse.json({ error: 'Name too long' }, { status: 400 })
    }
    if (!VALID_BOX_IDS.has(boxId)) {
      return NextResponse.json({ error: 'Invalid box' }, { status: 400 })
    }
    if (!VALID_LOCATION_IDS.has(locationId)) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 })
    }
    if (!VALID_DURATIONS.has(duration)) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
    }

    const box = getBoxById(boxId)!
    const location = getLocationById(locationId)!
    const priceKey = `m${duration}` as 'm1' | 'm3' | 'm6' | 'm12'
    const pricePerMonth = box.pricing[priceKey]
    const safeName = esc(name.slice(0, 200))
    const safePhone = esc(phone.slice(0, 50))
    const safeComment = typeof comment === 'string' ? esc(comment.slice(0, 1000)) : '—'

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'GrandPro Moving <onboarding@resend.dev>',
      to: [process.env.CONTACT_EMAIL ?? 'info@grandpro.kz'],
      subject: `Аренда ${box.number} (${location.name} · ${box.area} м² · ${duration} мес) — ${safeName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0369A1;">Заявка на аренду склада — GrandPro Moving</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;width:160px;">Локация</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(location.name)}, ${esc(location.address)}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Бокс</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(box.number)}, этаж ${box.floor}, ${box.area} м² (${box.size})</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Срок</td><td style="padding:8px;border-bottom:1px solid #eee;">${duration} мес → ${pricePerMonth.toLocaleString('ru-RU')} ₸/мес</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Имя</td><td style="padding:8px;border-bottom:1px solid #eee;">${safeName}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Телефон</td><td style="padding:8px;border-bottom:1px solid #eee;">${safePhone}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Комментарий</td><td style="padding:8px;border-bottom:1px solid #eee;">${safeComment}</td></tr>
          </table>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Storage booking error:', error)
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Smoke-test the API**

```bash
curl -s -X POST http://localhost:3000/api/storage \
  -H "Content-Type: application/json" \
  -d '{"boxId":"b-01","locationId":"bostandyk","duration":3,"name":"Тест","phone":"+77771234567"}'
```
Expected: `{"success":true}`

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add app/api/storage/route.ts
git commit -m "feat(storage): add POST /api/storage booking route with Resend email"
```

---

## Task 4: Static Page

**Files:**
- Create: `app/[locale]/storage/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/[locale]/storage/page.tsx
import type { Metadata } from 'next'
import { getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { BackToTop } from '@/components/ui/BackToTop'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { StoragePageClient } from '@/components/sections/storage/StoragePageClient'

export const metadata: Metadata = {
  title: 'Хранение вещей — GrandPro Moving Алматы',
  description: 'Аренда боксов для хранения вещей в Алматы. Безопасно, доступно, 24/7. Боксы от 2 м² в 4 локациях.',
  openGraph: {
    title: 'Склад и хранение — GrandPro Moving',
    description: 'Аренда боксов в Алматы. От 2 м², 4 локации, доступ 24/7.',
    url: 'https://grandpro.kz/storage',
    type: 'website',
  },
}

export default async function StoragePage() {
  const messages = await getMessages()
  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        <NextIntlClientProvider messages={messages}>
          <StoragePageClient />
        </NextIntlClientProvider>
      </main>
      <Footer />
      <BackToTop />
      <ChatWidget />
    </>
  )
}
```

- [ ] **Step 2: Verify page loads (dev server must be running)**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ru/storage
```
Expected: `200` (or `500` until StoragePageClient is created — that's fine, it means routing works).

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/storage/page.tsx
git commit -m "feat(storage): add /storage SSR page with metadata"
```

---

## Task 5: StorageMap Component

**Files:**
- Create: `components/sections/storage/StorageMap.tsx`

Note: `Map2GIS.tsx` uses a hardcoded container ID `'grandpro-2gis-map'`. `StorageMap` uses `'storage-2gis-map'` to avoid collision. It also supports re-centering when `lat`/`lon` props change (pan + move marker) without destroying the map.

- [ ] **Step 1: Create StorageMap**

```tsx
// components/sections/storage/StorageMap.tsx
'use client'
import { useEffect, useRef } from 'react'

interface StorageMapProps {
  lat: number
  lon: number
  locationName: string
  address: string
  height?: string
}

const CONTAINER_ID = 'storage-2gis-map'
const SCRIPT_ID = '2gis-api'

export function StorageMap({ lat, lon, locationName, address, height = '260px' }: StorageMapProps) {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    const popup =
      `<div style="font-family:Arial,sans-serif;padding:4px 2px">` +
      `<b style="font-size:13px;color:#0284C7">${locationName}</b><br>` +
      `<span style="font-size:12px;color:#475569">${address}</span>` +
      `</div>`

    const init = () => {
      const DG = (window as any).DG
      if (!DG) return
      DG.then(() => {
        const dg = (window as any).DG
        if (!dg) return
        const container = document.getElementById(CONTAINER_ID)
        if (!container) return

        if (mapRef.current) {
          // Map already exists — just pan and move marker
          mapRef.current.setView([lat, lon], 16)
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lon])
            markerRef.current.setPopupContent(popup).openPopup()
          }
          return
        }

        const map = dg.map(CONTAINER_ID, { center: [lat, lon], zoom: 16, fullscreenControl: false })
        mapRef.current = map
        markerRef.current = dg.marker([lat, lon])
          .addTo(map)
          .bindPopup(popup)
          .openPopup()
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
        if ((window as any).DG) { clearInterval(poll); init(); return }
        if (attempts >= 40) clearInterval(poll)
      }, 150)
      return () => clearInterval(poll)
    }

    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove() } catch {}
        mapRef.current = null
        markerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon])

  return (
    <div
      id={CONTAINER_ID}
      style={{
        width: '100%',
        height,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}
    />
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/sections/storage/StorageMap.tsx
git commit -m "feat(storage): add StorageMap component (2GIS with re-centering on location change)"
```

---

## Task 6: LocationTabs

**Files:**
- Create: `components/sections/storage/LocationTabs.tsx`

- [ ] **Step 1: Create component**

```tsx
// components/sections/storage/LocationTabs.tsx
'use client'
import { useRef } from 'react'
import type { StorageLocation } from '@/lib/storage-data'

interface LocationTabsProps {
  locations: StorageLocation[]
  activeId: string
  onChange: (id: string) => void
}

export function LocationTabs({ locations, activeId, onChange }: LocationTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {locations.map(loc => {
        const active = loc.id === activeId
        return (
          <button
            key={loc.id}
            type="button"
            onClick={() => onChange(loc.id)}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: active ? 'var(--color-primary)' : 'var(--bg-surface)',
              color: active ? '#fff' : 'var(--color-text-muted)',
              border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
            }}
          >
            {loc.name}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/sections/storage/LocationTabs.tsx
git commit -m "feat(storage): add LocationTabs component"
```

---

## Task 7: StorageFilters

**Files:**
- Create: `components/sections/storage/StorageFilters.tsx`

- [ ] **Step 1: Create component**

```tsx
// components/sections/storage/StorageFilters.tsx
'use client'
import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { StorageFilters, BoxSize } from '@/lib/storage-data'
import { DEFAULT_FILTERS } from '@/lib/storage-data'

const SIZES: BoxSize[] = ['S', 'M', 'L', 'XL']
const SIZE_LABELS: Record<BoxSize, string> = { S: 'S (<5 м²)', M: 'M (5–9 м²)', L: 'L (10–19 м²)', XL: 'XL (20+ м²)' }
const PRICE_OPTIONS = [
  { label: 'Любая', max: 0 },
  { label: 'До 10 000 ₸', max: 10000 },
  { label: 'До 20 000 ₸', max: 20000 },
  { label: 'До 40 000 ₸', max: 40000 },
]
const FLOOR_OPTIONS = [1, 2, 3]

interface StorageFiltersProps {
  filters: StorageFilters
  onChange: (f: StorageFilters) => void
}

export function StorageFilters({ filters, onChange }: StorageFiltersProps) {
  const t = useTranslations('storagePage.filters')
  const [open, setOpen] = useState(false)

  const toggleSize = (size: BoxSize) => {
    const next = filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size]
    onChange({ ...filters, sizes: next })
  }

  const isDefault =
    filters.sizes.length === 0 &&
    filters.priceMax === 0 &&
    filters.floor === null &&
    !filters.availableOnly

  const inner = (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Size pills */}
      <div className="flex gap-1.5 flex-wrap">
        {SIZES.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => toggleSize(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer"
            style={{
              background: filters.sizes.includes(s) ? 'var(--color-primary)' : 'var(--bg-surface)',
              color: filters.sizes.includes(s) ? '#fff' : 'var(--color-text-muted)',
              border: `1.5px solid ${filters.sizes.includes(s) ? 'var(--color-primary)' : 'var(--color-border)'}`,
            }}
          >
            {SIZE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Price dropdown */}
      <select
        value={filters.priceMax}
        onChange={e => onChange({ ...filters, priceMax: Number(e.target.value) })}
        className="px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
        style={{
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        {PRICE_OPTIONS.map(o => (
          <option key={o.max} value={o.max}>{o.label}</option>
        ))}
      </select>

      {/* Floor dropdown */}
      <select
        value={filters.floor ?? ''}
        onChange={e => onChange({ ...filters, floor: e.target.value ? Number(e.target.value) : null })}
        className="px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
        style={{
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        <option value="">{t('anyFloor')}</option>
        {FLOOR_OPTIONS.map(f => (
          <option key={f} value={f}>{t('floor')} {f}</option>
        ))}
      </select>

      {/* Available toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <button
          type="button"
          onClick={() => onChange({ ...filters, availableOnly: !filters.availableOnly })}
          className="w-10 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0"
          style={{ background: filters.availableOnly ? 'var(--color-primary)' : 'var(--color-border)' }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
            style={{ left: filters.availableOnly ? '18px' : '2px' }}
          />
        </button>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('availableOnly')}</span>
      </label>

      {/* Reset */}
      {!isDefault && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-primary)' }}
        >
          <X size={12} /> {t('reset')}
        </button>
      )}
    </div>
  )

  return (
    <div>
      {/* Mobile toggle */}
      <button
        type="button"
        className="sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mb-3 cursor-pointer"
        style={{
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
        onClick={() => setOpen(o => !o)}
      >
        <SlidersHorizontal size={15} />
        {t('toggle')}
        {!isDefault && (
          <span
            className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            {filters.sizes.length + (filters.priceMax > 0 ? 1 : 0) + (filters.floor !== null ? 1 : 0) + (filters.availableOnly ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Desktop: always visible */}
      <div className="hidden sm:block">{inner}</div>

      {/* Mobile: collapsible */}
      {open && <div className="sm:hidden pb-2">{inner}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/sections/storage/StorageFilters.tsx
git commit -m "feat(storage): add StorageFilters component (size/price/floor/available)"
```

---

## Task 8: BoxCard

**Files:**
- Create: `components/sections/storage/BoxCard.tsx`

- [ ] **Step 1: Create component**

```tsx
// components/sections/storage/BoxCard.tsx
'use client'
import { useTranslations } from 'next-intl'
import { MapPin } from 'lucide-react'
import type { StorageBox, RentalDuration } from '@/lib/storage-data'

interface BoxCardProps {
  box: StorageBox
  onBook: (box: StorageBox) => void
}

const DURATION_KEYS: { key: RentalDuration; label: keyof { m1: string; m3: string; m6: string; m12: string } }[] = [
  { key: 1, label: 'm1' },
  { key: 3, label: 'm3' },
  { key: 6, label: 'm6' },
  { key: 12, label: 'm12' },
]

export function BoxCard({ box, onBook }: BoxCardProps) {
  const t = useTranslations('storagePage.box')

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 12px var(--shadow-main)',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 36px var(--shadow-main)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 12px var(--shadow-main)')}
    >
      {/* Photo */}
      <div className="relative w-full" style={{ paddingBottom: '75%' }}>
        <img
          src={box.photo}
          alt={box.number}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        {/* Availability badge */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{
            background: box.available ? '#05966920' : '#DC262620',
            color: box.available ? '#059669' : '#DC2626',
            border: `1px solid ${box.available ? '#059669' : '#DC2626'}`,
          }}
        >
          {box.available ? t('available') : t('occupied')}
        </div>
        {/* Size badge */}
        <div
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          {box.size}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title row */}
        <div>
          <p className="font-heading font-bold text-base" style={{ color: 'var(--color-text)' }}>
            {box.number}
          </p>
          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
            <MapPin size={11} />
            {t('floor')} {box.floor} · {box.area} м²
          </p>
        </div>

        {/* Pricing table */}
        <div className="flex flex-col gap-1.5">
          {DURATION_KEYS.map(({ key, label }, i) => {
            const price = box.pricing[`m${key}` as keyof typeof box.pricing]
            const isBase = i === 0
            return (
              <div
                key={key}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                style={{
                  background: isBase ? 'var(--active-badge)' : 'transparent',
                  border: isBase ? '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)' : 'none',
                }}
              >
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {t(label)}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: isBase ? 'var(--color-primary)' : 'var(--color-text)' }}
                >
                  {price.toLocaleString('ru-RU')} ₸ {t('perMonth')}
                </span>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <button
          type="button"
          disabled={!box.available}
          onClick={() => onBook(box)}
          className="mt-auto w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--gradient-primary)', color: '#fff' }}
        >
          {t('book')} →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/sections/storage/BoxCard.tsx
git commit -m "feat(storage): add BoxCard component with pricing table"
```

---

## Task 9: BoxCatalog

**Files:**
- Create: `components/sections/storage/BoxCatalog.tsx`

- [ ] **Step 1: Create component**

```tsx
// components/sections/storage/BoxCatalog.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { PackageOpen } from 'lucide-react'
import type { StorageBox, StorageFilters } from '@/lib/storage-data'
import { filterBoxes } from '@/lib/storage-data'
import { BoxCard } from './BoxCard'

interface BoxCatalogProps {
  boxes: StorageBox[]
  filters: StorageFilters
  onBook: (box: StorageBox) => void
}

export function BoxCatalog({ boxes, filters, onBook }: BoxCatalogProps) {
  const t = useTranslations('storagePage')
  const visible = filterBoxes(boxes, filters)

  return (
    <div>
      <AnimatePresence mode="wait">
        {visible.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          >
            <PackageOpen size={48} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
            <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('empty')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {visible.map((box, i) => (
              <motion.div
                key={box.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
              >
                <BoxCard box={box} onBook={onBook} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/sections/storage/BoxCatalog.tsx
git commit -m "feat(storage): add BoxCatalog with animated grid and empty state"
```

---

## Task 10: BookingModal

**Files:**
- Create: `components/sections/storage/BookingModal.tsx`

- [ ] **Step 1: Create component**

```tsx
// components/sections/storage/BookingModal.tsx
'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { StorageBox, StorageLocation, RentalDuration } from '@/lib/storage-data'
import { KZ_PHONE_RE } from '@/lib/validators'

interface BookingModalProps {
  box: StorageBox
  location: StorageLocation
  onClose: () => void
}

const DURATIONS: RentalDuration[] = [1, 3, 6, 12]

export function BookingModal({ box, location, onClose }: BookingModalProps) {
  const t = useTranslations('storagePage.booking')
  const tBox = useTranslations('storagePage.box')

  const [duration, setDuration] = useState<RentalDuration>(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+7')
  const [comment, setComment] = useState('')
  const [nameError, setNameError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const submittingRef = useRef(false)

  const priceKey = `m${duration}` as keyof typeof box.pricing
  const pricePerMonth = box.pricing[priceKey]
  const durationLabel = tBox(`m${duration}` as 'm1' | 'm3' | 'm6' | 'm12')

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value
    if (!v.startsWith('+7')) {
      if (v.startsWith('8'))       v = '+7' + v.slice(1)
      else if (v.startsWith('77')) v = '+' + v
      else                         v = '+7' + v
    }
    if (v.length < 2) v = '+7'
    setPhone(v)
    if (phoneError) setPhoneError(false)
  }

  async function handleSubmit() {
    const nameOk = name.trim().length > 0
    const phoneOk = KZ_PHONE_RE.test(phone)
    setNameError(!nameOk)
    setPhoneError(!phoneOk)
    if (!nameOk || !phoneOk) return
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setSubmitError(false)
    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId: box.id, locationId: location.id, duration, name, phone, comment }),
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

  const inputStyle = (hasError: boolean) => ({
    background: 'var(--bg-surface)',
    border: `1.5px solid ${hasError ? '#DC2626' : 'var(--color-border)'}`,
    color: 'var(--color-text)',
  })

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — bottom on mobile, centered on desktop */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[1001] pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:pb-6 max-h-[90vh] overflow-y-auto"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 -20px 60px var(--shadow-main)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-heading font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                {t('title')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {box.number} · {location.name} · {box.area} м²
              </p>
            </div>
            <button
              type="button" onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{ background: 'var(--bg-surface-elevated)', color: 'var(--color-text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>

          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle size={48} className="mx-auto mb-3" style={{ color: '#059669' }} />
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{t('success')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Duration selector */}
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {t('duration')}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {DURATIONS.map(d => {
                    const pk = `m${d}` as keyof typeof box.pricing
                    const active = d === duration
                    return (
                      <button
                        key={d} type="button"
                        onClick={() => setDuration(d)}
                        className="py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer"
                        style={{
                          background: active ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
                          color: active ? '#fff' : 'var(--color-text-muted)',
                          border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        }}
                      >
                        {tBox(`m${d}` as 'm1' | 'm3' | 'm6' | 'm12')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Total */}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'var(--active-badge)', border: '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {t('total')}
                </span>
                <span className="font-heading font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
                  {pricePerMonth.toLocaleString('ru-RU')} ₸ {t('totalPerMonth')}
                </span>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {t('name')} <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text" value={name}
                  onChange={e => { setName(e.target.value); if (nameError) setNameError(false) }}
                  placeholder={t('namePlaceholder')}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle(nameError)}
                  onFocus={e => (e.currentTarget.style.borderColor = nameError ? '#DC2626' : 'var(--color-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = nameError ? '#DC2626' : 'var(--color-border)')}
                />
                {nameError && <p className="text-xs" style={{ color: '#DC2626' }}>{t('name')} — обязательное поле</p>}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {t('phone')} <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="tel" value={phone}
                  onChange={handlePhoneChange}
                  onBlur={() => { if (phone !== '+7') setPhoneError(!KZ_PHONE_RE.test(phone)) }}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle(phoneError)}
                  onFocus={e => (e.currentTarget.style.borderColor = phoneError ? '#DC2626' : 'var(--color-primary)')}
                />
                {phoneError && <p className="text-xs" style={{ color: '#DC2626' }}>{t('phoneInvalid')}</p>}
              </div>

              {/* Comment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {t('comment')}
                </label>
                <textarea
                  value={comment} onChange={e => setComment(e.target.value)}
                  placeholder={t('commentPlaceholder')} rows={2}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                  style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                />
              </div>

              {submitError && (
                <p className="text-xs text-center" style={{ color: '#DC2626' }}>{t('error')}</p>
              )}

              <button
                type="button" onClick={handleSubmit} disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'var(--gradient-primary)' }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? t('submitting') : t('submit')}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/sections/storage/BookingModal.tsx
git commit -m "feat(storage): add BookingModal (bottom-sheet on mobile, centered on desktop)"
```

---

## Task 11: StoragePageClient — Main Assembly

**Files:**
- Create: `components/sections/storage/StoragePageClient.tsx`

- [ ] **Step 1: Create root client component**

```tsx
// components/sections/storage/StoragePageClient.tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ArrowRight, Phone, Clock, MapPin } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import {
  STORAGE_LOCATIONS, STORAGE_BOXES,
  DEFAULT_FILTERS, getLocationById,
  type StorageBox, type StorageFilters,
} from '@/lib/storage-data'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { LocationTabs } from './LocationTabs'
import { StorageMap } from './StorageMap'
import { StorageFilters as FiltersBar } from './StorageFilters'
import { BoxCatalog } from './BoxCatalog'
import { BookingModal } from './BookingModal'

const HOW_STEPS = ['1', '2', '3', '4'] as const

export function StoragePageClient() {
  const t = useTranslations('storagePage')
  const [activeLocationId, setActiveLocationId] = useState(STORAGE_LOCATIONS[0].id)
  const [filters, setFilters] = useState<StorageFilters>(DEFAULT_FILTERS)
  const [selectedBox, setSelectedBox] = useState<StorageBox | null>(null)

  const activeLocation = getLocationById(activeLocationId)!
  const locationBoxes = STORAGE_BOXES.filter(b => b.locationId === activeLocationId)

  function handleLocationChange(id: string) {
    setActiveLocationId(id)
    setFilters(DEFAULT_FILTERS)
  }

  return (
    <>
      {/* ── Hero ── */}
      <section
        className="pt-28 pb-12 px-4 sm:pt-36 sm:pb-16 sm:px-6 text-center"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 tracking-tight"
            style={{ color: 'var(--color-text)' }}
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-base sm:text-lg mb-8 max-w-xl mx-auto"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.a
            href="#catalog"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl font-bold text-white"
            style={{ background: 'var(--gradient-primary)' }}
          >
            {t('hero.cta')} <ArrowRight size={18} />
          </motion.a>
        </div>
      </section>

      {/* ── Location tabs + Map ── */}
      <section className="py-10 px-4 sm:px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-[1280px] mx-auto flex flex-col gap-5">
          <LocationTabs
            locations={STORAGE_LOCATIONS}
            activeId={activeLocationId}
            onChange={handleLocationChange}
          />

          <div className="grid sm:grid-cols-[1fr_300px] gap-5 items-start">
            <StorageMap
              lat={activeLocation.lat}
              lon={activeLocation.lon}
              locationName={activeLocation.name}
              address={activeLocation.address}
              height="260px"
            />
            <div
              className="flex flex-col gap-3 p-5 rounded-2xl"
              style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--color-border)' }}
            >
              <p className="font-heading font-bold text-base" style={{ color: 'var(--color-text)' }}>
                {t('mapTitle')}
              </p>
              <div className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <MapPin size={15} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                {activeLocation.address}
              </div>
              <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <Clock size={15} className="flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                {activeLocation.hours}
              </div>
              <a
                href={`tel:${activeLocation.phone}`}
                className="flex items-center gap-2.5 text-sm font-semibold"
                style={{ color: 'var(--color-primary)' }}
              >
                <Phone size={15} />
                {activeLocation.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Catalog ── */}
      <section id="catalog" className="py-12 px-4 sm:py-16 sm:px-6" style={{ background: 'var(--bg-main)' }}>
        <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
          <FiltersBar filters={filters} onChange={setFilters} />
          <BoxCatalog boxes={locationBoxes} filters={filters} onBook={setSelectedBox} />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-14 px-4 sm:py-20 sm:px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-[1280px] mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-center mb-10" style={{ color: 'var(--color-text)' }}>
            {t('howItWorks.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((n, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }} transition={{ delay: i * 0.1 }}
                className="flex flex-col gap-3 p-6 rounded-2xl"
                style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--color-border)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-extrabold text-lg text-white flex-shrink-0"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {n}
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                  {t(`howItWorks.step${n}title` as any)}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {t(`howItWorks.step${n}desc` as any)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 px-4 sm:py-20 sm:px-6" style={{ background: 'var(--bg-main)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-center mb-10" style={{ color: 'var(--color-text)' }}>
            {t('faq.title')}
          </h2>
          <Accordion>
            {(['1','2','3','4','5'] as const).map(n => (
              <AccordionItem key={n} value={n} style={{ borderColor: 'var(--color-border)' }}>
                <AccordionTrigger style={{ color: 'var(--color-text)' }}>
                  {t(`faq.q${n}` as any)}
                </AccordionTrigger>
                <AccordionContent style={{ color: 'var(--color-text-muted)' }}>
                  {t(`faq.a${n}` as any)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Booking Modal ── */}
      <AnimatePresence>
        {selectedBox && (
          <BookingModal
            box={selectedBox}
            location={getLocationById(selectedBox.locationId)!}
            onClose={() => setSelectedBox(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/sections/storage/StoragePageClient.tsx
git commit -m "feat(storage): assemble StoragePageClient — catalog, map, modal, FAQ"
```

---

## Task 12: Smoke Test

- [ ] **Step 1: Verify page loads on desktop**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const errors = [];
  const b = await chromium.launch();
  const p = await b.newPage();
  p.on('pageerror', e => errors.push(e.message));
  await p.goto('http://localhost:3000/ru/storage', { waitUntil: 'networkidle' });
  await p.screenshot({ path: '/tmp/storage-desktop.png', fullPage: false });
  console.log('Errors:', errors.length ? errors.join('\n') : 'none');
  await b.close();
})();
"
```
Expected: `Errors: none`, screenshot shows hero + catalog.

- [ ] **Step 2: Verify page on mobile**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto('http://localhost:3000/ru/storage', { waitUntil: 'networkidle' });
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/storage-mobile.png', fullPage: true });
  await b.close();
  console.log('done');
})();
"
```
Expected: all sections visible, no overflow.

- [ ] **Step 3: Test booking flow**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('http://localhost:3000/ru/storage', { waitUntil: 'networkidle' });
  // Click first available box's Book button
  await p.click('button:has-text(\"Забронировать\")');
  await p.waitForTimeout(400);
  await p.fill('input[placeholder=\"Иван Иванов\"]', 'Тест Тестов');
  await p.fill('input[type=\"tel\"]', '+77771234567');
  await p.click('button:has-text(\"Отправить заявку\")');
  await p.waitForTimeout(2500);
  await p.screenshot({ path: '/tmp/storage-booking-success.png' });
  await b.close();
  console.log('done');
})();
"
```
Expected: screenshot shows success state in modal.

- [ ] **Step 4: Final TypeScript check**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(storage): complete storage rental page — catalog, filters, map, booking modal"
```
