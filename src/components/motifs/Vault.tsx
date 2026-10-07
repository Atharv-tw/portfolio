import { useCallback } from 'react'
import { useMotifCanvas, type MotifCtx } from './useMotifCanvas'

const MONO = '"JetBrains Mono Variable", monospace'
const ink = (a: number) => `rgba(244,244,246,${a})`
const RED = '#ff5d6c'
const HEX = '0123456789abcdef'

/** a record's fields: labels only, the values are drawn as bars so nothing is made up */
const FIELDS = [
  { label: 'name', len: 0.82 },
  { label: 'dob', len: 0.5 },
  { label: 'bp', len: 0.42 },
  { label: 'rx', len: 0.7 },
  { label: 'allergy', len: 0.58 },
]

const ENCRYPT = 0.9 // the record starts leaving the device
const STORED = 3.1 // the server holds all of it, sealed
const SHARE = 4.1 // a QR code is shown
const OPEN = 5.5 // the doctor scans it and is let in
const READ = 7.4 // ...and can read the record
const REVOKE = 9.0
const GONE = 10.1
const LOOP = 11.6
const STEPS = ['ENCRYPT', 'STORE', 'SHARE', 'REVOKE']

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => {
  const k = clamp(x)
  return k * k * (3 - 2 * k)
}
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * HealthVault — one record's life: encrypted on the patient's device, stored
 * sealed, opened for a doctor with a QR code, then revoked. Illustrative only.
 */
export default function Vault({ accent = '#35c6dc' }: { accent?: string }) {
  const draw = useCallback(
    ({ c, w, h, t }: MotifCtx) => {
      const T = t % LOOP
      const fs = Math.max(9, Math.min(11.5, Math.min(w, h) * 0.023))
      const reset = 1 - ease((T - (LOOP - 0.6)) / 0.5)

      const pad = w < 420 ? 14 : 18
      const gap = Math.max(32, w * 0.085)
      const cw = (w - pad * 2 - gap * 2) / 3
      const ch = Math.min(h * 0.46, cw * 1.55)
      const y0 = h * 0.25
      const mid = y0 + ch / 2
      const inset = Math.max(10, cw * 0.09)
      const lh = (ch - inset * 2) / FIELDS.length
      const cf = Math.max(8, Math.min(12.5, cw * 0.07))
      const labelCol = cf * 4.9
      const cardX = (i: number) => pad + i * (cw + gap)
      const lineY = (l: number) => y0 + inset + lh * (l + 0.5)

      c.textBaseline = 'middle'

      /** a readable line: the field's name and its value as a bar */
      const plain = (i: number, l: number, a: number) => {
        if (a <= 0.01) return
        const x = cardX(i) + inset
        c.globalAlpha = a
        c.font = `500 ${cf}px ${MONO}`
        c.textAlign = 'left'
        c.fillStyle = ink(0.5)
        c.fillText(FIELDS[l].label, x, lineY(l) + 1)
        c.fillStyle = ink(0.82)
        c.beginPath()
        c.roundRect(x + labelCol, lineY(l) - cf * 0.32, (cw - inset * 2 - labelCol) * FIELDS[l].len, cf * 0.64, 2)
        c.fill()
      }

      /** the same line, sealed: slow-churning hex */
      const sealed = (i: number, l: number, a: number) => {
        if (a <= 0.01) return
        const n = Math.floor((cw - inset * 2) / (cf * 0.6))
        let s = ''
        for (let k = 0; k < n; k++) {
          s += k % 5 === 4 ? ' ' : HEX[Math.floor(hash(i * 97 + l * 31 + k * 7 + Math.floor(t * 1.6 + hash(k * 3 + l) * 4)) * 16)]
        }
        c.globalAlpha = a
        c.font = `500 ${cf}px ${MONO}`
        c.textAlign = 'left'
        c.fillStyle = accent
        c.fillText(s, cardX(i) + inset, lineY(l) + 1)
      }

      // ---- where the doctor's access stands ----
      const granted = T >= READ - 0.5 && T < REVOKE
      const revoked = T >= REVOKE && T < GONE + 0.9
      const edge = [accent, ink(0.24), revoked ? RED : granted ? accent : ink(0.24)]
      const edgeAlpha = [0.6, 1, revoked ? 0.75 * (1 - ease((T - GONE) / 0.9)) + 0.25 : granted ? 0.7 : 1]

      // ---- the three places a record can be ----
      const titles = ['YOUR DEVICE', 'SERVER', 'DOCTOR']
      titles.forEach((title, i) => {
        c.globalAlpha = edgeAlpha[i]
        c.strokeStyle = edge[i]
        c.lineWidth = 1.3
        c.beginPath()
        c.roundRect(cardX(i), y0, cw, ch, Math.min(14, cw * 0.09))
        c.stroke()
        c.globalAlpha = 1
        c.font = `600 ${fs}px ${MONO}`
        c.textAlign = 'left'
        c.fillStyle = ink(0.62)
        c.fillText(title, cardX(i) + 2, y0 - fs * 1.4)
      })

      // the patient always has the readable record
      FIELDS.forEach((_, l) => plain(0, l, 1))

      // the server only ever holds the sealed one
      FIELDS.forEach((_, l) => sealed(1, l, ease((T - (ENCRYPT + 0.75 + l * 0.32)) / 0.3) * reset * 0.9))

      // the doctor: sealed as it arrives, readable while access lasts, sealed again on revoke
      FIELDS.forEach((_, l) => {
        const arrive = ease((T - (OPEN + 0.5 + l * 0.14)) / 0.25)
        const open = ease((T - (OPEN + 1.0 + l * 0.14)) / 0.3) * (1 - ease((T - (REVOKE + l * 0.07)) / 0.3))
        const left = 1 - ease((T - (REVOKE + 0.7)) / 0.4)
        plain(2, l, arrive * open * left)
        sealed(2, l, arrive * (1 - open) * left * 0.9)
      })
      c.globalAlpha = 1

      // ---- device → server: each line is sealed on the way out ----
      const g1 = cardX(0) + cw
      const g2 = cardX(1) + cw
      c.strokeStyle = ink(0.14)
      c.lineWidth = 1
      c.setLineDash([2, 4])
      c.beginPath()
      c.moveTo(g1 + 5, mid)
      c.lineTo(g1 + gap - 5, mid)
      c.moveTo(g2 + 5, mid)
      c.lineTo(g2 + gap - 5, mid)
      c.stroke()
      c.setLineDash([])

      let sealing = 0
      FIELDS.forEach((_, l) => {
        const p = (T - (ENCRYPT + l * 0.32)) / 0.75
        if (p <= 0 || p >= 1) return
        sealing = 1
        c.fillStyle = p < 0.5 ? ink(0.85) : accent
        c.beginPath()
        c.roundRect(g1 + 4 + (gap - 20) * p, lineY(l) - 2.5, 12, 5, 2)
        c.fill()
      })
      FIELDS.forEach((_, l) => {
        const p = (T - (OPEN + 0.15 + l * 0.14)) / 0.5
        if (p <= 0 || p >= 1) return
        c.fillStyle = accent
        c.beginPath()
        c.roundRect(g2 + 4 + (gap - 20) * p, lineY(l) - 2.5, 12, 5, 2)
        c.fill()
      })

      // the lock every line passes through
      const lx = g1 + gap / 2
      const lk = Math.max(6, Math.min(9, gap * 0.16))
      c.fillStyle = sealing ? accent : ink(0.7)
      c.strokeStyle = sealing ? accent : ink(0.7)
      c.lineWidth = 1.6
      c.beginPath()
      c.roundRect(lx - lk, mid - lk * 0.3, lk * 2, lk * 1.5, 2.5)
      c.fill()
      c.beginPath()
      c.arc(lx, mid - lk * 0.3, lk * 0.62, Math.PI, 0)
      c.stroke()

      // ---- server → doctor: a QR code opens it ----
      const qx = g2 + gap / 2
      const q = Math.min(gap * 0.8, 58)
      const N = 9
      const m = q / N
      const drawn = clamp((T - SHARE) / 0.9)
      const dead = ease((T - REVOKE) / 0.4)
      const qa = (0.9 - dead * 0.7) * (1 - ease((T - GONE) / 0.8))
      if (drawn > 0 && qa > 0.01) {
        const finder = (r: number, k: number) => {
          for (const [fr, fk] of [
            [0, 0],
            [0, N - 3],
            [N - 3, 0],
          ]) {
            const dr = r - fr
            const dk = k - fk
            if (dr >= 0 && dr < 3 && dk >= 0 && dk < 3) return dr !== 1 || dk !== 1 ? 1 : 2
          }
          return 0
        }
        c.fillStyle = ink(1)
        for (let r = 0; r < N; r++) {
          for (let k = 0; k < N; k++) {
            if ((r * N + k) / (N * N) > drawn) continue
            const f = finder(r, k)
            if (f === 0 && hash(r * 13 + k * 29) < 0.5) continue
            c.globalAlpha = qa * (f === 2 ? 0.35 : 1)
            c.fillRect(qx - q / 2 + k * m + 0.5, mid - q / 2 + r * m + 0.5, m - 1, m - 1)
          }
        }
        // the scan
        const scan = (T - OPEN) / 0.7
        if (scan > 0 && scan < 1) {
          c.globalAlpha = 0.9
          c.fillStyle = accent
          c.fillRect(qx - q / 2 - 3, mid - q / 2 + q * scan - 1, q + 6, 2)
        }
        if (dead > 0) {
          c.globalAlpha = dead * (1 - ease((T - GONE) / 0.8))
          c.strokeStyle = RED
          c.lineWidth = 2
          c.beginPath()
          c.moveTo(qx - q / 2 - 2, mid + q / 2 + 2)
          c.lineTo(qx - q / 2 - 2 + (q + 4) * dead, mid + q / 2 + 2 - (q + 4) * dead)
          c.stroke()
        }
        c.globalAlpha = 1
      }

      // ---- what each place holds ----
      const cap = y0 + ch + fs * 1.9
      c.font = `600 ${fs}px ${MONO}`
      c.textAlign = 'left'
      c.fillStyle = accent
      c.fillText('ENCRYPTED HERE', cardX(0) + 2, cap)
      c.fillStyle = ink(0.4 + 0.45 * ease((T - STORED) / 0.4) * reset)
      c.fillText('SEALED FILE', cardX(1) + 2, cap)
      c.fillStyle = revoked ? RED : granted ? accent : ink(0.38)
      c.fillText(revoked ? 'ACCESS REVOKED' : granted ? 'ACCESS GRANTED' : 'NO ACCESS', cardX(2) + 2, cap)

      // ---- key ----
      c.fillStyle = accent
      c.beginPath()
      c.arc(22, 24, 4.5, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = ink(0.7)
      c.fillText('AES-256-GCM  ·  ENCRYPTED IN THE BROWSER', 34, 25)

      // ---- where the story is ----
      const step = T < STORED - 0.5 ? 0 : T < SHARE ? 1 : T < REVOKE ? 2 : 3
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
      ref={useMotifCanvas(draw, undefined, 8.1)}
      className="motif-canvas"
      aria-label="A health record is encrypted on the patient's device, stored sealed on the server, opened for a doctor with a QR code, then revoked"
    />
  )
}
