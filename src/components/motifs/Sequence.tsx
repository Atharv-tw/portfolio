import { useCallback } from 'react'
import { useMotifCanvas, type MotifCtx } from './useMotifCanvas'

const MONO = '"JetBrains Mono Variable", monospace'
const ink = (a: number) => `rgba(244,244,246,${a})`

const DAY = 0.55 // one business day
const SEND1 = 1.1 // the first email is sent
const SEND2 = SEND1 + 0.5 + 3 * DAY // the follow-up, three business days later
const REPLY = SEND2 + 0.5 + 2 * DAY // they answer two days after that
const LOOP = REPLY + 4.2

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => {
  const k = clamp(x)
  return k * k * (3 - 2 * k)
}
const bell = (x: number) => Math.sin(clamp(x) * Math.PI)

/**
 * Outreach — one person's sequence: an email, a follow-up three business days
 * later, then a reply, which cancels the third for good. Illustrative only.
 */
export default function Sequence({ accent = '#8f8cff' }: { accent?: string }) {
  const draw = useCallback(
    ({ c, w, h, t }: MotifCtx) => {
      const T = t % LOOP
      const fs = Math.max(9, Math.min(11.5, Math.min(w, h) * 0.023))
      const show = Math.min(ease(T / 0.5), 1 - ease((T - (LOOP - 0.6)) / 0.5))
      const replied = T >= REPLY

      c.textBaseline = 'middle'
      c.font = `600 ${fs}px ${MONO}`

      // ---- the email on the desk: a draft, then the follow-up, then their answer ----
      const cardX = w * 0.1
      const cardW = w * 0.8
      const cardY = h * 0.19
      const cardH = h * 0.32
      const which = replied ? 2 : T >= SEND1 + 0.7 ? 1 : 0
      const born = [0, SEND1 + 0.7, REPLY][which]
      const sentAt = [SEND1, SEND2, Infinity][which]
      const sent = T >= sentAt
      const inAlpha = ease((T - born) / 0.35) * (which === 0 ? show : 1) * (replied ? show : 1)

      c.globalAlpha = inAlpha
      c.fillStyle = which === 2 ? accent : ink(1)
      c.globalAlpha = inAlpha * (which === 2 ? 0.1 : 0.035)
      c.beginPath()
      c.roundRect(cardX, cardY, cardW, cardH, 12)
      c.fill()
      c.globalAlpha = inAlpha * (which === 2 ? 0.7 : sent ? 0.3 : 0.5)
      c.strokeStyle = which === 2 ? accent : ink(0.6)
      c.lineWidth = 1.2
      c.stroke()

      // who it is to, and what state it is in
      const px = cardX + cardW * 0.06
      const row = cardH / 5
      c.globalAlpha = inAlpha
      c.textAlign = 'left'
      c.fillStyle = ink(0.45)
      c.fillText(which === 2 ? 'FROM' : 'TO', px, cardY + row * 0.95)
      c.fillStyle = ink(0.75)
      c.beginPath()
      c.roundRect(px + fs * 3.6, cardY + row * 0.95 - fs * 0.32, cardW * 0.26, fs * 0.64, 2)
      c.fill()
      const chip = which === 2 ? 'REPLY' : sent ? 'SENT' : which === 1 ? 'FOLLOW-UP' : 'DRAFT'
      const chipW = c.measureText(chip).width + fs * 1.6
      const chipX = cardX + cardW - cardW * 0.06 - chipW
      c.strokeStyle = which === 2 || sent ? accent : ink(0.4)
      c.fillStyle = which === 2 || sent ? accent : ink(0.7)
      c.beginPath()
      c.roundRect(chipX, cardY + row * 0.95 - fs * 1.05, chipW, fs * 2.1, fs * 1.05)
      c.stroke()
      c.textAlign = 'center'
      c.fillText(chip, chipX + chipW / 2, cardY + row * 0.95 + 1)

      // the body, written line by line; the opening line is the hook, the personal part
      const lines = which === 0 ? [0.92, 0.84, 0.6] : which === 1 ? [0.7, 0.46] : [0.8, 0.52]
      lines.forEach((len, l) => {
        const grow = ease((T - born - 0.15 - l * 0.22) / 0.4)
        const y = cardY + row * (2.15 + l * 0.95)
        const full = (cardW * 0.88) * len
        c.globalAlpha = inAlpha * (sent ? 0.45 : 1)
        if (l === 0 && which !== 2) {
          c.fillStyle = accent
          c.beginPath()
          c.roundRect(px, y - fs * 0.32, Math.min(full * 0.42, full * grow), fs * 0.64, 2)
          c.fill()
          if (grow > 0.42) {
            c.fillStyle = ink(0.6)
            c.beginPath()
            c.roundRect(px + full * 0.42 + 4, y - fs * 0.32, full * (grow - 0.42) - 4, fs * 0.64, 2)
            c.fill()
          }
        } else {
          c.fillStyle = ink(0.6)
          c.beginPath()
          c.roundRect(px, y - fs * 0.32, full * grow, fs * 0.64, 2)
          c.fill()
        }
      })
      c.globalAlpha = 1

      // ---- the sequence: three slots, three business days apart ----
      const ty = h * 0.69
      const nx = [w * 0.16, w * 0.5, w * 0.84]
      const r = Math.max(10, Math.min(15, w * 0.034))
      const sentN = [T >= SEND1, T >= SEND2, false]

      c.strokeStyle = ink(0.18)
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(nx[0], ty)
      c.lineTo(nx[2], ty)
      c.stroke()

      // business days between the slots, lit as they pass
      const starts = [SEND1 + 0.5, SEND2 + 0.5]
      for (let g = 0; g < 2; g++) {
        for (let d = 0; d < 3; d++) {
          const x = nx[g] + ((nx[g + 1] - nx[g]) * (d + 1)) / 4
          const passed = T >= starts[g] + d * DAY && !(g === 1 && d === 2)
          c.fillStyle = passed ? ink(0.85 * show + 0.25 * (1 - show)) : ink(0.25)
          c.fillRect(x - 0.75, ty - 5, 1.5, 10)
        }
        c.textAlign = 'center'
        c.fillStyle = ink(0.4)
        c.fillText('3 BUSINESS DAYS', (nx[g] + nx[g + 1]) / 2, ty + r + fs * 1.5)
      }

      // the reply lands in the second gap and ends it there
      const rx = nx[1] + ((nx[2] - nx[1]) * 2.5) / 4
      if (replied) {
        const land = ease((T - REPLY) / 0.45)
        c.globalAlpha = land * show
        c.strokeStyle = ink(0.9)
        c.fillStyle = ink(0.95)
        c.lineWidth = 1.5
        c.beginPath()
        c.moveTo(rx, cardY + cardH + 4)
        c.lineTo(rx, cardY + cardH + 4 + (ty - 9 - cardY - cardH - 4) * land)
        c.stroke()
        c.beginPath()
        c.arc(rx, ty, 4.5, 0, Math.PI * 2)
        c.fill()
        const ring = (T - REPLY) / 0.9
        if (ring > 0 && ring < 1) {
          c.globalAlpha = bell(ring) * 0.7
          c.beginPath()
          c.arc(rx, ty, 5 + ring * 16, 0, Math.PI * 2)
          c.stroke()
        }
        c.globalAlpha = 1
      }

      nx.forEach((x, i) => {
        const on = sentN[i]
        const dead = i === 2 && replied
        c.fillStyle = '#0d0b18'
        c.beginPath()
        c.arc(x, ty, r, 0, Math.PI * 2)
        c.fill()
        if (on) {
          c.globalAlpha = 0.25 + 0.75 * show
          c.fillStyle = accent
          c.fill()
          c.globalAlpha = 1
        } else {
          c.strokeStyle = dead ? ink(0.28) : accent
          c.globalAlpha = dead ? 1 : 0.75
          c.lineWidth = 1.4
          c.setLineDash(dead ? [] : [3, 4])
          c.stroke()
          c.setLineDash([])
          c.globalAlpha = 1
        }
        c.textAlign = 'center'
        c.font = `800 ${r * 0.95}px ${MONO}`
        c.fillStyle = on && show > 0.5 ? '#0d0b18' : dead ? ink(0.3) : ink(0.8)
        c.fillText(String(i + 1), x, ty + 1)
        if (dead) {
          const cut = ease((T - REPLY - 0.35) / 0.35) * show
          c.strokeStyle = ink(0.75)
          c.lineWidth = 1.6
          c.beginPath()
          c.moveTo(x - r * 1.15, ty + r * 1.15)
          c.lineTo(x - r * 1.15 + r * 2.3 * cut, ty + r * 1.15 - r * 2.3 * cut)
          c.stroke()
        }
        c.font = `600 ${fs}px ${MONO}`
        c.fillStyle = on && show > 0.5 ? accent : ink(0.45)
        c.fillText(on && show > 0.5 ? 'SENT' : dead && show > 0.5 ? 'CANCELLED' : 'SCHEDULED', x, ty - r - fs * 1.2)
      })

      // ---- key ----
      c.textAlign = 'left'
      c.fillStyle = accent
      c.beginPath()
      c.arc(22, 24, 4.5, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = ink(0.7)
      c.fillText('AT MOST 3 EMAILS TO ONE PERSON, EVER', 34, 25)

      // ---- where things stand ----
      const state = replied && show > 0.5 ? 'THEY REPLIED  ·  SEQUENCE ENDED' : T >= SEND1 ? 'WAITING, NOT CHASING' : 'NOTHING SENDS UNTIL YOU SEND IT'
      c.fillStyle = replied && show > 0.5 ? accent : ink(0.55)
      c.beginPath()
      c.arc(25, h - 26, 3, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = replied && show > 0.5 ? ink(0.92) : ink(0.55)
      c.fillText(state, 35, h - 25)
      c.textBaseline = 'alphabetic'
    },
    [accent],
  )

  return (
    <canvas
      ref={useMotifCanvas(draw, undefined, REPLY + 1.3)}
      className="motif-canvas"
      aria-label="An email sequence: one email, a follow-up three business days later, then a reply that cancels the third"
    />
  )
}
