# Cooperation Page — Design Spec

**Date:** 2026-06-18  
**Route:** `/[locale]/cooperation`  
**Goal:** Single minimal page for two audiences (B2B clients + partners) with static contact info. No form.

---

## Layout

Single-screen feel. Three stacked blocks with standard section padding.

```
┌─────────────────────────────────┐
│  Заголовок + подзаголовок       │
├─────────────────────────────────┤
│  [Для бизнеса] [Партнёрство]    │  ← tabs (client-side useState)
│  Short text + 3-4 bullets       │
├─────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │Phone │ │Email │ │WA    │    │
│  └──────┘ └──────┘ └──────┘    │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │TG    │ │IG    │ │TikTok│    │
│  └──────┘ └──────┘ └──────┘    │
│  пр. Аль-Фараби, 77/7 …        │
└─────────────────────────────────┘
```

---

## Block 1 — Page Header

- `<h1>` — translation key `cooperation.title` ("Сотрудничество")
- Subtitle — translation key `cooperation.subtitle` ("Работаем с бизнесом и партнёрами на взаимовыгодных условиях")
- No background image or illustration — typography only, consistent with `/services` and `/packing` pages

---

## Block 2 — Audience Tabs

Client component (`'use client'`). Two tabs via `useState<'b2b' | 'partner'>`.

### Tab: Для бизнеса (`b2b`)
- Short paragraph: корпоративный договор, стабильное обслуживание, прозрачное ценообразование
- Bullets:
  - Корпоративный договор с фиксированными тарифами
  - Постоянные скидки от объёма заказов
  - Приоритетный выезд и персональный менеджер
  - Ежемесячное закрывающие документы (акты, счета)

### Tab: Партнёрство (`partner`)
- Short paragraph: субподряд, совместные проекты, реферальная программа
- Bullets:
  - Субподряд для транспортных компаний и перевозчиков
  - Совместные проекты с риелторами и застройщиками
  - Реферальная программа с фиксированным вознаграждением
  - Прямые договоры без посредников

Tab styling: follows existing `components/ui/tabs.tsx` (shadcn Tabs).

---

## Block 3 — Contact Cards

6 cards in CSS grid: `grid-cols-3` (desktop) → `grid-cols-2` (tablet) → `grid-cols-1` (mobile).

| Card | Icon | Value | Link |
|---|---|---|---|
| Телефон | `Phone` (lucide) | +7 707 709 74 22 | `tel:+77077097422` |
| Email | `Mail` (lucide) | info@grandpro.kz | `mailto:info@grandpro.kz` |
| WhatsApp | `MessageCircle` (lucide) | +7 707 709 74 22 | `https://wa.me/77077097422` |
| Telegram | `Send` (lucide) | @grandpro_kz | `https://t.me/grandpro_kz` |
| Instagram | `Instagram` (lucide) | @grandpro_moving | `https://instagram.com/grandpro_moving` |
| TikTok | `Music2` (lucide) | @grandpro_moving | `https://tiktok.com/@grandpro_moving` |

Each card: glassmorphism style (`var(--glass-bg)`, `var(--glass-border)`) consistent with `BookingForm` and other cards. Hover: border transitions to `var(--color-primary)`.

Address line below grid: «пр. Аль-Фараби, 77/7, БЦ Esentai Tower, Алматы» with `MapPin` icon.

---

## Files to Create / Modify

### New files
- `app/[locale]/cooperation/page.tsx` — server component, metadata per locale
- `components/sections/cooperation/CooperationPageClient.tsx` — client component (tabs + contacts)

### Modified files
- `messages/ru.json` — add `cooperation` namespace
- `messages/kz.json` — add `cooperation` namespace
- `messages/en.json` — add `cooperation` namespace
- `components/layout/Header.tsx` — add nav link "Сотрудничество" / "Ынтымақтастық" / "Partners"

---

## SEO / Metadata

Per-locale metadata (same pattern as `packing/page.tsx`):

| Locale | Title | Description |
|---|---|---|
| ru | Сотрудничество — GrandPro Moving Алматы | Корпоративные договоры и партнёрство с мувинговой компанией GrandPro Moving. Свяжитесь с нами. |
| kz | Ынтымақтастық — GrandPro Moving Алматы | Корпоративтік шарттар мен серіктестік. Бізбен хабарласыңыз. |
| en | Partnership — GrandPro Moving Almaty | Corporate contracts and partnership with GrandPro Moving. Get in touch. |

---

## Placeholders (to replace later)

- `NEXT_PUBLIC_INSTAGRAM_URL` / handle `@grandpro_moving` — hardcoded for now
- `NEXT_PUBLIC_TIKTOK_URL` / handle `@grandpro_moving` — hardcoded for now
- Telegram handle `@grandpro_kz` — hardcoded for now

---

## Out of Scope

- Contact form (explicitly excluded)
- Map (no 2GIS on this page)
- New API route (no form → no API needed)
