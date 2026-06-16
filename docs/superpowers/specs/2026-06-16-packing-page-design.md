# Packing Page — Product Catalog Design

**Date:** 2026-06-16
**Status:** Approved

---

## Goal

Build a product catalog page at `/[locale]/packing` where users can browse moving supplies (stretch film, boxes, bubble wrap, tools), add items to a persistent cart, and place an order (cash on delivery / pickup) via a form that sends an email notification.

---

## Architecture

Static product data in `lib/packing-data.ts` (no database). Cart state managed with `useReducer` + `useEffect` persisted to `localStorage`. Order submission hits `POST /api/packing` which validates the payload and sends an HTML email via Resend. No online payment — delivery options are self-pickup or Almaty courier delivery.

**Tech stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind v4, Framer Motion v12, next-intl v4, Resend, Upstash Redis (rate limiting).

---

## Data Layer — `lib/packing-data.ts`

### Types

```ts
export type PackingCategory = 'film' | 'boxes' | 'protection' | 'tools'

export interface PackingProduct {
  id: string
  category: PackingCategory
  name: string          // "Стрейч-плёнка 500мм × 300м"
  description: string   // short, 1 sentence
  price: number         // KZT per unit
  unit: string          // "рул." | "шт." | "уп." | "пара"
  images: string[]      // array of /images/packing/ paths; first = main
  inStock: boolean
  popular?: boolean     // shows "Хит" badge
}

export type CartItem = {
  product: PackingProduct
  qty: number
}
```

### Categories (4)

| id | RU label |
|----|----------|
| `film` | Плёнки и скотч |
| `boxes` | Коробки |
| `protection` | Защита мебели |
| `tools` | Инструменты |

### Seed products (~20 items, spread across categories)

**film (5):**
- `film-stretch-500` — Стрейч-плёнка 500мм × 300м, 1 200 ₸/рул., popular
- `film-stretch-200` — Стрейч-плёнка 200мм × 150м, 650 ₸/рул.
- `tape-packing-50` — Скотч упаковочный 50мм × 66м, 320 ₸/шт., popular
- `tape-painter-25` — Малярный скотч 25мм × 50м, 280 ₸/шт.
- `tape-double-side` — Двусторонний скотч 50мм × 25м, 450 ₸/шт.

**boxes (5):**
- `box-s` — Коробка S (30×20×20 см), 350 ₸/шт.
- `box-m` — Коробка M (40×30×30 см), 520 ₸/шт., popular
- `box-l` — Коробка L (60×40×40 см), 750 ₸/шт.
- `box-xl` — Коробка XL (80×50×50 см), 950 ₸/шт.
- `box-wardrobe` — Телескопическая коробка для одежды, 1 400 ₸/шт.

**protection (5):**
- `bubble-wrap-100` — Пупырчатая плёнка 100м × 50см, 2 800 ₸/рул., popular
- `bubble-wrap-50` — Пупырчатая плёнка 50м × 50см, 1 500 ₸/рул.
- `foam-roll` — Вспененный полиэтилен 50м × 1м, 1 900 ₸/рул.
- `corner-plastic` — Пластиковые уголки для мебели (уп. 50 шт.), 800 ₸/уп.
- `furniture-cover` — Чехол для мебели (диван/кресло), 1 100 ₸/шт.

**tools (5):**
- `straps-pair` — Стяжные ремни 5м (2 шт.), 1 600 ₸/пара, popular
- `gloves-xl` — Рабочие перчатки XL (уп. 10 пар), 900 ₸/уп.
- `gloves-l` — Рабочие перчатки L (уп. 10 пар), 900 ₸/уп.
- `marker-black` — Маркер для коробок (чёрный), 180 ₸/шт.
- `cutter-retract` — Нож-резак выдвижной, 350 ₸/шт.

### Exports

```ts
export const PACKING_CATEGORIES: { id: PackingCategory; labelKey: string }[]
export const PACKING_PRODUCTS: PackingProduct[]
export function getProductById(id: string): PackingProduct | undefined
export const VALID_PRODUCT_IDS: Set<string>
```

---

## Cart Hook — `hooks/useCart.ts`

```ts
type CartAction =
  | { type: 'ADD_ITEM';    product: PackingProduct }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_QTY';  id: string; qty: number }  // qty=0 removes
  | { type: 'CLEAR' }

export function useCart(): {
  items: CartItem[]
  addItem: (product: PackingProduct, qty?: number) => void  // qty defaults to 1
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  total: number   // sum of price × qty
  count: number   // sum of all qty values
}
```

**localStorage key:** `'grandpro:packing:cart'`

**Hydration safety:** initial state is always `[]`; `useEffect` on mount loads from localStorage and dispatches a synthetic action to populate. This prevents SSR/client mismatch.

**ADD_ITEM logic:** if item already in cart → increment qty by 1; otherwise append `{ product, qty: 1 }`.

**UPDATE_QTY(qty=0):** treated as REMOVE_ITEM.

---

## Page — `app/[locale]/packing/page.tsx`

- `generateMetadata({ params })` — locale-aware title/description (ru/kz/en), OG URL includes locale segment: `https://grandpro.kz/${locale}/packing`
- Renders: `<ScrollProgress />`, `<Header />`, `<main><PackingPageClient /></main>`, `<Footer />`, `<BackToTop />`, `<ChatWidget />`
- No `getMessages()` / `NextIntlClientProvider` — root layout provides it

---

## Components — `components/sections/packing/`

### PackingPageClient.tsx

Root client component. State:
- `activeCategory: PackingCategory | 'all'` (default `'all'`)
- `cartOpen: boolean` (default `false`)
- `const cart = useCart()`

Renders: hero section → CategoryTabs → ProductGrid → CartFab → CartDrawer (inside AnimatePresence).

### CategoryTabs.tsx

Props: `{ active: PackingCategory | 'all'; onChange: (c: PackingCategory | 'all') => void }`

Horizontally scrollable tabs (hidden scrollbar). Tabs: "Все" + one per category. Active tab highlighted with `var(--color-primary)`. Auto-scrolls active tab into view on change (`scrollIntoView({ behavior: 'smooth', inline: 'center' })`).

### ProductGrid.tsx

Props: `{ products: PackingProduct[]; onAddItem: (p: PackingProduct) => void }`

Filters `PACKING_PRODUCTS` by `activeCategory` (all → no filter). Passes filtered list to grid. `AnimatePresence mode="wait"` wraps the grid — entire grid fades when category changes. Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5`. Per-card stagger: `delay: i * 0.04`.

Empty state (no products in category): centered message with icon.

### ProductCard.tsx

Props: `{ product: PackingProduct; onAdd: (p: PackingProduct) => void }`

Layout:
```
┌─────────────────────────┐
│  ← [  photo  ] →  •○○  │  ← image slider (aspect 4:3)
│  [Хит]                  │  ← popular badge (if popular)
│  Стрейч-плёнка 500мм    │  ← name
│  для мебели и техники   │  ← description
│  1 200 ₸ / рул.        │  ← price + unit
│  [−] 2 [+]  [В корзину]│  ← qty control + add button
└─────────────────────────┘
```

**Image slider:**
- State: `photoIndex: number` (default 0)
- `←` / `→` buttons (absolute positioned, visible on hover on desktop, always on mobile)
- Dot indicators below image (clickable)
- Touch swipe: `onTouchStart` / `onTouchEnd` track `deltaX`; swipe >50px → change photo
- If `images.length === 1` → no arrows/dots rendered

**Qty control:**
- Local state `qty: number` (default 1)
- `−` button: `qty > 1 ? qty-- : noop` (cannot go below 1 here; removal happens in cart)
- `+` button: `qty++`
- "В корзину" calls `onAdd(product)` with current qty by dispatching `qty` times — actually: better to pass qty to `addItem`. So `addItem` accepts optional `qty` param, or `PackingPageClient` calls `addItem` in a loop. Simplest: `addItem` adds 1 at a time, "В корзину" calls it `qty` times. OR: extend `ADD_ITEM` action to include `qty`.

**ADD_ITEM action:** `{ type: 'ADD_ITEM'; product: PackingProduct; qty: number }`. If item exists → `existing.qty += qty`. If new → append `{ product, qty }`. `addItem(product, qty?)` passes `qty ?? 1`.

**Out of stock:** `inStock: false` → button disabled, shows "Нет в наличии" badge instead of "Хит".

### CartFab.tsx

Props: `{ count: number; onClick: () => void }`

Fixed position: `bottom-6 right-6` (above BackToTop/ChatWidget z-index). Shopping cart icon + badge showing `count`. Hidden when `count === 0` (AnimatePresence scale animation on appear/disappear). On click: opens CartDrawer.

**Z-index:** `z-[900]` (below modals at 1000+).

### CartDrawer.tsx

Props: `{ open: boolean; onClose: () => void; cart: ReturnType<typeof useCart> }`

**Layout:** fixed right panel, full height, `w-full sm:w-[420px]`. Slides in from right: `initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}`. Backdrop: full-screen overlay behind panel.

**Sections:**
1. Header: "Корзина" + count badge + ✕ close button
2. Items list (scrollable): each item shows name, unit price, `−` qty `+`, subtotal, trash icon
3. Divider + total line
4. Checkout form (always visible below items, not a separate step):
   - Имя * (text input)
   - Телефон * (tel input, same +7 normalisation as BookingModal)
   - Способ получения: toggle — Самовывоз | Доставка (role="switch")
   - If Доставка: Адрес * (text input, required)
   - Комментарий (textarea, optional)
   - "Оформить заказ" button
5. Success state: checkmark + "Заказ принят! Перезвоним в течение 15 минут." + "Продолжить покупки" button (closes drawer, cart already cleared)

**Double-submit guard:** `submittingRef = useRef(false)`.

**Escape key:** closes drawer when not loading.

**Focus management:** first input focuses on open.

**ARIA:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="cart-dialog-title"`.

**Empty cart state:** if `items.length === 0` and not submitted, show centered empty state ("Корзина пуста") with illustration/icon.

---

## API — `app/api/packing/route.ts`

### Validation (in order)

1. `typeof name !== 'string' || typeof phone !== 'string'` → 400
2. `!Array.isArray(items) || items.length === 0` → 400
3. `typeof deliveryType !== 'string' || !['pickup','delivery'].includes(deliveryType)` → 400
4. Trim name/phone; check non-empty → 400
5. KZ_PHONE_RE test → 400
6. Length caps: name >200, phone >50 → 400
7. Per item: `typeof item.id !== 'string' || typeof item.qty !== 'number' || item.qty < 1 || !Number.isInteger(item.qty)` → 400
8. `!VALID_PRODUCT_IDS.has(item.id)` → 400
9. `deliveryType === 'delivery' && (!address || typeof address !== 'string' || !address.trim())` → 400
10. Address length >500 → 400
11. Comment (optional) slice to 1000 chars server-side

### Rate limiting

`grandpro:packing` prefix. Upstash slidingWindow. Graceful fallback if env vars missing.

### HTML email (Resend)

```
Subject: Заказ упаковочных материалов — {name}

Table: Товар | Кол-во | Цена | Сумма
...rows...
ИТОГО: X ₸

Контакт: {name}, {phone}
Способ: Самовывоз / Доставка по адресу: {address}
Комментарий: {comment}
```

All user-supplied strings HTML-escaped with `esc()` (same as `/api/storage`).

### Response

- `200 { success: true }` on success
- `400 { error: string }` on validation failure
- `409` — not used (no availability check)
- `429` — rate limited
- `500` — internal error

---

## i18n — `packingPage` block (ru/kz/en)

Keys:
- `hero.title`, `hero.subtitle`
- `tabs.all`, `tabs.film`, `tabs.boxes`, `tabs.protection`, `tabs.tools`
- `product.hit`, `product.inStock`, `product.outOfStock`, `product.addToCart`, `product.perUnit`, `product.piece`
- `cart.title`, `cart.empty`, `cart.total`, `cart.item`, `cart.remove`
- `form.name`, `form.namePlaceholder`, `form.phone`, `form.deliveryType`, `form.pickup`, `form.delivery`, `form.address`, `form.addressPlaceholder`, `form.comment`, `form.commentPlaceholder`, `form.submit`, `form.submitting`, `form.success`, `form.successCta`, `form.error`, `form.phoneInvalid`, `form.nameRequired`, `form.addressRequired`, `form.closeLabel`

---

## File Map

| Action | Path |
|--------|------|
| Create | `lib/packing-data.ts` |
| Create | `hooks/useCart.ts` |
| Create | `app/api/packing/route.ts` |
| Create | `app/[locale]/packing/page.tsx` |
| Create | `components/sections/packing/PackingPageClient.tsx` |
| Create | `components/sections/packing/CategoryTabs.tsx` |
| Create | `components/sections/packing/ProductGrid.tsx` |
| Create | `components/sections/packing/ProductCard.tsx` |
| Create | `components/sections/packing/CartFab.tsx` |
| Create | `components/sections/packing/CartDrawer.tsx` |
| Modify | `messages/ru.json` |
| Modify | `messages/kz.json` |
| Modify | `messages/en.json` |

---

## CSS Variables Used

Same as rest of project: `--color-primary`, `--color-text`, `--color-text-muted`, `--color-border`, `--bg-surface`, `--bg-surface-elevated`, `--bg-main`, `--gradient-primary`, `--gradient-hero`, `--shadow-main`, `--active-badge`.

---

## Out of Scope

- Real payment processing
- Order history / user accounts
- Stock management / real inventory
- Admin panel
- Delivery price calculation
