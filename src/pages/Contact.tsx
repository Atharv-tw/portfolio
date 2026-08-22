import { person } from '../content/site'
import Marquee from '../components/Marquee'

export default function Contact() {
  return (
    <>
      <section className="page-head grid-bg">
        <div className="shell">
          <span className="hand">say hello</span>
          <h1 className="display page-head__title">CONTACT</h1>
          <p className="page-head__lede">
            Got a hard problem, an internship, or just want to say hi? Send it over — I read
            every message.
          </p>
        </div>
      </section>

      <section className="section grid-bg">
        <div className="shell contact">
          <div className="contact__main">
            <span className="mono">Email</span>
            <a className="contact__email" href={`mailto:${person.email}`}>
              {person.email}
            </a>

            <div className="contact__row">
              <a className="btn" href={`mailto:${person.email}`}>
                Write to me
              </a>
              <a className="btn btn--ghost" href={person.resumePdf} download>
                Résumé (PDF)
              </a>
            </div>
          </div>

          <aside className="contact__side">
            <div>
              <span className="mono">Elsewhere</span>
              <ul className="contact__links">
                <li>
                  <a href={person.github.url} target="_blank" rel="noreferrer">
                    {person.github.label} <span className="mono mono--raw">@{person.github.handle}</span>
                  </a>
                </li>
                <li>
                  <a href={person.linkedin.url} target="_blank" rel="noreferrer">
                    {person.linkedin.label} <span className="mono mono--raw">@{person.linkedin.handle}</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <span className="mono">Based in</span>
              <p className="contact__where">{person.location}</p>
              <p className="mono">{person.availability}</p>
            </div>
          </aside>
        </div>
      </section>

      <Marquee text="LET'S TALK" direction="right" />
    </>
  )
}
