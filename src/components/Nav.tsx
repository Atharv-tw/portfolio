import { useEffect, useState } from 'react'
import { sections } from '../content/resume'
import { scrollToSection } from '../lib/smoothScroll'
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

export default function Nav() {
  const active = useApp((s) => s.section)
  const [time, setTime] = useState(() => clockFmt.format(new Date()))

  useEffect(() => {
    const id = window.setInterval(() => setTime(clockFmt.format(new Date())), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
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
        {sections
          .filter((s) => s.id !== 'hero')
          .map((s) => (
            <button
              key={s.id}
              className={`nav-link ${active === s.id ? 'is-active' : ''}`}
              onClick={() => scrollToSection(s.id)}
              data-sfx="click"
            >
              {s.label}
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
      </div>
    </header>
  )
}
