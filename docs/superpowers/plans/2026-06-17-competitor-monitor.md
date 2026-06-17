# Competitor Monitor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone web tool that monitors moving company competitors in Kazakhstan by scraping 2GIS, OLX.kz, and competitor websites, then displays price comparisons and LLM-generated review insights in a React dashboard.

**Architecture:** Python FastAPI backend with APScheduler for weekly scraping, SQLite for storage, and Claude for review analysis. Separate React + Vite frontend communicates via REST API. Scraping uses SearXNG for discovery, Firecrawl API for content extraction, and Camoufox for JS-heavy pages.

**Tech Stack:** Python 3.12, FastAPI, aiosqlite, APScheduler 3.x, httpx, Camoufox, Anthropic SDK (`claude-haiku-4-5`), Firecrawl API, React 18, Vite 5, Tailwind CSS 3, Recharts, React Router 6

---

## File Structure

New repo at `~/Documents/competitor-monitor/`:

```
competitor-monitor/
├── backend/
│   ├── main.py              # FastAPI app + lifespan (scheduler wire-up)
│   ├── db.py                # SQLite schema + async CRUD helpers
│   ├── runner.py            # Scan orchestrator
│   ├── scheduler.py         # APScheduler weekly cron
│   ├── scrapers/
│   │   ├── __init__.py
│   │   ├── search.py        # SearXNG discovery
│   │   ├── extract.py       # Firecrawl API + price regex
│   │   └── browser.py       # Camoufox browser fallback
│   ├── analysis/
│   │   ├── __init__.py
│   │   └── llm.py           # Claude analysis
│   ├── tests/
│   │   ├── test_db.py
│   │   ├── test_extract.py
│   │   ├── test_llm.py
│   │   └── test_api.py
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── api.ts
    │   └── pages/
    │       ├── Overview.tsx
    │       ├── Competitors.tsx
    │       ├── Prices.tsx
    │       └── Reviews.tsx
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

---

### Task 1: Project scaffold

**Files:**
- Create: `~/Documents/competitor-monitor/` (new git repo)
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/scrapers/__init__.py`, `backend/analysis/__init__.py`, `backend/tests/__init__.py`

- [ ] **Step 1: Create directories and git repo**

```bash
mkdir -p ~/Documents/competitor-monitor/backend/scrapers
mkdir -p ~/Documents/competitor-monitor/backend/analysis
mkdir -p ~/Documents/competitor-monitor/backend/tests
mkdir -p ~/Documents/competitor-monitor/frontend/src/pages
cd ~/Documents/competitor-monitor
git init
touch backend/scrapers/__init__.py backend/analysis/__init__.py backend/tests/__init__.py
```

- [ ] **Step 2: Create requirements.txt**

```
# backend/requirements.txt
fastapi==0.115.6
uvicorn[standard]==0.32.1
aiosqlite==0.20.0
httpx==0.28.1
apscheduler==3.11.0
anthropic==0.49.0
camoufox[geoip]==0.4.11
python-dotenv==1.0.1
pytest==8.3.4
pytest-asyncio==0.25.0
httpx==0.28.1
```

- [ ] **Step 3: Create .env.example**

```
# backend/.env.example
FIRECRAWL_API_KEY=fc-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
SEARXNG_URL=https://searx.be
DATABASE_URL=./competitor_monitor.db
```

- [ ] **Step 4: Create .gitignore**

```
# .gitignore
.env
*.db
*.db-shm
*.db-wal
__pycache__/
.pytest_cache/
node_modules/
dist/
.venv/
```

- [ ] **Step 5: Install Python deps**

```bash
cd ~/Documents/competitor-monitor/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in FIRECRAWL_API_KEY and ANTHROPIC_API_KEY in .env
```

- [ ] **Step 6: Commit**

```bash
cd ~/Documents/competitor-monitor
git add .
git commit -m "feat: initial project scaffold"
```

---

### Task 2: Database layer

**Files:**
- Create: `backend/db.py`
- Create: `backend/tests/test_db.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_db.py
import pytest
import pytest_asyncio
import aiosqlite
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db import init_db, add_competitor, get_competitors, add_scan, update_scan_status

@pytest_asyncio.fixture
async def db(tmp_path):
    async with aiosqlite.connect(str(tmp_path / "test.db")) as conn:
        conn.row_factory = aiosqlite.Row
        await init_db(conn)
        yield conn

@pytest.mark.asyncio
async def test_add_and_get_competitor(db):
    await add_competitor(db, name="МувингПро", website_url="https://movingpro.kz", city="Алматы")
    result = await get_competitors(db)
    assert len(result) == 1
    assert result[0]["name"] == "МувингПро"

@pytest.mark.asyncio
async def test_add_scan(db):
    scan_id = await add_scan(db, triggered_by="manual")
    assert isinstance(scan_id, int)

@pytest.mark.asyncio
async def test_update_scan_status(db):
    scan_id = await add_scan(db, triggered_by="manual")
    await update_scan_status(db, scan_id, "done")
    async with db.execute("SELECT status FROM scans WHERE id = ?", (scan_id,)) as cur:
        row = await cur.fetchone()
    assert row[0] == "done"
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd ~/Documents/competitor-monitor/backend && source .venv/bin/activate
pytest tests/test_db.py -v
```

Expected: `FAILED` — `ModuleNotFoundError: No module named 'db'`

- [ ] **Step 3: Implement db.py**

```python
# backend/db.py
import aiosqlite, os, json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "./competitor_monitor.db")

async def get_connection() -> aiosqlite.Connection:
    conn = await aiosqlite.connect(DATABASE_URL)
    conn.row_factory = aiosqlite.Row
    return conn

async def init_db(conn: aiosqlite.Connection) -> None:
    await conn.executescript("""
        CREATE TABLE IF NOT EXISTS competitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            website_url TEXT,
            twogis_url TEXT,
            olx_url TEXT,
            city TEXT DEFAULT 'Алматы',
            auto_found BOOLEAN DEFAULT FALSE,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            finished_at TIMESTAMP,
            status TEXT DEFAULT 'pending',
            triggered_by TEXT DEFAULT 'scheduler'
        );
        CREATE TABLE IF NOT EXISTS prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_id INTEGER REFERENCES scans(id),
            competitor_id INTEGER REFERENCES competitors(id),
            service_name TEXT,
            price_min INTEGER,
            price_max INTEGER,
            currency TEXT DEFAULT 'KZT',
            source_url TEXT,
            raw_text TEXT
        );
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_id INTEGER REFERENCES scans(id),
            competitor_id INTEGER REFERENCES competitors(id),
            platform TEXT,
            rating REAL,
            text TEXT,
            review_date DATE
        );
        CREATE TABLE IF NOT EXISTS analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_id INTEGER REFERENCES scans(id),
            competitor_id INTEGER REFERENCES competitors(id),
            strengths TEXT,
            weaknesses TEXT,
            price_level TEXT,
            summary TEXT,
            raw_json TEXT
        );
    """)
    await conn.commit()

async def add_competitor(conn, name, website_url=None, twogis_url=None,
                         olx_url=None, city="Алматы", auto_found=False) -> int:
    cur = await conn.execute(
        "INSERT INTO competitors (name, website_url, twogis_url, olx_url, city, auto_found) VALUES (?,?,?,?,?,?)",
        (name, website_url, twogis_url, olx_url, city, auto_found),
    )
    await conn.commit()
    return cur.lastrowid

async def get_competitors(conn, active_only=True) -> list[dict]:
    q = "SELECT * FROM competitors" + (" WHERE active = TRUE" if active_only else "") + " ORDER BY created_at DESC"
    async with conn.execute(q) as cur:
        return [dict(r) for r in await cur.fetchall()]

async def add_scan(conn, triggered_by="scheduler") -> int:
    cur = await conn.execute(
        "INSERT INTO scans (triggered_by, status) VALUES (?, 'pending')", (triggered_by,)
    )
    await conn.commit()
    return cur.lastrowid

async def update_scan_status(conn, scan_id: int, status: str) -> None:
    finished = datetime.utcnow().isoformat() if status in ("done", "error") else None
    await conn.execute("UPDATE scans SET status=?, finished_at=? WHERE id=?", (status, finished, scan_id))
    await conn.commit()

async def add_price(conn, scan_id, competitor_id, service_name, price_min,
                    price_max, source_url, raw_text) -> None:
    await conn.execute(
        "INSERT INTO prices (scan_id,competitor_id,service_name,price_min,price_max,source_url,raw_text) VALUES (?,?,?,?,?,?,?)",
        (scan_id, competitor_id, service_name, price_min, price_max, source_url, raw_text),
    )
    await conn.commit()

async def add_review(conn, scan_id, competitor_id, platform, rating, text, review_date=None) -> None:
    await conn.execute(
        "INSERT INTO reviews (scan_id,competitor_id,platform,rating,text,review_date) VALUES (?,?,?,?,?,?)",
        (scan_id, competitor_id, platform, rating, text, review_date),
    )
    await conn.commit()

async def add_analysis(conn, scan_id, competitor_id, strengths, weaknesses,
                       price_level, summary, raw_json) -> None:
    await conn.execute(
        "INSERT INTO analysis (scan_id,competitor_id,strengths,weaknesses,price_level,summary,raw_json) VALUES (?,?,?,?,?,?,?)",
        (scan_id, competitor_id, json.dumps(strengths, ensure_ascii=False),
         json.dumps(weaknesses, ensure_ascii=False), price_level, summary, raw_json),
    )
    await conn.commit()

async def get_latest_scan(conn) -> dict | None:
    async with conn.execute("SELECT * FROM scans ORDER BY started_at DESC LIMIT 1") as cur:
        row = await cur.fetchone()
    return dict(row) if row else None

async def get_prices_for_scan(conn, scan_id: int) -> list[dict]:
    async with conn.execute(
        "SELECT p.*, c.name as competitor_name FROM prices p JOIN competitors c ON p.competitor_id=c.id WHERE p.scan_id=?",
        (scan_id,)
    ) as cur:
        return [dict(r) for r in await cur.fetchall()]

async def get_analysis_for_scan(conn, scan_id: int) -> list[dict]:
    async with conn.execute(
        "SELECT a.*, c.name as competitor_name FROM analysis a JOIN competitors c ON a.competitor_id=c.id WHERE a.scan_id=?",
        (scan_id,)
    ) as cur:
        return [dict(r) for r in await cur.fetchall()]
```

- [ ] **Step 4: Run tests — verify pass**

```bash
pytest tests/test_db.py -v
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/competitor-monitor
git add backend/db.py backend/tests/test_db.py
git commit -m "feat: SQLite database layer with schema and CRUD helpers"
```

---

### Task 3: Firecrawl extractor + price parser

**Files:**
- Create: `backend/scrapers/extract.py`
- Create: `backend/tests/test_extract.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_extract.py
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scrapers.extract import scrape_url, extract_prices_from_markdown, ScrapeError

@pytest.mark.asyncio
async def test_scrape_url_returns_markdown():
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"markdown": "# МувингПро\nПереезд от 15 000 тенге"}
    mock_resp.raise_for_status = lambda: None
    with patch("scrapers.extract.httpx.AsyncClient") as MockClient:
        mock_client = AsyncMock()
        MockClient.return_value.__aenter__.return_value = mock_client
        mock_client.post.return_value = mock_resp
        result = await scrape_url("https://movingpro.kz")
    assert "МувингПро" in result

def test_extract_prices_finds_range():
    md = "Квартирный переезд: от 15 000 до 30 000 тг"
    prices = extract_prices_from_markdown(md)
    assert any(p["price_min"] == 15000 for p in prices)

def test_extract_prices_finds_single():
    md = "Такелаж от 25000 тенге"
    prices = extract_prices_from_markdown(md)
    assert any(p["price_min"] == 25000 for p in prices)
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pytest tests/test_extract.py -v
```

Expected: `FAILED` — `ModuleNotFoundError: No module named 'scrapers.extract'`

- [ ] **Step 3: Implement scrapers/extract.py**

```python
# backend/scrapers/extract.py
import httpx, re, os
from dotenv import load_dotenv

load_dotenv()
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
FIRECRAWL_BASE = "https://api.firecrawl.dev/v1"

class ScrapeError(Exception):
    pass

async def scrape_url(url: str, raw_html: str = None) -> str:
    payload = {"url": url, "formats": ["markdown"]}
    if raw_html:
        payload["rawHtml"] = raw_html
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{FIRECRAWL_BASE}/scrape",
            headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}"},
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
    markdown = data.get("markdown") or data.get("data", {}).get("markdown", "")
    if not markdown:
        raise ScrapeError(f"No markdown returned for {url}")
    return markdown

def extract_prices_from_markdown(markdown: str) -> list[dict]:
    # Collapse spaces inside numbers: "15 000" → "15000"
    text = re.sub(r"(\d)\s(\d{3})\b", r"\1\2", markdown)
    prices = []

    for m in re.finditer(r"от\s+(\d+)\s+до\s+(\d+)\s*(тг|тенге|₸)", text, re.I):
        prices.append({"price_min": int(m.group(1)), "price_max": int(m.group(2)), "raw_text": m.group(0)})

    for m in re.finditer(r"от\s+(\d+)\s*(тг|тенге|₸)", text, re.I):
        if not any(p["price_min"] == int(m.group(1)) and p.get("price_max") for p in prices):
            prices.append({"price_min": int(m.group(1)), "price_max": None, "raw_text": m.group(0)})

    for m in re.finditer(r"(\d+)\s*[-–]\s*(\d+)\s*(тг|тенге|₸)", text, re.I):
        prices.append({"price_min": int(m.group(1)), "price_max": int(m.group(2)), "raw_text": m.group(0)})

    return prices
```

- [ ] **Step 4: Run tests — verify pass**

```bash
pytest tests/test_extract.py -v
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/competitor-monitor
git add backend/scrapers/extract.py backend/tests/test_extract.py
git commit -m "feat: Firecrawl extractor with KZT price regex parser"
```

---

### Task 4: SearXNG discovery

**Files:**
- Create: `backend/scrapers/search.py`

- [ ] **Step 1: Write failing test**

Add to `backend/tests/test_extract.py`:

```python
from scrapers.search import search_competitors

@pytest.mark.asyncio
async def test_search_returns_urls():
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"results": [
        {"url": "https://movingpro.kz", "title": "МувингПро"},
    ]}
    mock_resp.raise_for_status = lambda: None
    with patch("scrapers.search.httpx.AsyncClient") as MockClient:
        mock_client = AsyncMock()
        MockClient.return_value.__aenter__.return_value = mock_client
        mock_client.get.return_value = mock_resp
        results = await search_competitors("грузчики Алматы")
    assert results[0]["url"] == "https://movingpro.kz"
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pytest tests/test_extract.py::test_search_returns_urls -v
```

Expected: `FAILED` — `ModuleNotFoundError: No module named 'scrapers.search'`

- [ ] **Step 3: Implement scrapers/search.py**

```python
# backend/scrapers/search.py
import httpx, os
from dotenv import load_dotenv

load_dotenv()
SEARXNG_URL = os.getenv("SEARXNG_URL", "https://searx.be")

SEARCH_QUERIES = [
    "грузчики Алматы цена",
    "переезд квартиры Алматы",
    "такелаж Алматы",
    "грузчики Астана цена",
    "переезд офиса Алматы",
]

async def search_competitors(query: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{SEARXNG_URL}/search",
            params={"q": query, "format": "json", "language": "ru-RU", "categories": "general"},
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()
    return [{"url": r["url"], "title": r.get("title", "")} for r in data.get("results", []) if r.get("url")]

async def discover_competitor_urls() -> list[dict]:
    seen_domains: set[str] = set()
    results = []
    for query in SEARCH_QUERIES:
        try:
            for hit in await search_competitors(query):
                domain = hit["url"].split("/")[2]
                if domain not in seen_domains:
                    seen_domains.add(domain)
                    results.append(hit)
        except Exception:
            continue
    return results
```

- [ ] **Step 4: Run tests — verify pass**

```bash
pytest tests/test_extract.py -v
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/competitor-monitor
git add backend/scrapers/search.py backend/tests/test_extract.py
git commit -m "feat: SearXNG competitor discovery"
```

---

### Task 5: Camoufox browser fallback

**Files:**
- Create: `backend/scrapers/browser.py`

- [ ] **Step 1: Download Camoufox browser**

```bash
cd ~/Documents/competitor-monitor/backend && source .venv/bin/activate
python -m camoufox fetch
```

Expected: Downloads Firefox binary. Takes ~1 minute.

- [ ] **Step 2: Implement scrapers/browser.py**

```python
# backend/scrapers/browser.py
from camoufox.sync_api import Camoufox

def fetch_with_browser(url: str, wait_selector: str = None) -> str:
    """Return full page HTML using stealthy Firefox. Used when Firecrawl returns empty."""
    with Camoufox(headless=True) as browser:
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")
        if wait_selector:
            page.wait_for_selector(wait_selector, timeout=10000)
        html = page.content()
        page.close()
    return html
```

- [ ] **Step 3: Smoke test**

```bash
python3 -c "
from scrapers.browser import fetch_with_browser
html = fetch_with_browser('https://example.com')
print(len(html), 'chars — OK' if len(html) > 1000 else 'FAIL: too short')
"
```

Expected: `2000+ chars — OK`

- [ ] **Step 4: Commit**

```bash
cd ~/Documents/competitor-monitor
git add backend/scrapers/browser.py
git commit -m "feat: Camoufox browser fallback for JS-heavy pages"
```

---

### Task 6: LLM analysis with Claude

**Files:**
- Create: `backend/analysis/llm.py`
- Create: `backend/tests/test_llm.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_llm.py
import pytest, json
from unittest.mock import MagicMock, patch
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from analysis.llm import analyze_competitor

@pytest.mark.asyncio
async def test_analyze_competitor_returns_structure():
    payload = json.dumps({
        "strengths": ["быстрые"], "weaknesses": ["опаздывают"],
        "price_level": "дешевле рынка", "summary": "Итог."
    })
    mock_msg = MagicMock()
    mock_msg.content = [MagicMock(text=payload)]
    with patch("analysis.llm.Anthropic") as MockA:
        MockA.return_value.messages.create.return_value = mock_msg
        result = await analyze_competitor("МувингПро", ["Быстро"], "от 15000 тг")
    assert result["price_level"] == "дешевле рынка"
    assert "summary" in result
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pytest tests/test_llm.py -v
```

Expected: `FAILED` — `ModuleNotFoundError: No module named 'analysis.llm'`

- [ ] **Step 3: Implement analysis/llm.py**

```python
# backend/analysis/llm.py
import json, os
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM = """Ты аналитик рынка переездов в Казахстане.
Анализируй данные и возвращай ТОЛЬКО валидный JSON без пояснений:
{
  "strengths": ["2-5 сильных сторон из отзывов"],
  "weaknesses": ["2-5 слабых сторон из отзывов"],
  "price_level": "дешевле рынка" | "на уровне рынка" | "дороже рынка",
  "summary": "2-3 предложения итога"
}"""

async def analyze_competitor(name: str, reviews: list[str], prices_markdown: str) -> dict:
    reviews_text = "\n".join(f"- {r}" for r in reviews[:50])
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=1024,
        system=SYSTEM,
        messages=[{"role": "user", "content": (
            f"Компания: {name}\n\nОтзывы:\n{reviews_text}\n\nЦены:\n{prices_markdown[:2000]}\n\nВерни JSON."
        )}],
    )
    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    result = json.loads(raw.strip())
    result["raw_json"] = response.content[0].text
    return result
```

- [ ] **Step 4: Run tests — verify pass**

```bash
pytest tests/test_llm.py -v
```

Expected: `1 passed`

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/competitor-monitor
git add backend/analysis/llm.py backend/tests/test_llm.py
git commit -m "feat: Claude LLM analysis for competitor reviews and prices"
```

---

### Task 7: Scan runner (orchestrator)

**Files:**
- Create: `backend/runner.py`

- [ ] **Step 1: Implement runner.py**

```python
# backend/runner.py
import logging
from db import (get_connection, init_db, get_competitors, add_competitor,
                add_scan, update_scan_status, add_price, add_review, add_analysis)
from scrapers.search import discover_competitor_urls
from scrapers.extract import scrape_url, extract_prices_from_markdown, ScrapeError
from scrapers.browser import fetch_with_browser
from analysis.llm import analyze_competitor

logger = logging.getLogger(__name__)

async def run_scan(triggered_by: str = "scheduler") -> int:
    conn = await get_connection()
    await init_db(conn)
    scan_id = await add_scan(conn, triggered_by=triggered_by)
    await update_scan_status(conn, scan_id, "running")
    try:
        # Discover new competitors
        discovered = await discover_competitor_urls()
        existing_urls = {c["website_url"] for c in await get_competitors(conn, active_only=False) if c["website_url"]}
        for hit in discovered:
            if hit["url"] not in existing_urls:
                await add_competitor(conn, name=hit["title"][:100], website_url=hit["url"], auto_found=True)
                logger.info(f"New: {hit['url']}")
        # Scrape each active competitor
        for competitor in await get_competitors(conn, active_only=True):
            await _scrape_competitor(conn, scan_id, competitor)
        await update_scan_status(conn, scan_id, "done")
    except Exception as e:
        logger.error(f"Scan {scan_id} failed: {e}")
        await update_scan_status(conn, scan_id, "error")
    await conn.close()
    return scan_id

async def _scrape_competitor(conn, scan_id: int, competitor: dict) -> None:
    cid, name, url = competitor["id"], competitor["name"], competitor.get("website_url")
    if not url:
        return
    logger.info(f"Scraping {name}")
    markdown = ""
    try:
        markdown = await scrape_url(url)
    except ScrapeError:
        try:
            html = fetch_with_browser(url)
            markdown = await scrape_url(url, raw_html=html)
        except Exception as e:
            logger.warning(f"Could not scrape {url}: {e}")

    for price in extract_prices_from_markdown(markdown):
        await add_price(conn, scan_id, cid, "услуга", price["price_min"],
                        price.get("price_max"), url, price["raw_text"])

    if competitor.get("olx_url"):
        try:
            olx_md = await scrape_url(competitor["olx_url"])
            for price in extract_prices_from_markdown(olx_md):
                await add_price(conn, scan_id, cid, "olx", price["price_min"],
                                price.get("price_max"), competitor["olx_url"], price["raw_text"])
        except Exception as e:
            logger.warning(f"OLX failed for {name}: {e}")

    if markdown:
        try:
            result = await analyze_competitor(name, [], markdown)
            await add_analysis(conn, scan_id, cid,
                               result.get("strengths", []), result.get("weaknesses", []),
                               result.get("price_level", "на уровне рынка"),
                               result.get("summary", ""), result.get("raw_json", ""))
        except Exception as e:
            logger.warning(f"LLM failed for {name}: {e}")
```

- [ ] **Step 2: Smoke test**

```bash
cd ~/Documents/competitor-monitor/backend && source .venv/bin/activate
python3 -c "
import asyncio
from runner import run_scan
from db import get_connection, init_db, add_competitor

async def main():
    conn = await get_connection()
    await init_db(conn)
    await add_competitor(conn, name='Тест', website_url='https://example.com')
    await conn.close()
    scan_id = await run_scan('manual')
    print(f'scan_id={scan_id} — OK')

asyncio.run(main())
"
```

Expected: `scan_id=1 — OK`

- [ ] **Step 3: Commit**

```bash
cd ~/Documents/competitor-monitor
git add backend/runner.py
git commit -m "feat: scan orchestrator combining discovery, scraping, and LLM"
```

---

### Task 8: FastAPI app

**Files:**
- Create: `backend/main.py`
- Create: `backend/tests/test_api.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_api.py
import pytest
from httpx import AsyncClient, ASGITransport
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app

@pytest.mark.asyncio
async def test_get_competitors_empty():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/competitors")
    assert resp.status_code == 200

@pytest.mark.asyncio
async def test_add_competitor():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/competitors", json={
            "name": "МувингПро", "website_url": "https://movingpro.kz", "city": "Алматы"
        })
    assert resp.status_code == 200
    assert resp.json()["name"] == "МувингПро"
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pytest tests/test_api.py -v
```

Expected: `FAILED` — `ModuleNotFoundError: No module named 'main'`

- [ ] **Step 3: Implement main.py**

```python
# backend/main.py
import json, os
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from db import (get_connection, init_db, get_competitors, add_competitor,
                get_latest_scan, get_prices_for_scan, get_analysis_for_scan)

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    conn = await get_connection()
    await init_db(conn)
    await conn.close()
    from scheduler import create_scheduler
    scheduler = create_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(title="Competitor Monitor", lifespan=lifespan)
app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])

class CompetitorIn(BaseModel):
    name: str
    website_url: str = None
    twogis_url: str = None
    olx_url: str = None
    city: str = "Алматы"

@app.get("/api/competitors")
async def list_competitors():
    conn = await get_connection()
    result = await get_competitors(conn)
    await conn.close()
    return result

@app.post("/api/competitors")
async def create_competitor(body: CompetitorIn):
    conn = await get_connection()
    cid = await add_competitor(conn, name=body.name, website_url=body.website_url,
                               twogis_url=body.twogis_url, olx_url=body.olx_url, city=body.city)
    result = next(c for c in await get_competitors(conn) if c["id"] == cid)
    await conn.close()
    return result

@app.patch("/api/competitors/{cid}")
async def toggle_competitor(cid: int, active: bool):
    conn = await get_connection()
    await conn.execute("UPDATE competitors SET active=? WHERE id=?", (active, cid))
    await conn.commit()
    await conn.close()
    return {"ok": True}

@app.get("/api/scans")
async def list_scans():
    conn = await get_connection()
    async with conn.execute("SELECT * FROM scans ORDER BY started_at DESC LIMIT 20") as cur:
        rows = [dict(r) for r in await cur.fetchall()]
    await conn.close()
    return rows

@app.post("/api/scans")
async def start_scan(background_tasks: BackgroundTasks):
    from runner import run_scan
    background_tasks.add_task(run_scan, "manual")
    return {"message": "Скан запущен"}

@app.get("/api/prices")
async def get_prices():
    conn = await get_connection()
    scan = await get_latest_scan(conn)
    result = await get_prices_for_scan(conn, scan["id"]) if scan else []
    await conn.close()
    return result

@app.get("/api/analysis")
async def get_analysis():
    conn = await get_connection()
    scan = await get_latest_scan(conn)
    items = await get_analysis_for_scan(conn, scan["id"]) if scan else []
    await conn.close()
    for item in items:
        for f in ("strengths", "weaknesses"):
            if isinstance(item.get(f), str):
                try: item[f] = json.loads(item[f])
                except: item[f] = []
    return items

@app.get("/api/overview")
async def get_overview():
    conn = await get_connection()
    scan = await get_latest_scan(conn)
    competitors = await get_competitors(conn)
    analysis = await get_analysis_for_scan(conn, scan["id"]) if scan else []
    await conn.close()
    return {
        "last_scan": dict(scan) if scan else None,
        "competitors_count": len(competitors),
        "top_insights": [a["summary"] for a in analysis[:3] if a.get("summary")],
    }
```

- [ ] **Step 4: Create scheduler.py (needed for lifespan)**

```python
# backend/scheduler.py
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(_weekly_scan, CronTrigger(day_of_week="mon", hour=9), id="weekly", replace_existing=True)
    return scheduler

async def _weekly_scan():
    from runner import run_scan
    logger.info("Weekly scan started")
    scan_id = await run_scan("scheduler")
    logger.info(f"Weekly scan done: id={scan_id}")
```

- [ ] **Step 5: Run tests — verify pass**

```bash
pytest tests/test_api.py -v
```

Expected: `2 passed`

- [ ] **Step 6: Smoke test server**

```bash
uvicorn main:app --reload --port 8000
# Open http://localhost:8000/docs — FastAPI docs should load
```

- [ ] **Step 7: Commit**

```bash
cd ~/Documents/competitor-monitor
git add backend/main.py backend/scheduler.py backend/tests/test_api.py
git commit -m "feat: FastAPI REST API with APScheduler weekly cron"
```

---

### Task 9: Frontend scaffold

**Files:**
- Create: `frontend/` (Vite project)

- [ ] **Step 1: Scaffold**

```bash
cd ~/Documents/competitor-monitor
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: Configure Tailwind — replace `frontend/tailwind.config.js`**

```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 3: Replace `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Replace `frontend/vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
```

- [ ] **Step 5: Create `frontend/src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Overview } from './pages/Overview'
import { Competitors } from './pages/Competitors'
import { Prices } from './pages/Prices'
import { Reviews } from './pages/Reviews'

const links = [
  { to: '/', label: 'Обзор' },
  { to: '/competitors', label: 'Конкуренты' },
  { to: '/prices', label: 'Цены' },
  { to: '/reviews', label: 'Отзывы' },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b px-6 py-3 flex gap-6 items-center">
          <span className="font-bold text-gray-900">Конкурентный мониторинг</span>
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-900'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="max-w-6xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/competitors" element={<Competitors />} />
            <Route path="/prices" element={<Prices />} />
            <Route path="/reviews" element={<Reviews />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
```

- [ ] **Step 6: Create `frontend/src/api.ts`**

```ts
const BASE = '/api'

export type Competitor = {
  id: number; name: string; website_url: string | null; twogis_url: string | null
  olx_url: string | null; city: string; auto_found: boolean; active: boolean; created_at: string
}
export type Scan = { id: number; started_at: string; finished_at: string | null; status: string; triggered_by: string }
export type Price = { id: number; competitor_id: number; competitor_name: string; service_name: string; price_min: number; price_max: number | null; source_url: string }
export type Analysis = { id: number; competitor_id: number; competitor_name: string; strengths: string[]; weaknesses: string[]; price_level: string; summary: string }
export type Overview = { last_scan: Scan | null; competitors_count: number; top_insights: string[] }

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}
async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST', headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export const api = {
  getOverview: () => get<Overview>('/overview'),
  getCompetitors: () => get<Competitor[]>('/competitors'),
  addCompetitor: (data: Pick<Competitor, 'name' | 'website_url' | 'twogis_url' | 'olx_url' | 'city'>) => post<Competitor>('/competitors', data),
  toggleCompetitor: (id: number, active: boolean) => fetch(`${BASE}/competitors/${id}?active=${active}`, { method: 'PATCH' }),
  startScan: () => post<{ message: string }>('/scans'),
  getPrices: () => get<Price[]>('/prices'),
  getAnalysis: () => get<Analysis[]>('/analysis'),
}
```

- [ ] **Step 7: Create stub pages**

```bash
cat > frontend/src/pages/Overview.tsx << 'EOF'
export function Overview() { return <div>Overview</div> }
EOF
cat > frontend/src/pages/Competitors.tsx << 'EOF'
export function Competitors() { return <div>Competitors</div> }
EOF
cat > frontend/src/pages/Prices.tsx << 'EOF'
export function Prices() { return <div>Prices</div> }
EOF
cat > frontend/src/pages/Reviews.tsx << 'EOF'
export function Reviews() { return <div>Reviews</div> }
EOF
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd ~/Documents/competitor-monitor/frontend
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: `http://localhost:5173` opens, nav bar visible.

- [ ] **Step 10: Commit**

```bash
cd ~/Documents/competitor-monitor
git add frontend/
git commit -m "feat: React + Vite + Tailwind frontend scaffold with API client"
```

---

### Task 10: Overview page

**Files:**
- Modify: `frontend/src/pages/Overview.tsx`

- [ ] **Step 1: Implement Overview.tsx**

```tsx
import { useEffect, useState } from 'react'
import { api, type Overview as OData, type Scan } from '../api'

function ScanBadge({ scan }: { scan: Scan | null }) {
  if (!scan) return <p className="text-gray-400 text-sm">Сканов ещё не было</p>
  const colors: Record<string, string> = {
    done: 'bg-green-100 text-green-700', running: 'bg-blue-100 text-blue-700',
    error: 'bg-red-100 text-red-700', pending: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[scan.status] ?? 'bg-gray-100 text-gray-600'}`}>
        {scan.status}
      </span>
      <span className="text-sm text-gray-500">{new Date(scan.started_at).toLocaleString('ru-RU')}</span>
    </div>
  )
}

export function Overview() {
  const [data, setData] = useState<OData | null>(null)
  const [scanning, setScanning] = useState(false)

  const load = async () => { try { setData(await api.getOverview()) } catch {} }
  useEffect(() => { load() }, [])

  const handleScan = async () => {
    setScanning(true)
    await api.startScan()
    setTimeout(() => { setScanning(false); load() }, 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Обзор</h1>
        <button onClick={handleScan} disabled={scanning}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {scanning ? 'Запускаем...' : 'Запустить скан'}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Конкуренты</p>
          <p className="text-3xl font-bold text-gray-900">{data?.competitors_count ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 col-span-2">
          <p className="text-sm text-gray-500 mb-2">Последний скан</p>
          <ScanBadge scan={data?.last_scan ?? null} />
        </div>
      </div>
      {(data?.top_insights?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Топ инсайты</h2>
          <ul className="space-y-2">
            {data!.top_insights.map((s, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2">
                <span className="text-blue-400 font-bold">{i + 1}.</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser — open `http://localhost:5173`**

Should see stat cards and "Запустить скан" button.

- [ ] **Step 3: Commit**

```bash
cd ~/Documents/competitor-monitor
git add frontend/src/pages/Overview.tsx
git commit -m "feat: Overview page with scan trigger and stat cards"
```

---

### Task 11: Competitors page

**Files:**
- Modify: `frontend/src/pages/Competitors.tsx`

- [ ] **Step 1: Implement Competitors.tsx**

```tsx
import { useEffect, useState } from 'react'
import { api, type Competitor } from '../api'

function AddForm({ onAdd }: { onAdd: () => void }) {
  const [name, setName] = useState(''), [url, setUrl] = useState(''), [city, setCity] = useState('Алматы')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    await api.addCompetitor({ name, website_url: url || null, twogis_url: null, olx_url: null, city })
    setName(''); setUrl(''); onAdd()
  }
  return (
    <form onSubmit={submit} className="bg-white rounded-xl border p-4 flex gap-3 items-end flex-wrap">
      <div className="flex-1 min-w-32">
        <label className="text-xs text-gray-500 block mb-1">Название</label>
        <input value={name} onChange={e => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="МувингПро" />
      </div>
      <div className="flex-1 min-w-48">
        <label className="text-xs text-gray-500 block mb-1">Сайт</label>
        <input value={url} onChange={e => setUrl(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Город</label>
        <select value={city} onChange={e => setCity(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option>Алматы</option><option>Астана</option>
        </select>
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
        Добавить
      </button>
    </form>
  )
}

export function Competitors() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const load = async () => { try { setCompetitors(await api.getCompetitors()) } catch {} }
  useEffect(() => { load() }, [])
  const toggle = async (c: Competitor) => { await api.toggleCompetitor(c.id, !c.active); load() }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Конкуренты</h1>
      <AddForm onAdd={load} />
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              {['Название', 'Город', 'Сайт', 'Источник', 'Статус'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {competitors.length === 0
              ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Нет конкурентов</td></tr>
              : competitors.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.city}</td>
                  <td className="px-4 py-3">
                    {c.website_url
                      ? <a href={c.website_url} target="_blank" rel="noopener"
                          className="text-blue-600 hover:underline truncate block max-w-48">{c.website_url}</a>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.auto_found ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.auto_found ? 'auto' : 'вручную'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(c)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {c.active ? 'активен' : 'отключён'}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser — open `http://localhost:5173/competitors`**

Add a competitor, verify it appears, toggle active/inactive.

- [ ] **Step 3: Commit**

```bash
cd ~/Documents/competitor-monitor
git add frontend/src/pages/Competitors.tsx
git commit -m "feat: Competitors page with add form and toggle"
```

---

### Task 12: Prices page

**Files:**
- Modify: `frontend/src/pages/Prices.tsx`

- [ ] **Step 1: Implement Prices.tsx**

```tsx
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api, type Price } from '../api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function groupByService(prices: Price[]) {
  const map: Record<string, Record<string, number>> = {}
  for (const p of prices) {
    if (!map[p.service_name]) map[p.service_name] = {}
    map[p.service_name][p.competitor_name] = p.price_min
  }
  return Object.entries(map).map(([service, comps]) => ({ service, ...comps }))
}

export function Prices() {
  const [prices, setPrices] = useState<Price[]>([])
  useEffect(() => { api.getPrices().then(setPrices).catch(() => {}) }, [])

  const chartData = groupByService(prices)
  const names = [...new Set(prices.map(p => p.competitor_name))]

  if (!prices.length) return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Цены</h1>
      <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
        Нет данных. Запустите скан на странице Обзор.
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Сравнение цен</h1>
      <div className="bg-white rounded-xl border p-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Мин. цена по услугам (₸)</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <XAxis dataKey="service" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => `${v.toLocaleString('ru-RU')} ₸`} />
            <Legend />
            {names.map((n, i) => <Bar key={n} dataKey={n} fill={COLORS[i % COLORS.length]} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>{['Услуга', 'Конкурент', 'Мин.', 'Макс.'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {prices.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{p.service_name}</td>
                <td className="px-4 py-3 font-medium">{p.competitor_name}</td>
                <td className="px-4 py-3">{p.price_min.toLocaleString('ru-RU')} ₸</td>
                <td className="px-4 py-3 text-gray-400">{p.price_max ? `${p.price_max.toLocaleString('ru-RU')} ₸` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser after a scan**

Open `http://localhost:5173/prices` — chart and table should render.

- [ ] **Step 3: Commit**

```bash
cd ~/Documents/competitor-monitor
git add frontend/src/pages/Prices.tsx
git commit -m "feat: Prices page with Recharts bar chart and comparison table"
```

---

### Task 13: Reviews / LLM analysis page

**Files:**
- Modify: `frontend/src/pages/Reviews.tsx`

- [ ] **Step 1: Implement Reviews.tsx**

```tsx
import { useEffect, useState } from 'react'
import { api, type Analysis } from '../api'

const PRICE_COLOR: Record<string, string> = {
  'дешевле рынка': 'bg-green-100 text-green-700',
  'на уровне рынка': 'bg-gray-100 text-gray-600',
  'дороже рынка': 'bg-red-100 text-red-700',
}

function Tag({ label, green }: { label: string; green: boolean }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${green ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {label}
    </span>
  )
}

function Card({ item }: { item: Analysis }) {
  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900">{item.competitor_name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${PRICE_COLOR[item.price_level] ?? 'bg-gray-100 text-gray-600'}`}>
          {item.price_level}
        </span>
      </div>
      {item.summary && <p className="text-sm text-gray-600">{item.summary}</p>}
      {item.strengths.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase font-medium mb-2">Сильные стороны</p>
          <div className="flex flex-wrap gap-1.5">{item.strengths.map((s, i) => <Tag key={i} label={s} green />)}</div>
        </div>
      )}
      {item.weaknesses.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase font-medium mb-2">Слабые стороны → ваши возможности</p>
          <div className="flex flex-wrap gap-1.5">{item.weaknesses.map((w, i) => <Tag key={i} label={w} green={false} />)}</div>
        </div>
      )}
    </div>
  )
}

export function Reviews() {
  const [analysis, setAnalysis] = useState<Analysis[]>([])
  useEffect(() => { api.getAnalysis().then(setAnalysis).catch(() => {}) }, [])

  if (!analysis.length) return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Анализ отзывов</h1>
      <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
        Нет данных. Запустите скан на странице Обзор.
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Анализ конкурентов</h1>
      <p className="text-sm text-gray-500">Сильные и слабые стороны по данным Claude</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.map(item => <Card key={item.id} item={item} />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run all backend tests**

```bash
cd ~/Documents/competitor-monitor/backend && source .venv/bin/activate
pytest tests/ -v
```

Expected: all tests pass

- [ ] **Step 3: Verify full flow in browser**

```bash
# Terminal 1
cd ~/Documents/competitor-monitor/backend && source .venv/bin/activate && uvicorn main:app --port 8000
# Terminal 2
cd ~/Documents/competitor-monitor/frontend && npm run dev
```

1. Open `http://localhost:5173/competitors` → add a competitor manually
2. Open `http://localhost:5173` → click "Запустить скан" → wait ~30s
3. Open `/prices` → verify price data appears
4. Open `/reviews` → verify Claude analysis cards appear

- [ ] **Step 4: Commit**

```bash
cd ~/Documents/competitor-monitor
git add frontend/src/pages/Reviews.tsx
git commit -m "feat: Reviews page with Claude LLM analysis cards"
```

---

## Running the project

```bash
# Backend
cd ~/Documents/competitor-monitor/backend
source .venv/bin/activate
uvicorn main:app --port 8000

# Frontend (separate terminal)
cd ~/Documents/competitor-monitor/frontend
npm run dev
```

Open `http://localhost:5173`
