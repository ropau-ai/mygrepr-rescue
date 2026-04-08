# Grepr / reddittri

You are a **Next.js 16 + Python full-stack developer** specializing in Reddit data aggregation, Groq AI categorization, and editorial UX for French finance communities.

## Project

Grepr — Reddit finance aggregator. Scrapes 14 subreddits daily, categorizes posts with Groq AI (LLaMA 3.3 70B), extracts financial data, stores in NocoDB, displays on a Next.js dashboard.

## Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind v4, Radix UI, Shadcn/ui (new-york), Framer Motion, next-themes
- **Backend**: Python 3.12, PullPush.io (primary) + PRAW (fallback), Groq API + DeepSeek fallback
- **Auth**: Auth.js v5 (Google OAuth, JWT sessions, no DB) — migrated from Clerk 2026-04-03
- **Data**: NocoDB (REST API, Hetzner VPS)
- **Deployment**: Dokploy

## Commands

### Frontend (`/frontend`)
```bash
npm run dev        # localhost:3000
npm run build
npm run start
npm run lint
```

### Backend (root)
```bash
pip install -r requirements.txt
python scheduler.py          # Daily loop (6:00 UTC)
python scheduler.py dry      # One-time fetch, no DB push
python scheduler.py status
python scheduler.py reset
```

### Docker
```bash
docker build -t grepr .      # Backend worker only
```

## Architecture

**Monorepo**: `frontend/` (Next.js) + `backend/` (Python) — independent, communicate through NocoDB.

### Data Flow
```
14 subreddits → PullPush.io fetch → Groq AI categorization (16 categories) → NocoDB → Next.js SSR → Dashboard
```

### Frontend key files
- `src/app/` — App Router pages (`force-dynamic` on all main pages)
- `src/lib/i18n.ts` — Custom i18n (FR/EN, no library), `Record<Locale, Record<string, string>>`, `t(key, locale, params?)`
- `src/lib/design-tokens.ts` — `CATEGORY_TAG_COLORS`, `getCategoryColor()`
- `src/components/language-provider.tsx` — React context, localStorage `grepr-lang`, defaults FR
- `src/types/post.ts` — `Post`, `ExtractedData`, `CATEGORIES`, `CATEGORY_COLORS`, `formatAmount`
- **Path alias**: `@/*` → `src/*`

### Backend key files
- `backend/config.py` — 16 categories, 14 subreddits, API keys, ETF list
- `backend/fetchers/reddit.py` — PullPush.io + PRAW fallback
- `backend/processors/ai.py` — Groq categorization, financial regex
- `backend/db/nocodb.py` — NocoDB HTTP client
- `backend/cli/` — `fetch.py`, `process.py`, `push.py`
- `scheduler.py` — Orchestrator, daily cron

### Don't touch
- `mygrepr/` — Archived copy of original repo. Not active.

## Routes

| Route | Purpose |
|---|---|
| `/` | Dashboard — bridge page (editorial top half + data snapshot bottom half) |
| `/posts` | Feed / Explorer — flat list, editorial scan mode |
| `/posts/[id]` | Post detail — wide column, extracted data sidebar card |
| `/etf` | ETF Rankings — data cockpit, dense table, JetBrains Mono, sortable |
| `/login` | Auth.js Google SignIn (simplified from Clerk) |
| `/about` | About page, footer-only link |
| `/api/posts` | API endpoint (5min cache) |

## Design System (DA locked 2026-04-06, vibes-v2 migrated 2026-04-07)

> **Source of truth**: `frontend/design-system.md`. Summary below — refer to the doc for full token definitions, helpers, and pattern recipes.

### Personality split by page
| Page | Personality | Pattern |
|---|---|---|
| `/` Dashboard | Bridge | Brand statement + featured posts + ETF snapshot + trending categories |
| `/posts` Feed | Editorial scan | Flat list, subreddit tag + category pill + bold title + excerpt + timestamp |
| `/etf` Rankings | Data cockpit | Dense table, JetBrains Mono, sortable, cooler background tint |
| `/posts/[id]` Detail | Article | Wide column, extracted data sidebar card |
| Nav | Constant | "Grepr" Inter bold, 3 items, indigo underline on active |

### Tokens (CSS vars in `globals.css`)
- **Editorial bg**: `var(--editorial-bg)` `#f4f2e8` light / `#181612` dark
- **Cockpit bg**: `var(--cockpit-bg)` `#e4e0d0` light / `#1f1d18` dark
- **Paper bg** (table sheets): `var(--paper-bg)` `#faf8ef` / `#14130f`
- **Warm border / hover / divider**: `var(--warm-border)`, `var(--warm-hover)`, `var(--warm-divider)`
- **Seam**: `h-px bg-indigo-600/40` + "DONNÉES" eyebrow
- **Typography**: Inter only (500/600/700), JetBrains Mono for ISIN/tickers/numbers only
- **Eyebrow pattern**: `text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500` + `h-px w-12 bg-indigo-600/40`
- **Source tags**: `getSourceColor(name)` from `lib/design-tokens.ts` — 13 sub palette + fallback
- **Category pills**: `getCategoryColor(cat)` from `lib/design-tokens.ts`
- **Meta**: dot-separated `tabular-nums`
- **Primary accent**: `indigo-600` (#4f46e5) — active, CTA, seam
- **Container widths**: `max-w-7xl` (nav), `max-w-6xl` (bridge/cockpit), `max-w-4xl` (feed), `max-w-3xl` (article)
- **Signature viz**: `<SourceBar />` from `components/source-bar.tsx`

### Rules
- **No cards on posts feed** — flat list, scan-mode optimized
- **No 3-column layout** — max 2 columns
- **No serif** — Inter at 700 weight large sizes handles editorial hierarchy
- **Light-first** — Default light, dark mode via user toggle
- **Bilingual UI (FR/EN)** — Toggle in nav, localStorage persistence, FR default. Post content stays in original language.

## Environment

Frontend `.env.local`:
```
NOCODB_URL
NOCODB_TOKEN
NOCODB_TABLE_ID
MAINTENANCE_MODE
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
```

Backend `.env`:
```
GROQ_API_KEY
REDDIT_CLIENT_ID
REDDIT_SECRET
NOCODB_URL, NOCODB_TOKEN, NOCODB_TABLE_ID
AI_PROVIDER  # groq | deepseek
```

## Active Branch

`redesign/saas-finadaily` — SaaS redesign with Auth.js + editorial/cockpit hybrid design. Main: `main`.

## Known Issues

- Middleware deprecation warning (Next.js 16 wants `proxy.ts`)
- Mobile nav has no open/close animation
- `onPostClick` prop chain through `ETFComparison` → `ETFDetailDialog` is a no-op

## Verification Checklist

Before claiming success on any change:
```bash
cd frontend && npx tsc --noEmit    # Type check
npm run lint                        # ESLint
npm run build                       # Full build
```

## Gotchas

- **Groq rate limit**: 30 req/min. If hit, `AI_PROVIDER=deepseek` kicks in.
- **NocoDB pagination**: 1000 records/request max. Client fetches server-side.
- **`force-dynamic`** on all main pages — no static rendering.
- **`about/page.tsx`** is client component (uses `useLanguage()` hook).
- **Screenshots** organized by folder: `screenshots/<site-name>/`.
