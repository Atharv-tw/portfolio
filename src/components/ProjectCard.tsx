import { Link } from 'react-router-dom'
import type { Project } from '../content/site'

/**
 * Accent travels as a custom property so the CSS stays branch-free.
 */
export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article
      className="pcard"
      style={
        {
          '--accent': project.accent,
          '--accent-ink': project.accentInk,
        } as React.CSSProperties
      }
    >
      <Link to={`/work/${project.id}`} className="pcard__link">
        <div className="pcard__top">
          <span className="mono">Project {project.index}</span>
          <span className="mono">{project.year}</span>
        </div>

        <div className="pcard__swatch" aria-hidden="true">
          <span className="pcard__initial">{project.name.charAt(0)}</span>
        </div>

        <h3 className="pcard__name display">{project.name}</h3>
        <p className="pcard__kicker">{project.kicker}</p>

        <ul className="pcard__tags">
          {project.tags.map((t) => (
            <li className="tag" key={t}>
              {t}
            </li>
          ))}
        </ul>

        <span className="pcard__cta mono">View project →</span>
      </Link>
    </article>
  )
}
