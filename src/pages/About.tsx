import { person, principles, experience, timeline, interests } from '../content/site'
import Marquee from '../components/Marquee'
import Reveal from '../components/Reveal'

const sections = [
  { id: 'bio', label: 'Main bio' },
  { id: 'story', label: 'How I work' },
  { id: 'roles', label: 'Roles' },
  { id: 'wins', label: 'Journey' },
]

export default function About() {
  return (
    <>
      <section className="page-head grid-bg">
        <div className="shell">
          <span className="hand">about me!</span>
          <h1 className="display page-head__title">ABOUT</h1>
          <p className="mono">{person.role} · {person.location}</p>
        </div>
      </section>

      <div className="shell about">
        {/* Sticky index, hidden on narrow screens */}
        <aside className="about__index">
          <nav aria-label="Sections">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="mono about__index-link">
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="about__body">
          <section id="bio" className="about__block">
            <h2 className="mono about__kicker">Main bio</h2>
            {person.about.map((para) => (
              <p className="about__para" key={para.slice(0, 24)}>
                {para}
              </p>
            ))}

            <ul className="about__skills">
              {person.skills.map((s) => (
                <li className="tag" key={s}>
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section id="story" className="about__block">
            <h2 className="mono about__kicker">How I work</h2>
            {principles.map((p, i) => (
              <Reveal key={p.title} delay={i * 80} className="principle">
                <h3 className="principle__title">{p.title}</h3>
                <p className="principle__body">{p.body}</p>
                <span className="hand principle__note">{p.note}</span>
              </Reveal>
            ))}
          </section>

          <section id="roles" className="about__block">
            <h2 className="mono about__kicker">Roles</h2>
            <ol className="roles">
              {experience.map((role) => (
                <Reveal as="li" key={role.id} className="role">
                  <div className="role__head">
                    <h3 className="role__title">{role.title}</h3>
                    {role.current && <span className="role__now mono">Now</span>}
                  </div>
                  <p className="role__company">
                    {role.company}
                    {role.site && <span className="mono role__site"> · {role.site}</span>}
                  </p>
                  <p className="mono role__period">
                    {role.period} · {role.location}
                  </p>
                  <ul className="role__bullets">
                    {role.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <ul className="role__tech">
                    {role.tech.map((t) => (
                      <li className="tag" key={t}>
                        {t}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </ol>
          </section>

          <section id="wins" className="about__block">
            <h2 className="mono about__kicker">Journey</h2>
            <ol className="wins">
              {timeline.map((m) => (
                <Reveal as="li" key={m.title} className={`win ${m.highlight ? 'is-highlight' : ''}`}>
                  <span className="mono win__year">{m.year}</span>
                  <div>
                    <h3 className="win__title">{m.title}</h3>
                    <p className="win__detail">{m.detail}</p>
                  </div>
                </Reveal>
              ))}
            </ol>

            <h2 className="mono about__kicker about__kicker--spaced">Currently curious about</h2>
            <ul className="about__skills">
              {interests.map((i) => (
                <li className="tag" key={i}>
                  {i}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <Marquee text={person.firstName.toUpperCase()} direction="right" />
    </>
  )
}
