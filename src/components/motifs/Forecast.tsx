import { useCallback } from 'react'
import { useMotifCanvas, type MotifCtx } from './useMotifCanvas'

const MONO = '"JetBrains Mono Variable", monospace'

/** a small network, laid out left → right; the bottom-right is left clear for the bot */
const NODES: Array<[number, number]> = [
  [0.09, 0.52],
  [0.25, 0.3],
  [0.27, 0.56],
  [0.23, 0.8],
  [0.44, 0.24],
  [0.46, 0.48],
  [0.43, 0.74],
  [0.63, 0.34],
  [0.62, 0.62],
  [0.8, 0.16],
  [0.88, 0.36],
  [0.58, 0.86],
]

const EDGES: Array<[number, number]> = [
  [0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 5], [2, 6], [3, 6], [4, 7],
  [5, 7], [5, 8], [6, 8], [6, 11], [7, 9], [7, 10], [8, 10], [8, 11],
]

/** where the attack actually goes, and the runner-up the model also considers at each step */
const PATH = [0, 2, 5, 7, 10]
const ALT = [1, 6, 8, 9]

const STEP = 2.3
const REST = 2.2
const LOOP = (PATH.length - 1) * STEP + REST

const ease = (x: number) => {
  const k = Math.min(1, Math.max(0, x))
  return k * k * (3 - 2 * k)
}

/**
 * NetWM — the forecast runs one step ahead of the attack: dashed where it
 * expects the next move, solid once that move happens. Illustrative only.
 */
export default function Forecast({ accent = '#f5a524' }: { accent?: string }) {
  const draw = useCallback(
    ({ c, w, h, t }: MotifCtx) => {
      const T = t % LOOP
      const step = Math.min(PATH.length - 1, Math.floor(T / STEP))
      const local = T - step * STEP
      const resting = step === PATH.length - 1
      const fs = Math.max(9, Math.min(11.5, Math.min(w, h) * 0.023))

      const padT = 46
      const padB = 54
      const P = NODES.map(([x, y]) => ({ x: 14 + x * (w - 28), y: padT + y * (h - padT - padB) }))

      // ---- the network at rest ----
      c.lineWidth = 1
      c.strokeStyle = 'rgba(244,244,246,0.13)'
      c.beginPath()
      for (const [a, b] of EDGES) {
        c.moveTo(P[a].x, P[a].y)
        c.lineTo(P[b].x, P[b].y)
      }
      c.stroke()

      // ordinary traffic, so it reads as a living network and not a diagram
      c.fillStyle = 'rgba(244,244,246,0.45)'
      EDGES.forEach(([a, b], i) => {
        const k = (t * (0.16 + (i % 5) * 0.035) + i * 0.37) % 1
        c.beginPath()
        c.arc(P[a].x + (P[b].x - P[a].x) * k, P[a].y + (P[b].y - P[a].y) * k, 1.3, 0, Math.PI * 2)
        c.fill()
      })

      // ---- what has already happened ----
      c.strokeStyle = accent
      c.lineWidth = 2
      for (let i = 0; i < step; i++) {
        c.beginPath()
        c.moveTo(P[PATH[i]].x, P[PATH[i]].y)
        c.lineTo(P[PATH[i + 1]].x, P[PATH[i + 1]].y)
        c.stroke()
      }

      // ---- the forecast: drawn first, then the move it predicted ----
      const from = P[PATH[step]]
      const predicted = new Map<number, number>()
      if (!resting) {
        const next = PATH[step + 1]
        const alt = ALT[step]
        const grow = ease(local / 0.7)
        const move = ease((local - 1.3) / 0.75)

        c.setLineDash([5, 6])
        c.lineDashOffset = -t * 22
        for (const [node, weight] of [
          [alt, 0.34],
          [next, 1],
        ] as const) {
          const to = P[node]
          c.strokeStyle = accent
          c.globalAlpha = weight * (node === next ? 1 - move * 0.6 : 1 - move)
          c.lineWidth = node === next ? 1.8 : 1.2
          c.beginPath()
          c.moveTo(from.x, from.y)
          c.lineTo(from.x + (to.x - from.x) * grow, from.y + (to.y - from.y) * grow)
          c.stroke()
          predicted.set(node, weight * ease((local - 0.5) / 0.4) * (node === next ? 1 : 1 - move))
        }
        c.setLineDash([])
        c.globalAlpha = 1

        if (move > 0) {
          const to = P[next]
          const hx = from.x + (to.x - from.x) * move
          const hy = from.y + (to.y - from.y) * move
          c.strokeStyle = accent
          c.lineWidth = 2
          c.beginPath()
          c.moveTo(from.x, from.y)
          c.lineTo(hx, hy)
          c.stroke()
          c.fillStyle = '#fff'
          c.beginPath()
          c.arc(hx, hy, 3.2, 0, Math.PI * 2)
          c.fill()
          if (move >= 1) predicted.delete(next)
        }
      }

      // ---- nodes ----
      const landed = !resting && local > 2.05 ? step + 1 : step
      P.forEach((p, i) => {
        const hit = PATH.indexOf(i)
        const taken = hit >= 0 && hit <= landed
        const guess = predicted.get(i) ?? 0

        if (taken) {
          const fresh = hit === landed ? 1 + Math.sin(t * 5) * 0.12 : 1
          c.fillStyle = accent
          c.globalAlpha = 0.22
          c.beginPath()
          c.arc(p.x, p.y, 15 * fresh, 0, Math.PI * 2)
          c.fill()
          c.globalAlpha = 1
          c.beginPath()
          c.arc(p.x, p.y, 6.5, 0, Math.PI * 2)
          c.fill()
        } else {
          c.fillStyle = '#0c0a04'
          c.strokeStyle = 'rgba(244,244,246,0.5)'
          c.lineWidth = 1.2
          c.beginPath()
          c.arc(p.x, p.y, 5.5, 0, Math.PI * 2)
          c.fill()
          c.stroke()
        }

        if (guess > 0.02) {
          c.globalAlpha = guess
          c.strokeStyle = accent
          c.lineWidth = 1.6
          c.setLineDash([3, 4])
          c.beginPath()
          c.arc(p.x, p.y, 13, 0, Math.PI * 2)
          c.stroke()
          c.setLineDash([])
          c.globalAlpha = 1
        }
      })

      // ---- key ----
      c.font = `600 ${fs}px ${MONO}`
      c.textBaseline = 'middle'
      c.textAlign = 'left'
      c.fillStyle = accent
      c.beginPath()
      c.arc(22, 24, 4.5, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = 'rgba(244,244,246,0.7)'
      c.fillText('OBSERVED', 34, 25)
      const kx = 34 + c.measureText('OBSERVED').width + 22
      c.strokeStyle = accent
      c.lineWidth = 1.5
      c.setLineDash([3, 3])
      c.beginPath()
      c.arc(kx, 24, 5.5, 0, Math.PI * 2)
      c.stroke()
      c.setLineDash([])
      c.fillText('FORECAST', kx + 13, 25)

      // ---- timeline: the forecast marker always sits one tick ahead of now ----
      const tlX = 22
      const tlY = h - 26
      const gap = Math.min(46, (w * 0.5) / PATH.length)
      c.strokeStyle = 'rgba(244,244,246,0.18)'
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(tlX, tlY)
      c.lineTo(tlX + gap * (PATH.length - 1), tlY)
      c.stroke()
      PATH.forEach((_, i) => {
        const x = tlX + i * gap
        if (i <= landed) {
          c.fillStyle = accent
          c.beginPath()
          c.arc(x, tlY, 3.5, 0, Math.PI * 2)
          c.fill()
        } else if (i === landed + 1) {
          c.strokeStyle = accent
          c.setLineDash([2, 3])
          c.beginPath()
          c.arc(x, tlY, 5, 0, Math.PI * 2)
          c.stroke()
          c.setLineDash([])
        } else {
          c.fillStyle = 'rgba(244,244,246,0.3)'
          c.fillRect(x - 0.5, tlY - 3, 1, 6)
        }
      })
      c.fillStyle = 'rgba(244,244,246,0.5)'
      c.fillText('TIME  →', tlX + gap * (PATH.length - 1) + 16, tlY + 1)
      c.textBaseline = 'alphabetic'
    },
    [accent],
  )

  return (
    <canvas
      ref={useMotifCanvas(draw, undefined, 3.4)}
      className="motif-canvas"
      aria-label="An attack moves through a network while a forecast marks each next step before it happens"
    />
  )
}
