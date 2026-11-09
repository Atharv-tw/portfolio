import { useEffect, useRef, useState } from 'react'
import { person } from '../content/resume'
import { sfx } from '../audio/synth'
import { botScreen } from '../lib/scrollState'
import { usePrefersReducedMotion } from '../lib/hooks'
import { useApp } from '../store'
import './Speech.css'

const TYPE_MS = 30
const HOLD_MS = 1500
const GAP = 14

/**
 * The bot's speech bubble in the hero. It types his lines one after the other
 * (his mouth moves while it does) and follows his head round the screen. The
 * whole text is in the page from the start for screen readers; the typing is
 * only for the eyes. Click it to hear it again.
 */
export default function Speech() {
  const lines: readonly string[] = person.heroSays
  const entered = useApp((s) => s.entered)
  const setTalking = useApp((s) => s.setBotTalking)
  const reduced = usePrefersReducedMotion()
  const [line, setLine] = useState(0)
  const [shown, setShown] = useState(0)
  const [run, setRun] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  // type it out, line by line
  useEffect(() => {
    if (!entered || lines.length === 0) return
    if (reduced) {
      setLine(lines.length - 1)
      setShown(lines[lines.length - 1].length)
      return
    }
    let cancelled = false
    const timers: number[] = []
    const wait = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)))
    ;(async () => {
      await wait(run === 0 ? 1600 : 0)
      for (let i = 0; i < lines.length && !cancelled; i++) {
        setLine(i)
        setShown(0)
        setTalking(true)
        for (let c = 1; c <= lines[i].length && !cancelled; c++) {
          setShown(c)
          if (c % 2 === 0 && lines[i][c - 1] !== ' ') sfx.blip()
          await wait(lines[i][c - 1] === ',' || lines[i][c - 1] === ':' ? TYPE_MS * 6 : TYPE_MS)
        }
        setTalking(false)
        if (i < lines.length - 1) await wait(HOLD_MS)
      }
    })()
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      setTalking(false)
    }
  }, [entered, reduced, run, lines, setTalking])

  // follow his head: beside it when there is room, above it when there is not
  useEffect(() => {
    let raf = 0
    const step = () => {
      const el = ref.current
      if (el) {
        const on = botScreen.visible && botScreen.scene === 'hero'
        el.classList.toggle('is-on', on && entered)
        if (on) {
          const w = el.offsetWidth
          const h = el.offsetHeight
          let x = botScreen.x - botScreen.r - GAP - w
          let y = botScreen.y - botScreen.r * 1.05 - h * 0.35
          let side = 'left'
          if (x < 16) {
            x = Math.min(window.innerWidth - w - 16, Math.max(16, botScreen.x - w / 2))
            y = botScreen.y - botScreen.r * 1.25 - h - GAP
            side = 'top'
          }
          el.dataset.side = side
          el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(Math.max(72, y))}px, 0)`
        }
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [entered])

  if (lines.length === 0) return null
  const text = lines[line] ?? ''

  return (
    <div ref={ref} className="speech" onClick={() => setRun((r) => r + 1)} data-cursor="open">
      <p className="sr-only">{lines.join(' ')}</p>
      <p className="speech-text" aria-hidden="true">
        {text.slice(0, shown)}
        <span className="speech-rest">{text.slice(shown)}</span>
      </p>
    </div>
  )
}
