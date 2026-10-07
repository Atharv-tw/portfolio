import { useRef, useState } from 'react'
import { person } from '../content/resume'
import Magnetic from '../components/Magnetic'
import RiseText from '../components/RiseText'
import { sfx } from '../audio/synth'
import './Contact.css'

export default function Contact() {
  const [copied, setCopied] = useState(false)
  const revertTimer = useRef(0)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(person.email)
      sfx.success()
      setCopied(true)
      window.clearTimeout(revertTimer.current)
      revertTimer.current = window.setTimeout(() => setCopied(false), 2200)
    } catch {
      // clipboard blocked → fall back to the mail app
      window.location.href = `mailto:${person.email}`
    }
  }

  return (
    <section id="contact" data-section="contact" data-env="1" className="section contact">
      <div className="container contact-inner">
        <div className="contact-top">
          <p className="mono-label contact-label">Next — 005</p>
          <RiseText as="h2" className="contact-heading" text="Let's build something." />
          <div className="contact-seat" data-bot-seat="contact" aria-hidden="true" />
        </div>

        <div className="contact-open">
          <span className="mono-label">Open to</span>
          <ul className="chip-row">
            {person.openTo.map((o) => (
              <li key={o} className="chip">
                {o}
              </li>
            ))}
          </ul>
        </div>

        <button
          className={`contact-email ${copied ? 'is-copied' : ''}`}
          onClick={copyEmail}
          data-sfx="none"
          data-cursor="copy"
          aria-label={`Copy email address ${person.email}`}
        >
          <span className="contact-email-text">{person.email}</span>
          <span className="mono-label contact-email-hint" aria-live="polite">
            {copied ? 'Copied ✓' : 'Click to copy'}
          </span>
        </button>

        <div className="contact-actions">
          <Magnetic strength={0.25}>
            <a className="btn btn-solid" href={`mailto:${person.email}`}>
              Email ↗
            </a>
          </Magnetic>
          <Magnetic strength={0.25}>
            <a className="btn" href={person.resumePdf} download="Atharv-Tiwari-Resume.pdf">
              Résumé ↓
            </a>
          </Magnetic>
          <Magnetic strength={0.25}>
            <a className="btn" href={person.github.url} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          </Magnetic>
          <Magnetic strength={0.25}>
            <a className="btn" href={person.linkedin.url} target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
          </Magnetic>
        </div>

        <footer className="contact-footer">
          <div className="mono-label">
            © 2026 {person.name} — {person.location}
          </div>
          <div className="mono-label">
            built with React · Three.js · too much chai — press <kbd>Ctrl K</kbd>
          </div>
        </footer>
      </div>
    </section>
  )
}
