# Address Autocomplete Design

**Goal:** При вводе адреса погрузки/выгрузки в `AddressDrawer` показывать подсказки из 2GIS Suggest API. После выбора адреса — автофокус на следующее поле; на мобильном карта отображается под инпутами.

**Tech Stack:** Next.js App Router, React 19, TypeScript 5, 2GIS Suggest REST API, native `fetch` + `AbortController`

---

## 1. API

**Endpoint:** `GET https://suggest-api.2gis.com/1.0`

**Параметры:**
| Параметр | Значение |
|---|---|
| `q` | строка запроса (мин. 2 символа) |
| `key` | `process.env.NEXT_PUBLIC_2GIS_KEY` |
| `locale` | `ru_RU` |
| `region_id` | `68` (Алматы) |
| `fields` | `items.point,items.full_name` |
| `limit` | `5` |

**Ответ (успех):**
```json
{
  "result": {
    "items": [
      {
        "name": "пр. Абая 1",
        "full_name": "пр. Абая 1, Алматы",
        "type": "street_address",
        "point": { "lat": 43.238, "lon": 76.945 }
      }
    ]
  }
}
```

**Типы объектов в `type`:** `street_address`, `building`, `poi`, `street` — отображаются с разными иконками (📍 / 🏢).

**CSP:** `suggest-api.2gis.com` покрыт существующим `*.2gis.com` — изменений не требует.

**Env:** добавить `NEXT_PUBLIC_2GIS_KEY=<ключ>` в `.env.local`. Без ключа хук молча возвращает пустой массив (пользователь может ввести адрес вручную).

---

## 2. Новые файлы

### `components/forms/booking/useAddressSuggest.ts`

Хук инкапсулирует всю логику запросов.

```typescript
interface Suggestion {
  name: string
  fullName: string
  type: string
  lat: number | null
  lon: number | null
}

function useAddressSuggest(query: string): {
  suggestions: Suggestion[]
  loading: boolean
}
```

**Поведение:**
- Если `query.trim().length < 2` — возвращает `[]`, запрос не делается
- Debounce 300ms: новый вызов отменяет предыдущий `AbortController`
- Ошибка сети / API → `suggestions: []`, `loading: false` (silent fail)
- Компонент размонтирован до ответа → `abort()`, state не обновляется

### `components/forms/booking/SuggestionList.tsx`

Чистый presentational-компонент. Принимает `suggestions`, `onSelect`, `loading`.

```typescript
interface SuggestionListProps {
  suggestions: Suggestion[]
  loading: boolean
  onSelect: (s: Suggestion) => void
}
```

**Состояния рендера:**
| Состояние | Отображение |
|---|---|
| `loading: true` | 3 skeleton-строки (pulse animation) |
| `suggestions.length === 0` (после ввода) | "Адрес не найден" |
| `suggestions.length > 0` | список max 5 строк с иконкой + `fullName` |

Иконка: `MapPin` (lucide) для `street_address`/`street`, `Building2` для `poi`/`building`.

---

## 3. Изменения в `AddressDrawer.tsx`

### Новый state

```typescript
type ActiveField = 'from' | 'to' | null
const [activeField, setActiveField] = useState<ActiveField>(null)
```

### Autofocus-логика

После выбора подсказки для поля `from` → `setActiveField('to')` + `toInputRef.current?.focus()`.  
После выбора `to` → `setActiveField(null)` (оба заполнены, подсказки скрываются).

### Desktop layout (md+)

```
┌─────────────────────┬──────────────────────────────┐
│  Left panel         │  Right panel                 │
│  max-w-[480px]      │  flex-1                      │
│                     │                              │
│  [Откуда input]     │  activeField !== null        │
│  [Куда input]       │  → <SuggestionList />        │
│                     │  activeField === null        │
│                     │  → <BookingMap />            │
│  [Confirm]          │                              │
└─────────────────────┴──────────────────────────────┘
```

Переход между SuggestionList и BookingMap — `AnimatePresence` с opacity fade (150ms).

### Mobile layout (< md)

```
┌──────────────────────────────┐
│  [Откуда input]              │
│  activeField === 'from'      │
│  → <SuggestionList />        │  ← dropdown под инпутом, z-10
│  [Куда input]                │
│  activeField === 'to'        │
│  → <SuggestionList />        │  ← dropdown под инпутом, z-10
├──────────────────────────────┤
│  <BookingMap />              │  ← НОВОЕ: ~40% высоты экрана
│  flex-shrink-0, h-[40vh]     │
├──────────────────────────────┤
│  [Confirm] [Clarify]         │
└──────────────────────────────┘
```

На мобильном `SuggestionList` — абсолютно спозиционированный dropdown (`position: absolute`, `top: 100%`, `z-index: 10`), не сдвигает карту.

### Изменение `BookingMap` props

`BookingMap` получает опциональные маркеры для отображения точек после заполнения адресов:

```typescript
interface BookingMapProps {
  fromPoint?: { lat: number; lon: number }
  toPoint?: { lat: number; lon: number }
}
```

Если обе точки переданы — строится линия маршрута через `DG.polyline`. Если одна — только маркер.

---

## 4. UX-состояния AddressDrawer

| Состояние | Desktop правая панель | Mobile под инпутами |
|---|---|---|
| Оба поля пусты, фокуса нет | Карта (Алматы, zoom 12) | Карта |
| `from` в фокусе, <2 символа | Карта | Карта |
| `from` в фокусе, ≥2 символа | SuggestionList (loading/results) | Dropdown под from-инпутом |
| `to` в фокусе, ≥2 символа | SuggestionList | Dropdown под to-инпутом |
| Оба адреса выбраны | Карта с двумя пинами + маршрут | Карта с пинами |

---

## 5. Что не меняется

- `BookingForm.tsx` — не трогаем, `onConfirm(from, to)` остаётся прежним
- `types.ts` — не трогаем
- `lib/booking-price.ts` — не трогаем
- CSP в `next.config.ts` — не трогаем
- `app/api/contact/route.ts` — не трогаем

---

## 6. Edge cases

- **Пользователь вводит адрес вручную (без выбора из подсказок):** работает — подсказки это дополнение, не замена ручному вводу. Кнопка "Подтвердить" всегда активна.
- **Нет API ключа:** `useAddressSuggest` возвращает `[]`, компонент рендерится без подсказок.
- **Медленный интернет:** показывается skeleton на 300ms+ после последнего ввода.
- **Escape / клик вне:** `onBlur` на инпуте → `setActiveField(null)` → подсказки скрываются. **Важно:** элементы `SuggestionList` должны иметь `onMouseDown={e => e.preventDefault()}` — это предотвращает срабатывание `blur` на инпуте до обработки `onClick` на подсказке (стандартный паттерн для suggestion dropdowns).
- **Almaty region_id=68:** hardcoded. Если проект расширится на другие города — вынести в конфиг.
