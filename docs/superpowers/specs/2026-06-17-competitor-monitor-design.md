# Competitor Monitor — Design Spec

**Date:** 2026-06-17
**Scope:** Отдельный проект `competitor-monitor/`, не входит в grandpro-moving

---

## Цель

Еженедельно собирать данные о конкурентах GrandPro Moving (цены, отзывы) из 2GIS, OLX.kz и сайтов конкурентов, анализировать их через Claude и показывать в веб-дашборде.

---

## Архитектура

**Один Python-процесс:** FastAPI (REST API) + APScheduler (еженедельный cron) + SQLite (хранение).

**Фронтенд:** React 18 + Vite + Tailwind + Recharts — отдельный Vite-проект, общается с бэком через REST.

```
competitor-monitor/
├── backend/
│   ├── main.py              # FastAPI app (API + запуск скана вручную)
│   ├── scheduler.py         # APScheduler — еженедельный cron
│   ├── db.py                # SQLite через aiosqlite
│   ├── scrapers/
│   │   ├── search.py        # SearXNG — поиск конкурентов по запросам
│   │   ├── extract.py       # Firecrawl API — извлечение страниц
│   │   └── browser.py       # Camoufox — стелс-браузер для JS-heavy сайтов
│   ├── analysis/
│   │   └── llm.py           # Claude claude-haiku-4-5 — анализ отзывов и цен
│   ├── .env                 # FIRECRAWL_API_KEY, ANTHROPIC_API_KEY
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Overview.tsx
│   │   │   ├── Competitors.tsx
│   │   │   ├── Prices.tsx
│   │   │   └── Reviews.tsx
│   │   └── components/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## Scraping Pipeline

### Шаг 1 — Discovery (SearXNG)

Поиск по запросам:
- `"грузчики Алматы цена"`
- `"переезд квартиры Алматы"`
- `"такелаж Алматы"`
- `"грузчики Астана"`

Результаты: список URL → новые домены добавляются в `competitors` с `auto_found=true`.

Использует публичный SearXNG-инстанс (без self-hosted инфраструктуры).

### Шаг 2 — Extraction (Firecrawl API)

Для каждого активного конкурента:
- Сайт конкурента → `POST /scrape` → чистый markdown с ценами и описанием услуг
- OLX-объявление (если есть `olx_url`) → `POST /scrape` → цены из объявления

Firecrawl возвращает markdown без HTML-шума, готовый для LLM.

### Шаг 3 — Browser fallback (Camoufox)

Используется когда Firecrawl возвращает пустой контент (JS-heavy страница).

Camoufox запускает стелс-Firefox:
1. Открывает URL
2. Ждёт загрузки контента
3. Возвращает итоговый HTML
4. HTML передаётся в Firecrawl `/scrape` с параметром `rawHtml`

Используется для 2GIS (карточки организаций, отзывы) и OLX с динамическим контентом.

### Шаг 4 — LLM анализ (Claude claude-haiku-4-5)

Входные данные: все отзывы + найденные цены по конкуренту за один скан.

Промпт возвращает структурированный JSON:

```json
{
  "strengths": ["быстрые", "аккуратные", "вежливые"],
  "weaknesses": ["опаздывают", "грубят по телефону", "теряют вещи"],
  "price_level": "дешевле рынка",
  "summary": "Компания работает в низком ценовом сегменте. Клиенты хвалят скорость, но жалуются на коммуникацию."
}
```

---

## Модель данных (SQLite)

```sql
CREATE TABLE competitors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  website_url TEXT,
  twogis_url TEXT,
  olx_url TEXT,
  city TEXT,              -- 'Алматы' | 'Астана'
  auto_found BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scans (
  id INTEGER PRIMARY KEY,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  status TEXT,            -- 'pending' | 'running' | 'done' | 'error'
  triggered_by TEXT       -- 'scheduler' | 'manual'
);

CREATE TABLE prices (
  id INTEGER PRIMARY KEY,
  scan_id INTEGER REFERENCES scans(id),
  competitor_id INTEGER REFERENCES competitors(id),
  service_name TEXT,      -- 'квартирный переезд' | 'такелаж' | 'упаковка'
  price_min INTEGER,
  price_max INTEGER,
  currency TEXT DEFAULT 'KZT',
  source_url TEXT,
  raw_text TEXT
);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY,
  scan_id INTEGER REFERENCES scans(id),
  competitor_id INTEGER REFERENCES competitors(id),
  platform TEXT,          -- '2gis' | 'olx' | 'website'
  rating REAL,
  text TEXT,
  review_date DATE
);

CREATE TABLE analysis (
  id INTEGER PRIMARY KEY,
  scan_id INTEGER REFERENCES scans(id),
  competitor_id INTEGER REFERENCES competitors(id),
  strengths TEXT,         -- JSON array
  weaknesses TEXT,        -- JSON array
  price_level TEXT,       -- 'дешевле рынка' | 'на уровне' | 'дороже'
  summary TEXT,
  raw_json TEXT
);
```

---

## API (FastAPI)

| Метод | Маршрут | Описание |
|---|---|---|
| `GET` | `/api/competitors` | Список конкурентов |
| `POST` | `/api/competitors` | Добавить конкурента вручную |
| `PATCH` | `/api/competitors/:id` | Обновить / деактивировать |
| `GET` | `/api/scans` | История сканов |
| `POST` | `/api/scans` | Запустить скан вручную |
| `GET` | `/api/scans/:id` | Статус и результаты скана |
| `GET` | `/api/prices` | Сравнение цен (последний скан) |
| `GET` | `/api/analysis` | LLM-анализ по конкурентам |

---

## Дашборд (React)

### `/` — Обзор
- Дата и статус последнего скана
- Кнопка "Запустить скан сейчас"
- Топ-3 инсайта от Claude (самое важное)
- Краткая таблица цен vs рынок

### `/competitors` — Конкуренты
- Таблица: имя, город, источники, статус, дата последнего скана
- Кнопки: добавить вручную, деактивировать
- Бейдж `auto` для найденных через SearXNG

### `/prices` — Цены
- Таблица сравнения: услуга × компания = цена
- Recharts: bar chart "ты vs конкуренты" по каждой услуге
- Цветовая кодировка: зелёный (ты дешевле), красный (ты дороже)

### `/reviews` — Анализ отзывов
- Карточка на каждого конкурента
- Сильные стороны (зелёные теги)
- Слабые стороны (красные теги) → это возможности для GrandPro
- Краткое summary от Claude

---

## Стек

| Компонент | Технология |
|---|---|
| Backend | Python 3.12, FastAPI, aiosqlite |
| Scheduler | APScheduler 3.x |
| Search | SearXNG (публичный инстанс) |
| Scraping | Firecrawl API |
| Browser | Camoufox |
| LLM | Anthropic SDK, `claude-haiku-4-5` |
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Storage | SQLite |

---

## Что НЕ входит в MVP

- Авторизация / логин (локальный инструмент)
- Email-уведомления
- Экспорт в PDF/Excel
- Сравнение с несколькими историческими сканами (только последний)
