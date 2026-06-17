# AnimatedSelect — Design Spec
**Date:** 2026-06-17  
**Scope:** `components/ui/AnimatedSelect.tsx` + обновление `ServicesPageClient.tsx`

---

## Цель

Заменить все `<select>`-поля в форме-визарде на услуги (`ServicesPageClient.tsx`) анимированным select-компонентом (на основе 21st.dev / geekles007), адаптированным под дизайн-систему проекта.

---

## Компонент: `components/ui/AnimatedSelect.tsx`

### Типы

```ts
type AnimatedSelectOption = {
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
```

### Поведение

- **Управляемый компонент**: состояние (`value`) хранится снаружи, компонент не держит свой `useState` для выбранного значения.
- **Открытие/закрытие**: внутренний `useState<boolean>(false)` только для `open`.
- **Закрытие по клику снаружи**: `useEffect` с `mousedown` listener на `document`, чистится при размонтировании.
- **Placeholder**: если `value === ''`, в collapsed-режиме показывается `placeholder` вместо выбранного элемента.

### Анимация

Используем `MotionConfig` + `AnimatePresence` + `layoutId="dropdown"` как в оригинале:
- Collapsed: `borderRadius: 30`, показывает только выбранный item
- Expanded: `borderRadius: 20`, список всех опций с `w-full`
- Элементы списка: `variants` с `delay: index * 0.05` для stagger-эффекта

### Стили

Все цвета через CSS custom properties проекта — без хардкодов:

| Элемент | CSS var |
|---|---|
| Фон | `var(--bg-surface)` |
| Рамка | `var(--color-border)` |
| Рамка ошибки | `#DC2626` |
| Текст | `var(--color-text)` |
| Мuted текст | `var(--color-text-muted)` |
| Hover строки | `var(--bg-surface-elevated)` |
| Акцент | `var(--color-primary)` |

Ширина дропдауна: `w-full` (не фиксированные 400px).

### Error state

- Collapsed-вариант: красная рамка `1.5px solid #DC2626`
- Под компонентом: `<p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>`

---

## Изменения в `ServicesPageClient.tsx`

### Удалить

- Компонент `SelectField` (строки 174–206) — больше не используется.

### Добавить

- Импорт `AnimatedSelect` из `@/components/ui/AnimatedSelect`

### Заменить: 5 мест

#### 1. Шаг 1 — Тип переезда

```tsx
// было:
<SelectField
  label={t('wizard.serviceType')} value={form.serviceType}
  onChange={v => set('serviceType', v as ServiceType)} required
  error={errors.serviceType}
  options={serviceTypes.map(type => ({ value: type, label: t(`cards.${type}.title`) }))}
/>

// стало:
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

Иконки через маленький хелпер внутри файла:
```tsx
function ServiceIcon({ type }: { type: ServiceType }) {
  const Icon = SERVICE_ICONS[type]
  return <Icon size={18} strokeWidth={1.5} />
}
```

#### 2. Шаг 2 — Квартира, количество комнат

```tsx
<AnimatedSelect
  label="Количество комнат"
  required
  error={errors.rooms}
  placeholder="— выберите"
  headerLabel="Количество комнат"
  value={form.rooms}
  onChange={v => set('rooms', v)}
  data={['1','2','3','4','5+'].map(v => ({ id: v, value: v, label: `${v} комн.` }))}
/>
```

#### 3. Шаг 2 — Упаковка, количество комнат

Идентично п.2.

#### 4. Шаг 2 — Такелаж, тип оборудования

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

---

## Файловая структура

```
components/
  ui/
    AnimatedSelect.tsx   ← новый файл
    ...остальные ui компоненты
```

Никаких новых папок, никаких дополнительных файлов — один компонент.

---

## Что НЕ меняем

- `InputField`, `Toggle`, `FloorBlock` — остаются без изменений
- Логика валидации (`validateStep1`, `validateStep2`) — без изменений
- Структура `FormState` — без изменений
- i18n — без изменений (используем уже существующие ключи `cards.*.desc`)
