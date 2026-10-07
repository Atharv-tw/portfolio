import { useEffect, useRef, useState } from 'react'
import { archive, type Project } from '../content/resume'
import Motif from '../components/motifs/Motif'
import { useIsTouch, usePrefersReducedMotion } from '../lib/hooks'
import { useApp } from '../store'
import './Archive.css'

/** how far from the pointer the preview sits: clear of the cursor's own ring */
const OFFSET = 44
const EDGE = 12
/** air between the preview and the words either side of it */
const GUTTER = 28

/**
 * The rest of the work: an archive, not a second showcase. Plain rows; a small
 * preview keeps the pointer company while it is over one, and nothing more.
 */
export default function Archive() {
  const setCaseOpenId = useApp((s) => s.setCaseOpenId)
  const touch = useIsTouch()
  const reduced = usePrefersReducedMotion()

  // `shown` stays mounted while it fades out; `on` is whether it is visible
  const [shown, setShown] = useState<Project | null>(null)
  const [on, setOn] = useState(false)
  const floatRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const lane = useRef<{ min: number; max: number } | null>(null)
  const want = useRef({ x: 0, y: 0 })
  const at = useRef({ x: 0, y: 0, placed: false })
  const leaving = useRef(0)

  /**
   * Where the preview may sit so that it covers no words: the empty stretch of
   * the rows, between the end of the longest line and the OPEN labels. Null
   * when that stretch is too narrow to hold it.
   */
  const measure = () => {
    const list = listRef.current
    const el = floatRef.current
    if (!list || !el) return
    const range = document.createRange()
    let text = 0
    list.querySelectorAll('.archive-statement, .archive-kind').forEach((n) => {
      range.selectNodeContents(n)
      text = Math.max(text, range.getBoundingClientRect().right)
    })
    let go = Infinity
    list.querySelectorAll('.archive-go').forEach((n) => {
      go = Math.min(go, n.getBoundingClientRect().left)
    })
    const min = text + GUTTER
    const max = go - GUTTER - el.offsetWidth
    lane.current = max >= min ? { min, max } : null
  }

  /** aim the preview beside a point: in the empty lane when there is one, else next to the pointer */
  const aim = (x: number, y: number) => {
    const el = floatRef.current
    const w = el?.offsetWidth ?? 360
    const h = el?.offsetHeight ?? 306
    const vw = document.documentElement.clientWidth
    const free = lane.current
    const left = free
      ? Math.min(free.max, Math.max(free.min, x + OFFSET))
      : x + OFFSET + w > vw - EDGE
        ? x - OFFSET - w
        : x + OFFSET
    const top = Math.min(window.innerHeight - h - EDGE, Math.max(EDGE, y - h / 2))
    want.current = { x: Math.max(EDGE, left), y: top }
  }

  const show = (p: Project) => {
    window.clearTimeout(leaving.current)
    setShown(p)
    setOn(true)
  }

  const hide = () => {
    setOn(false)
    window.clearTimeout(leaving.current)
    leaving.current = window.setTimeout(() => {
      setShown(null)
      at.current.placed = false
    }, 260)
  }

  // follow the pointer with a little lag, so it reads as trailing rather than glued on
  const live = shown !== null
  useEffect(() => {
    if (!live) return
    let raf = 0
    const step = () => {
      const p = at.current
      const t = want.current
      if (!p.placed || reduced) {
        p.x = t.x
        p.y = t.y
        p.placed = true
      } else {
        p.x += (t.x - p.x) * 0.2
        p.y += (t.y - p.y) * 0.2
      }
      if (floatRef.current) floatRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
      raf = requestAnimationFrame(step)
    }
    step()
    return () => cancelAnimationFrame(raf)
  }, [live, reduced])

  useEffect(() => () => window.clearTimeout(leaving.current), [])

  if (archive.length === 0) return null

  return (
    <section id="archive" data-section="archive" data-env="0.86" className="section archive">
      <div className="container">
        <header className="archive-head">
          <p className="mono-label">More work</p>
          <h2 className="display-md">Also built.</h2>
        </header>

        <ul
          ref={listRef}
          className="archive-list"
          onPointerEnter={measure}
          onPointerMove={(e) => {
            if (e.pointerType !== 'touch') aim(e.clientX, e.clientY)
          }}
          onPointerLeave={hide}
        >
          {archive.map((p) => (
            <li key={p.id}>
              <button
                className={`archive-row ${on && shown?.id === p.id ? 'is-active' : ''}`}
                style={{ ['--project-accent' as string]: p.accent }}
                onClick={() => {
                  hide()
                  setCaseOpenId(p.id)
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'touch') return
                  if (!shown) measure()
                  aim(e.clientX, e.clientY)
                  show(p)
                }}
                onFocus={(e) => {
                  // keyboard: there is no pointer to follow, so it sits over the quiet end of the row
                  if (!e.currentTarget.matches(':focus-visible') || e.currentTarget.hasAttribute('data-quiet-focus')) return
                  const r = e.currentTarget.getBoundingClientRect()
                  measure()
                  aim(r.left + r.width * 0.56, r.top + r.height / 2)
                  show(p)
                }}
                onBlur={hide}
                data-cursor="open"
              >
                <span className="mono-label archive-index">{p.index}</span>
                <span className="archive-title">
                  <span className="archive-name">{p.name}</span>
                  <span className="archive-statement">{p.statement}</span>
                </span>
                <span className="mono-label archive-kind">
                  {p.kind}
                  {p.year && ` — ${p.year}`}
                </span>
                <span className="mono-label archive-go">
                  Open <span aria-hidden="true">↗</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* a pointer has to exist for this to have anywhere to be */}
      {!touch && (
        <div
          ref={floatRef}
          className={`archive-float env-dark ${on ? 'is-on' : ''}`}
          style={
            shown
              ? { ['--project-accent' as string]: shown.accent, ['--project-stage' as string]: shown.stage }
              : undefined
          }
          aria-hidden="true"
        >
          <div className="archive-float-stage">{shown && <Motif key={shown.id} project={shown} />}</div>
        </div>
      )}
    </section>
  )
}
