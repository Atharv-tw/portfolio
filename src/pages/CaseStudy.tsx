import { Link, useParams } from 'react-router-dom'
import { projects, projectById } from '../content/site'
import Reveal from '../components/Reveal'
import NotFound from './NotFound'

export default function CaseStudy() {
  const { slug } = useParams()
  const project = slug ? projectById(slug) : undefined

  if (!project) return <NotFound />

  const others = projects.filter((p) => p.id !== project.id).slice(0, 3)

  return (
    <article
      className="case"
      style={
        {
          '--accent': project.accent,
          '--accent-ink': project.accentInk,
        } as React.CSSProperties
      }
    >
      {/* -------------------------------------------------------- Header */}
      <header className="case__head grid-bg">
        <div className="shell">
          <Link to="/work" className="mono case__back">
            ← All work
          </Link>

          <span className="mono case__year">
            {project.index} · {project.year}
          </span>

          <h1 className="display case__title">{project.name}</h1>
          <p className="case__kicker">{project.kicker}</p>

          <ul className="case__tags">
            {project.tags.map((t) => (
              <li className="tag" key={t}>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* ---------------------------------------------------- Spec block */}
      <section className="shell case__spec">
        <div>
          <span className="mono">Role</span>
          <p>{project.role}</p>
        </div>
        <div>
          <span className="mono">Type</span>
          <p>{project.kind}</p>
        </div>
        <div>
          <span className="mono">Year</span>
          <p>{project.year}</p>
        </div>
        <div>
          <span className="mono">Stack</span>
          <p>{project.tech.join(', ')}</p>
        </div>
      </section>

      {/* ------------------------------------------------------ Narrative */}
      <section className="section grid-bg">
        <div className="shell case__body">
          <Reveal className="case__block">
            <span className="hand">the challenge</span>
            <p className="case__prose">{project.challenge}</p>
          </Reveal>

          <Reveal className="case__block" delay={70}>
            <span className="hand">my approach</span>
            <p className="case__prose">{project.approach}</p>
          </Reveal>

          <Reveal className="case__block" delay={140}>
            <span className="hand">the results</span>
            <p className="case__prose">{project.results}</p>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------- Metrics */}
      <section className="case__metrics">
        <div className="shell case__metrics-grid">
          {project.metrics.map((m, i) => (
            <Reveal key={m.label} delay={i * 90} className="metric">
              <span className="metric__value display">{m.value}</span>
              <span className="metric__label mono">{m.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- What shipped */}
      <section className="section grid-bg">
        <div className="shell case__body">
          <h2 className="mono">What shipped</h2>
          <ul className="case__list">
            {project.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>

          {(project.links.repo || project.links.live) && (
            <div className="case__links">
              {project.links.repo && (
                <a className="btn" href={project.links.repo} target="_blank" rel="noreferrer">
                  Source
                </a>
              )}
              {project.links.live && (
                <a className="btn btn--ghost" href={project.links.live} target="_blank" rel="noreferrer">
                  Live
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------- Next work */}
      <section className="section grid-bg case__next">
        <div className="shell">
          <div className="section-head">
            <span className="hand">more projects</span>
            <hr className="rule section-head__rule" />
          </div>

          <div className="case__next-grid">
            {others.map((p) => (
              <Link
                key={p.id}
                to={`/work/${p.id}`}
                className="next-card"
                style={{ '--accent': p.accent } as React.CSSProperties}
              >
                <span className="mono">
                  {p.index} · {p.year}
                </span>
                <h3 className="display next-card__name">{p.name}</h3>
                <p>{p.kicker}</p>
                <span className="mono">See →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </article>
  )
}
