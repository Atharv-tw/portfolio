import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { log, type LogEntry } from '../content/log'
import { lockScroll, unlockScroll } from '../lib/smoothScroll'
import { sfx } from '../audio/synth'
import { useApp } from '../store'
import './LogOverlay.css'

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const entries = [...log].sort((a, b) => b.date.localeCompare(a.date))

function Entry({ entry }: { entry: LogEntry }) {
  return (
    <li className="log-entry">
      <time className="mono-label log-date" dateTime={entry.date}>
        {dateFmt.format(new Date(entry.date + 'T00:00:00'))}
      </time>
      <div className="log-body">
        <span className="mono-label log-kind">{entry.kind}</span>
        <h3 className="log-title">{entry.title}</h3>
        {entry.body && <p className="log-text">{entry.body}</p>}
        {entry.link && (
          <a className="mono-label log-link" href={entry.link.href} target="_blank" rel="noreferrer">
            {entry.link.label} ↗
          </a>
        )}
      </div>
    </li>
  )
}

/**
 * LOG — field notes, opened from the nav. A sheet of paper over the page, on
 * purpose: it is a notebook, and nobody has to walk through it to see the work.
 * Entries come from src/content/log.ts.
 */
export default function LogOverlay() {
  const open = useApp((s) => s.logOpen)
  const setOpen = useApp((s) => s.setLogOpen)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    lockScroll()
    sfx.whoosh()
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      unlockScroll()
      returnFocus?.focus({ preventScroll: true })
    }
  }, [open, setOpen])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="log-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => setOpen(false)}
        >
          <motion.aside
            className="log-sheet env-light"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-title"
          >
            <header className="log-head">
              <div>
                <p className="mono-label">Field notes</p>
                <h2 id="log-title" className="log-heading">
                  Build log
                </h2>
              </div>
              <button ref={closeRef} className="log-close" onClick={() => setOpen(false)} aria-label="Close log">
                <span className="mono-label">Esc</span>
                <span aria-hidden="true">✕</span>
              </button>
            </header>

            <div className="log-scroll" data-lenis-prevent>
              <p className="log-intro">Things I have built, researched, fixed, tried or learned. Newest first.</p>

              {entries.length > 0 ? (
                <ol className="log-list">
                  {entries.map((e) => (
                    <Entry key={e.date + e.title} entry={e} />
                  ))}
                </ol>
              ) : (
                import.meta.env.DEV && (
                  // layout preview only — these rows never reach a production build
                  <ol className="log-list is-skeleton" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <li key={i} className="log-entry">
                        <span className="log-bone" style={{ width: '5.5rem' }} />
                        <div className="log-body">
                          <span className="log-bone" style={{ width: '4rem' }} />
                          <span className="log-bone is-title" style={{ width: `${62 - i * 9}%` }} />
                          <span className="log-bone" style={{ width: '92%' }} />
                          <span className="log-bone" style={{ width: `${70 - i * 6}%` }} />
                        </div>
                      </li>
                    ))}
                    <li className="log-devnote mono-label">No entries yet — add them in src/content/log.ts</li>
                  </ol>
                )
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
