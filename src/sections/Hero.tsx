import { person } from '../content/resume'
import Magnetic from '../components/Magnetic'
import ScrambleText from '../components/ScrambleText'
import { scrollToSection } from '../lib/smoothScroll'
import './Hero.css'

export default function Hero() {
  return (
    <section id="hero" data-section="hero" data-env="0" className="hero">
      <div className="container hero-inner">
        <div className="hero-top">
          <div className="hero-copy">
            <ScrambleText as="p" className="mono-label hero-kicker" text={person.role} delay={200} />
            <h1 className="display-xl hero-name">
              <span className="hero-mask has-field">
                <span className="hero-line hero-line-1">Atharv</span>
              </span>
              <span className="hero-mask">
                <span className="hero-line hero-line-2">Tiwari</span>
              </span>
            </h1>
          </div>
          {/* the bot stands in this box — size and place it here, he follows */}
          <div className="hero-stage" data-bot-seat="hero" aria-hidden="true" />
        </div>

        <div className="hero-foot">
          <div className="hero-pitch">
            <p className="body-lg hero-sub">{person.heroSub}</p>
            <div className="hero-actions">
              <Magnetic>
                <button className="btn btn-solid" onClick={() => scrollToSection('work')}>
                  View work ↓
                </button>
              </Magnetic>
              <Magnetic>
                <a className="btn" href={person.resumePdf} download="Atharv-Tiwari-Resume.pdf">
                  Résumé
                </a>
              </Magnetic>
              <span className="hero-links">
                <a className="mono-label" href={person.github.url} target="_blank" rel="noreferrer">
                  GitHub ↗
                </a>
                <a className="mono-label" href={person.linkedin.url} target="_blank" rel="noreferrer">
                  LinkedIn ↗
                </a>
              </span>
            </div>
          </div>

          <dl className="hero-proof">
            {person.heroProof.map((f) => (
              <div key={f.label} className="hero-proof-item">
                <dt className="mono-label">{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
