import { useCallback } from 'react'
import { useMotifCanvas, type MotifCtx } from './useMotifCanvas'

const MONO = '"JetBrains Mono Variable", monospace'
const ink = (a: number) => `rgba(244,244,246,${a})`

/** the three jars, and the share of the pocket money that belongs in each */
const JARS = [
  { label: 'NEEDS', share: '50%', coins: 5 },
  { label: 'WANTS', share: '20%', coins: 2 },
  { label: 'SAVE', share: '30%', coins: 3 },
]

/** the order the ten coins are dealt in (jar per coin), and the slot each lands in */
const DEAL = [0, 2, 0, 1, 0, 2, 0, 1, 2, 0]
const SLOT = DEAL.map((jar, k) => DEAL.slice(0, k).filter((j) => j === jar).length)

const FIRST = 0.8
const EVERY = 0.46
const FLIGHT = 0.5
const CLEAR = FIRST + (DEAL.length - 1) * EVERY + FLIGHT + 0.25
const LEVEL = CLEAR + 1.5
const LOOP = LEVEL + 2.4

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => {
  const k = clamp(x)
  return k * k * (3 - 2 * k)
}
/** rises, then falls, over 0…1 */
const bell = (x: number) => Math.sin(clamp(x) * Math.PI)

/**
 * Finstar — one round of a budgeting game: ten coins of pocket money are
 * dealt into needs, wants and savings, the round clears, the player levels up.
 * Illustrative only.
 */
export default function Arcade({ accent = '#ffb114' }: { accent?: string }) {
  const draw = useCallback(
    ({ c, w, h, t }: MotifCtx) => {
      const T = t % LOOP
      const fs = Math.max(9, Math.min(11.5, Math.min(w, h) * 0.023))
      // the board empties just before the next round, and fills in as it starts
      const show = Math.min(ease(T / 0.5), 1 - ease((T - (LOOP - 0.6)) / 0.5))

      const jarW = Math.min(w * 0.21, 170)
      const jarH = Math.min(h * 0.34, 240)
      const baseY = h * 0.8
      const coinH = Math.min(h * 0.04, (jarH - 26) / 5 - 4)
      const coinW = jarW * 0.6
      const gap = 4
      const srcX = w / 2
      const srcY = h * 0.225
      const pillW = Math.min(w * 0.46, 270)
      const pillH = Math.max(26, fs * 2.8)
      const jarX = (i: number) => w * (0.2 + i * 0.3)
      const slotY = (slot: number) => baseY - 9 - coinH / 2 - slot * (coinH + gap)
      const dotX = (k: number) => srcX - pillW / 2 + (pillW * (k + 1)) / (DEAL.length + 1)

      c.textBaseline = 'middle'

      // ---- the pocket money, ten coins of it ----
      const cleared = ease((T - CLEAR) / 0.4)
      c.lineWidth = 1.2
      c.strokeStyle = cleared > 0 ? accent : ink(0.24)
      c.globalAlpha = cleared > 0 ? 0.35 + cleared * 0.5 : 1
      c.beginPath()
      c.roundRect(srcX - pillW / 2, srcY - pillH / 2, pillW, pillH, pillH / 2)
      c.stroke()
      c.globalAlpha = 1

      c.font = `600 ${fs}px ${MONO}`
      c.textAlign = 'center'
      c.fillStyle = ink(0.5)
      c.fillText('POCKET MONEY', srcX, srcY - pillH / 2 - fs * 1.2)

      DEAL.forEach((_, k) => {
        const waiting = T < FIRST + k * EVERY
        c.globalAlpha = (1 - cleared) * (waiting ? show : 1)
        c.fillStyle = waiting ? accent : ink(0.16)
        c.beginPath()
        c.arc(dotX(k), srcY, waiting ? pillH * 0.17 : 2, 0, Math.PI * 2)
        c.fill()
      })
      if (cleared > 0) {
        c.globalAlpha = cleared * show
        c.font = `700 ${fs}px ${MONO}`
        c.fillStyle = accent
        c.fillText('ROUND CLEAR', srcX, srcY + 1)
      }
      c.globalAlpha = 1

      // ---- the jars ----
      JARS.forEach((jar, i) => {
        const x = jarX(i)
        const landed = DEAL.filter((j, k) => j === i && T >= FIRST + k * EVERY + FLIGHT).length
        const full = landed === jar.coins
        const l = x - jarW / 2
        const r = x + jarW / 2
        const top = baseY - jarH
        const rad = Math.min(14, jarW * 0.12)

        c.beginPath()
        c.moveTo(l, top)
        c.lineTo(l, baseY - rad)
        c.quadraticCurveTo(l, baseY, l + rad, baseY)
        c.lineTo(r - rad, baseY)
        c.quadraticCurveTo(r, baseY, r, baseY - rad)
        c.lineTo(r, top)
        if (full) {
          c.globalAlpha = 0.07 * show
          c.fillStyle = accent
          c.fill()
        }
        c.globalAlpha = full ? 0.35 + 0.55 * show : 1
        c.strokeStyle = full ? accent : ink(0.3)
        c.lineWidth = 1.5
        c.stroke()
        c.globalAlpha = 1

        c.textAlign = 'center'
        c.font = `500 ${fs}px ${MONO}`
        c.fillStyle = ink(0.42)
        c.fillText(jar.share, x, top - fs * 1.1)
        c.font = `700 ${fs}px ${MONO}`
        c.fillStyle = full && show > 0.5 ? accent : ink(0.82)
        c.fillText(jar.label, x, baseY + fs * 2)
        c.font = `500 ${fs * 0.92}px ${MONO}`
        c.fillStyle = ink(0.45)
        c.fillText(`${Math.round(landed * show)} / ${jar.coins}`, x, baseY + fs * 3.6)
      })

      // ---- the coins: in the air as a coin, in the jar as its edge ----
      DEAL.forEach((jar, k) => {
        const p = (T - (FIRST + k * EVERY)) / FLIGHT
        if (p <= 0) return
        const tx = jarX(jar)
        const ty = slotY(SLOT[k])
        c.fillStyle = accent
        if (p >= 1) {
          // a small squash as it lands
          const squash = 1 + bell((p - 1) / 0.45) * 0.14
          const cw = coinW * squash
          const ch = coinH / squash
          c.globalAlpha = show
          c.beginPath()
          c.roundRect(tx - cw / 2, ty + coinH / 2 - ch, cw, ch, ch / 2)
          c.fill()
          c.globalAlpha = show * 0.3
          c.fillStyle = '#fff'
          c.beginPath()
          c.roundRect(tx - cw / 2 + ch * 0.5, ty + coinH / 2 - ch + ch * 0.22, cw * 0.34, ch * 0.16, ch * 0.08)
          c.fill()
        } else {
          const rr = Math.max(7, coinH * 0.62)
          const sx = dotX(k)
          const x = sx + (tx - sx) * p
          const y = srcY + (ty - srcY) * p * p
          c.globalAlpha = show
          c.beginPath()
          c.arc(x, y, rr, 0, Math.PI * 2)
          c.fill()
          c.fillStyle = '#1a1206'
          c.font = `800 ${rr * 1.15}px ${MONO}`
          c.textAlign = 'center'
          c.fillText('₹', x, y + 1)
        }
      })
      c.globalAlpha = 1

      // ---- what the round paid ----
      const paid = (T - CLEAR) / 1.4
      if (paid > 0 && paid < 1) {
        c.globalAlpha = bell(paid)
        c.font = `800 ${fs * 1.5}px ${MONO}`
        c.textAlign = 'center'
        c.fillStyle = ink(0.95)
        c.fillText('+50 XP', srcX, (srcY + baseY - jarH) / 2 + fs * 0.6 - ease(paid) * fs * 1.6)
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
      c.fillText('BUDGET BLITZ', 34, 25)

      // ---- level and experience ----
      const levelled = T > LEVEL
      const xp = levelled ? 1 - 0.9 * ease((T - LEVEL) / 0.45) : 0.58 + 0.42 * ease((T - CLEAR) / 0.9)
      const barW = Math.min(120, w * 0.22)
      const barX = w - 18 - barW
      c.fillStyle = ink(0.14)
      c.beginPath()
      c.roundRect(barX, 21, barW, 6, 3)
      c.fill()
      c.globalAlpha = show
      c.fillStyle = accent
      c.beginPath()
      c.roundRect(barX, 21, Math.max(6, barW * xp), 6, 3)
      c.fill()
      c.textAlign = 'right'
      c.fillStyle = ink(0.75)
      c.fillText(`LVL ${levelled ? 5 : 4}`, barX - 10, 25)
      const up = (T - LEVEL) / 1.8
      if (up > 0 && up < 1) {
        c.globalAlpha = bell(up)
        c.font = `700 ${fs}px ${MONO}`
        c.fillStyle = accent
        c.fillText('LEVEL UP', w - 18, 25 + fs * 2)
      }
      c.globalAlpha = 1
      c.textAlign = 'left'
      c.textBaseline = 'alphabetic'
    },
    [accent],
  )

  return (
    <canvas
      ref={useMotifCanvas(draw, undefined, 3.95)}
      className="motif-canvas"
      aria-label="A budgeting game round: coins of pocket money are dealt into needs, wants and savings"
    />
  )
}
