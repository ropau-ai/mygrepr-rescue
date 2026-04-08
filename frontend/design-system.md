# Grepr Design System

> Locked 2026-04-07. Vibes-v2 → production migration.
> Source of truth for tokens. CLAUDE.md DA section points here.

## Two modes, one shell

| Mode | Background | Purpose | Pages |
|---|---|---|---|
| **Editorial** | `var(--editorial-bg)` `#f4f2e8` | Reading, scanning, browsing | `/`, `/posts`, `/posts/[id]` |
| **Cockpit** | `var(--cockpit-bg)` `#e4e0d0` | Data, ranking, comparison | `/etf`, dashboard bottom half |

The bridge between modes is a **sharp seam**: `h-px bg-indigo-600/40` with optional eyebrow `DONNÉES`.
No gradients. The transition is editorial.

## CSS variables (globals.css)

```css
:root {
  --editorial-bg: #f4f2e8;
  --editorial-border: #e5e5e1;
  --editorial-muted: #71716a;
  --cockpit-bg: #e4e0d0;
  --paper-bg: #faf8ef;        /* warm paper for table sheets */
  --warm-border: #d4cfb7;
  --warm-divider: #ebe6d0;
  --warm-hover: #f1eedf;
  --ticker-pill: #e8e3cd;
}

.dark {
  --editorial-bg: #181612;
  --editorial-border: #2a2723;
  --editorial-muted: #8a857a;
  --cockpit-bg: #1f1d18;
  --paper-bg: #14130f;
  --warm-border: #34302a;
  --warm-divider: #2a2723;
  --warm-hover: #1f1d18;
  --ticker-pill: #2a2723;
}
```

Use `bg-[var(--editorial-bg)]`, `border-[var(--warm-border)]` etc. inline. Never raw hex.

## Typography

- **Family**: Inter (`--font-sans`) — only family.
- **Mono**: JetBrains Mono (`--font-mono`) — ISIN, tickers, numbers, timestamps only.
- **Weights**: 500 / 600 / 700.
- **No serif**. Editorial hierarchy comes from Inter 700 at large sizes.

## Eyebrow lockup (universal label pattern)

```tsx
<div className="flex items-center gap-3 mb-4">
  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
    Filtres
  </span>
  <div className="h-px w-12 bg-indigo-600/40" />
</div>
```

Used for every section label across feed, cockpit, dashboard, post detail.

## Source tags (subreddit pills)

- Defined in `src/lib/design-tokens.ts` → `SOURCE_COLORS` (13 mapped + fallback).
- Helper: `getSourceColor(subreddit: string)` (case-insensitive).
- Class shape: `bg-{hue}-100 text-{hue}-700` light, `dark:bg-{hue}-500/15 dark:text-{hue}-300` dark.
- **No border**. `rounded-sm`. `text-[10px] font-bold uppercase tracking-wide`.

## Category pills

- `getCategoryColor(category)` from `design-tokens.ts`.
- Used in feed row meta + post detail header.
- Default treatment for non-source tags: `bg-slate-100 text-slate-600 rounded-sm text-[10px] font-bold uppercase`.

## SourceBar (signature)

`<SourceBar />` from `src/components/source-bar.tsx`.

Stacked proportional bar showing category-level cross-community distribution. Pass `slices: { source, count, pct }[]` sorted by count descending. Used on dashboard hero post — transforms a single post's category into a visible signal of how the topic spreads across subs.

## Containers

| Width | Use |
|---|---|
| `max-w-7xl` | Full nav bar |
| `max-w-6xl` | Bridge dashboard, cockpit ETF |
| `max-w-4xl` | Posts feed |
| `max-w-3xl` | Post detail article column |

Padding: `px-4 md:px-6` standard.

## Color accents

- **Primary**: `indigo-600` `#4f46e5` — active links, CTA, seam, sort-active state.
- **Bullish**: `emerald-500/600`.
- **Bearish**: `rose-500`.
- **Muted**: `slate-400`/`slate-500` for meta, `slate-600` for body.

## Hover states

- **Feed rows**: `hover:bg-[var(--warm-hover)]`, title `group-hover:text-indigo-900`, `ArrowUpRight` icon fade-in.
- **Table rows**: `hover:bg-[var(--warm-hover)]`, ticker pill `group-hover:bg-indigo-600 group-hover:text-white`.
- **Nav items**: indigo underline on active.

## Meta line convention

Dot-separated, `tabular-nums`, single line:
```
{votes} · {comments} · {time}
```
Class: `text-[10px] font-medium text-slate-400 tabular-nums whitespace-nowrap`.

## Component contracts

- `<SourceBar slices label? className?>` — distribution viz
- `getSourceColor(name)` / `getSourceBarColor(name)` — pill / swatch
- `getCategoryColor(cat)` — category pill class
- All translations via `useLanguage()` → `t(key)`. No hardcoded UI strings.
