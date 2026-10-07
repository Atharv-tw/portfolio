import { outside } from '../content/resume'
import './Outside.css'

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
            <li key={item.id} className="outside-item">
              <span className="mono-label outside-index">0{i + 1}</span>
              <span className="outside-label">{item.label}</span>
              {item.note && <span className="outside-note">{item.note}</span>}
            </li>
          ))}
        </ul>

        <div className="outside-seat" data-bot-seat="outside" aria-hidden="true" />
      </div>
    </section>
  )
}
