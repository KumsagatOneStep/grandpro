# AnimatedSelect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать переиспользуемый анимированный `AnimatedSelect` компонент и заменить им все 4 вхождения `SelectField` в `ServicesPageClient.tsx`.

**Architecture:** Единый управляемый компонент `components/ui/AnimatedSelect.tsx` с Framer Motion `layoutId`-морфингом. Все цвета через CSS custom properties проекта. `SelectField` — удаляется полностью.

**Tech Stack:** Next.js 16 App Router, React 19, Framer Motion 12, Lucide React, next-intl, Tailwind CSS 4, TypeScript 5.

---

## File Map

| Действие | Путь |
|---|---|
| Создать | `components/ui/AnimatedSelect.tsx` |
| Изменить | `components/sections/services/ServicesPageClient.tsx` |

---

## Task 1: Create `AnimatedSelect.tsx`

**Files:**
- Create: `components/ui/AnimatedSelect.tsx`

- [ ] **Step 1: Создать файл компонента**

Создать `components/ui/AnimatedSelect.tsx` с полным содержимым:

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { ChevronDown, X } from 'lucide-react'

export type AnimatedSelectOption = {
  id: string
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
}

type AnimatedSelectProps = {
  label?: string
  required?: boolean
  error?: string
  data: AnimatedSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  headerLabel?: string
}

export function AnimatedSelect({
  label,
  required,
  error,
  data,
  value,
  onChange,
  placeholder = '— выберите',
  headerLabel,
}: AnimatedSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const selected = data.find(d => d.value === value)
  const borderColor = error ? '#DC2626' : 'var(--color-border)'

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {label}{required && <span style={{ color: '#DC2626' }}> *</span>}
        </label>
      )}

      <MotionConfig transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
        <div ref={ref} className="relative">
          <AnimatePresence mode="popLayout" initial={false}>
            {!open ? (
              <motion.button
                key="collapsed"
                type="button"
                layout
                layoutId="dropdown"
                animate={{ borderRadius: 12 }}
                onClick={() => setOpen(true)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left overflow-hidden"
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: 12,
                }}
              >
                {selected ? (
                  <div className="flex items-center gap-3 min-w-0">
                    {selected.icon && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                      >
                        {selected.icon}
                      </div>
                    )}
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                      {selected.label}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {placeholder}
                  </span>
                )}
                <ChevronDown size={16} className="flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              </motion.button>
            ) : (
              <motion.div
                key="expanded"
                layout
                layoutId="dropdown"
                animate={{ borderRadius: 12 }}
                className="w-full overflow-hidden py-2"
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: `1.5px solid ${open ? 'var(--color-primary)' : borderColor}`,
                  borderRadius: 12,
                }}
              >
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {headerLabel ?? label ?? 'Выберите'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--bg-surface)', color: 'var(--color-text-muted)' }}
                  >
                    <X size={12} />
                  </button>
                </div>

                <div>
                  {data.map((item, i) => (
                    <motion.button
                      key={item.id}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { onChange(item.value); setOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{
                        background: item.value === value ? 'var(--active-badge)' : 'transparent',
                      }}
                      onMouseEnter={e => {
                        if (item.value !== value)
                          e.currentTarget.style.background = 'var(--bg-surface)'
                      }}
                      onMouseLeave={e => {
                        if (item.value !== value)
                          e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      {item.icon && (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                        >
                          {item.icon}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                            {item.description}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>

      {error && (
        <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Убедиться что TypeScript не ругается**

```bash
cd /Users/kumsagat/Documents/grandpro-moving
npx tsc --noEmit 2>&1 | grep AnimatedSelect
```

Ожидаемый вывод: пусто (без ошибок).

- [ ] **Step 3: Коммит**

```bash
cd /Users/kumsagat/Documents/grandpro-moving
git add components/ui/AnimatedSelect.tsx
git commit -m "feat: add AnimatedSelect UI component"
```

---

## Task 2: Обновить `ServicesPageClient.tsx`

**Files:**
- Modify: `components/sections/services/ServicesPageClient.tsx`

### Шаг 2.1 — Добавить импорт и `ServiceIcon` хелпер, удалить `SelectField`

- [ ] **Step 1: Добавить импорт `AnimatedSelect` в начало файла**

Найти строку (она первая):
```tsx
'use client'
import { useState } from 'react'
```

Заменить на:
```tsx
'use client'
import { useState } from 'react'
import { AnimatedSelect } from '@/components/ui/AnimatedSelect'
```

- [ ] **Step 2: Добавить `ServiceIcon` хелпер после блока `SERVICE_COLORS`**

Найти (строки 401–404):
```tsx
const SERVICE_COLORS: Record<ServiceType, string> = {
  apartment: '#0369A1', office: '#7C3AED', cargo: '#D97706',
  international: '#059669', rigging: '#DC2626', packing: '#0891B2',
}
const PLAN_KEYS = ['start', 'business', 'corporate'] as const
```

Заменить на:
```tsx
const SERVICE_COLORS: Record<ServiceType, string> = {
  apartment: '#0369A1', office: '#7C3AED', cargo: '#D97706',
  international: '#059669', rigging: '#DC2626', packing: '#0891B2',
}

function ServiceIcon({ type }: { type: ServiceType }) {
  const Icon = SERVICE_ICONS[type]
  return <Icon size={18} strokeWidth={1.5} />
}

const PLAN_KEYS = ['start', 'business', 'corporate'] as const
```

- [ ] **Step 3: Удалить компонент `SelectField` (строки 174–206)**

Найти и удалить весь блок:
```tsx
function SelectField({
  label, value, onChange, options, required, error,
}: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
  required?: boolean; error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}{required && <span style={{ color: '#DC2626' }}> *</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none transition-all duration-200"
          style={{
            background: 'var(--bg-surface-elevated)',
            border: `1.5px solid ${error ? '#DC2626' : 'var(--color-border)'}`,
            color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
          }}
        >
          <option value="">— выберите</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--color-text-muted)' }} />
      </div>
      {error && <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Убрать `ChevronDown` из импорта Lucide**

`ChevronDown` использовался только в `SelectField`, который мы удалили. Убираем только его.

Найти строку импортов lucide:
```tsx
import {
  Home, Building2, Truck, Globe, Wrench, Package,
  ArrowRight, ChevronLeft, Check, Sparkles, Star,
  Calendar, ChevronDown, Trash2, Zap, PackageCheck,
} from 'lucide-react'
```

Заменить на:
```tsx
import {
  Home, Building2, Truck, Globe, Wrench, Package,
  ArrowRight, ChevronLeft, Check, Sparkles, Star,
  Calendar, Trash2, Zap, PackageCheck,
} from 'lucide-react'
```

### Шаг 2.2 — Заменить 4 вхождения `SelectField`

- [ ] **Step 5: Шаг 1 визарда — Тип переезда (строка ~549)**

Найти:
```tsx
                <SelectField
                  label={t('wizard.serviceType')} value={form.serviceType}
                  onChange={v => set('serviceType', v as ServiceType)} required
                  error={errors.serviceType}
                  options={serviceTypes.map(type => ({ value: type, label: t(`cards.${type}.title`) }))}
                />
```

Заменить на:
```tsx
                <AnimatedSelect
                  label={t('wizard.serviceType')}
                  required
                  error={errors.serviceType}
                  placeholder="— выберите"
                  headerLabel={t('wizard.serviceType')}
                  value={form.serviceType}
                  onChange={v => set('serviceType', v as ServiceType)}
                  data={serviceTypes.map(type => ({
                    id: type,
                    value: type,
                    label: t(`cards.${type}.title`),
                    description: t(`cards.${type}.desc`),
                    icon: <ServiceIcon type={type} />,
                  }))}
                />
```

- [ ] **Step 6: Шаг 2, квартира — Количество комнат (строка ~240)**

Найти:
```tsx
      <SelectField
        label="Количество комнат" value={form.rooms} onChange={v => set('rooms', v)} required
        error={errors.rooms}
        options={['1', '2', '3', '4', '5+'].map(v => ({ value: v, label: `${v} комн.` }))}
      />
```

Заменить на:
```tsx
      <AnimatedSelect
        label="Количество комнат"
        required
        error={errors.rooms}
        placeholder="— выберите"
        headerLabel="Количество комнат"
        value={form.rooms}
        onChange={v => set('rooms', v)}
        data={['1', '2', '3', '4', '5+'].map(v => ({ id: v, value: v, label: `${v} комн.` }))}
      />
```

- [ ] **Step 7: Шаг 2, такелаж — Тип оборудования (строка ~323)**

Найти:
```tsx
      <SelectField
        label="Тип оборудования" value={form.equipmentType}
        onChange={v => set('equipmentType', v)} required error={errors.equipmentType}
        options={[
          { value: 'safe', label: 'Сейф' },
          { value: 'piano', label: 'Пианино / рояль' },
          { value: 'machine', label: 'Станок / оборудование' },
          { value: 'atm', label: 'Банкомат / терминал' },
          { value: 'other', label: 'Другое' },
        ]}
      />
```

Заменить на:
```tsx
      <AnimatedSelect
        label="Тип оборудования"
        required
        error={errors.equipmentType}
        placeholder="— выберите"
        headerLabel="Тип оборудования"
        value={form.equipmentType}
        onChange={v => set('equipmentType', v)}
        data={[
          { id: 'safe',    value: 'safe',    label: 'Сейф' },
          { id: 'piano',   value: 'piano',   label: 'Пианино / рояль' },
          { id: 'machine', value: 'machine', label: 'Станок / оборудование' },
          { id: 'atm',     value: 'atm',     label: 'Банкомат / терминал' },
          { id: 'other',   value: 'other',   label: 'Другое' },
        ]}
      />
```

- [ ] **Step 8: Шаг 2, упаковка — Количество комнат (строка ~350)**

Найти:
```tsx
      <SelectField
        label="Количество комнат" value={form.rooms} onChange={v => set('rooms', v)} required
        error={errors.rooms}
        options={['1', '2', '3', '4', '5+'].map(v => ({ value: v, label: `${v} комн.` }))}
      />
```

Заменить на:
```tsx
      <AnimatedSelect
        label="Количество комнат"
        required
        error={errors.rooms}
        placeholder="— выберите"
        headerLabel="Количество комнат"
        value={form.rooms}
        onChange={v => set('rooms', v)}
        data={['1', '2', '3', '4', '5+'].map(v => ({ id: v, value: v, label: `${v} комн.` }))}
      />
```

> **Внимание:** строки 240 и 350 — одинаковый JSX, но в разных функциях (`apartment` и `packing`). Убедись что заменены обе.

- [ ] **Step 9: Проверить что `SelectField` не осталось в файле**

```bash
grep -n "SelectField" /Users/kumsagat/Documents/grandpro-moving/components/sections/services/ServicesPageClient.tsx
```

Ожидаемый вывод: пусто.

- [ ] **Step 10: TypeScript проверка**

```bash
cd /Users/kumsagat/Documents/grandpro-moving
npx tsc --noEmit 2>&1 | head -30
```

Ожидаемый вывод: пусто (без ошибок).

- [ ] **Step 11: Коммит**

```bash
cd /Users/kumsagat/Documents/grandpro-moving
git add components/sections/services/ServicesPageClient.tsx
git commit -m "feat: replace SelectField with AnimatedSelect in services wizard"
```

---

## Task 3: Финальная проверка

- [ ] **Step 1: Production build**

```bash
cd /Users/kumsagat/Documents/grandpro-moving
npm run build 2>&1 | tail -20
```

Ожидаемый вывод: `✓ Compiled successfully` без ошибок.

- [ ] **Step 2: Запустить dev-сервер**

```bash
cd /Users/kumsagat/Documents/grandpro-moving
npm run dev
```

- [ ] **Step 3: Ручная проверка в браузере**

Открыть `http://localhost:3000/ru/services`.

Проверить:
1. Шаг 1 → поле «Тип переезда» → collapsed показывает placeholder «— выберите»
2. Клик на поле → открывается список с 6 опциями, иконками и описаниями, spring-анимация
3. Выбор «Квартирный переезд» → поле коллапсируется, показывает иконку + название
4. Клик вне дропдауна → закрывается
5. Кнопка X → закрывается
6. Кнопка «Далее» без выбора → красная рамка + ошибка под полем
7. Шаг 2 (квартира) → поле «Количество комнат» работает без иконок
8. Шаг 2 (такелаж) → поле «Тип оборудования» работает без иконок
9. Шаг 2 (упаковка) → поле «Количество комнат» работает
10. Dark mode и light mode — цвета правильные через CSS vars

- [ ] **Step 4: Финальный коммит (если были мелкие правки)**

```bash
cd /Users/kumsagat/Documents/grandpro-moving
git add -p
git commit -m "fix: AnimatedSelect visual tweaks after manual review"
```
