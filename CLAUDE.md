# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Grepr — Reddit finance aggregator. Scrapes 14 subreddits daily, categorizes posts with Groq AI (LLaMA 3.3 70B), extracts financial data, stores in NocoDB, displays on a Next.js dashboard. Targets French finance communities.

## Commands

### Frontend (`/frontend`)
```bash
npm run dev        # Next.js dev server (localhost:3000)
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint
```

### Backend (root)
```bash
pip install -r requirements.txt
python scheduler.py          # Daily loop (runs at 6:00 UTC)
python scheduler.py dry      # One-time fetch, no DB push
python scheduler.py status   # Progress check
python scheduler.py reset    # Start fresh
```

### Docker
```bash
docker build -t grepr .      # Backend worker only
```

## Architecture

**Monorepo: frontend/ (Next.js) + backend/ (Python) — independent, communicate through NocoDB.**

### Data Flow
```
14 subreddits → PullPush.io fetch → Groq AI categorization (16 categories) → NocoDB → Next.js SSR → Dashboard
```

### Frontend — Next.js 16, React 19, TypeScript, Tailwind v4
- **App Router** with `force-dynamic` on all main pages (SSR, no static)
- **Clerk** for auth (optional — dashboard viewable without login)
- **Radix UI** + **Shadcn/ui** (new-york style) for components
- **Framer Motion** for animations, **next-themes** for dark/light
- **Path alias:** `@/*` maps to `src/*`
- NocoDB client fetches server-side with pagination (1000 records/request max)
- Client-side localStorage for favorites + last visit tracking

### Backend — Python 3.12
- `backend/config.py` — 16 categories, 14 subreddits, API keys, ETF list
- `backend/fetchers/reddit.py` — PullPush.io (primary, free) + PRAW (fallback)
- `backend/processors/ai.py` — Groq API calls, categorization, financial regex extraction
- `backend/db/nocodb.py` — NocoDB HTTP client (REST API on Hetzner VPS)
- `backend/cli/` — Individual step runners (fetch.py, process.py, push.py)
- `scheduler.py` — Orchestrator, daily cron loop
- **AI fallback:** Groq primary → DeepSeek secondary. Groq rate-limited (30 req/min)

### Key Frontend Routes
```
/              → Dashboard
/posts         → All posts
/posts/[id]    → Post detail
/consensus     → Consensus board
/about         → About
/landing       → Landing (hidden from nav)
/login         → Clerk SignIn
/sign-up       → Clerk SignUp
/settings      → Settings (auth required)
/api/posts     → API endpoint (5min cache)
```

## Environment

Frontend `.env.local`: `NOCODB_URL`, `NOCODB_TOKEN`, `NOCODB_TABLE_ID`, `MAINTENANCE_MODE`, Clerk keys.
Backend `.env`: `GROQ_API_KEY`, `REDDIT_CLIENT_ID`, `REDDIT_SECRET`, NocoDB credentials, `AI_PROVIDER`.

## Key Types

`/frontend/src/types/post.ts` — `Post` interface, `ExtractedData`, `CATEGORIES` const (16 types), `CATEGORY_COLORS`, `CONSENSUS_COLORS`, `formatAmount` helper.

## Active Branch

`redesign/saas-finadaily` — SaaS redesign with Clerk auth + Finadaily-style light theme. Main branch: `main`.

## Ignore

`mygrepr/` — Archived copy of original repo. Not active. All work happens in root `frontend/` and `backend/`.
