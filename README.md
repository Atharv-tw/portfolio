# Atharv Tiwari — Portfolio

Warm-paper, crayon-accented portfolio. Multi-page, light, and deliberately one thing —
there is no dark mode.

**Stack:** Vite · React 19 · TypeScript · React Router 7. Fonts are self-hosted via
Fontsource. **No animation libraries** — every transition, marquee and reveal is
hand-written CSS.

## Run it

```bash
npm install
```

```bash
npm run dev
```

`npm run build` type-checks and builds to `dist/`. `npm run preview` serves that build.

## Routes

| Path | Page |
| --- | --- |
| `/` | Hero, sticky-stack work, stats, contact CTA |
| `/about` | Bio, principles, roles, hackathon journey |
| `/work` | All six projects |
| `/work/:slug` | Case study — `onyx`, `outreach`, `finstar`, `health-companion`, `codeswipe`, `healthvault` |
| `/playground` | Drag-and-zoom scrapbook |
| `/contact` | Email, socials, résumé |

## Where things live

| What | Where |
| --- | --- |
| **All site copy & data** | `src/content/site.ts` |
| Design tokens, grain, grid, marquee, reveal | `src/styles/base.css` |
| Page-level layout | `src/styles/sections.css` |
| Pages | `src/pages/` |
| Shared components | `src/components/` |

## Design system

Four fonts, each with exactly one job:

- **Handjet** — the giant display type (`.display`)
- **Inter** — body copy
- **DM Mono** — micro-labels and captions (`.mono`; add `.mono--raw` to keep casing)
- **Just Me Again Down Here** — handwritten margin notes (`.hand`)

The paper texture is a single fixed SVG noise layer at `mix-blend-mode: multiply`
(`.grain` in `base.css`), over a dotted grid (`.grid-bg`). Project accent colors travel
as the `--accent` / `--accent-ink` custom properties, so the CSS never branches per
project.

## TODO for Atharv

- **Review the case-study prose.** `challenge` / `approach` / `results` in
  `src/content/site.ts` were drafted from your existing bullets and the Outreach repo's
  README. Every number in `metrics` comes from data you already had — but the framing is
  a draft, so make it sound like you.
- **Playground images.** `src/pages/Playground.tsx` renders generated SVG placeholders.
  Drop real photos in `public/` and swap `<Placeholder/>` for `<img>` — one line per tile.
- `links: { repo, live }` is empty for all six projects; fill them in and the case study
  shows the buttons automatically.
- `public/og.jpg` and `public/favicon.svg` are still the old dark branding.

## Accessibility

`prefers-reduced-motion` disables smooth scroll, reveals and marquees. The playground
canvas is `aria-hidden` with its captions exposed as a plain list for screen readers.

## Deploy

Static output — any host works. `vercel.json` already rewrites all paths to
`index.html`, which client-side routing needs; on other hosts configure the equivalent
SPA fallback or deep links like `/work/onyx` will 404.
