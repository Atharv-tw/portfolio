import type { ReactNode } from 'react'
import { outside } from '../content/resume'
import './Outside.css'

/** line art behind each tile, keyed by the item's id; an item without one just has no art */
const ART: Record<string, ReactNode> = {
  // three medals on their ribbons
  taekwondo: (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5">
      {[40, 100, 160].map((x, i) => (
        <g key={x}>
          <path d={`M${x - 12} 0 L${x} ${64 + i * 18} L${x + 12} 0`} />
          <circle cx={x} cy={96 + i * 18} r="30" />
          <circle cx={x} cy={96 + i * 18} r="20" />
        </g>
      ))}
    </svg>
  ),
  // half court: arc, key and hoop
  basketball: (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 200 V120 A90 90 0 0 1 190 120 V200" />
      <rect x="65" y="110" width="70" height="90" />
      <circle cx="100" cy="110" r="35" />
      <circle cx="100" cy="176" r="9" />
      <path d="M82 190 H118" />
    </svg>
  ),
}

/** The human bit. Small on purpose. */
export default function Outside() {
  return (
    <section id="outside" data-section="outside" data-env="0.97" className="section outside">
      <div className="container outside-grid">
        <header className="outside-head">
          <p className="mono-label">Outside the terminal</p>
          <h2 className="display-md">Away from the keyboard.</h2>
        </header>

        <ul className="outside-list">
          {outside.map((item, i) => (
            <li key={item.id} className="outside-tile">
              <span className="outside-art" aria-hidden="true">
                {ART[item.id]}
              </span>
              <span className="outside-top">
                <span className="mono-label outside-index">0{i + 1}</span>
                <span className="mono-label outside-label">{item.label}</span>
              </span>
              {/* the fact is the headline; the label only names it */}
              <span className="outside-note">{item.note || item.label}</span>
            </li>
          ))}
        </ul>

        <div className="outside-seat" data-bot-seat="outside" aria-hidden="true" />
      </div>
    </section>
  )
}
