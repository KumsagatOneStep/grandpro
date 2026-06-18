# Cooperation Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать страницу `/[locale]/partners` — «Сотрудничество» с табами (B2B / Партнёрство) и статичным блоком контактов.

**Architecture:** Серверный page-компонент с per-locale metadata + единый клиентский `CooperationPageClient` с `useState` для переключения табов. Никакого API-роута — только статика. Навигационная ссылка уже существует в Header и MobileDrawer.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl v4, Tailwind CSS 4, Framer Motion, lucide-react

## Global Constraints

- Route: `app/[locale]/partners/` (не `/cooperation/`) — соответствует существующим nav-ссылкам в Header.tsx и MobileDrawer.tsx
- Стили через CSS-переменные (`var(--color-text)`, `var(--glass-bg)` и т.д.) — не hardcode цвета
- Glassmorphism-карточки: `var(--glass-bg)`, `var(--glass-border)`, `backdropFilter: blur(20px)`
- Hover на карточках: `border-color → var(--color-primary)` через `onMouseEnter/Leave`
- Шрифт заголовков: `font-heading`, тело: `font-source-sans` (через CSS-переменные `--font-lexend`, `--font-source-sans`)
- Padding главной секции: `pt-36 pb-20` (компенсация fixed header высотой ~80px)
- TypeScript strict, все пропсы типизированы
- Переводы только через `useTranslations` — не hardcode строки в JSX

---

### Task 1: Переводы — добавить namespace `cooperation` в все три файла

**Files:**
- Modify: `messages/ru.json`
- Modify: `messages/kz.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces: namespace `cooperation` с ключами: `title`, `subtitle`, `tabs.b2b`, `tabs.partner`, `b2b.text`, `b2b.bullets` (array), `partner.text`, `partner.bullets` (array), `contacts.title`, `contacts.phone`, `contacts.email`, `contacts.whatsapp`, `contacts.telegram`, `contacts.instagram`, `contacts.tiktok`, `contacts.address`

- [ ] **Step 1: Добавить `cooperation` в `messages/ru.json`**

Вставить перед последней `}` в файле (после `"packingPage": { ... }`):

```json
  ,
  "cooperation": {
    "title": "Сотрудничество",
    "subtitle": "Работаем с бизнесом и партнёрами на взаимовыгодных условиях",
    "tabs": {
      "b2b": "Для бизнеса",
      "partner": "Партнёрство"
    },
    "b2b": {
      "text": "Предлагаем корпоративные договоры с фиксированными тарифами и выделенным менеджером для стабильного обслуживания вашего бизнеса.",
      "bullets": [
        "Корпоративный договор с фиксированными тарифами",
        "Постоянные скидки от объёма заказов",
        "Приоритетный выезд и персональный менеджер",
        "Ежемесячные закрывающие документы (акты, счета)"
      ]
    },
    "partner": {
      "text": "Работаем с перевозчиками, риелторами и застройщиками — субподряд и реферальные программы на прозрачных условиях.",
      "bullets": [
        "Субподряд для транспортных компаний и перевозчиков",
        "Совместные проекты с риелторами и застройщиками",
        "Реферальная программа с фиксированным вознаграждением",
        "Прямые договоры без посредников"
      ]
    },
    "contacts": {
      "title": "Свяжитесь с нами",
      "phone": "Телефон",
      "email": "Email",
      "whatsapp": "WhatsApp",
      "telegram": "Telegram",
      "instagram": "Instagram",
      "tiktok": "TikTok",
      "address": "пр. Аль-Фараби, 77/7, БЦ Esentai Tower, Алматы"
    }
  }
```

- [ ] **Step 2: Добавить `cooperation` в `messages/kz.json`**

```json
  ,
  "cooperation": {
    "title": "Серіктестік",
    "subtitle": "Бизнеспен және серіктестермен өзара тиімді жағдайда жұмыс жасаймыз",
    "tabs": {
      "b2b": "Бизнес үшін",
      "partner": "Серіктестік"
    },
    "b2b": {
      "text": "Бекітілген тарифтер мен жеке менеджермен корпоративтік шарттар ұсынамыз.",
      "bullets": [
        "Бекітілген тарифтермен корпоративтік шарт",
        "Тапсырыс көлемінен тұрақты жеңілдіктер",
        "Басым шығу және жеке менеджер",
        "Ай сайынғы жабу құжаттары (актілер, шот-фактуралар)"
      ]
    },
    "partner": {
      "text": "Тасымалдаушылармен, риелторлармен және құрылысшылармен жұмыс жасаймыз.",
      "bullets": [
        "Көлік компаниялары мен тасымалдаушыларға субподряд",
        "Риелторлар мен құрылысшылармен бірлескен жобалар",
        "Белгіленген сыйақымен реферал бағдарламасы",
        "Делдалсыз тікелей шарттар"
      ]
    },
    "contacts": {
      "title": "Бізбен байланысыңыз",
      "phone": "Телефон",
      "email": "Email",
      "whatsapp": "WhatsApp",
      "telegram": "Telegram",
      "instagram": "Instagram",
      "tiktok": "TikTok",
      "address": "Әл-Фараби даңғылы, 77/7, Esentai Tower БО, Алматы"
    }
  }
```

- [ ] **Step 3: Добавить `cooperation` в `messages/en.json`**

```json
  ,
  "cooperation": {
    "title": "Partnership",
    "subtitle": "We work with businesses and partners on mutually beneficial terms",
    "tabs": {
      "b2b": "For Business",
      "partner": "Partners"
    },
    "b2b": {
      "text": "We offer corporate contracts with fixed rates and a dedicated manager for reliable business service.",
      "bullets": [
        "Corporate agreement with fixed rates",
        "Ongoing volume discounts",
        "Priority dispatch and personal manager",
        "Monthly closing documents (acts, invoices)"
      ]
    },
    "partner": {
      "text": "We work with carriers, realtors, and developers — subcontracting and referral programs on transparent terms.",
      "bullets": [
        "Subcontracting for transport companies and carriers",
        "Joint projects with realtors and developers",
        "Referral program with fixed rewards",
        "Direct contracts, no intermediaries"
      ]
    },
    "contacts": {
      "title": "Get in Touch",
      "phone": "Phone",
      "email": "Email",
      "whatsapp": "WhatsApp",
      "telegram": "Telegram",
      "instagram": "Instagram",
      "tiktok": "TikTok",
      "address": "Al-Farabi Ave, 77/7, Esentai Tower BC, Almaty"
    }
  }
```

- [ ] **Step 4: Commit**

```bash
git add messages/ru.json messages/kz.json messages/en.json
git commit -m "feat(cooperation): add cooperation translations (ru/kz/en)"
```

---

### Task 2: CooperationPageClient компонент

**Files:**
- Create: `components/sections/cooperation/CooperationPageClient.tsx`

**Interfaces:**
- Consumes: namespace `cooperation` из Task 1
- Produces: `export function CooperationPageClient(): JSX.Element`

- [ ] **Step 1: Создать файл `components/sections/cooperation/CooperationPageClient.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Phone, Mail, MessageCircle, Send, Instagram, Music2, MapPin, CheckCircle2 } from 'lucide-react'

type TabId = 'b2b' | 'partner'

const CONTACTS = [
  { icon: Phone,         labelKey: 'phone',     value: '+7 707 709 74 22', href: 'tel:+77077097422' },
  { icon: Mail,          labelKey: 'email',     value: 'info@grandpro.kz', href: 'mailto:info@grandpro.kz' },
  { icon: MessageCircle, labelKey: 'whatsapp',  value: '+7 707 709 74 22', href: 'https://wa.me/77077097422' },
  { icon: Send,          labelKey: 'telegram',  value: '@grandpro_kz',     href: 'https://t.me/grandpro_kz' },
  { icon: Instagram,     labelKey: 'instagram', value: '@grandpro_moving', href: 'https://instagram.com/grandpro_moving' },
  { icon: Music2,        labelKey: 'tiktok',    value: '@grandpro_moving', href: 'https://tiktok.com/@grandpro_moving' },
] as const

export function CooperationPageClient() {
  const t = useTranslations('cooperation')
  const [tab, setTab] = useState<TabId>('b2b')

  const bullets = t.raw(`${tab}.bullets`) as string[]

  return (
    <section className="pt-36 pb-20 px-4">
      <div className="max-w-3xl mx-auto">

        {/* ── Page header ── */}
        <div className="text-center mb-12">
          <h1
            className="font-heading text-4xl sm:text-5xl font-extrabold mb-4 leading-tight"
            style={{ color: 'var(--color-text)' }}
          >
            {t('title')}
          </h1>
          <p
            className="text-base sm:text-lg max-w-xl mx-auto"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('subtitle')}
          </p>
        </div>

        {/* ── Tabs ── */}
        <div
          className="flex p-1 rounded-2xl gap-1 mb-6"
          style={{ background: 'var(--bg-surface)' }}
        >
          {(['b2b', 'partner'] as TabId[]).map(id => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: tab === id ? 'var(--gradient-primary)' : 'transparent',
                color: tab === id ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              {t(`tabs.${id}`)}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 32px var(--shadow-main)',
          }}
        >
          <p className="text-base mb-5" style={{ color: 'var(--color-text-muted)' }}>
            {t(`${tab}.text`)}
          </p>
          <ul className="space-y-3">
            {bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2
                  size={16}
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: 'var(--color-primary)' }}
                />
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Contact cards title ── */}
        <h2
          className="font-heading text-xl font-bold mb-5"
          style={{ color: 'var(--color-text)' }}
        >
          {t('contacts.title')}
        </h2>

        {/* ── Contact grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {CONTACTS.map(({ icon: Icon, labelKey, value, href }) => (
            <a
              key={labelKey}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-3 p-4 rounded-2xl transition-colors duration-150"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 4px 16px var(--shadow-main)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <Icon size={16} color="#fff" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {t(`contacts.${labelKey}`)}
                </p>
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--color-text)' }}
                >
                  {value}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* ── Address ── */}
        <div className="flex items-center gap-2">
          <MapPin size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t('contacts.address')}
          </span>
        </div>

      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sections/cooperation/CooperationPageClient.tsx
git commit -m "feat(cooperation): add CooperationPageClient component"
```

---

### Task 3: Page route

**Files:**
- Create: `app/[locale]/partners/page.tsx`

**Interfaces:**
- Consumes: `CooperationPageClient` из Task 2, layout компоненты (`Header`, `Footer`, `ScrollProgress`, `BackToTop`, `ChatWidget`)
- Produces: Next.js page export `default function PartnersPage()`

- [ ] **Step 1: Создать `app/[locale]/partners/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { BackToTop } from '@/components/ui/BackToTop'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { CooperationPageClient } from '@/components/sections/cooperation/CooperationPageClient'

const META = {
  ru: {
    title: 'Сотрудничество — GrandPro Moving Алматы',
    description: 'Корпоративные договоры и партнёрство с GrandPro Moving. Свяжитесь с нами.',
  },
  kz: {
    title: 'Серіктестік — GrandPro Moving Алматы',
    description: 'Корпоративтік шарттар мен серіктестік. Бізбен хабарласыңыз.',
  },
  en: {
    title: 'Partnership — GrandPro Moving Almaty',
    description: 'Corporate contracts and partnership with GrandPro Moving. Get in touch.',
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
      url: `https://grandpro.kz/${locale}/partners`,
      type: 'website',
    },
  }
}

export default function PartnersPage() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        <CooperationPageClient />
      </main>
      <Footer />
      <BackToTop />
      <ChatWidget />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/partners/page.tsx
git commit -m "feat(cooperation): add /partners page route"
```

---

### Task 4: Проверка

- [ ] **Step 1: Запустить dev-сервер**

```bash
npm run dev
```

- [ ] **Step 2: Открыть в браузере и проверить**

Проверить:
- `http://localhost:3000/ru/partners` — страница открывается, заголовок «Сотрудничество»
- `http://localhost:3000/kz/partners` — заголовок «Серіктестік»
- `http://localhost:3000/en/partners` — заголовок «Partnership»
- Клик по табу «Партнёрство» — контент меняется
- Карточки: 6 штук, hover подсвечивает border
- Телефон кликабелен (tel:), email (mailto:), соцсети открываются в новой вкладке
- Мобильный вид (320px): сетка схлопывается в 1 колонку
- Ссылка «Сотрудничество» в Header ведёт на `/[locale]/partners`
- Тёмная и светлая тема — стили корректны

- [ ] **Step 3: Проверить TypeScript**

```bash
npx tsc --noEmit
```

Ожидаемый результат: 0 ошибок.

- [ ] **Step 4: Финальный commit (если были мелкие правки)**

```bash
git add -p
git commit -m "fix(cooperation): address review findings"
```
