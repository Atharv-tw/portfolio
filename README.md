# Atharv Tiwari — Portfolio

Dark, cinematic, interactive portfolio with a small robot who lives on the site.

**Stack:** Vite · React 19 · TypeScript · Three.js (react-three-fiber + drei, single shared WebGL context) · GSAP + ScrollTrigger · Lenis smooth scroll · Framer Motion · d3-force · zustand. Every sound is synthesized at runtime with the Web Audio API — zero audio files.

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
| **All site copy & data** (projects, stats, timeline, links) | `src/content/resume.ts` |
| Design tokens (colors, type, z-layers) | `src/styles/tokens.css` |
| The robot mascot | `src/three/Mascot/` |
| Sound synth (click/chirp/boing/…) | `src/audio/synth.ts` |
| Project motifs (radar, arcade, orbit, swipe deck, vault) | `src/components/motifs/` |
| GitHub heatmap (live fetch + fallback) | `src/components/Heatmap.tsx`, `public/github-fallback.json` |
| Skills constellation | `src/three/Constellation.tsx` |

### TODO for Atharv

- `src/content/resume.ts` → each project has `links: { repo: '', live: '' }`. Drop URLs in and the case-study overlay shows them automatically.
- Refresh `public/resume.pdf` whenever the résumé changes.
- Optional: refresh `public/github-fallback.json` occasionally (`https://github-contributions-api.jogruber.de/v4/Atharv-tw?y=last`).

## Nice to know

- **Sound** unlocks on the preloader's *Enter* click (browser autoplay policy). Mute toggle in the nav persists in `localStorage`.
- **Reduced motion**: the site honors `prefers-reduced-motion` — no smooth scroll, no 3D, static reveals. Override with `?motion=full` or `?motion=reduced`.
- **Easter eggs**: `Ctrl/⌘ + K` command palette (jump, copy email, bot tricks) · Konami code (↑↑↓↓←→←→BA) · click the bot · spam-click the bot · leave it alone for 30s.
- The GitHub heatmap fetches live data client-side and silently falls back to the bundled snapshot when offline.

## Deploy

Static output — any host works. Easiest: [Vercel](https://vercel.com) → import the repo → framework preset **Vite** → done. Netlify / GitHub Pages / Cloudflare Pages work the same way (`npm run build`, publish `dist/`).
