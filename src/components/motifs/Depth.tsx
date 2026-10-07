import { useCallback } from 'react'
import { useMotifCanvas, type MotifCtx } from './useMotifCanvas'

const COLS = 40
const ROWS = 12
/** one pass, a hold, then the column goes dark again */
const PASS = 6.4
const HOLD = 9.2
const LOOP = 11
const MONO = '"JetBrains Mono Variable", monospace'

type RGB = [number, number, number]
/** cold and deep → warm and shallow */
const RAMP: RGB[] = [
  [8, 32, 56],
  [16, 74, 112],
  [38, 138, 168],
  [126, 208, 214],
  [242, 204, 128],
]

function tempColor(v: number): string {
  const x = Math.min(0.999, Math.max(0, v)) * (RAMP.length - 1)
  const i = Math.floor(x)
  const k = x - i
  const a = RAMP[i]
  const b = RAMP[i + 1]
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`
}

/** an invented field that only has to look like water: warm on top, wavy thermocline */
function temp(col: number, row: number, t: number) {
  const x = col / COLS
  const d = row / (ROWS - 1)
  const lift = Math.sin(x * 5.2 + t * 0.22) * 0.13 + Math.sin(x * 11.5 - t * 0.31) * 0.05
  return 1 - Math.pow(Math.min(1, Math.max(0, d * 1.08 + lift * (0.4 + d))), 0.72)
}

const ease = (x: number) => {
  const k = Math.min(1, Math.max(0, x))
  return k * k * (3 - 2 * k)
}

/**
 * Okeanos — a satellite passes over the surface; behind it the water column
 * underneath fills in. Illustrative only: no real data, no units.
 */
export default function Depth({ accent = '#3fa7c4' }: { accent?: string }) {
  const draw = useCallback(
    ({ c, w, h, t }: MotifCtx) => {
      const T = t % LOOP
      const pass = Math.min(1, T / PASS)
      const fade = T > HOLD ? 1 - ease((T - HOLD) / (LOOP - HOLD - 0.3)) : 1
      const fs = Math.max(9, Math.min(11.5, Math.min(w, h) * 0.023))

      const left = 46
      const right = w - 18
      const surfY = h * 0.22
      const top = surfY + 26
      const bottom = h - 46
      const cw = (right - left) / COLS
      const ch = (bottom - top) / ROWS
      const scanX = left + (right - left) * pass

      // ---- water column ----
      for (let col = 0; col < COLS; col++) {
        const x = left + col * cw
        const behind = pass * COLS - col
        for (let row = 0; row < ROWS; row++) {
          const y = top + row * ch
          // the prediction travels down from the surface, so deeper cells land later
          const k = ease((behind - row * 0.55) / 2.2) * fade
          if (k < 0.99) {
            c.fillStyle = 'rgba(244,244,246,0.1)'
            c.fillRect(x + cw / 2 - 1, y + ch / 2 - 1, 2, 2)
          }
          if (k > 0.01) {
            c.globalAlpha = k
            c.fillStyle = tempColor(temp(col, row, t))
            c.beginPath()
            c.roundRect(x + 1, y + 1, cw - 2, ch - 2, 2)
            c.fill()
            c.globalAlpha = 1
          }
        }
      }

      // ---- thermocline: where the column crosses the middle of the ramp ----
      c.strokeStyle = `rgba(244,244,246,${0.7 * fade})`
      c.lineWidth = 1.4
      c.beginPath()
      let started = false
      for (let col = 0; col < COLS; col++) {
        if (pass * COLS - col < 5) break
        let depth = ROWS - 1
        for (let row = 0; row < ROWS - 1; row++) {
          const a = temp(col, row, t)
          const b = temp(col, row + 1, t)
          if (a >= 0.5 && b < 0.5) {
            depth = row + (a - 0.5) / (a - b)
            break
          }
        }
        const x = left + col * cw + cw / 2
        const y = top + depth * ch + ch / 2
        if (started) c.lineTo(x, y)
        else c.moveTo(x, y)
        started = true
      }
      c.stroke()

      // ---- surface strip: what the satellite actually sees ----
      for (let col = 0; col < COLS; col++) {
        const x = left + col * cw
        const seen = ease(pass * COLS - col) * fade
        c.fillStyle = 'rgba(244,244,246,0.14)'
        c.fillRect(x + 1, surfY, cw - 2, 10)
        if (seen > 0.01) {
          c.globalAlpha = seen
          c.fillStyle = tempColor(temp(col, 0, t) * 0.92 + 0.08)
          c.fillRect(x + 1, surfY, cw - 2, 10)
          c.globalAlpha = 1
        }
      }

      // ---- satellite + its beam ----
      const satY = Math.max(22, surfY - 44)
      if (pass < 1) {
        c.setLineDash([2, 5])
        c.strokeStyle = accent
        c.lineWidth = 1
        c.beginPath()
        c.moveTo(scanX, satY + 9)
        c.lineTo(scanX, surfY - 3)
        c.stroke()
        c.setLineDash([])

        // the front where surface becomes subsurface
        const g = c.createLinearGradient(0, top, 0, bottom)
        g.addColorStop(0, accent)
        g.addColorStop(1, 'transparent')
        c.strokeStyle = g
        c.lineWidth = 2
        c.beginPath()
        c.moveTo(scanX, top)
        c.lineTo(scanX - 5.5 * 0.55 * cw, bottom)
        c.stroke()
      }
      const sx = pass < 1 ? scanX : right
      c.globalAlpha = pass < 1 ? 1 : 0.4 * fade
      c.fillStyle = '#f4f4f6'
      c.fillRect(sx - 4, satY - 4, 8, 8)
      c.fillStyle = accent
      c.fillRect(sx - 17, satY - 2.5, 10, 5)
      c.fillRect(sx + 7, satY - 2.5, 10, 5)
      c.globalAlpha = 1

      // ---- labels ----
      c.font = `600 ${fs}px ${MONO}`
      c.fillStyle = 'rgba(244,244,246,0.55)'
      c.textAlign = 'left'
      c.textBaseline = 'middle'
      c.fillText('ORBIT', 12, satY)
      c.fillText('SEA', 12, surfY + 5)
      c.save()
      c.translate(20, (top + bottom) / 2)
      c.rotate(-Math.PI / 2)
      c.textAlign = 'center'
      c.fillText('DEPTH  →', 0, 0)
      c.restore()

      // cold ↔ warm key
      const keyY = h - 22
      c.fillStyle = 'rgba(244,244,246,0.5)'
      c.fillText('COLD', 12, keyY)
      const keyX = 12 + c.measureText('COLD').width + 10
      for (let i = 0; i < 24; i++) {
        c.fillStyle = tempColor(i / 23)
        c.fillRect(keyX + i * 4, keyY - 4, 4, 8)
      }
      c.fillStyle = 'rgba(244,244,246,0.5)'
      c.fillText('WARM', keyX + 106, keyY)
      c.textBaseline = 'alphabetic'
    },
    [accent],
  )

  return (
    <canvas
      ref={useMotifCanvas(draw, undefined, 8)}
      className="motif-canvas"
      aria-label="A satellite passes over the sea surface and the temperature of the water beneath it is filled in"
    />
  )
}
