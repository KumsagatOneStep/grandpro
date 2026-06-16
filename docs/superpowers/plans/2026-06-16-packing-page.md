# Packing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/[locale]/packing` — a moving-supplies catalog with image-slider product cards, category tabs, a localStorage-persisted cart drawer, and order submission via `POST /api/packing` → Resend email.

**Architecture:** Static product data in `lib/packing-data.ts`. Cart managed with `useReducer` + two `useEffect`s (load from / save to `localStorage`). Order form lives inside `CartDrawer` — no separate checkout page. Same email pattern as `/api/storage`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind v4, Framer Motion v12, next-intl v4, Resend, Upstash Redis (rate limiting), Lucide icons.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/packing-data.ts` | Types + 20 seed products |
| Create | `hooks/useCart.ts` | useReducer cart + localStorage |
| Modify | `messages/ru.json` | Add `packingPage` block |
| Modify | `messages/kz.json` | Add `packingPage` block |
| Modify | `messages/en.json` | Add `packingPage` block |
| Create | `app/api/packing/route.ts` | POST → validate → Resend |
| Create | `app/[locale]/packing/page.tsx` | SSR page + generateMetadata |
| Create | `components/sections/packing/CategoryTabs.tsx` | Scrollable category tabs |
| Create | `components/sections/packing/ProductCard.tsx` | Card with image slider + qty |
| Create | `components/sections/packing/ProductGrid.tsx` | Animated grid + empty state |
| Create | `components/sections/packing/CartFab.tsx` | Floating cart button with badge |
| Create | `components/sections/packing/CartDrawer.tsx` | Slide-in drawer + checkout form |
| Create | `components/sections/packing/PackingPageClient.tsx` | Root client component |

---

## Task 1: Data Layer

**Files:**
- Create: `lib/packing-data.ts`

- [ ] **Step 1: Create the file with types and all 20 products**

```ts
// lib/packing-data.ts

export type PackingCategory = 'film' | 'boxes' | 'protection' | 'tools'

export interface PackingProduct {
  id: string
  category: PackingCategory
  name: string
  description: string
  price: number       // KZT per unit
  unit: string        // "рул." | "шт." | "уп." | "пара"
  images: string[]    // paths under /images/packing/; first = main
  inStock: boolean
  popular?: boolean
}

export type CartItem = {
  product: PackingProduct
  qty: number
}

export const PACKING_CATEGORIES: { id: PackingCategory; labelKey: string }[] = [
  { id: 'film',       labelKey: 'tabs.film' },
  { id: 'boxes',      labelKey: 'tabs.boxes' },
  { id: 'protection', labelKey: 'tabs.protection' },
  { id: 'tools',      labelKey: 'tabs.tools' },
]

export const PACKING_PRODUCTS: PackingProduct[] = [
  // ── film ──
  {
    id: 'film-stretch-500',
    category: 'film',
    name: 'Стрейч-плёнка 500мм × 300м',
    description: 'Профессиональная растягивающаяся плёнка для обмотки мебели и коробок.',
    price: 1200,
    unit: 'рул.',
    images: ['/images/packing/stretch-500-1.jpg', '/images/packing/stretch-500-2.jpg'],
    inStock: true,
    popular: true,
  },
  {
    id: 'film-stretch-200',
    category: 'film',
    name: 'Стрейч-плёнка 200мм × 150м',
    description: 'Компактный рулон для упаковки небольших предметов и связки вещей.',
    price: 650,
    unit: 'рул.',
    images: ['/images/packing/stretch-200-1.jpg'],
    inStock: true,
  },
  {
    id: 'tape-packing-50',
    category: 'film',
    name: 'Скотч упаковочный 50мм × 66м',
    description: 'Прозрачный упаковочный скотч с надёжной клеящей основой для коробок.',
    price: 320,
    unit: 'шт.',
    images: ['/images/packing/tape-packing-1.jpg', '/images/packing/tape-packing-2.jpg'],
    inStock: true,
    popular: true,
  },
  {
    id: 'tape-painter-25',
    category: 'film',
    name: 'Малярный скотч 25мм × 50м',
    description: 'Для маркировки, защиты поверхностей и временной фиксации.',
    price: 280,
    unit: 'шт.',
    images: ['/images/packing/tape-painter-1.jpg'],
    inStock: true,
  },
  {
    id: 'tape-double-side',
    category: 'film',
    name: 'Двусторонний скотч 50мм × 25м',
    description: 'Для фиксации защитных материалов и ковров при транспортировке.',
    price: 450,
    unit: 'шт.',
    images: ['/images/packing/tape-double-1.jpg'],
    inStock: true,
  },
  // ── boxes ──
  {
    id: 'box-s',
    category: 'boxes',
    name: 'Коробка S (30×20×20 см)',
    description: 'Для книг, посуды, мелкой электроники и плотных тяжёлых вещей.',
    price: 350,
    unit: 'шт.',
    images: ['/images/packing/box-s-1.jpg', '/images/packing/box-s-2.jpg'],
    inStock: true,
  },
  {
    id: 'box-m',
    category: 'boxes',
    name: 'Коробка M (40×30×30 см)',
    description: 'Универсальный размер для большинства бытовых вещей.',
    price: 520,
    unit: 'шт.',
    images: ['/images/packing/box-m-1.jpg', '/images/packing/box-m-2.jpg'],
    inStock: true,
    popular: true,
  },
  {
    id: 'box-l',
    category: 'boxes',
    name: 'Коробка L (60×40×40 см)',
    description: 'Для постельного белья, подушек, лёгкой одежды и объёмных вещей.',
    price: 750,
    unit: 'шт.',
    images: ['/images/packing/box-l-1.jpg'],
    inStock: true,
  },
  {
    id: 'box-xl',
    category: 'boxes',
    name: 'Коробка XL (80×50×50 см)',
    description: 'Крупногабаритная коробка для мягкой мебели, штор и крупных вещей.',
    price: 950,
    unit: 'шт.',
    images: ['/images/packing/box-xl-1.jpg'],
    inStock: true,
  },
  {
    id: 'box-wardrobe',
    category: 'boxes',
    name: 'Телескопическая коробка для одежды',
    description: 'Регулируемая высота, перекладина для вешалок — одежда едет без складок.',
    price: 1400,
    unit: 'шт.',
    images: ['/images/packing/box-wardrobe-1.jpg', '/images/packing/box-wardrobe-2.jpg'],
    inStock: true,
  },
  // ── protection ──
  {
    id: 'bubble-wrap-100',
    category: 'protection',
    name: 'Пупырчатая плёнка 100м × 50см',
    description: 'Надёжная защита хрупких предметов, зеркал, стёкол и техники.',
    price: 2800,
    unit: 'рул.',
    images: ['/images/packing/bubble-100-1.jpg', '/images/packing/bubble-100-2.jpg'],
    inStock: true,
    popular: true,
  },
  {
    id: 'bubble-wrap-50',
    category: 'protection',
    name: 'Пупырчатая плёнка 50м × 50см',
    description: 'Экономичный рулон для частичной упаковки и защиты отдельных предметов.',
    price: 1500,
    unit: 'рул.',
    images: ['/images/packing/bubble-50-1.jpg'],
    inStock: true,
  },
  {
    id: 'foam-roll',
    category: 'protection',
    name: 'Вспененный полиэтилен 50м × 1м',
    description: 'Мягкая подложка для защиты поверхностей мебели от царапин.',
    price: 1900,
    unit: 'рул.',
    images: ['/images/packing/foam-1.jpg'],
    inStock: true,
  },
  {
    id: 'corner-plastic',
    category: 'protection',
    name: 'Пластиковые уголки для мебели',
    description: 'Защита углов шкафов, столов и рам при перевозке. Упаковка 50 штук.',
    price: 800,
    unit: 'уп.',
    images: ['/images/packing/corner-1.jpg', '/images/packing/corner-2.jpg'],
    inStock: true,
  },
  {
    id: 'furniture-cover',
    category: 'protection',
    name: 'Чехол для мебели (диван/кресло)',
    description: 'Плотный полиэтиленовый чехол защищает от пыли и влаги при переезде.',
    price: 1100,
    unit: 'шт.',
    images: ['/images/packing/cover-1.jpg'],
    inStock: true,
  },
  // ── tools ──
  {
    id: 'straps-pair',
    category: 'tools',
    name: 'Стяжные ремни 5м (2 шт.)',
    description: 'Для фиксации грузов в кузове. Нагрузка до 500 кг.',
    price: 1600,
    unit: 'пара',
    images: ['/images/packing/straps-1.jpg', '/images/packing/straps-2.jpg'],
    inStock: true,
    popular: true,
  },
  {
    id: 'gloves-xl',
    category: 'tools',
    name: 'Рабочие перчатки XL',
    description: 'Прорезиненные перчатки для безопасной переноски мебели и коробок.',
    price: 900,
    unit: 'уп.',
    images: ['/images/packing/gloves-1.jpg'],
    inStock: true,
  },
  {
    id: 'gloves-l',
    category: 'tools',
    name: 'Рабочие перчатки L',
    description: 'Прорезиненные перчатки для безопасной переноски мебели и коробок.',
    price: 900,
    unit: 'уп.',
    images: ['/images/packing/gloves-1.jpg'],
    inStock: true,
  },
  {
    id: 'marker-black',
    category: 'tools',
    name: 'Маркер для коробок (чёрный)',
    description: 'Перманентный маркер для подписи содержимого и маркировки коробок.',
    price: 180,
    unit: 'шт.',
    images: ['/images/packing/marker-1.jpg'],
    inStock: true,
  },
  {
    id: 'cutter-retract',
    category: 'tools',
    name: 'Нож-резак выдвижной',
    description: 'Для вскрытия коробок и нарезки упаковочных материалов.',
    price: 350,
    unit: 'шт.',
    images: ['/images/packing/cutter-1.jpg'],
    inStock: true,
  },
]

export function getProductById(id: string): PackingProduct | undefined {
  return PACKING_PRODUCTS.find(p => p.id === id)
}

export const VALID_PRODUCT_IDS = new Set<string>(PACKING_PRODUCTS.map(p => p.id))
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add lib/packing-data.ts
git commit -m "feat(packing): add data layer — types and 20 seed products"
```

---

## Task 2: Cart Hook

**Files:**
- Create: `hooks/useCart.ts`

Context: `hooks/` directory does not exist yet — create it. The hook must be `'use client'` because it uses `useReducer` and `useEffect`. Hydration safety: initial reducer state is always `[]`; the first `useEffect` loads from localStorage client-side to prevent SSR/client mismatch.

- [ ] **Step 1: Create `hooks/useCart.ts`**

```ts
'use client'
import { useReducer, useEffect } from 'react'
import type { PackingProduct, CartItem } from '@/lib/packing-data'

type CartAction =
  | { type: 'ADD_ITEM';    product: PackingProduct; qty: number }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_QTY';  id: string; qty: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD';        items: CartItem[] }

const CART_KEY = 'grandpro:packing:cart'

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'LOAD':
      return action.items
    case 'ADD_ITEM': {
      const existing = state.find(i => i.product.id === action.product.id)
      if (existing) {
        return state.map(i =>
          i.product.id === action.product.id
            ? { ...i, qty: i.qty + action.qty }
            : i
        )
      }
      return [...state, { product: action.product, qty: action.qty }]
    }
    case 'REMOVE_ITEM':
      return state.filter(i => i.product.id !== action.id)
    case 'UPDATE_QTY':
      if (action.qty <= 0) return state.filter(i => i.product.id !== action.id)
      return state.map(i =>
        i.product.id === action.id ? { ...i, qty: action.qty } : i
      )
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function useCart() {
  const [items, dispatch] = useReducer(cartReducer, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: 'LOAD', items: parsed })
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  const addItem = (product: PackingProduct, qty = 1) =>
    dispatch({ type: 'ADD_ITEM', product, qty })
  const removeItem = (id: string) =>
    dispatch({ type: 'REMOVE_ITEM', id })
  const updateQty = (id: string, qty: number) =>
    dispatch({ type: 'UPDATE_QTY', id, qty })
  const clearCart = () =>
    dispatch({ type: 'CLEAR' })

  const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return { items, addItem, removeItem, updateQty, clearCart, total, count }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add hooks/useCart.ts
git commit -m "feat(packing): add useCart hook with useReducer and localStorage persistence"
```

---

## Task 3: i18n Keys

**Files:**
- Modify: `messages/ru.json`
- Modify: `messages/kz.json`
- Modify: `messages/en.json`

Add a `packingPage` key block to each file. Insert it right after the `storagePage` block (before the closing `}` of the root object).

- [ ] **Step 1: Add `packingPage` to `messages/ru.json`**

Find the line `"storagePage": {` and add after its closing `}`:

```json
  "packingPage": {
    "hero": {
      "title": "Упаковочные материалы",
      "subtitle": "Стрейч-плёнка, коробки, пупырчатая плёнка и инструменты для переезда. Самовывоз или доставка по Алматы."
    },
    "tabs": {
      "all": "Все товары",
      "film": "Плёнки и скотч",
      "boxes": "Коробки",
      "protection": "Защита мебели",
      "tools": "Инструменты"
    },
    "product": {
      "hit": "Хит",
      "inStock": "В наличии",
      "outOfStock": "Нет в наличии",
      "addToCart": "В корзину",
      "perUnit": "/ {unit}",
      "empty": "Товары в этой категории появятся скоро."
    },
    "cart": {
      "title": "Корзина",
      "empty": "Корзина пуста. Добавьте товары из каталога.",
      "total": "Итого",
      "remove": "Удалить"
    },
    "form": {
      "name": "Ваше имя",
      "namePlaceholder": "Иван Иванов",
      "phone": "Номер телефона",
      "deliveryType": "Способ получения",
      "pickup": "Самовывоз",
      "delivery": "Доставка",
      "address": "Адрес доставки",
      "addressPlaceholder": "ул. Абая 1, кв. 12",
      "comment": "Комментарий",
      "commentPlaceholder": "Дополнительная информация...",
      "submit": "Оформить заказ",
      "submitting": "Отправляем...",
      "success": "Заказ принят! Перезвоним в течение 15 минут.",
      "successCta": "Продолжить покупки",
      "error": "Не удалось отправить. Попробуйте ещё раз.",
      "phoneInvalid": "Неверный формат (+7 7XX XXX XX XX)",
      "nameRequired": "Обязательное поле",
      "addressRequired": "Укажите адрес доставки",
      "closeLabel": "Закрыть корзину"
    }
  }
```

- [ ] **Step 2: Add `packingPage` to `messages/kz.json`**

```json
  "packingPage": {
    "hero": {
      "title": "Орау материалдары",
      "subtitle": "Стрейч-пленка, қораптар, көпіршікті пленка және көшуге арналған құралдар. Өзіңіз алып кетесіз немесе Алматы бойынша жеткізу."
    },
    "tabs": {
      "all": "Барлық тауарлар",
      "film": "Пленкалар мен скотч",
      "boxes": "Қораптар",
      "protection": "Жиһаз қорғанысы",
      "tools": "Құралдар"
    },
    "product": {
      "hit": "Хит",
      "inStock": "Қол жетімді",
      "outOfStock": "Жоқ",
      "addToCart": "Себетке",
      "perUnit": "/ {unit}",
      "empty": "Бұл санаттағы тауарлар жақында пайда болады."
    },
    "cart": {
      "title": "Себет",
      "empty": "Себет бос. Каталогтан тауарларды қосыңыз.",
      "total": "Барлығы",
      "remove": "Жою"
    },
    "form": {
      "name": "Атыңыз",
      "namePlaceholder": "Айдар Сейткали",
      "phone": "Телефон нөмірі",
      "deliveryType": "Алу тәсілі",
      "pickup": "Өзіңіз аласыз",
      "delivery": "Жеткізу",
      "address": "Жеткізу мекенжайы",
      "addressPlaceholder": "Абай к-сі 1, пәт. 12",
      "comment": "Пікір",
      "commentPlaceholder": "Қосымша ақпарат...",
      "submit": "Тапсырыс беру",
      "submitting": "Жіберілуде...",
      "success": "Тапсырыс қабылданды! 15 минут ішінде қоңырау шаламыз.",
      "successCta": "Сатып алуды жалғастыру",
      "error": "Жіберілмеді. Қайталап көріңіз.",
      "phoneInvalid": "Қате формат (+7 7XX XXX XX XX)",
      "nameRequired": "Міндетті өріс",
      "addressRequired": "Жеткізу мекенжайын көрсетіңіз",
      "closeLabel": "Себетті жабу"
    }
  }
```

- [ ] **Step 3: Add `packingPage` to `messages/en.json`**

```json
  "packingPage": {
    "hero": {
      "title": "Packing Supplies",
      "subtitle": "Stretch film, boxes, bubble wrap and moving tools. Self-pickup or delivery across Almaty."
    },
    "tabs": {
      "all": "All Products",
      "film": "Film & Tape",
      "boxes": "Boxes",
      "protection": "Furniture Protection",
      "tools": "Tools"
    },
    "product": {
      "hit": "Popular",
      "inStock": "In Stock",
      "outOfStock": "Out of Stock",
      "addToCart": "Add to Cart",
      "perUnit": "/ {unit}",
      "empty": "Products in this category are coming soon."
    },
    "cart": {
      "title": "Cart",
      "empty": "Your cart is empty. Add products from the catalog.",
      "total": "Total",
      "remove": "Remove"
    },
    "form": {
      "name": "Your Name",
      "namePlaceholder": "John Smith",
      "phone": "Phone Number",
      "deliveryType": "Delivery Method",
      "pickup": "Self-Pickup",
      "delivery": "Delivery",
      "address": "Delivery Address",
      "addressPlaceholder": "Abay St 1, apt. 12",
      "comment": "Comment",
      "commentPlaceholder": "Additional information...",
      "submit": "Place Order",
      "submitting": "Sending...",
      "success": "Order received! We will call you within 15 minutes.",
      "successCta": "Continue Shopping",
      "error": "Failed to send. Please try again.",
      "phoneInvalid": "Invalid format (+7 7XX XXX XX XX)",
      "nameRequired": "Required field",
      "addressRequired": "Please enter the delivery address",
      "closeLabel": "Close cart"
    }
  }
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add messages/ru.json messages/kz.json messages/en.json
git commit -m "feat(packing): add packingPage i18n keys (ru/kz/en)"
```

---

## Task 4: API Route

**Files:**
- Create: `app/api/packing/route.ts`

Context: Follow the same pattern as `app/api/storage/route.ts`. Rate limiting uses prefix `'grandpro:packing'`. The `esc()` function is copied locally (no shared utility). Items is an array of `{ id: string; qty: number }`.

- [ ] **Step 1: Create `app/api/packing/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { Resend } from 'resend'
import { KZ_PHONE_RE } from '@/lib/validators'
import { VALID_PRODUCT_IDS, getProductById } from '@/lib/packing-data'

function getRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    prefix: 'grandpro:packing',
  })
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const rl = getRatelimit()
  if (rl) {
    try {
      const { success } = await rl.limit(ip)
      if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    } catch {
      // Redis unavailable — allow through
    }
  }

  try {
    const body = await request.json()
    const { name, phone, items, deliveryType, address, comment } = body

    // 1. Type checks
    if (typeof name !== 'string' || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }
    if (typeof deliveryType !== 'string' || !['pickup', 'delivery'].includes(deliveryType)) {
      return NextResponse.json({ error: 'Invalid delivery type' }, { status: 400 })
    }

    // 2. Trim + non-empty
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()
    if (!trimmedName || !trimmedPhone) {
      return NextResponse.json({ error: 'Name and phone required' }, { status: 400 })
    }

    // 3. Phone format
    if (!KZ_PHONE_RE.test(trimmedPhone)) {
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 })
    }

    // 4. Length caps
    if (trimmedName.length > 200 || trimmedPhone.length > 50) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 })
    }

    // 5. Validate each item
    for (const item of items) {
      if (
        typeof item.id !== 'string' ||
        typeof item.qty !== 'number' ||
        item.qty < 1 ||
        !Number.isInteger(item.qty)
      ) {
        return NextResponse.json({ error: 'Invalid item' }, { status: 400 })
      }
      if (!VALID_PRODUCT_IDS.has(item.id)) {
        return NextResponse.json({ error: `Unknown product: ${item.id}` }, { status: 400 })
      }
    }

    // 6. Delivery address
    if (deliveryType === 'delivery') {
      if (!address || typeof address !== 'string' || !address.trim()) {
        return NextResponse.json({ error: 'Address required for delivery' }, { status: 400 })
      }
      if (address.length > 500) {
        return NextResponse.json({ error: 'Address too long' }, { status: 400 })
      }
    }

    // Build order details
    const safeName    = esc(trimmedName)
    const safePhone   = esc(trimmedPhone)
    const safeAddress = deliveryType === 'delivery' && address
      ? esc(address.trim().slice(0, 500))
      : null
    const safeComment = typeof comment === 'string'
      ? esc(comment.slice(0, 1000))
      : null

    let orderTotal = 0
    const itemRows = items.map((item: { id: string; qty: number }) => {
      const product = getProductById(item.id)!
      const subtotal = product.price * item.qty
      orderTotal += subtotal
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${esc(product.name)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.qty} ${esc(product.unit)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${product.price.toLocaleString('ru-RU')} ₸</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${subtotal.toLocaleString('ru-RU')} ₸</td>
      </tr>`
    }).join('\n')

    const deliveryRow = safeAddress
      ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Адрес</td><td colspan="3" style="padding:8px;border-bottom:1px solid #eee;">${safeAddress}</td></tr>`
      : ''
    const commentRow = safeComment
      ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Комментарий</td><td colspan="3" style="padding:8px;border-bottom:1px solid #eee;">${safeComment}</td></tr>`
      : ''

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'GrandPro Moving <onboarding@resend.dev>',
      to: [process.env.CONTACT_EMAIL ?? 'info@grandpro.kz'],
      subject: `Заказ упаковочных материалов — ${safeName}`,
      html: `
        <div style="font-family:sans-serif;max-width:640px;margin:0 auto;">
          <h2 style="color:#0369A1;">Заказ упаковочных материалов — GrandPro Moving</h2>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f0f9ff;">
                <th style="padding:8px;text-align:left;border-bottom:2px solid #0369A1;">Товар</th>
                <th style="padding:8px;text-align:center;border-bottom:2px solid #0369A1;">Кол-во</th>
                <th style="padding:8px;text-align:right;border-bottom:2px solid #0369A1;">Цена</th>
                <th style="padding:8px;text-align:right;border-bottom:2px solid #0369A1;">Сумма</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
              <tr>
                <td colspan="3" style="padding:8px;font-weight:700;text-align:right;">ИТОГО:</td>
                <td style="padding:8px;font-weight:700;font-size:1.1em;color:#0369A1;text-align:right;">${orderTotal.toLocaleString('ru-RU')} ₸</td>
              </tr>
            </tbody>
          </table>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;width:160px;">Клиент</td><td style="padding:8px;border-bottom:1px solid #eee;">${safeName}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Телефон</td><td style="padding:8px;border-bottom:1px solid #eee;">${safePhone}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Способ</td><td style="padding:8px;border-bottom:1px solid #eee;">${deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка'}</td></tr>
            ${deliveryRow}
            ${commentRow}
          </table>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Packing order error:', error)
    return NextResponse.json({ error: 'Failed to send order' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "app/api/packing/route.ts"
git commit -m "feat(packing): add POST /api/packing — validate, rate-limit, Resend email"
```

---

## Task 5: Static Page

**Files:**
- Create: `app/[locale]/packing/page.tsx`

Context: Same pattern as `app/[locale]/storage/page.tsx`. Use `generateMetadata` (async, receives `params` as a Promise — this is Next.js 16's API). No `getMessages()` or `NextIntlClientProvider` needed — root layout already wraps everything.

- [ ] **Step 1: Create `app/[locale]/packing/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { BackToTop } from '@/components/ui/BackToTop'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { PackingPageClient } from '@/components/sections/packing/PackingPageClient'

const META = {
  ru: {
    title: 'Упаковочные материалы — GrandPro Moving Алматы',
    description: 'Стрейч-плёнка, коробки, пупырчатая плёнка и инструменты для переезда. Самовывоз или доставка по Алматы.',
  },
  kz: {
    title: 'Орау материалдары — GrandPro Moving Алматы',
    description: 'Стрейч-пленка, қораптар, көпіршікті пленка және көшуге арналған құралдар. Алматы бойынша жеткізу.',
  },
  en: {
    title: 'Packing Supplies — GrandPro Moving Almaty',
    description: 'Stretch film, boxes, bubble wrap and moving tools. Self-pickup or delivery across Almaty.',
  },
} as const

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const m = META[locale as keyof typeof META] ?? META.ru
  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.title,
      description: m.description,
      url: `https://grandpro.kz/${locale}/packing`,
      type: 'website',
    },
  }
}

export default function PackingPage() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        <PackingPageClient />
      </main>
      <Footer />
      <BackToTop />
      <ChatWidget />
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1
```
Expected: no output (PackingPageClient doesn't exist yet — that's fine, TS will error; create a stub first).

If TypeScript errors on missing `PackingPageClient`, create a temporary stub:

```tsx
// components/sections/packing/PackingPageClient.tsx
'use client'
export function PackingPageClient() { return <div /> }
```

Then re-run `npx tsc --noEmit`. Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/packing/page.tsx" components/sections/packing/PackingPageClient.tsx
git commit -m "feat(packing): add static page with generateMetadata (stub client)"
```

---

## Task 6: CategoryTabs

**Files:**
- Create: `components/sections/packing/CategoryTabs.tsx`

Context: Same scrollable tab pattern as `components/sections/storage/LocationTabs.tsx`. Tabs: "Все товары" + 4 category tabs. Active tab auto-scrolls into view using `[data-active="true"]` + `scrollIntoView`.

- [ ] **Step 1: Create `components/sections/packing/CategoryTabs.tsx`**

```tsx
'use client'
import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { PACKING_CATEGORIES, type PackingCategory } from '@/lib/packing-data'

interface CategoryTabsProps {
  active: PackingCategory | 'all'
  onChange: (c: PackingCategory | 'all') => void
}

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  const t = useTranslations('packingPage')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>('[data-active="true"]')
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active])

  const tabs: { id: PackingCategory | 'all'; label: string }[] = [
    { id: 'all', label: t('tabs.all') },
    ...PACKING_CATEGORIES.map(c => ({ id: c.id, label: t(c.labelKey as Parameters<typeof t>[0]) })),
  ]

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
    >
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            data-active={isActive ? 'true' : undefined}
            onClick={() => onChange(tab.id)}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            style={{
              background: isActive ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
              color: isActive ? '#fff' : 'var(--color-text-muted)',
              border: `1.5px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/sections/packing/CategoryTabs.tsx
git commit -m "feat(packing): add CategoryTabs component"
```

---

## Task 7: ProductCard

**Files:**
- Create: `components/sections/packing/ProductCard.tsx`

Context: The most complex component. Has an image slider (prev/next arrows + dot indicators + touch swipe), a qty stepper, and an "Add to Cart" button. If `images.length === 1`, hide arrows and dots.

- [ ] **Step 1: Create `components/sections/packing/ProductCard.tsx`**

```tsx
'use client'
import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { PackingProduct } from '@/lib/packing-data'

interface ProductCardProps {
  product: PackingProduct
  onAdd: (product: PackingProduct, qty: number) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const t = useTranslations('packingPage')
  const [photoIndex, setPhotoIndex] = useState(0)
  const [qty, setQty] = useState(1)
  const touchStartX = useRef<number | null>(null)

  const hasMultiple = product.images.length > 1

  function prevPhoto() {
    setPhotoIndex(i => (i - 1 + product.images.length) % product.images.length)
  }
  function nextPhoto() {
    setPhotoIndex(i => (i + 1) % product.images.length)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > 50) prevPhoto()
    else if (delta < -50) nextPhoto()
    touchStartX.current = null
  }

  function handleAdd() {
    if (!product.inStock) return
    onAdd(product, qty)
    setQty(1)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Image slider */}
      <div
        className="relative w-full overflow-hidden"
        style={{ paddingBottom: '75%' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={product.images[photoIndex]}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={e => { (e.currentTarget as HTMLImageElement).src = '/images/packing/placeholder.jpg' }}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.popular && product.inStock && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-lg text-white"
              style={{ background: 'var(--gradient-primary)' }}
            >
              {t('product.hit')}
            </span>
          )}
          {!product.inStock && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg text-white bg-gray-500">
              {t('product.outOfStock')}
            </span>
          )}
        </div>

        {/* Arrows */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prevPhoto}
              aria-label="Предыдущее фото"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-0 sm:hover:opacity-100 transition-opacity cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.45)' }}
            >
              <ChevronLeft size={16} className="text-white" />
            </button>
            <button
              type="button"
              onClick={nextPhoto}
              aria-label="Следующее фото"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-0 sm:hover:opacity-100 transition-opacity cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.45)' }}
            >
              <ChevronRight size={16} className="text-white" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {hasMultiple && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {product.images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPhotoIndex(i)}
                aria-label={`Фото ${i + 1}`}
                className="w-1.5 h-1.5 rounded-full transition-all cursor-pointer"
                style={{
                  background: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.45)',
                  transform: i === photoIndex ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex-1">
          <p className="font-semibold text-sm leading-snug mb-1" style={{ color: 'var(--color-text)' }}>
            {product.name}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-heading font-bold text-base" style={{ color: 'var(--color-primary)' }}>
            {product.price.toLocaleString('ru-RU')} ₸
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            / {product.unit}
          </span>
        </div>

        {/* Qty + Add to cart */}
        <div className="flex items-center gap-2">
          {/* Stepper */}
          <div
            className="flex items-center rounded-xl overflow-hidden"
            style={{ border: '1.5px solid var(--color-border)', background: 'var(--bg-surface)' }}
          >
            <button
              type="button"
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-8 h-8 flex items-center justify-center text-lg font-bold cursor-pointer transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="Уменьшить"
            >
              −
            </button>
            <span
              className="w-8 text-center text-sm font-bold select-none"
              style={{ color: 'var(--color-text)' }}
            >
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty(q => q + 1)}
              className="w-8 h-8 flex items-center justify-center text-lg font-bold cursor-pointer transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="Увеличить"
            >
              +
            </button>
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.inStock}
            className="flex-1 h-8 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <ShoppingCart size={13} />
            {t('product.addToCart')}
          </button>
        </div>
      </div>
    </div>
  )
}
```

Note: the slider arrows use `opacity-0` by default and rely on the parent having `group` class. Wrap the card in `group` in ProductGrid, OR always show arrows on mobile. Since mobile users can swipe, make arrows always visible on mobile and hidden on desktop until hover. Replace `opacity-0 group-hover:opacity-100 sm:opacity-0 sm:hover:opacity-100` with `opacity-100 sm:opacity-0 sm:group-hover:opacity-100` — always visible on mobile, hover-only on desktop. The parent `<div>` in ProductGrid must have `className="group"`.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/sections/packing/ProductCard.tsx
git commit -m "feat(packing): add ProductCard with image slider, qty stepper, add-to-cart"
```

---

## Task 8: ProductGrid

**Files:**
- Create: `components/sections/packing/ProductGrid.tsx`

Context: Receives the full product list and active category from parent. Filters internally. Uses `AnimatePresence mode="wait"` on a keyed wrapper so the grid fades when category changes. Each card gets `delay: i * 0.04` stagger.

- [ ] **Step 1: Create `components/sections/packing/ProductGrid.tsx`**

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { PackageOpen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PACKING_PRODUCTS, type PackingCategory, type PackingProduct } from '@/lib/packing-data'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  activeCategory: PackingCategory | 'all'
  onAddItem: (product: PackingProduct, qty: number) => void
}

export function ProductGrid({ activeCategory, onAddItem }: ProductGridProps) {
  const t = useTranslations('packingPage')
  const visible = activeCategory === 'all'
    ? PACKING_PRODUCTS
    : PACKING_PRODUCTS.filter(p => p.category === activeCategory)

  return (
    <AnimatePresence mode="wait">
      {visible.length === 0 ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="py-20 text-center flex flex-col items-center gap-3"
          aria-live="polite"
          aria-atomic="true"
        >
          <PackageOpen size={40} style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t('product.empty')}
          </p>
        </motion.div>
      ) : (
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {visible.map((product, i) => (
            <motion.div
              key={product.id}
              className="group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <ProductCard product={product} onAdd={onAddItem} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/sections/packing/ProductGrid.tsx
git commit -m "feat(packing): add ProductGrid with AnimatePresence category transition"
```

---

## Task 9: CartFab

**Files:**
- Create: `components/sections/packing/CartFab.tsx`

Context: Fixed floating button bottom-right. Disappears with scale animation when count = 0. Appears when count > 0. Z-index 900 (below the drawer at 1000).

- [ ] **Step 1: Create `components/sections/packing/CartFab.tsx`**

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'

interface CartFabProps {
  count: number
  onClick: () => void
}

export function CartFab({ count, onClick }: CartFabProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          key="cart-fab"
          type="button"
          onClick={onClick}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer z-[900]"
          style={{ background: 'var(--gradient-primary)' }}
          aria-label={`Открыть корзину, ${count} товаров`}
        >
          <ShoppingCart size={22} />
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
            style={{ background: '#DC2626' }}
          >
            {count > 99 ? '99+' : count}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/sections/packing/CartFab.tsx
git commit -m "feat(packing): add CartFab floating button with animated badge"
```

---

## Task 10: CartDrawer

**Files:**
- Create: `components/sections/packing/CartDrawer.tsx`

Context: Full-height right panel (`w-full sm:w-[420px]`), slides in from right. Backdrop click closes (unless loading). Contains item list + totals + checkout form in one scrollable panel. Success state replaces form. ARIA dialog semantics. Escape key closes. Focus on first input on open.

- [ ] **Step 1: Create `components/sections/packing/CartDrawer.tsx`**

```tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Trash2, CheckCircle, Loader2, ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KZ_PHONE_RE } from '@/lib/validators'
import type { useCart } from '@/hooks/useCart'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  cart: ReturnType<typeof useCart>
}

export function CartDrawer({ open, onClose, cart }: CartDrawerProps) {
  const t = useTranslations('packingPage')
  const { items, removeItem, updateQty, clearCart, total, count } = cart

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+7')
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup')
  const [address, setAddress] = useState('')
  const [comment, setComment] = useState('')
  const [nameError, setNameError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const [addressError, setAddressError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const submittingRef = useRef(false)

  // Focus first input on open
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => document.getElementById('cart-name')?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !loading) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, loading, onClose])

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value
    if (!v.startsWith('+7')) {
      if (v === '+')              v = '+7'
      else if (v.startsWith('8')) v = '+7' + v.slice(1)
      else if (v.startsWith('77')) v = '+' + v
      else                        v = '+7' + v
    }
    if (!v.startsWith('+7') || v.length < 2) v = '+7'
    setPhone(v)
    if (phoneError) setPhoneError(false)
  }

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    background: 'var(--bg-main)',
    border: `1.5px solid ${hasError ? '#DC2626' : 'var(--color-border)'}`,
    color: 'var(--color-text)',
  })

  async function handleSubmit() {
    const nameOk = name.trim().length > 0
    const phoneOk = KZ_PHONE_RE.test(phone)
    const addressOk = deliveryType === 'pickup' || address.trim().length > 0
    setNameError(!nameOk)
    setPhoneError(!phoneOk)
    setAddressError(!addressOk)
    if (!nameOk || !phoneOk || !addressOk) return
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setSubmitError(false)
    try {
      const res = await fetch('/api/packing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          items: items.map(i => ({ id: i.product.id, qty: i.qty })),
          deliveryType,
          address: deliveryType === 'delivery' ? address : undefined,
          comment: comment || undefined,
        }),
      })
      if (res.ok) {
        clearCart()
        setSubmitted(true)
      } else {
        setSubmitError(true)
      }
    } catch {
      setSubmitError(true)
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  function handleSuccessClose() {
    setSubmitted(false)
    setName('')
    setPhone('+7')
    setDeliveryType('pickup')
    setAddress('')
    setComment('')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] z-[1001] flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: '-20px 0 60px var(--shadow-main)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-dialog-title"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <p id="cart-dialog-title" className="font-heading font-bold text-lg" style={{ color: 'var(--color-text)' }}>
              {t('cart.title')}
            </p>
            {count > 0 && (
              <span
                className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                {count}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={loading ? undefined : onClose}
            disabled={loading}
            aria-label={t('form.closeLabel')}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
            style={{ background: 'var(--bg-surface-elevated)', color: 'var(--color-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {submitted ? (
            /* Success state */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-4">
              <CheckCircle size={56} style={{ color: '#059669' }} />
              <p className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
                {t('form.success')}
              </p>
              <button
                type="button"
                onClick={handleSuccessClose}
                className="px-6 py-3 rounded-xl font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: 'var(--gradient-primary)' }}
              >
                {t('form.successCta')}
              </button>
            </div>
          ) : items.length === 0 ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-3">
              <ShoppingCart size={40} style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {t('cart.empty')}
              </p>
            </div>
          ) : (
            <>
              {/* Items */}
              <div className="flex flex-col gap-3">
                {items.map(({ product, qty }) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--color-border)' }}
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      onError={e => { (e.currentTarget as HTMLImageElement).src = '/images/packing/placeholder.jpg' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                        {product.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {product.price.toLocaleString('ru-RU')} ₸ / {product.unit}
                      </p>
                    </div>
                    {/* Qty stepper */}
                    <div
                      className="flex items-center rounded-lg overflow-hidden flex-shrink-0"
                      style={{ border: '1px solid var(--color-border)' }}
                    >
                      <button
                        type="button"
                        onClick={() => updateQty(product.id, qty - 1)}
                        className="w-7 h-7 flex items-center justify-center text-base font-bold cursor-pointer"
                        style={{ color: 'var(--color-text-muted)' }}
                        aria-label="Уменьшить"
                      >
                        −
                      </button>
                      <span
                        className="w-6 text-center text-sm font-bold select-none"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(product.id, qty + 1)}
                        className="w-7 h-7 flex items-center justify-center text-base font-bold cursor-pointer"
                        style={{ color: 'var(--color-text-muted)' }}
                        aria-label="Увеличить"
                      >
                        +
                      </button>
                    </div>
                    {/* Subtotal */}
                    <span className="text-sm font-bold w-20 text-right flex-shrink-0" style={{ color: 'var(--color-text)' }}>
                      {(product.price * qty).toLocaleString('ru-RU')} ₸
                    </span>
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeItem(product.id)}
                      aria-label={t('cart.remove')}
                      className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors flex-shrink-0"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'var(--active-badge)', border: '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)' }}
              >
                <span className="font-medium text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {t('cart.total')}
                </span>
                <span className="font-heading font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
                  {total.toLocaleString('ru-RU')} ₸
                </span>
              </div>

              {/* Checkout form */}
              <div className="flex flex-col gap-4">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cart-name" className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {t('form.name')} <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    id="cart-name"
                    type="text" value={name}
                    onChange={e => { setName(e.target.value); if (nameError) setNameError(false) }}
                    placeholder={t('form.namePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle(nameError)}
                    onFocus={e => (e.currentTarget.style.borderColor = nameError ? '#DC2626' : 'var(--color-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = nameError ? '#DC2626' : 'var(--color-border)')}
                  />
                  {nameError && <p className="text-xs" style={{ color: '#DC2626' }}>{t('form.nameRequired')}</p>}
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cart-phone" className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {t('form.phone')} <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    id="cart-phone"
                    type="tel" value={phone}
                    onChange={handlePhoneChange}
                    onBlur={() => { if (phone !== '+7') setPhoneError(!KZ_PHONE_RE.test(phone)) }}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle(phoneError)}
                    onFocus={e => (e.currentTarget.style.borderColor = phoneError ? '#DC2626' : 'var(--color-primary)')}
                  />
                  {phoneError && <p className="text-xs" style={{ color: '#DC2626' }}>{t('form.phoneInvalid')}</p>}
                </div>

                {/* Delivery type */}
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {t('form.deliveryType')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['pickup', 'delivery'] as const).map(type => {
                      const active = deliveryType === type
                      return (
                        <button
                          key={type}
                          type="button"
                          aria-pressed={active}
                          onClick={() => { setDeliveryType(type); if (type === 'pickup') setAddressError(false) }}
                          className="py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                          style={{
                            background: active ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
                            color: active ? '#fff' : 'var(--color-text-muted)',
                            border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          }}
                        >
                          {t(`form.${type}` as 'form.pickup' | 'form.delivery')}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Address (conditional) */}
                {deliveryType === 'delivery' && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="cart-address" className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      {t('form.address')} <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      id="cart-address"
                      type="text" value={address}
                      onChange={e => { setAddress(e.target.value); if (addressError) setAddressError(false) }}
                      placeholder={t('form.addressPlaceholder')}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={inputStyle(addressError)}
                      onFocus={e => (e.currentTarget.style.borderColor = addressError ? '#DC2626' : 'var(--color-primary)')}
                      onBlur={e => (e.currentTarget.style.borderColor = addressError ? '#DC2626' : 'var(--color-border)')}
                    />
                    {addressError && <p className="text-xs" style={{ color: '#DC2626' }}>{t('form.addressRequired')}</p>}
                  </div>
                )}

                {/* Comment */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cart-comment" className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {t('form.comment')}
                  </label>
                  <textarea
                    id="cart-comment"
                    value={comment} onChange={e => setComment(e.target.value)}
                    placeholder={t('form.commentPlaceholder')} rows={2} maxLength={1000}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                    style={{ background: 'var(--bg-main)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                  />
                </div>

                {submitError && (
                  <p className="text-xs text-center" style={{ color: '#DC2626' }}>{t('form.error')}</p>
                )}

                <button
                  type="button" onClick={handleSubmit} disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? t('form.submitting') : t('form.submit')}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/sections/packing/CartDrawer.tsx
git commit -m "feat(packing): add CartDrawer with item list, totals, and checkout form"
```

---

## Task 11: PackingPageClient

**Files:**
- Create: `components/sections/packing/PackingPageClient.tsx` (replace stub from Task 5)

Context: Root client component. Assembles all sections. Manages `activeCategory` and `cartOpen` state. Passes `cart` down to `CartFab` and `CartDrawer`. Hero section uses CSS variables for theming.

- [ ] **Step 1: Replace stub with full implementation**

```tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { type PackingCategory } from '@/lib/packing-data'
import { CategoryTabs } from './CategoryTabs'
import { ProductGrid } from './ProductGrid'
import { CartFab } from './CartFab'
import { CartDrawer } from './CartDrawer'

export function PackingPageClient() {
  const t = useTranslations('packingPage')
  const cart = useCart()
  const [activeCategory, setActiveCategory] = useState<PackingCategory | 'all'>('all')
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <>
      {/* ── Hero ── */}
      <section
        className="pt-28 pb-12 px-4 sm:pt-36 sm:pb-16 sm:px-6 text-center"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <ShoppingBag size={30} className="text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 tracking-tight"
            style={{ color: 'var(--color-text)' }}
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="text-base sm:text-lg max-w-xl mx-auto"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('hero.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* ── Catalog ── */}
      <section className="py-12 px-4 sm:py-16 sm:px-6" style={{ background: 'var(--bg-main)' }}>
        <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
          <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
          <ProductGrid
            activeCategory={activeCategory}
            onAddItem={(product, qty) => cart.addItem(product, qty)}
          />
        </div>
      </section>

      {/* ── CartFab ── */}
      <CartFab count={cart.count} onClick={() => setCartOpen(true)} />

      {/* ── CartDrawer ── */}
      <AnimatePresence>
        {cartOpen && (
          <CartDrawer
            key="cart-drawer"
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            cart={cart}
          />
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/sections/packing/PackingPageClient.tsx
git commit -m "feat(packing): assemble PackingPageClient — catalog, cart, drawer"
```

---

## Task 12: Smoke Tests

- [ ] **Step 1: Start dev server**

```bash
npm run dev > /tmp/packing-dev.log 2>&1 &
until curl -s http://localhost:3000 > /dev/null 2>&1; do sleep 2; done && echo "ready"
```

- [ ] **Step 2: Desktop page load (no JS errors)**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const errors = [];
  const b = await chromium.launch();
  const p = await b.newPage();
  p.on('pageerror', e => errors.push(e.message));
  await p.goto('http://localhost:3000/ru/packing', { waitUntil: 'networkidle' });
  await p.screenshot({ path: '/tmp/packing-desktop.png', fullPage: false });
  console.log('Errors:', errors.length ? errors.join('\n') : 'none');
  await b.close();
})();
" 2>&1
```
Expected: `Errors: none`, screenshot shows hero + category tabs + product grid.

- [ ] **Step 3: Mobile full-page screenshot**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto('http://localhost:3000/ru/packing', { waitUntil: 'networkidle' });
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/packing-mobile.png', fullPage: true });
  await b.close();
  console.log('done');
})();
" 2>&1
```
Expected: all sections visible, no overflow.

- [ ] **Step 4: Cart flow — add item → open drawer → fill form → submit**

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('http://localhost:3000/ru/packing', { waitUntil: 'networkidle' });
  // Add first product to cart
  await p.click('button:has-text(\"В корзину\")');
  await p.waitForTimeout(400);
  // CartFab should appear — click it
  await p.click('[aria-label*=\"Открыть корзину\"]');
  await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/packing-cart-open.png' });
  // Fill form
  await p.fill('#cart-name', 'Тест Тестов');
  await p.fill('#cart-phone', '+77771234567');
  await p.click('button:has-text(\"Оформить заказ\")');
  await p.waitForTimeout(2500);
  await p.screenshot({ path: '/tmp/packing-cart-success.png' });
  await b.close();
  console.log('done');
})();
" 2>&1
```
Expected: `done`, `packing-cart-open.png` shows drawer with item, `packing-cart-success.png` shows success state.

- [ ] **Step 5: Final TypeScript check**

```bash
cd /Users/kumsagat/Documents/grandpro-moving && npx tsc --noEmit 2>&1
```
Expected: no output.

- [ ] **Step 6: Stop dev server and final commit**

```bash
kill $(lsof -ti:3000) 2>/dev/null
git add -A
git commit -m "feat(packing): complete packing page — catalog, cart, drawer, smoke tests pass"
```
