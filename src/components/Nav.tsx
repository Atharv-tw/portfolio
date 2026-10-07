import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { person, sections } from '../content/resume'
import { log } from '../content/log'
import { lockScroll, scrollToSection, unlockScroll } from '../lib/smoothScroll'
import { sfx } from '../audio/synth'
import { useApp } from '../store'
import SoundToggle from './SoundToggle'
import './Nav.css'

const clockFmt = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Kolkata',
})

/** LOG is a side door, not a section: it only shows once there is something in it (always, while developing). */
export const hasLog = log.length > 0 || import.meta.env.DEV

type NavItem = { id: string; label: string; log?: boolean }

const items: NavItem[] = sections.filter((s) => s.nav).map((s) => ({ id: s.id, label: s.label }))
if (hasLog) items.splice(items.length - 1, 0, { id: 'log', label: 'Log', log: true })

export default function Nav() {
  const active = useApp((s) => s.section)
  const logOpen = useApp((s) => s.logOpen)
  const setLogOpen = useApp((s) => s.setLogOpen)
  const menuOpen = useApp((s) => s.menuOpen)
  const setMenuOpen = useApp((s) => s.setMenuOpen)
  const [time, setTime] = useState(() => clockFmt.format(new Date()))

  useEffect(() => {
    const id = window.setInterval(() => setTime(clockFmt.format(new Date())), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    lockScroll()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      unlockScroll()
    }
  }, [menuOpen, setMenuOpen])

  const go = (item: NavItem) => {
    const wasMenu = menuOpen
    setMenuOpen(false)
    // wait one tick so unlockScroll runs before the scroll (or the next lock) starts
    window.setTimeout(
      () => {
        if (item.log) setLogOpen(true)
        else scrollToSection(item.id)
      },
      wasMenu ? 40 : 0,
    )
  }

  const isActive = (item: NavItem) => (item.log ? logOpen : !logOpen && active === item.id)

  return (
    <>
      <header className="nav">
        <button
          className="nav-logo"
          onClick={() => scrollToSection('hero')}
          aria-label="Back to top"
          data-sfx="click"
        >
          AT<span>/</span>
        </button>

        <nav className="nav-links" aria-label="Sections">
          {items.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${isActive(item) ? 'is-active' : ''}`}
              onClick={() => go(item)}
              data-sfx="click"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="nav-right">
          <span className="nav-clock mono-label" title="New Delhi time">
            DEL {time} IST
          </span>
          <button
            className="nav-kbd mono-label"
            onClick={() => useApp.getState().setPaletteOpen(true)}
            aria-label="Open command palette"
            title="Command palette"
          >
            ⌘K
          </button>
          <SoundToggle />
          <button
            className={`nav-burger ${menuOpen ? 'is-open' : ''}`}
            onClick={() => {
              setMenuOpen(!menuOpen)
              sfx.whoosh()
            }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            data-sfx="none"
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            role="dialog"
            aria-label="Menu"
          >
            <nav className="mobile-menu-links" aria-label="Sections">
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  className={`mobile-menu-link ${isActive(item) ? 'is-active' : ''}`}
                  initial={{ y: 34, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.05, ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
                  onClick={() => go(item)}
                  data-sfx="click"
                >
                  <span className="mono-label mobile-menu-index">0{i + 1}</span>
                  {item.label}
                </motion.button>
              ))}
            </nav>
            <motion.div
              className="mobile-menu-foot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <a href={person.github.url} target="_blank" rel="noreferrer" className="mono-label">
                GitHub ↗
              </a>
              <a href={person.linkedin.url} target="_blank" rel="noreferrer" className="mono-label">
                LinkedIn ↗
              </a>
              <a href={`mailto:${person.email}`} className="mono-label">
                Email ↗
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
