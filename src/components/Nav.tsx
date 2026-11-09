import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { person, sections } from '../content/resume'
import { log } from '../content/log'
import { onProjectsPage } from '../lib/page'
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

/** `href` items are links: to the projects page, or, from there, back to a home-page section */
type NavItem = { id: string; label: string; log?: boolean; href?: string }

const items: NavItem[] = sections
  .filter((s) => s.nav)
  .map((s) => ({ id: s.id, label: s.label, href: onProjectsPage ? `/#${s.id}` : undefined }))
items.splice(items.findIndex((i) => i.id === 'work') + 1, 0, { id: 'projects', label: 'Projects', href: '/projects' })
if (hasLog) items.splice(items.length - 1, 0, { id: 'log', label: 'Log', log: true })

const sectionIds: readonly string[] = sections.map((s) => s.id)

export default function Nav() {
  const active = useApp((s) => s.section)
  const logOpen = useApp((s) => s.logOpen)
  const setLogOpen = useApp((s) => s.setLogOpen)
  const menuOpen = useApp((s) => s.menuOpen)
  const setMenuOpen = useApp((s) => s.setMenuOpen)
  const entered = useApp((s) => s.entered)
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

  // arriving at /#experience (from the projects page): go there once the preloader is out of the way
  useEffect(() => {
    if (onProjectsPage || !entered) return
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (sectionIds.includes(id)) scrollToSection(id)
  }, [entered])

  /** links leave the page by themselves; Projects on the projects page only goes back to the top */
  const follow = (e: React.MouseEvent, item: NavItem) => {
    setMenuOpen(false)
    if (item.id === 'projects' && onProjectsPage) {
      e.preventDefault()
      go(item)
    }
  }

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

  const isActive = (item: NavItem) => {
    if (item.log) return logOpen
    if (logOpen) return false
    return onProjectsPage ? item.id === 'projects' : active === item.id
  }

  return (
    <>
      <header className="nav">
        {onProjectsPage ? (
          <a className="nav-logo" href="/" aria-label="Home" data-sfx="click">
            AT<span>/</span>
          </a>
        ) : (
          <button
            className="nav-logo"
            onClick={() => scrollToSection('hero')}
            aria-label="Back to top"
            data-sfx="click"
          >
            AT<span>/</span>
          </button>
        )}

        <nav className="nav-links" aria-label="Sections">
          {items.map((item) =>
            item.href ? (
              <a
                key={item.id}
                className={`nav-link ${isActive(item) ? 'is-active' : ''}`}
                href={item.href}
                onClick={(e) => follow(e, item)}
                aria-current={isActive(item) ? 'page' : undefined}
                data-sfx="click"
              >
                {item.label}
              </a>
            ) : (
              <button
                key={item.id}
                className={`nav-link ${isActive(item) ? 'is-active' : ''}`}
                onClick={() => go(item)}
                data-sfx="click"
              >
                {item.label}
              </button>
            ),
          )}
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
              {items.map((item, i) => {
                const props = {
                  className: `mobile-menu-link ${isActive(item) ? 'is-active' : ''}`,
                  initial: { y: 34, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  transition: { delay: 0.05 + i * 0.05, ease: [0.16, 1, 0.3, 1] as const, duration: 0.5 },
                  'data-sfx': 'click',
                }
                const body = (
                  <>
                    <span className="mono-label mobile-menu-index">0{i + 1}</span>
                    {item.label}
                  </>
                )
                return item.href ? (
                  <motion.a key={item.id} {...props} href={item.href} onClick={(e) => follow(e, item)}>
                    {body}
                  </motion.a>
                ) : (
                  <motion.button key={item.id} {...props} onClick={() => go(item)}>
                    {body}
                  </motion.button>
                )
              })}
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
