import { useCallback } from 'react'
import { useMotifCanvas, type MotifCtx } from './useMotifCanvas'

const STAGES = ['SCAN', 'DETECT', 'UNDERSTAND', 'REMEDIATE'] as const
/** when each stage starts, and the loop length, in seconds */
const AT = [0, 3.2, 6.2, 9, 12.4]
const PATCHED = '#58d69b'
const MONO = '"JetBrains Mono Variable", monospace'

/** five raw findings; two are duplicates the triage step folds away */
const FINDINGS = [
  { a: -2.35, r: 0.62, label: 'SQLi', dupOf: -1 },
  { a: -0.75, r: 0.78, label: 'SSRF', dupOf: -1 },
  { a: 0.95, r: 0.5, label: 'IDOR', dupOf: -1 },
  { a: -1.75, r: 0.86, label: 'SQLi', dupOf: 0 },
  { a: 1.7, r: 0.8, label: 'IDOR', dupOf: 2 },
]

const ease = (x: number) => {
  const k = Math.min(1, Math.max(0, x))
  return k * k * (3 - 2 * k)
}

/** Onyx — one finding's whole life: scan → detect → understand → remediate. */
export default function Radar({ accent = '#f2364b' }: { accent?: string }) {
  const draw = useCallback(
    ({ c, w, h, t }: MotifCtx) => {
      const T = t % AT[4]
      const stage = T < AT[1] ? 0 : T < AT[2] ? 1 : T < AT[3] ? 2 : 3
      const local = T - AT[stage]
      const span = AT[stage + 1] - AT[stage]
      const u = Math.min(w, h)
      const fs = Math.max(9, Math.min(12, u * 0.024))

      // ---- stage rail ----
      const railX = 18
      const railY = 26
      const railW = Math.min(w - 36, 430)
      const seg = railW / STAGES.length
      c.textBaseline = 'alphabetic'
      c.textAlign = 'left'
      STAGES.forEach((name, i) => {
        const x = railX + i * seg
        const on = i === stage
        c.font = `${on ? 700 : 500} ${fs}px ${MONO}`
        c.fillStyle = on ? '#f4f4f6' : i < stage ? 'rgba(244,244,246,0.5)' : 'rgba(244,244,246,0.26)'
        c.fillText(name, x, railY)
        c.fillStyle = 'rgba(244,244,246,0.12)'
        c.fillRect(x, railY + 8, seg - 10, 2)
        if (i <= stage) {
          c.fillStyle = i === 3 && on ? PATCHED : accent
          c.fillRect(x, railY + 8, (seg - 10) * (i < stage ? 1 : local / span), 2)
        }
      })

      // ---- radar ----
      const cx = w * 0.38
      const cy = h * 0.57
      const R = Math.min(w * 0.34, h * 0.35)

      c.strokeStyle = 'rgba(244,244,246,0.1)'
      c.lineWidth = 1
      for (let i = 1; i <= 3; i++) {
        c.beginPath()
        c.arc(cx, cy, (R * i) / 3, 0, Math.PI * 2)
        c.stroke()
      }
      c.beginPath()
      c.moveTo(cx - R, cy)
      c.lineTo(cx + R, cy)
      c.moveTo(cx, cy - R)
      c.lineTo(cx, cy + R)
      c.stroke()

      // the sweep only hunts while there is something left to find
      const sweepOn = stage === 0 ? 1 : stage === 1 ? 1 - ease(local / span - 0.4) * 0.6 : 0.16
      const sweep = (t * 1.5) % (Math.PI * 2)
      const grad = c.createConicGradient(sweep, cx, cy)
      grad.addColorStop(0, accent + '55')
      grad.addColorStop(0.12, accent + '14')
      grad.addColorStop(0.25, 'transparent')
      grad.addColorStop(1, 'transparent')
      c.globalAlpha = sweepOn
      c.fillStyle = grad
      c.beginPath()
      c.moveTo(cx, cy)
      c.arc(cx, cy, R, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = accent
      c.lineWidth = 1.5
      c.beginPath()
      c.moveTo(cx, cy)
      c.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R)
      c.stroke()
      c.globalAlpha = 1

      // target
      c.fillStyle = '#f4f4f6'
      c.beginPath()
      c.arc(cx, cy, 2.5, 0, Math.PI * 2)
      c.fill()

      // ---- findings ----
      const pos = FINDINGS.map((f) => ({ x: cx + Math.cos(f.a) * f.r * R, y: cy + Math.sin(f.a) * f.r * R }))
      let kept = 0
      FINDINGS.forEach((f, i) => {
        if (stage === 0) return
        const { x, y } = pos[i]
        const born = stage === 1 ? ease((local - i * 0.45) / 0.35) : 1
        if (born <= 0) return
        const isDup = f.dupOf >= 0

        // understand: duplicates get tied to their original, then dropped
        let alpha = born
        if (isDup && stage >= 2) {
          const k = stage === 2 ? ease(local / 1.3) : 1
          const fade = stage === 2 ? 1 - ease((local - 1.3) / 0.9) : 0
          alpha = fade
          if (fade > 0) {
            const o = pos[f.dupOf]
            c.setLineDash([3, 4])
            c.strokeStyle = `rgba(244,244,246,${0.5 * fade})`
            c.beginPath()
            c.moveTo(x, y)
            c.lineTo(x + (o.x - x) * k, y + (o.y - y) * k)
            c.stroke()
            c.setLineDash([])
          }
        }
        if (alpha <= 0.01) return

        // remediate: survivors go green one after another
        const order = isDup ? 0 : kept++
        const fixed = stage === 3 ? ease((local - 0.4 - order * 0.75) / 0.4) : 0
        const col = fixed > 0.5 ? PATCHED : accent

        c.globalAlpha = alpha
        c.fillStyle = col
        c.beginPath()
        c.arc(x, y, 4.5, 0, Math.PI * 2)
        c.fill()
        c.globalAlpha = alpha * 0.28
        c.beginPath()
        c.arc(x, y, 11 + Math.sin(t * 4 + i) * 1.5, 0, Math.PI * 2)
        c.fill()

        // triaged ring
        if (!isDup && stage >= 2) {
          const k = stage === 2 ? ease((local - 1.6) / 0.6) : 1
          c.globalAlpha = alpha * k
          c.strokeStyle = col
          c.lineWidth = 1.4
          c.beginPath()
          c.arc(x, y, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k)
          c.stroke()
        }

        c.globalAlpha = alpha
        c.font = `600 ${fs - 1}px ${MONO}`
        c.fillStyle = col
        const tag = fixed > 0.5 ? 'PATCHED' : isDup && stage >= 2 ? 'DUPLICATE' : f.label
        const left = x > cx + R * 0.35
        c.textAlign = left ? 'right' : 'left'
        c.fillText(tag, x + (left ? -22 : 22), y + 4)
        c.textAlign = 'left'
        c.globalAlpha = 1
      })

      // ---- status line ----
      const status = [
        'SCANNING TARGET',
        `${Math.min(5, Math.floor(local / 0.45) + 1)} FINDINGS`,
        local < 2.2 ? 'TRIAGING' : '3 REAL · 2 DUPLICATE',
        local < 2.9 ? 'WRITING FIX' : 'PULL REQUEST OPENED',
      ][stage]
      c.font = `600 ${fs}px ${MONO}`
      const done = stage === 3 && local >= 2.9
      const tw = c.measureText(status).width
      if (done) {
        c.fillStyle = PATCHED + '22'
        c.strokeStyle = PATCHED
        c.lineWidth = 1
        c.beginPath()
        c.roundRect(14, h - 40, tw + 44, 26, 13)
        c.fill()
        c.stroke()
        c.fillStyle = PATCHED
        c.fillText('✓', 26, h - 22)
        c.fillText(status, 42, h - 22)
      } else {
        c.fillStyle = 'rgba(244,244,246,0.5)'
        c.fillText(status, 18, h - 22)
      }
    },
    [accent],
  )

  return (
    <canvas
      ref={useMotifCanvas(draw, undefined, 12.2)}
      className="motif-canvas"
      aria-label="A scan finds five issues, triage keeps three, and each one ends in a pull request"
    />
  )
}
