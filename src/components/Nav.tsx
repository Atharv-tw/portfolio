import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { person, nav } from '../content/site'

export default function Nav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // Close the mobile sheet whenever the route changes.
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="nav">
      <div className="nav__inner shell">
        <Link to="/" className="nav__brand">
          <span className="nav__mark" aria-hidden="true" />
          {person.name}
        </Link>

        <nav className={`nav__links ${open ? 'is-open' : ''}`} aria-label="Primary">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/contact" className="nav__cta">
            Contact
          </Link>
        </nav>

        <button
          className="nav__toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
