import { useEffect, useRef, useState } from 'react'
import { getMusicAnalyser, isMusicPlaying, onMusicChange, toggleMusic } from '../audio/music'
import { useApp } from '../store'
import './MusicPlayer.css'

const BARS = 22
// cyan → pink → amber, sampled per bar for an energetic but on-brand spectrum
const STOPS: Array<[number, number, number]> = [
  [0, 229, 255],
  [255, 77, 157],
  [255, 177, 20],
]

function sample(f: number): string {
  const x = Math.min(0.999, Math.max(0, f)) * (STOPS.length - 1)
  const i = Math.floor(x)
  const t = x - i
  const a = STOPS[i]
  const b = STOPS[Math.min(STOPS.length - 1, i + 1)]
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const bl = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r},${g},${bl})`
}

export default function MusicPlayer() {
  const entered = useApp((s) => s.entered)
  const [playing, setPlaying] = useState(isMusicPlaying())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const data = useRef(new Uint8Array(64))
  const smooth = useRef<number[]>(Array(BARS).fill(0))

  useEffect(() => onMusicChange(setPlaying), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const c = canvas.getContext('2d')!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = 132
    const H = 26
    canvas.width = W * dpr
    canvas.height = H * dpr
    c.scale(dpr, dpr)

    let raf = 0
    const gap = 2
    const bw = (W - gap * (BARS - 1)) / BARS

    const render = (t: number) => {
      c.clearRect(0, 0, W, H)
      const analyser = getMusicAnalyser()
      const on = isMusicPlaying()
      if (on && analyser) analyser.getByteFrequencyData(data.current)

      for (let i = 0; i < BARS; i++) {
        let target: number
        if (on && analyser) {
          const v = data.current[Math.floor((i / BARS) * 46) + 1] / 255
          target = Math.max(0.06, v * v * 1.3)
        } else {
          // idle: a slow breathing wave so it never looks dead
          target = 0.1 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.002 + i * 0.5))
        }
        smooth.current[i] += (target - smooth.current[i]) * (on ? 0.35 : 0.08)
        const h = Math.max(1.5, smooth.current[i] * H)
        c.fillStyle = sample(i / (BARS - 1))
        const x = i * (bw + gap)
        const r = Math.min(bw / 2, 1.4)
        c.beginPath()
        c.roundRect(x, (H - h) / 2, bw, h, r)
        c.fill()
      }
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!entered) return null

  return (
    <div className={`music-player ${playing ? 'is-playing' : ''}`}>
      <button
        className="music-btn"
        onClick={toggleMusic}
        aria-pressed={playing}
        aria-label={playing ? 'Pause music' : 'Play music'}
        data-sfx="none"
      >
        {playing ? (
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
          </svg>
        )}
      </button>
      <div className="music-meta">
        <span className="music-title mono-label">
          {playing ? 'now playing' : 'a little vibe?'}
        </span>
        <canvas ref={canvasRef} className="music-viz" aria-hidden="true" />
      </div>
      <span className="music-track mono-label">lofi · generative</span>
    </div>
  )
}
