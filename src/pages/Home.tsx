import { Link } from 'react-router-dom'
import { person, projects, stats } from '../content/site'
import Marquee from '../components/Marquee'
import Reveal from '../components/Reveal'

export default function Home() {
  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section className="hero grid-bg">
        <div className="shell hero__inner">
          <span className="hand hero__hand">my name is</span>

          <h1 className="display hero__name">{person.displayName}</h1>

          <div className="hero__meta">
            <span className="mono">{person.role}</span>
            <span className="mono">{person.location}</span>
          </div>

          <p className="hero__badge mono">{person.availability}</p>

          <p className="statement hero__statement">{person.statement}</p>

          <div className="hero__actions">
            <Link to="/work" className="btn">
              See the work
            </Link>
            <Link to="/contact" className="btn btn--ghost">
              Contact me
            </Link>
          </div>
        </div>
      </section>

      <Marquee text="FEATURED WORKS" />

      {/* ---------------------------------------------- Sticky-stack work */}
      <section className="section work grid-bg" id="work">
        <div className="shell">
          <div className="section-head">
            <span className="hand">explore my work!</span>
            <hr className="rule section-head__rule" />
            <span className="mono">{projects.length} products</span>
          </div>

          <p className="work__lede">
            Six products across security, health, fintech and outreach. Most started as a
            hackathon weekend and refused to stay one.
          </p>

          <div className="stack">
            {projects.map((p) => (
              <div
                className="stack__row"
                key={p.id}
                style={
                  {
                    '--accent': p.accent,
                    '--accent-ink': p.accentInk,
                  } as React.CSSProperties
                }
              >
                <div className="stack__pin">
                  <div className="stack__panel">
                    <span className="stack__index display">{p.index}</span>
                    <span className="mono stack__year">{p.year}</span>
                  </div>
                </div>

                <Reveal className="stack__body">
                  <span className="mono">{p.kind}</span>
                  <h3 className="stack__name display">{p.name}</h3>
                  <p className="stack__kicker">{p.kicker}</p>

                  <ul className="stack__bullets">
                    {p.bullets.slice(0, 2).map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>

                  <p className="stack__impact">{p.impact}</p>

                  <ul className="stack__tags">
                    {p.tech.slice(0, 5).map((t) => (
                      <li className="tag" key={t}>
                        {t}
                      </li>
                    ))}
                  </ul>

                  <Link to={`/work/${p.id}`} className="stack__cta mono">
                    Read the case study →
                  </Link>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Stats */}
      <section className="section stats grid-bg">
        <div className="shell">
          <div className="stats__grid">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 90} className="stats__item">
                <span className="stats__value display">{s.value}</span>
                <span className="stats__label">{s.label}</span>
                <span className="mono">{s.note}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Marquee text="LET'S TALK" direction="right" />

      {/* ------------------------------------------------------- Contact */}
      <section className="section cta grid-bg">
        <div className="shell cta__inner">
          <span className="hand">let's make something together</span>
          <p className="statement">
            Got a hard problem, an internship, or just want to say hi? I read every message.
          </p>
          <Link to="/contact" className="btn">
            Drop a line
          </Link>
        </div>
      </section>
    </>
  )
}
