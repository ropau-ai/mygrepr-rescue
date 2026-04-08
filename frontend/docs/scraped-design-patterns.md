# Scraped Design Patterns — Inspo Sites

Extracted 2026-04-04 via Firecrawl + Browserbase from 4 reference sites.

## 1. Techmeme (Editorial / Vibe 1 reference)

**Layout:**
- 2-column: main content (left, ~70%) + sidebar (right, ~30%)
- Stories grouped in clusters (`div.clus`) with hierarchy: top news → newest → earlier picks → more
- Each cluster: source citation → bold headline → excerpt → related links indented below
- Sidebar: events, podcasts, sponsor posts

**Navigation:**
- Top bar: HOME | RIVER | LEADERBOARDS | ABOUT | EVENTS | NEWSLETTER
- Flat text links, pipe-separated, uppercase
- Sister sites: MEDIAGAZER | MEMEORANDUM | WESMIRCH

**Typography:**
- Heading hierarchy: `<h2>` for sections (Top News, Newest, Earlier Picks, More News)
- Source: `<cite>` tags with author/publication
- Headlines: bold `<a>` tags, standard size
- Metadata: `font-size:90%`, italic for descriptions

**Story clustering pattern:**
- Lead story: full citation + headline + excerpt
- Related stories indented below with smaller font
- Source logos/icons next to citations

**Key takeaway for Grepr:** Clean hierarchy without cards. Stories clustered by topic. Source attribution prominent. Minimal visual chrome.

## 2. Hacker News (Dense Wire / Vibe 2 reference)

**Layout:**
- Single column, `width:85%`, centered `<table>` layout
- Background: `#f6f6ef` (warm off-white)
- Header bar: `bgcolor="#ff6600"` (orange)

**Row structure:**
```
<tr.athing.submission>
  <td.title><span.rank>1.</span></td>      → rank number
  <td.votelinks><div.votearrow></td>        → upvote arrow
  <td.title><span.titleline><a>Title</a>    → headline + (domain)
    <span.sitebit.comhead>(site.com)</span>
</tr>
<tr>                                         → metadata row
  <td.subtext>
    <span.score>246 points</span>
    by <a.hnuser>username</a>
    <span.age>3 hours ago</span>
    | hide | 67 comments
  </td>
</tr>
<tr.spacer style="height:5px">              → 5px spacer between items
```

**Typography:**
- `line-height:12pt` for nav
- Ranks: plain text, right-aligned
- Titles: default size, no bold (just link color)
- Metadata: smaller, gray

**Key takeaway for Grepr:** Ultra-dense rows. Rank → arrow → title (source) → points/user/time/comments. 5px between items. Zero decoration.

## 3. Product Hunt (Card Grid / Vibe 3 reference)

**Layout:**
- `bg-primary` body, `max-w-[900px]` main content + sidebar
- `flex flex-col gap-10` for sections
- `flex flex-row items-start gap-4` for each product card
- `rounded-xl` everywhere (cards, avatars, badges)

**Card structure:**
```
<section data-test="post-item-{id}">
  <img 48x48 rounded-xl>              → product icon
  <div flex-1>
    <span font-semibold>              → "1. ProductName" (ranked)
    <span text-secondary>            → tagline
    <div flex-row gap-2>              → topic badges
    <div flex-row items-center>       → upvote button + count
  </div>
</section>
```

**Key Tailwind classes used:**
- Layout: `flex`, `flex-col`, `flex-row`, `gap-4`, `gap-10`, `items-center`, `items-start`
- Cards: `rounded-xl`, `px-0 py-4`, `sm:p-4`, `sm:-mx-4`
- Hover: `has-[[data-target]]:hover:sm:bg-gray-100`, `group-hover:sm:text-brand-500`
- Typography: `text-base font-semibold text-primary`, `text-base text-secondary`
- Badges: `rounded-xl border-2 border-warning-100 bg-white p-2`
- Transitions: `transition-all duration-300 ease-out`

**Interaction patterns:**
- Upvote celebrating animation: `scale-[1.2]`, `shadow-[0_24px_52px_-24px_rgba(16,24,40,0.38)]`
- Shine effect on celebrate: pseudo-element gradient sweep
- Hover: `bg-gray-100` on card, `text-brand-500` on title

**Key takeaway for Grepr:** Ranked items with icon + title + tagline + upvote. Subtle hover states. rounded-xl as base radius. Clean spacing with gap utilities.

## 4. Upstract (Multi-source Aggregator / closest to Grepr)

**Layout:**
- `container grid-xl` wrapper
- Multi-column grid: `col-4 col-sm-12` (4-col desktop, full mobile)
- Each source is a column: `#s_reddit`, `#s_yahoo_main`, etc.
- Trending strip at top: `#trendingposts` spanning full width (`col-12`)

**Column structure:**
```
<div.column.col-4.col-sm-12.kind_norm #s_reddit>
  <h4.ic_reddit>Reddit</h4>         → source header with icon class
  <ul>
    <li>
      <a data-th="thumb.webp" data-p="preview text" data-ts="6 minutes ago">
        Headline text
      </a>
      <a.au title="Original Thread">  → comment icon link
        <svg.lucide.fill>
      </a>
    </li>
  </ul>
</div>
```

**Key patterns:**
- Source-based columns (each source = its own column)
- Thumbnails via `data-th` attribute (lazy loaded)
- Preview text via `data-p` attribute (tooltip/hover)
- Timestamps via `data-ts` attribute
- Icon classes: `ic_reddit`, `ic_google`, `ic_imgur`, `ic_yahoo_main`
- Content types: `kind_norm` (text), `kind_img` (image)

**Trending strip:** Horizontal scrolling headlines with `++` separators, full-width banner with flash icon

**Key takeaway for Grepr:** Source-based columns work well for multi-subreddit display. Data attributes for preview/timestamp. Simple `<ul><li>` structure. Trending strip as attention grabber.

## Design Pattern Summary for Grepr

| Pattern | Best Source | How to Apply |
|---------|-----------|--------------|
| Story hierarchy | Techmeme | Featured post at top, rest in ranked list |
| Dense rows | HN | Feed view: rank + upvotes + title + source + meta |
| Card grid | Product Hunt | Grid view: rounded-xl cards with icon/badge/title/tagline |
| Source columns | Upstract | Dashboard: category-based columns showing latest per category |
| Category nav | Product Hunt | Rounded-full pills with active state |
| Stats strip | Techmeme | Header bar with live stats inline |
| Hover states | Product Hunt | bg-gray-100 on hover, text-brand on title |
| Spacing | Product Hunt | gap-4 between items, gap-10 between sections |
| Radius | Product Hunt | rounded-xl (12px) as base radius |
| Transitions | Product Hunt | transition-all duration-300 ease-out |
