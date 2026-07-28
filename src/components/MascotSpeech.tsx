import { useEffect, useRef, useState } from 'react'
import { mascotState, sayQuip } from '../lib/mascotState'
import { useApp } from '../store'
import './MascotSpeech.css'

/**
 * The bot's voice. A DOM bubble that tracks his projected screen position
 * (written each frame by the 3D layer) and shows short, upbeat quips — a
 * greeting on arrival, then every so often, plus whatever he says on click.
 */
export default function MascotSpeech() {
  const entered = useApp((s) => s.entered)
  const ref = useRef<HTMLDivElement>(null)
  const [bubble, setBubble] = useState({ id: 0, text: '' })

  // one warm hello a beat after the bot pops in
  useEffect(() => {
    if (!entered) return
    const t = window.setTimeout(() => sayQuip('yo 👋'), 2800)
    return () => window.clearTimeout(t)
  }, [entered])

  useEffect(() => {
    if (!entered) return
    let raf = 0
    let shownId = 0
    let hideAt = 0
    let nextAuto = performance.now() + 13000
    const el = ref.current

    const loop = () => {
      const now = performance.now()

      if (now > nextAuto) {
        nextAuto = now + 16000 + Math.random() * 11000
        if (mascotState.onScreen && !mascotState.dragging && now > hideAt) sayQuip()
      }

      if (mascotState.quipId !== shownId) {
        shownId = mascotState.quipId
        setBubble({ id: shownId, text: mascotState.quip })
        hideAt = now + 3400
      }

      // hideAt starts at 0, so nothing shows until the first real quip
      const visible = mascotState.onScreen && !mascotState.dragging && now < hideAt
      if (el) {
        el.style.opacity = visible ? '1' : '0'
        el.style.transform = `translate(${mascotState.screenX}px, ${mascotState.screenY}px) translate(-50%, -100%)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [entered])

  if (!entered) return null

  return (
    <div ref={ref} className="mascot-speech" aria-hidden="true">
      <span key={bubble.id} className="mascot-speech-text">
        {bubble.text}
      </span>
    </div>
  )
}
