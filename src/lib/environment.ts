/**
 * The page's background is one continuous ramp from paper to void, driven by
 * scroll. Elements declare where they sit on it with `data-env="0…1"`; we
 * interpolate between their centres so there are no section-shaped steps.
 *
 * `env` is mutable shared state for the 3D layer (same idea as scrollState).
 */
export const env = {
  /** 0 = paper, 1 = void */
  t: 0,
  /** which ink set is active */
  dark: false,
}

type RGB = [number, number, number]

const RAMP: Array<[number, RGB]> = [
  [0, [244, 240, 232]],
  [0.25, [217, 215, 210]],
  [0.5, [122, 122, 122]],
  [0.75, [42, 42, 47]],
  [0.9, [16, 16, 20]],
  [1, [5, 5, 6]],
]

/**
 * Ink flips where the ramp crosses ~#777: dark and light ink both clear 4.5:1
 * there. The dead-band stops it flickering when the user rests on the line.
 */
const FLIP = 0.5
const FLIP_BAND = 0.015

export function rampColor(t: number): RGB {
  const x = Math.min(1, Math.max(0, t))
  for (let i = 1; i < RAMP.length; i++) {
    const [t1, c1] = RAMP[i]
    if (x <= t1) {
      const [t0, c0] = RAMP[i - 1]
      const k = (x - t0) / (t1 - t0)
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * k),
        Math.round(c0[1] + (c1[1] - c0[1]) * k),
        Math.round(c0[2] + (c1[2] - c0[2]) * k),
      ]
    }
  }
  return RAMP[RAMP.length - 1][1]
}

const toHex = ([r, g, b]: RGB) => '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)

/**
 * `--bg` is inherited by everything, so writing it restyles the whole page
 * (~5 ms here). The page colour itself is therefore painted straight onto
 * <html> every frame, and the token only follows in steps this coarse —
 * the surfaces mixed from it cannot show a difference that small.
 */
const TOKEN_STEP = 6

let anchors: Array<{ y: number; v: number }> = []
let lastHex = ''
let tokenRgb: RGB | null = null
let themeMeta: HTMLMetaElement | null = null

function docTop(el: HTMLElement) {
  return el.getBoundingClientRect().top + window.scrollY
}

/**
 * A stuck `position: sticky` box reports where it is pinned, not where it sits
 * in flow — rebuild the flow position from its (non-sticky) parent instead.
 */
function flowTop(el: HTMLElement) {
  const parent = el.parentElement
  if (!parent || getComputedStyle(el).position !== 'sticky') return docTop(el)
  let y = docTop(parent) + parseFloat(getComputedStyle(parent).paddingTop || '0')
  for (const sib of Array.from(parent.children)) {
    if (sib === el) break
    y += (sib as HTMLElement).offsetHeight
  }
  return y
}

export function measureEnvironment() {
  anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-env]'))
    .map((el) => ({ y: flowTop(el) + el.offsetHeight / 2, v: Number(el.dataset.env) }))
    .filter((a) => Number.isFinite(a.v))
    .sort((a, b) => a.y - b.y)
  updateEnvironment()
}

export function updateEnvironment() {
  if (!anchors.length) return
  const probe = window.scrollY + window.innerHeight / 2

  let t = anchors[anchors.length - 1].v
  if (probe <= anchors[0].y) t = anchors[0].v
  else {
    for (let i = 1; i < anchors.length; i++) {
      const b = anchors[i]
      if (probe <= b.y) {
        const a = anchors[i - 1]
        t = a.v + ((b.v - a.v) * (probe - a.y)) / Math.max(1, b.y - a.y)
        break
      }
    }
  }
  env.t = t

  const root = document.documentElement
  const rgb = rampColor(t)
  const hex = toHex(rgb)
  if (hex !== lastHex) {
    lastHex = hex
    root.style.backgroundColor = hex
  }

  const dark = env.dark ? t > FLIP - FLIP_BAND : t > FLIP + FLIP_BAND
  const flipped = dark !== env.dark || !root.dataset.env
  if (flipped) {
    env.dark = dark
    root.dataset.env = dark ? 'dark' : 'light'
  }

  const drift = tokenRgb ? Math.max(...rgb.map((c, i) => Math.abs(c - tokenRgb![i]))) : Infinity
  // always land exactly on the two ends, where the page rests longest
  const atEnd = (t <= 0 || t >= 1) && drift > 0
  if (drift >= TOKEN_STEP || flipped || atEnd) {
    tokenRgb = rgb
    root.style.setProperty('--bg', hex)
    themeMeta ??= document.querySelector('meta[name="theme-color"]')
    themeMeta?.setAttribute('content', hex)
  }
}
