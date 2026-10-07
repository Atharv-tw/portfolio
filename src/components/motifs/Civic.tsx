import { useCallback } from 'react'
import { useMotifCanvas, type MotifCtx } from './useMotifCanvas'

const MONO = '"JetBrains Mono Variable", monospace'
const ink = (a: number) => `rgba(244,244,246,${a})`

/** the five stages a report moves through, as the app names them */
const STAGES = ['SUBMITTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED']

/** streets of a made-up neighbourhood: [x1, y1, x2, y2, weight] in map space */
const STREETS: Array<[number, number, number, number, number]> = [
  [0, 0.22, 1, 0.3, 2],
  [0, 0.62, 1, 0.56, 2],
  [0.3, 0, 0.24, 1, 2],
  [0.72, 0, 0.78, 1, 2],
  [0, 0.42, 1, 0.44, 1],
  [0, 0.84, 1, 0.8, 1],
  [0.12, 0, 0.08, 1, 1],
  [0.5, 0, 0.52, 1, 1],
  [0.9, 0, 0.94, 1, 1],
  [0.3, 0.26, 0.74, 0.92, 1],
]

/** other reports already on the map: [x, y, resolved] */
const OTHERS: Array<[number, number, boolean]> = [
  [0.14, 0.34, true],
  [0.4, 0.74, false],
  [0.84, 0.2, true],
  [0.9, 0.7, false],
  [0.2, 0.86, true],
  [0.62, 0.14, false],
]

const HERE: [number, number] = [0.6, 0.5] // where the new report is
const DEPOT: [number, number] = [0.1, 0.62] // where the crew starts from

const DROP = 0.7
const FIRST = 1.3
const EACH = 1.5
const DONE = FIRST + (STAGES.length - 1) * EACH
const LOOP = DONE + 2.9

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => {
  const k = clamp(x)
  return k * k * (3 - 2 * k)
}
const bell = (x: number) => Math.sin(clamp(x) * Math.PI)

/**
 * Civic Setu — one report's life on the map: pinned with a photo and its
 * location, acknowledged, assigned, worked on, resolved. Illustrative only.
 */
export default function Civic({ accent = '#c6e84f' }: { accent?: string }) {
  const draw = useCallback(
    ({ c, w, h, t }: MotifCtx) => {
      const T = t % LOOP
      const fs = Math.max(9, Math.min(11.5, Math.min(w, h) * 0.023))
      const show = Math.min(ease(T / 0.5), 1 - ease((T - (LOOP - 0.6)) / 0.5))
      const stage = T < FIRST ? -1 : Math.min(STAGES.length - 1, Math.floor((T - FIRST) / EACH))
      const resolved = stage === STAGES.length - 1

      // the map fills the frame between the key and the progress rail
      const mx = 14
      const my = 44
      const mw = w - 28
      const mh = h - my - 70
      const at = (p: readonly [number, number]) => ({ x: mx + p[0] * mw, y: my + p[1] * mh })

      c.textBaseline = 'middle'
      c.save()
      c.beginPath()
      c.roundRect(mx, my, mw, mh, 10)
      c.clip()
      c.fillStyle = ink(0.025)
      c.fillRect(mx, my, mw, mh)
      for (const [x1, y1, x2, y2, weight] of STREETS) {
        c.strokeStyle = ink(weight === 2 ? 0.16 : 0.09)
        c.lineWidth = weight === 2 ? 5 : 2.5
        c.beginPath()
        c.moveTo(mx + x1 * mw, my + y1 * mh)
        c.lineTo(mx + x2 * mw, my + y2 * mh)
        c.stroke()
      }

      // the reports that were already here
      for (const [x, y, done] of OTHERS) {
        const p = at([x, y])
        c.beginPath()
        c.arc(p.x, p.y, 4, 0, Math.PI * 2)
        if (done) {
          c.strokeStyle = ink(0.4)
          c.lineWidth = 1.3
          c.stroke()
        } else {
          c.fillStyle = accent
          c.globalAlpha = 0.55
          c.fill()
          c.globalAlpha = 1
        }
      }

      // ---- the crew: sent out when the report is assigned, there while it is in progress ----
      const here = at(HERE)
      const depot = at(DEPOT)
      const go = ease((T - (FIRST + 2 * EACH + 0.2)) / (EACH * 1.1))
      if (stage >= 2 && show > 0.01) {
        const gone = resolved ? 1 - ease((T - DONE - 0.5) / 0.5) : 1
        const cx = depot.x + (here.x - depot.x) * go
        const cy = depot.y + (here.y - depot.y) * go
        c.globalAlpha = 0.5 * show * gone
        c.strokeStyle = ink(0.8)
        c.lineWidth = 1.2
        c.setLineDash([3, 5])
        c.beginPath()
        c.moveTo(depot.x, depot.y)
        c.lineTo(here.x, here.y)
        c.stroke()
        c.setLineDash([])
        c.globalAlpha = show * gone
        c.fillStyle = ink(0.95)
        c.beginPath()
        c.roundRect(cx - 5, cy - 5, 10, 10, 2.5)
        c.fill()
        c.globalAlpha = 1
      }

      // ---- the new report ----
      const fall = ease((T - DROP + 0.45) / 0.45)
      if (fall > 0 && show > 0.01) {
        const ring = (T - DROP) / 1.1
        if (ring > 0 && ring < 1) {
          c.globalAlpha = bell(ring) * 0.8
          c.strokeStyle = accent
          c.lineWidth = 1.5
          c.beginPath()
          c.arc(here.x, here.y, 6 + ring * 30, 0, Math.PI * 2)
          c.stroke()
        }
        const py = here.y - (1 - fall) * mh * 0.4
        const pr = Math.max(8, Math.min(11, w * 0.026))
        c.globalAlpha = show * fall
        c.fillStyle = resolved ? ink(0.95) : accent
        c.beginPath()
        c.arc(here.x, py - pr * 1.6, pr, Math.PI * 0.85, Math.PI * 0.15)
        c.lineTo(here.x, py)
        c.closePath()
        c.fill()
        c.strokeStyle = '#0f1406'
        c.lineWidth = 2
        c.lineCap = 'round'
        c.beginPath()
        if (resolved) {
          c.moveTo(here.x - pr * 0.42, py - pr * 1.6)
          c.lineTo(here.x - pr * 0.1, py - pr * 1.28)
          c.lineTo(here.x + pr * 0.45, py - pr * 1.95)
        } else {
          c.moveTo(here.x, py - pr * 2.05)
          c.lineTo(here.x, py - pr * 1.55)
          c.moveTo(here.x, py - pr * 1.2)
          c.lineTo(here.x, py - pr * 1.19)
        }
        c.stroke()
        c.lineCap = 'butt'
        c.globalAlpha = 1
      }
      c.restore()

      // ---- what was filed: a photo, a category, a location ----
      const filed = ease((T - DROP - 0.15) / 0.4) * show
      if (filed > 0.01) {
        const kw = Math.min(mw * 0.4, 190)
        const kh = Math.max(46, fs * 4.9)
        const kx = here.x - kw - Math.max(14, w * 0.04)
        const ky = here.y - kh - fs * 1.2
        c.globalAlpha = filed
        c.fillStyle = '#12180a'
        c.beginPath()
        c.roundRect(kx, ky, kw, kh, 8)
        c.fill()
        c.strokeStyle = accent
        c.globalAlpha = filed * 0.5
        c.lineWidth = 1
        c.stroke()
        c.globalAlpha = filed
        // the photo
        const th = kh - 14
        c.fillStyle = ink(0.12)
        c.beginPath()
        c.roundRect(kx + 7, ky + 7, th, th, 4)
        c.fill()
        c.fillStyle = ink(0.4)
        c.beginPath()
        c.moveTo(kx + 7 + th * 0.12, ky + 7 + th * 0.82)
        c.lineTo(kx + 7 + th * 0.42, ky + 7 + th * 0.42)
        c.lineTo(kx + 7 + th * 0.62, ky + 7 + th * 0.66)
        c.lineTo(kx + 7 + th * 0.74, ky + 7 + th * 0.54)
        c.lineTo(kx + 7 + th * 0.9, ky + 7 + th * 0.82)
        c.closePath()
        c.fill()
        c.textAlign = 'left'
        c.font = `700 ${fs}px ${MONO}`
        c.fillStyle = ink(0.94)
        c.fillText('ROAD ISSUE', kx + th + 16, ky + kh * 0.36)
        c.font = `500 ${fs * 0.92}px ${MONO}`
        c.fillStyle = ink(0.5)
        c.fillText('PHOTO  ·  GPS', kx + th + 16, ky + kh * 0.68)
        c.globalAlpha = 1
      }

      // ---- key ----
      c.font = `600 ${fs}px ${MONO}`
      c.textAlign = 'left'
      c.fillStyle = accent
      c.beginPath()
      c.arc(22, 24, 4.5, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = ink(0.7)
      c.fillText('OPEN', 34, 25)
      const kx2 = 34 + c.measureText('OPEN').width + 22
      c.strokeStyle = ink(0.5)
      c.lineWidth = 1.3
      c.beginPath()
      c.arc(kx2, 24, 4.5, 0, Math.PI * 2)
      c.stroke()
      c.fillText('RESOLVED', kx2 + 12, 25)

      // ---- the rail: five stages, every one visible to the person who reported it ----
      const ry = h - 30
      const gap = 5
      const sw = (w - 44 - gap * (STAGES.length - 1)) / STAGES.length
      STAGES.forEach((_, k) => {
        const fill = k < stage ? 1 : k === stage ? ease((T - (FIRST + k * EACH)) / 0.5) : 0
        c.fillStyle = ink(0.14)
        c.beginPath()
        c.roundRect(22 + k * (sw + gap), ry, sw, 5, 2.5)
        c.fill()
        if (fill > 0) {
          c.globalAlpha = show
          c.fillStyle = accent
          c.beginPath()
          c.roundRect(22 + k * (sw + gap), ry, Math.max(5, sw * fill), 5, 2.5)
          c.fill()
          c.globalAlpha = 1
        }
      })
      c.textAlign = 'left'
      c.fillStyle = stage >= 0 && show > 0.5 ? ink(0.92) : ink(0.45)
      c.fillText(stage >= 0 && show > 0.5 ? STAGES[stage] : 'NEW REPORT', 22, ry - fs * 1.3)
      c.textAlign = 'right'
      c.fillStyle = ink(0.45)
      c.fillText(`${stage >= 0 && show > 0.5 ? stage + 1 : 0} / ${STAGES.length}`, w - 22, ry - fs * 1.3)
      c.textAlign = 'left'
      c.textBaseline = 'alphabetic'
    },
    [accent],
  )

  return (
    <canvas
      ref={useMotifCanvas(draw, undefined, FIRST + 3 * EACH + 0.85)}
      className="motif-canvas"
      aria-label="A civic report on a map: pinned with a photo and location, then acknowledged, assigned, worked on and resolved"
    />
  )
}
