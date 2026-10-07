import { useCallback } from 'react'
import { useMotifCanvas, type MotifCtx } from './useMotifCanvas'

const MONO = '"JetBrains Mono Variable", monospace'
const SANS = '"Bricolage Grotesque Variable", system-ui, sans-serif'
const ink = (a: number) => `rgba(244,244,246,${a})`

/** three profiles in the deck: no people, just the kind of card the app deals */
const CARDS = [
  { glyph: '</>', role: 'Frontend', skills: ['React', 'TypeScript'], wants: 'Project collaborators', match: true },
  { glyph: '{ }', role: 'Backend', skills: ['Go', 'Postgres'], wants: 'Mentors', match: false },
  { glyph: 'f(x)', role: 'Machine learning', skills: ['Python', 'PyTorch'], wants: 'Co-founders', match: true },
]

const HOLD = 1.5
const SWIPE = 0.75
const BEAT = 3.2
const LOOP = CARDS.length * BEAT

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => {
  const k = clamp(x)
  return k * k * (3 - 2 * k)
}
const bell = (x: number) => Math.sin(clamp(x) * Math.PI)
/** stable noise, for the activity strip on each card */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Codeswipe — the deck deals itself: a card is read, then swiped right into a
 * match or left into a skip, and the next one comes up. Illustrative only.
 */
export default function SwipeDeck({ accent = '#ff4d9d' }: { accent?: string }) {
  const draw = useCallback(
    ({ c, w, h, t }: MotifCtx) => {
      const T = t % LOOP
      const i = Math.floor(T / BEAT)
      const local = T - i * BEAT
      const top = CARDS[i]
      const dir = top.match ? 1 : -1
      const swipe = ease((local - HOLD) / SWIPE)
      const rise = ease((local - HOLD - SWIPE * 0.45) / 0.7)
      const fs = Math.max(9, Math.min(11.5, Math.min(w, h) * 0.023))

      const ch = Math.min(h * 0.66, 430)
      const cw = ch * 0.72
      const cx = w / 2
      const cy = h * 0.495

      c.textBaseline = 'middle'

      /** one card, drawn around the origin */
      const card = (p: (typeof CARDS)[number], n: number, alpha: number, detail: number, stamp: number, isTop: boolean) => {
        c.globalAlpha = alpha
        c.fillStyle = '#17121b'
        c.beginPath()
        c.roundRect(-cw / 2, -ch / 2, cw, ch, Math.min(18, cw * 0.09))
        c.fill()
        c.lineWidth = 1.2
        c.strokeStyle = isTop ? accent : ink(0.22)
        c.globalAlpha = alpha * (isTop ? 0.6 : 1)
        c.stroke()
        if (detail <= 0.01) return

        const a = alpha * detail * (1 - stamp * 0.72)
        // who
        const r = cw * 0.15
        const ay = -ch * 0.27
        c.globalAlpha = a * 0.16
        c.fillStyle = accent
        c.beginPath()
        c.arc(0, ay, r, 0, Math.PI * 2)
        c.fill()
        c.globalAlpha = a * 0.85
        c.strokeStyle = accent
        c.lineWidth = 1.4
        c.stroke()
        c.globalAlpha = a
        c.textAlign = 'center'
        c.font = `700 ${r * 0.6}px ${MONO}`
        c.fillText(p.glyph, 0, ay + 1)

        c.font = `700 ${cw * 0.1}px ${SANS}`
        c.fillStyle = ink(0.96)
        c.fillText(p.role, 0, -ch * 0.085)

        // what they work in
        const cf = Math.max(8, cw * 0.052)
        c.font = `600 ${cf}px ${MONO}`
        const pad = cf * 0.9
        const widths = p.skills.map((s) => c.measureText(s).width + pad * 2)
        const gap = cf * 0.6
        let x = -(widths.reduce((s, v) => s + v, 0) + gap * (widths.length - 1)) / 2
        p.skills.forEach((s, k) => {
          c.strokeStyle = ink(0.3)
          c.lineWidth = 1
          c.beginPath()
          c.roundRect(x, ch * 0.03 - cf * 1.05, widths[k], cf * 2.1, cf * 1.05)
          c.stroke()
          c.fillStyle = ink(0.82)
          c.fillText(s, x + widths[k] / 2, ch * 0.03 + 1)
          x += widths[k] + gap
        })

        // recent activity: the profile is built from real work
        const cells = 14
        const cell = (cw * 0.72) / cells
        for (let k = 0; k < cells; k++) {
          const v = hash(n * 31 + k * 7)
          c.globalAlpha = a * (v > 0.3 ? 0.25 + v * 0.75 : 0.12)
          c.fillStyle = v > 0.3 ? accent : ink(1)
          c.beginPath()
          c.roundRect(-cw * 0.36 + k * cell + 1, ch * 0.16, cell - 2, cell - 2, 2)
          c.fill()
        }
        c.globalAlpha = a

        // what they are here for
        c.font = `600 ${cf * 0.9}px ${MONO}`
        c.fillStyle = ink(0.45)
        c.fillText('LOOKING FOR', 0, ch * 0.305)
        c.font = `600 ${cw * 0.078}px ${SANS}`
        c.fillStyle = ink(0.94)
        c.fillText(p.wants, 0, ch * 0.385)

        // the verdict, stamped across the card
        if (stamp > 0.01) {
          const text = p.match ? 'MATCH' : 'SKIP'
          c.save()
          c.rotate(p.match ? -0.2 : 0.2)
          c.globalAlpha = alpha * stamp
          c.font = `800 ${cw * 0.17}px ${MONO}`
          const tw = c.measureText(text).width
          c.strokeStyle = p.match ? accent : ink(0.75)
          c.fillStyle = p.match ? accent : ink(0.75)
          c.lineWidth = 2.5
          c.beginPath()
          c.roundRect(-tw / 2 - cw * 0.06, -ch * 0.14 - cw * 0.13, tw + cw * 0.12, cw * 0.26, 8)
          c.stroke()
          c.fillText(text, 0, -ch * 0.14 + 2)
          c.restore()
        }
      }

      // ---- the two ways it can go ----
      const side = (cx - cw / 2) / 2
      const lit = clamp(swipe * 2) * (1 - ease((local - HOLD - SWIPE) / 0.5))
      c.textAlign = 'center'
      const arrow = `600 ${fs * 1.7}px ${MONO}`
      const word = `600 ${fs}px ${MONO}`
      c.fillStyle = ink(0.4 + (dir < 0 ? lit * 0.55 : 0))
      c.font = arrow
      c.fillText('←', side, cy - fs * 1.3)
      c.font = word
      c.fillText('SKIP', side, cy + fs * 0.7)
      c.fillStyle = dir > 0 && lit > 0.02 ? accent : ink(0.4)
      c.globalAlpha = dir > 0 && lit > 0.02 ? 0.5 + lit * 0.5 : 1
      c.font = arrow
      c.fillText('→', w - side, cy - fs * 1.3)
      c.font = word
      c.fillText('MATCH', w - side, cy + fs * 0.7)
      c.globalAlpha = 1

      // ---- the rest of the deck, moving up as the top card leaves ----
      for (let d = 3; d >= 1; d--) {
        const depth = d - rise
        if (depth > 2.95) continue
        const n = (i + d) % CARDS.length
        c.save()
        c.translate(cx, cy + depth * ch * 0.055)
        c.scale(1 - depth * 0.07, 1 - depth * 0.07)
        card(CARDS[n], n, clamp(1 - depth * 0.3) * (d === 3 ? rise : 1), clamp(1 - depth), 0, false)
        c.restore()
      }

      // ---- the card being decided ----
      c.save()
      c.translate(cx + dir * swipe * (w * 0.5 + cw * 0.2), cy + swipe * swipe * ch * 0.06)
      c.rotate(dir * swipe * 0.32)
      card(top, i, 1 - clamp((swipe - 0.7) / 0.3), 1, clamp(swipe * 2.6), true)
      c.restore()
      c.globalAlpha = 1

      // ---- key ----
      c.font = `600 ${fs}px ${MONO}`
      c.textAlign = 'left'
      c.fillStyle = accent
      c.beginPath()
      c.arc(22, 24, 4.5, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = ink(0.7)
      c.fillText('SWIPE TO FIND A COLLABORATOR', 34, 25)

      // ---- matches so far this deck ----
      const landed = top.match && local > HOLD + SWIPE
      const count = CARDS.slice(0, i).filter((p) => p.match).length + (landed ? 1 : 0)
      const fade = Math.min(ease(T / 0.4), 1 - ease((T - (LOOP - 0.5)) / 0.4))
      c.fillStyle = ink(0.5)
      c.fillText('MATCHES', 22, h - 25)
      const mx = 22 + c.measureText('MATCHES').width + 12
      c.globalAlpha = fade
      c.font = `800 ${fs * 1.15}px ${MONO}`
      c.fillStyle = count > 0 ? accent : ink(0.5)
      c.fillText(String(count).padStart(2, '0'), mx, h - 25)
      if (top.match) {
        const pulse = (local - HOLD - SWIPE) / 0.7
        if (pulse > 0 && pulse < 1) {
          c.globalAlpha = bell(pulse) * 0.7
          c.strokeStyle = accent
          c.lineWidth = 1.5
          c.beginPath()
          c.arc(mx + fs * 0.7, h - 26, fs * (1 + pulse * 1.4), 0, Math.PI * 2)
          c.stroke()
        }
      }
      c.globalAlpha = 1
      c.textBaseline = 'alphabetic'
    },
    [accent],
  )

  return (
    <canvas
      ref={useMotifCanvas(draw, undefined, 1.98)}
      className="motif-canvas"
      aria-label="A deck of developer profile cards: one is swiped right into a match, the next comes up"
    />
  )
}
