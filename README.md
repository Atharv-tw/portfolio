# Atharv Tiwari — Portfolio

An interactive portfolio that starts on warm white and ends on black, with a small orange robot who lives in it.

**Stack:** Vite · React 19 · TypeScript · Three.js (react-three-fiber + drei, single shared WebGL context) · GSAP + ScrollTrigger · Lenis smooth scroll · Framer Motion · zustand. Every sound is synthesized at runtime with the Web Audio API — zero audio files.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build → dist/
npm run preview    # serve the production build
```

## Where things live

| What | Where |
| --- | --- |
| **All site copy & data** (person, projects, now, experience, track record) | `src/content/resume.ts` |
| **Build log entries** | `src/content/log.ts` |
| Design tokens (ink, accent, type, z-layers) | `src/styles/tokens.css` |
| The paper → void background | `src/lib/environment.ts` |
| The robot | `src/three/Mascot/` |
| Project visuals (radar, depth, forecast, orbit, arcade, swipe deck, vault) | `src/components/motifs/` |
| Project modal | `src/sections/ProjectCase.tsx`, `src/components/ProjectMedia.tsx` |
| Sound synth (click/chirp/boing/…) | `src/audio/synth.ts` |
| GitHub heatmap (live fetch + fallback) | `src/components/Heatmap.tsx`, `public/github-fallback.json` |

## Editing content

Everything written on the site comes from `src/content/`. Empty strings and empty arrays are fine: a block with no content renders nothing in production. In `npm run dev` the gap is outlined ("awaiting copy") so you can see what is still missing.

**A project** (`projects` in `resume.ts`)

- `tier: 'featured'` puts it among the big tiles, `'archive'` in "More work".
- `statement` is the one-liner, `summary` the short explanation on the tile.
- `overview`, `built`, `why`, `results`, `topics`, `links` fill the modal.
- `accent` and `stage` are the project's own colours. They are only ever used inside that project.

**A demo video.** Put the file in `public/videos/` and point at it:

```ts
media: { video: '/videos/onyx.mp4', poster: '/videos/onyx.jpg' }
```

Until a project has one, its modal shows the live visual, labelled as an illustration.

**The build log.** Add entries to `src/content/log.ts` (the file shows the shape). The LOG link appears in the nav as soon as there is one entry.

## How the background works

Sections and project stages carry `data-env="0…1"` (0 = paper, 1 = void). `environment.ts` interpolates between them with scroll and writes `--bg`. Text colour does not fade with it: `<html data-env>` flips once between a light and a dark ink set. The flip happens while the featured project stages fill the screen, and those bring their own surface and ink (`.env-dark`), so page text is never left on mid-grey.

To change where the page gets dark, change the `data-env` values. To pin an element to one ink set regardless of scroll, give it `.env-light` or `.env-dark`.

## The robot

- **Where he is:** any element with `data-bot-seat="<scene>"` is a box he fits himself into. Move or resize the box in CSS and he follows, at every breakpoint. No seat for a scene means he is not there.
- **Who he is in each scene:** `src/three/Mascot/states.ts` (mood, pose, prop, colours).
- **Face:** `face.ts` draws it on a canvas texture.
- **Body:** `MascotBody.tsx` is procedural. `MascotRig.tsx` only talks to it through the handles in `parts.ts`, so the body can be replaced by a GLB with the same node names without touching behaviour.

## Nice to know

- **Sound** unlocks on the preloader's *Enter* click (browser autoplay policy). Mute toggle in the nav persists in `localStorage`.
- **Reduced motion**: the site honors `prefers-reduced-motion` — no smooth scroll, static reveals, and the robot holds still instead of animating. Override with `?motion=full` or `?motion=reduced`.
- **Easter eggs**: `Ctrl/⌘ + K` command palette (jump, open a project, copy email, bot tricks) · Konami code (↑↑↓↓←→←→BA) · click the bot · spam-click the bot · leave it alone for 30s.
- The GitHub heatmap fetches live data client-side and silently falls back to the bundled snapshot when offline.

### TODO for Atharv

- `src/content/resume.ts` → OKEANOS and NETWM: `overview`, `built`, `why`, `results`, `topics`, `links`.
- `src/content/resume.ts` → `trackRecord.stats`: confirm the hackathon podium count. `outside`: a line each for Taekwondo and Basketball.
- `public/videos/` → demo footage for the featured projects.
- `src/content/log.ts` → first build log entries.
- `public/og.jpg` still shows the old design; replace it with a capture of the new hero.
- Refresh `public/resume.pdf` whenever the résumé changes.
- Optional: refresh `public/github-fallback.json` occasionally (`https://github-contributions-api.jogruber.de/v4/Atharv-tw?y=last`).

## Deploy

Static output — any host works. Easiest: [Vercel](https://vercel.com) → import the repo → framework preset **Vite** → done. Netlify / GitHub Pages / Cloudflare Pages work the same way (`npm run build`, publish `dist/`).
