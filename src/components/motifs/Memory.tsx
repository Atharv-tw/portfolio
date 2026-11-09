import { useCallback } from 'react'
import { useMotifCanvas, type MotifCtx } from './useMotifCanvas'

const MONO = '"JetBrains Mono Variable", monospace'
const ink = (a: number) => `rgba(244,244,246,${a})`

/** what is said into the diary, and the note each part is filed into */
const DIARY: [string, number][] = [
  ['Training for a half marathon.', 0],
  ['Methods section done.', 1],
  ['Priya wants it by Friday.', 2],
  ['Dropping experiment two.', 3],
]
const CARDS = ['ME', 'PROJECTS', 'PEOPLE', 'DECISIONS']
/** what each note already held: lines only, drawn as bars */
const HELD = [
  [0.78, 0.52],
  [0.64, 0.86],
  [0.7, 0.46],
  [0.58, 0.8],
]
/** two agents, one memory: the notes each one opens, in order */
const AGENTS = [
  { name: 'CLAUDE CODE', reads: [0, 1] },
  { name: 'CODEX', reads: [0, 2, 3] },
]

const TYPE = 0.5 // the diary line starts typing
const CPS = 40 // characters a second
const FILE = 3.4 // the night's filing: each part leaves for its note
const FLY = 0.8
const READ = 6.1 // the agents open the notes
const VISIT = 1 // one note: get there, read it
const LOOP = 11
const STEPS = ['CAPTURE', 'FILE', 'READ']

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => {
  const k = clamp(x)
  return k * k * (3 - 2 * k)
}

/**
 * Vault — a diary line types itself in, overnight each part is filed into the
 * note it belongs to, then two agents read the same notes. Illustrative only.
 */
export default function Memory({ accent = '#6fd943' }: { accent?: string }) {
  const draw = useCallback(
    ({ c, w, h, t }: MotifCtx) => {
      const T = t % LOOP
      const fs = Math.max(9, Math.min(11.5, Math.min(w, h) * 0.023))
      const show = Math.min(ease(T / 0.4), 1 - ease((T - (LOOP - 0.6)) / 0.5))
      const pad = w < 420 ? 14 : 18

      c.textBaseline = 'middle'

      // ---- the diary line, laid out word by word so it wraps on a narrow tile ----
      const tf = Math.max(9.5, Math.min(13, w * 0.026))
      const diaryY = 24 + fs * 2.6
      const textTop = diaryY + fs * 2
      const lineH = tf * 1.6
      c.font = `500 ${tf}px ${MONO}`
      const space = c.measureText(' ').width
      const words: { text: string; part: number; x: number; y: number; at: number }[] = []
      let wx = pad
      let wl = 0
      let at = 0
      DIARY.forEach(([text, part]) => {
        for (const word of text.split(' ')) {
          const ww = c.measureText(word).width
          if (wx > pad && wx + ww > w - pad) {
            wx = pad
            wl++
          }
          words.push({ text: word, part, x: wx, y: textTop + wl * lineH, at })
          wx += ww + space
          at += word.length + 1
        }
      })
      const textBottom = textTop + wl * lineH

      // ---- the four notes ----
      const gap = Math.max(10, w * 0.028)
      const cw = (w - pad * 2 - gap * 3) / 4
      const y0 = textBottom + fs * 3.6
      const floor = h - 26 - fs * 3
      const ch = Math.max(34, Math.min(cw * 1.05, (floor - y0) * 0.6))
      const inset = Math.max(7, cw * 0.09)
      const bar = Math.max(4, Math.min(7, ch * 0.075))
      const cardX = (i: number) => pad + i * (cw + gap)
      const slotY = (s: number) => y0 + inset + bar / 2 + s * ((ch - inset * 2 - bar) / 2)
      const agentY = y0 + ch + (floor - y0 - ch) * 0.62 + fs

      // where each agent is, and which note it has open
      const agentAt = (a: number) => {
        const { reads } = AGENTS[a]
        const homeX = w * (a ? 0.62 : 0.2)
        const t0 = READ + a * 0.3
        let x = homeX
        let y = agentY
        let open = -1
        let beam = 0
        reads.forEach((card, i) => {
          const s = t0 + i * VISIT
          if (T < s) return
          const k = ease((T - s) / 0.35)
          x += (cardX(card) + cw / 2 + (a ? 6 : -6) - x) * k
          y += (y0 + ch + 11 - y) * k
          open = card
          beam = ease((T - s - 0.3) / 0.15)
        })
        const back = ease((T - (t0 + reads.length * VISIT)) / 0.45)
        x += (homeX - x) * back
        y += (agentY - y) * back
        if (back > 0) open = -1
        return { x, y, open, beam, homeX }
      }
      const agents = AGENTS.map((_, a) => agentAt(a))

      CARDS.forEach((title, i) => {
        const read = agents.some((g) => g.open === i)
        const landed = ease((T - (FILE + i * 0.45 + FLY)) / 0.25)
        c.globalAlpha = read ? 0.85 : 0.35 + 0.35 * landed * show
        c.strokeStyle = read || landed * show > 0.5 ? accent : ink(0.5)
        c.lineWidth = 1.3
        c.beginPath()
        c.roundRect(cardX(i), y0, cw, ch, Math.min(10, cw * 0.1))
        c.stroke()
        c.globalAlpha = 1
        c.font = `600 ${fs}px ${MONO}`
        c.textAlign = 'left'
        c.fillStyle = read ? ink(0.9) : ink(0.62)
        c.fillText(title, cardX(i) + 2, y0 - fs * 1.4)

        // what it held before tonight, then the new line
        const full = cw - inset * 2
        HELD[i].forEach((len, s) => {
          c.fillStyle = ink(read ? 0.7 : 0.4)
          c.beginPath()
          c.roundRect(cardX(i) + inset, slotY(s) - bar / 2, full * len, bar, 2)
          c.fill()
        })
        if (landed > 0.01) {
          c.globalAlpha = landed * show
          c.fillStyle = accent
          c.beginPath()
          c.roundRect(cardX(i) + inset, slotY(2) - bar / 2, full * 0.9, bar, 2)
          c.fill()
          c.globalAlpha = 1
        }
      })

      // ---- the diary text: typed, lit as each part leaves, then kept as it was said ----
      const typed = (T - TYPE) * CPS
      c.font = `500 ${tf}px ${MONO}`
      c.textAlign = 'left'
      let caret = { x: pad, y: textTop }
      words.forEach((word) => {
        const n = Math.floor(clamp((typed - word.at) / word.text.length) * word.text.length)
        if (n <= 0) return
        const go = (T - (FILE + word.part * 0.45)) / FLY
        c.globalAlpha = show
        c.fillStyle = go < 0 ? ink(0.88) : go < 0.35 ? accent : ink(0.34)
        const seen = word.text.slice(0, n)
        c.fillText(seen, word.x, word.y)
        if (n < word.text.length || T < FILE) caret = { x: word.x + c.measureText(seen).width + 2, y: word.y }
      })
      if (T < FILE && Math.floor(t * 2.2) % 2 === 0) {
        const { x, y } = caret
        c.fillStyle = accent
        c.fillRect(x, y - tf * 0.55, 1.6, tf * 1.1)
      }
      c.globalAlpha = 1

      // ---- filing: each part flies from where it was said to its note ----
      DIARY.forEach(([, part]) => {
        const p = (T - (FILE + part * 0.45)) / FLY
        if (p <= 0 || p >= 1) return
        const mine = words.filter((word) => word.part === part)
        const first = mine[0]
        const onLine = mine.filter((word) => word.y === first.y)
        const last = onLine[onLine.length - 1]
        const fromW = Math.min(last.x + c.measureText(last.text).width - first.x, cw * 1.4)
        const toW = (cw - inset * 2) * 0.9
        const k = ease(p)
        const sx = first.x
        const sy = first.y
        const tx = cardX(part) + inset
        const ty = slotY(2)
        // a gentle arc, up and over rather than straight through the other notes
        const cx = (sx + tx) / 2
        const cy = Math.min(sy, ty) - fs * 1.5
        const x = (1 - k) * (1 - k) * sx + 2 * (1 - k) * k * cx + k * k * tx
        const y = (1 - k) * (1 - k) * sy + 2 * (1 - k) * k * cy + k * k * ty
        const bw = fromW + (toW - fromW) * k
        c.globalAlpha = (0.55 + 0.45 * Math.sin(p * Math.PI)) * show
        c.fillStyle = accent
        c.beginPath()
        c.roundRect(x, y - bar / 2, bw, bar, 2)
        c.fill()
      })
      c.globalAlpha = 1

      // ---- the agents: both read the same notes ----
      agents.forEach((g, a) => {
        c.globalAlpha = show
        if (g.open >= 0 && g.beam > 0) {
          c.strokeStyle = accent
          c.globalAlpha = g.beam * 0.7 * show
          c.lineWidth = 1
          c.setLineDash([2, 3])
          c.beginPath()
          c.moveTo(g.x, g.y - 4)
          c.lineTo(g.x, y0 + ch + 1)
          c.stroke()
          c.setLineDash([])
          c.globalAlpha = show
        }
        // the seat it reads from
        c.strokeStyle = ink(0.25)
        c.lineWidth = 1
        c.beginPath()
        c.arc(g.homeX, agentY, 6.5, 0, Math.PI * 2)
        c.stroke()
        c.fillStyle = accent
        c.beginPath()
        c.arc(g.x, g.y, 4.5, 0, Math.PI * 2)
        c.fill()
        c.font = `600 ${fs}px ${MONO}`
        c.textAlign = 'left'
        c.fillStyle = g.open >= 0 ? ink(0.85) : ink(0.5)
        c.fillText(AGENTS[a].name, g.homeX + 13, agentY + 1)
      })
      c.globalAlpha = 1

      // ---- key ----
      c.font = `600 ${fs}px ${MONO}`
      c.textAlign = 'left'
      c.fillStyle = accent
      c.beginPath()
      c.arc(22, 24, 4.5, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = ink(0.7)
      c.fillText('ONE MEMORY  ·  EVERY AGENT READS IT', 34, 25)
      c.fillStyle = ink(0.45)
      c.fillText('DIARY', pad, diaryY)

      // ---- where the story is ----
      const step = T < FILE ? 0 : T < READ ? 1 : 2
      let sx = 22
      STEPS.forEach((label, k) => {
        const on = k === step
        c.fillStyle = on ? accent : ink(k < step ? 0.6 : 0.28)
        c.beginPath()
        c.arc(sx + 3, h - 26, on ? 4 : 2.5, 0, Math.PI * 2)
        c.fill()
        c.fillStyle = on ? ink(0.92) : ink(k < step ? 0.6 : 0.34)
        c.fillText(label, sx + 13, h - 25)
        sx += 13 + c.measureText(label).width + fs * 1.9
      })
      c.textBaseline = 'alphabetic'
    },
    [accent],
  )

  return (
    <canvas
      ref={useMotifCanvas(draw, undefined, 7.85)}
      className="motif-canvas"
      aria-label="A diary line is typed, its parts are filed into four notes (me, projects, people, decisions), then two agents read from the same notes"
    />
  )
}
