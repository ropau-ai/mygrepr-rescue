# Grepr Design System — Editorial Wire

Mix of Vibe 1 (Editorial) + Vibe 2 (Dense Wire).
Editorial structure and typography hierarchy. Dense data presentation with monospace accents.

## Core Palette

### Light
- Background: `#fcfcfc` (near-white)
- Surface/Card: `#ffffff`
- Border: `#e5e7eb` (slate-200)
- Subtle border: `#f1f5f9` (slate-100)
- Text primary: `#0f172a` (slate-900)
- Text secondary: `#64748b` (slate-500)
- Text muted: `#94a3b8` (slate-400)
- Accent: `#4f46e5` (indigo-600)
- Accent hover: `#4338ca` (indigo-700)
- Positive: `#10b981` (emerald-500)
- Warning: `#f59e0b` (amber-500)
- Negative: `#ef4444` (red-500)

### Dark
- Background: `#0f0f14`
- Surface/Card: `#1a1a22`
- Border: `rgba(255,255,255,0.1)`
- Text primary: `#f1f5f9` (slate-100)
- Text secondary: `#94a3b8` (slate-400)
- Text muted: `#64748b` (slate-500)
- Accent: `#818cf8` (indigo-400)

## Typography

- Font: Inter (sans), JetBrains Mono (mono — numbers, ISIN, data)
- Page title: `text-4xl font-extrabold tracking-tight`
- Section header: `text-xs font-bold uppercase tracking-widest text-indigo-600` + rule line
- Card title / Featured headline: `text-2xl font-bold leading-tight`
- Row title: `text-sm font-bold tracking-tight`
- Body: `text-sm leading-relaxed text-slate-600`
- Meta labels: `text-[10px] font-bold uppercase tracking-widest text-slate-400`
- Data numbers: `font-mono text-[11px] font-bold` (votes, rank, time)
- Source tags: `text-xs font-medium text-slate-400`

## Spacing

- Page padding: `px-6 py-10` (mobile `px-4`)
- Section gap: `space-y-12` or `gap-12`
- Item gap in lists: `space-y-1` (dense) or `divide-y divide-slate-100`
- Card padding: `p-6`
- Container: `max-w-[1200px] mx-auto`

## Components

### Category Badge
```
px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm
border bg-indigo-50 border-indigo-100 text-indigo-700
dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300
```

### Category Filter Chip
```
px-4 py-1.5 text-sm font-medium rounded-full border transition-all
Active: bg-slate-900 text-white border-slate-900
        dark:bg-white dark:text-slate-900
Inactive: text-slate-500 border-transparent hover:border-slate-200
```

### Dense Row (Feed view)
```
group flex items-start px-3 py-2 hover:bg-indigo-50/30 transition-colors
  Rank: font-mono text-[11px] text-slate-300 w-8
  Votes: font-mono text-[10px] font-bold text-slate-500
  Title: text-sm font-bold text-slate-900 group-hover:text-indigo-900
  Source: text-[10px] text-slate-400
  Category: font-mono text-[9px] uppercase bg-slate-100 px-1.5 rounded-[2px]
  Time: text-[11px] text-slate-400 flex items-center gap-1
  Comments: text-[11px] text-slate-500
```

### Featured Card (Dashboard)
```
No border, no shadow — just content hierarchy
  Header: category badge + source + time
  Title: text-2xl font-bold leading-tight group-hover:text-indigo-600
  Summary: text-lg text-slate-600 leading-relaxed max-w-2xl
  Footer: border-t border-slate-100 pt-4 — votes + CTA link
```

### Sidebar Post Item
```
border-b border-slate-100 pb-6 last:border-0
  Category: text-[10px] font-bold text-indigo-600 uppercase tracking-wider
  Time: text-[10px] text-slate-400 font-medium uppercase
  Title: text-sm font-bold leading-relaxed group-hover:underline
  Source + votes: text-[10px] font-bold text-slate-400 / text-emerald-500
```

### Stats Strip (Header)
```
Inline flex, right-aligned
  Label: text-[10px] uppercase tracking-widest font-bold text-slate-500
  Value: text-lg font-medium text-slate-900 tabular-nums
  Divider: w-px h-8 bg-slate-200
```

### Section Divider
```
flex items-center gap-4 mb-4
  Label: text-xs font-bold uppercase tracking-widest text-indigo-600
  Line: h-px flex-1 bg-slate-100
```

### Button Primary
```
px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium
hover:opacity-90 transition-opacity
```

### Button Ghost
```
px-4 py-2.5 rounded-lg border border-border text-sm font-medium
text-muted-foreground hover:text-foreground hover:bg-muted transition-colors
```

## Layout Patterns

### Dashboard (/)
```
Header bar: logo + date + stats strip (inline)
Daily Brief: 2-col grid — insights left, alert card right
Category columns: 2-3 col grid, top 6 active categories, 3 posts each
Trending strip: featured post (editorial style) + sidebar list
```

### Feed (/posts)
```
Left sidebar (w-64): category checkboxes + source checkboxes + filters
Main content: search bar + filter chips + dense ranked rows
View toggle available but default = dense list
```

### ETF Rankings (/etf)
```
Header + stats + filter chips (PEA/CTO/Tous)
Full-width table with monospace data columns
Click row → detail dialog
```

## Radius
- Buttons/inputs: `rounded-lg` (8px)
- Cards: `rounded-xl` (12px) — use sparingly, editorial = less rounded
- Badges: `rounded-sm` (2px) for category, `rounded-full` for filter chips
- Avatar: `rounded-full`

## Shadows
- Minimal. Editorial = flat. Only on hover or dialogs.
- Hover card lift: `hover:shadow-md` (rare)
- Dialog: `shadow-lg`
- Default cards: no shadow, just `border border-slate-100`

## Transitions
- All interactive: `transition-colors` or `transition-all`
- Duration: 150ms default (fast, snappy)
- Hover text color: `group-hover:text-indigo-600`

## Icons
- Lucide React, stroke-width 2
- Size: `w-4 h-4` default, `w-3 h-3` for inline meta
- Color: `text-muted-foreground` default, `text-primary` on active
