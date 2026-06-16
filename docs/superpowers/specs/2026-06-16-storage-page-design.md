# Storage Page Design — GrandPro Moving

**Date:** 2026-06-16  
**URL:** `/[locale]/storage`  
**Type:** Self-storage rental catalog with booking request flow

---

## Overview

A catalog page where clients browse real storage boxes across 4+ warehouse locations in Almaty, filter by size/price/floor/availability, and submit a booking request (name + phone). A manager calls back to confirm; no online payment.

---

## Page Structure (top → bottom)

1. **Hero** — title, subtitle, CTA "Выбрать бокс" (scroll to catalog)
2. **Location Tabs** — horizontal scrollable tabs, one per warehouse location
3. **Map + Info** — 2GIS map (reuses `Map2GIS.tsx` key) with active location pin; address, working hours, phone alongside
4. **Filter Bar** — size, price range, floor, availability toggle
5. **Box Catalog** — responsive grid of `BoxCard` components; empty state if no results
6. **How It Works** — 4-step process strip
7. **FAQ** — 5 questions using existing `accordion.tsx` (shadcn)

---

## Data Architecture

Static file `lib/storage-data.ts` — no database. Content manager edits this file to add/remove boxes or locations. CMS migration is out of scope.

### Types

```ts
interface StorageLocation {
  id: string
  name: string       // "Бостандык"
  address: string    // full street address
  lat: number
  lon: number
  hours: string      // "Пн–Вс 00:00–24:00"
  phone: string
}

interface StorageBox {
  id: string
  locationId: string
  number: string           // "Бокс №12"
  floor: number
  area: number             // м²
  size: 'S' | 'M' | 'L' | 'XL'  // S<5м², M<10м², L<20м², XL≥20м²
  available: boolean
  photo: string            // placeholder path; real photos added post-launch
  pricing: {
    m1: number    // 1 month price (₸)
    m3: number    // per month when paying 3 months
    m6: number    // per month when paying 6 months
    m12: number   // per month when paying 12 months
  }
}
```

### Seed data

`storage-data.ts` ships with 4 placeholder locations and ~5 sample boxes each (mix of sizes, floors, available/occupied). Real data filled by content manager before launch.

---

## Components

```
app/[locale]/storage/
  page.tsx                     — SSR, metadata (title/OG), loads messages

components/sections/storage/
  StoragePageClient.tsx        — client root; holds activeLocationId, filters, selectedBox state
  LocationTabs.tsx             — horizontal scrollable tab strip
  StorageMap.tsx               — Map2GIS wrapper fixed to active location coords
  StorageFilters.tsx           — filter bar (desktop: inline row; mobile: collapsible sheet)
  BoxCatalog.tsx               — filtered grid + empty state
  BoxCard.tsx                  — box card with photo, details, pricing table, CTA
  BookingModal.tsx             — bottom-sheet modal: box summary + duration selector + name/phone form

lib/
  storage-data.ts              — static location and box data

app/api/storage/
  route.ts                     — POST handler: validate → send Resend email → return {success}
```

---

## State (StoragePageClient)

| State | Type | Description |
|---|---|---|
| `activeLocationId` | `string` | Which location tab is selected |
| `filters` | `StorageFilters` | `{ sizes: ('S'\|'M'\|'L'\|'XL')[], priceMin: number, priceMax: number, floor: number \| null, availableOnly: boolean }` |
| `selectedBox` | `StorageBox \| null` | Box open in BookingModal; null = modal closed |

Filtering happens client-side (no server requests) — data is static and small.

---

## BoxCard

Shows per card:
- Photo (4:3 ratio, placeholder)
- Availability badge (green "Свободен" / red "Занят")
- Box number, floor, area (м²), size category
- Pricing table: 4 rows (1/3/6/12 мес) with per-month price; shortest term highlighted
- "Забронировать →" button — disabled + muted when occupied

---

## BookingModal (bottom sheet on mobile, centered modal on desktop)

Content:
- Box summary: number, location name, area
- Duration selector: pill buttons `[1 мес] [3 мес] [6 мес] [12 мес]`
- Total price (updates on duration change)
- Name field (required)
- Phone field (required, KZ regex validation — reuses `KZ_PHONE_RE` from `lib/validators.ts`)
- Comment field (optional)
- Submit button → POST `/api/storage`
- Success / error states

---

## API `/api/storage`

**Method:** POST  
**Pattern:** Identical to `/api/contact` and `/api/services`.

**Request body:**
```ts
{
  boxId: string
  locationId: string
  duration: 1 | 3 | 6 | 12   // months
  name: string
  phone: string
  comment?: string
}
```

**Validation:**
- `name`: non-empty string, max 200 chars
- `phone`: matches `KZ_PHONE_RE`
- `boxId` / `locationId`: must exist in `storage-data.ts` enum
- `duration`: must be one of [1, 3, 6, 12]

**Rate limiting:** Upstash Redis slidingWindow(5, '60s') with graceful fallback on auth error (same pattern as fixed in `/api/contact`).

**Email via Resend** (to `CONTACT_EMAIL`):
```
Subject: Аренда бокса №12 (Бостандык • 6 м² • 3 мес) — Иван Иванов

Локация:   Бостандык, ул. Примерная 1
Бокс:      №12, этаж 2, 6 м² (M)
Срок:      3 месяца → 13 000 ₸/мес
Имя:       Иван Иванов
Телефон:   +7 777 123 45 67
Комментарий: —
```

---

## Mobile Adaptations

| Element | Desktop | Mobile |
|---|---|---|
| Location tabs | full row | `overflow-x: auto` horizontal scroll |
| Map | 320px height, alongside address info | full width, 200px height, address below |
| Filter bar | inline horizontal row | "Фильтры ▼" button → collapsible panel |
| Box catalog | 3 columns | 1 column (2 on tablet ≥640px) |
| BookingModal | centered dialog | bottom sheet (slides up) |

---

## «Как это работает» — 4 steps

1. **Выбери бокс** — фильтруй по размеру, цене, этажу
2. **Оставь заявку** — менеджер перезвонит в течение 15 минут
3. **Подпиши договор** — при первом визите на склад
4. **Получи доступ** — ключ + пропуск, режим работы 24/7

---

## FAQ (5 questions, using existing `accordion.tsx`)

1. Какой минимальный срок аренды?
2. Можно ли продлить аренду онлайн?
3. Есть ли видеонаблюдение и охрана?
4. Что нельзя хранить на складе?
5. Как получить доступ в нерабочее время?

---

## i18n

New key `storagePage` added to `messages/ru.json`, `messages/kz.json`, `messages/en.json`. All hardcoded strings in components go through `useTranslations('storagePage')`.

---

## Out of Scope

- Online payment (Kaspi / card)
- Real-time availability (box status is static in data file)
- Admin panel for managing boxes
- Individual location sub-pages (`/storage/bostandyk`)
- CMS integration

---

## Team Roles

| Role | Responsibility |
|---|---|
| **PM** | Prioritize tasks, coordinate content collection, sign off on launch |
| **Next.js Developer** | `app/[locale]/storage/page.tsx`, API route, i18n keys, routing |
| **UI/UX Developer** | All storage components, mobile adaptations, animations |
| **Content Manager** | Fill `storage-data.ts` with real locations, addresses, coordinates, box counts and prices |
| **Photographer** | Real photos of warehouse boxes (post-launch, replaces placeholders) |
