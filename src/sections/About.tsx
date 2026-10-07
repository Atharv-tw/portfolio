import { interests, person } from '../content/resume'
import Marquee from '../components/Marquee'
import RiseText from '../components/RiseText'
import ScrambleText from '../components/ScrambleText'
import './About.css'

export default function About() {
  return (
    <section id="about" data-section="about" data-env="0.06" className="section about">
      <div className="container">
        <div className="section-head">
          <ScrambleText as="p" className="mono-label" text="About — 001" />
          <RiseText as="h2" className="display-lg about-lead" text={person.aboutLead} />
          <div className="rule" />
        </div>

        <div className="about-grid">
          <div className="about-copy">
            {person.about.map((p) => (
              <p key={p.slice(0, 24)} className="body-lg">
                {p}
              </p>
            ))}
          </div>

          <aside className="about-side">
            {/* he sits on the top rule of the facts list */}
            <div className="about-seat" data-bot-seat="about" aria-hidden="true" />
            <dl className="about-facts">
              {person.aboutFacts.map((f) => (
                <div key={f.label} className="about-fact">
                  <dt className="mono-label">{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        <div className="about-interests" aria-label="Things I keep coming back to">
          <Marquee speed={30}>
            {interests.map((it) => (
              <span key={it} className="chip">
                {it}
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  )
}
