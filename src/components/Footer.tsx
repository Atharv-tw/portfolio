import { Link } from 'react-router-dom'
import { person, nav } from '../content/site'

export default function Footer() {
  return (
    <footer className="footer grid-bg">
      <div className="shell footer__inner">
        <div>
          <p className="display footer__name">{person.name}</p>
          <p className="mono">{person.role}</p>
        </div>

        <nav className="footer__links" aria-label="Footer">
          {nav.slice(1).map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
          <Link to="/contact">Contact</Link>
        </nav>

        <div className="footer__social">
          <a href={person.github.url} target="_blank" rel="noreferrer">
            {person.github.label}
          </a>
          <a href={person.linkedin.url} target="_blank" rel="noreferrer">
            {person.linkedin.label}
          </a>
          <a href={`mailto:${person.email}`}>Email</a>
        </div>
      </div>

      <div className="shell footer__base">
        <span className="mono">© {new Date().getFullYear()} {person.name}</span>
        <span className="mono">{person.location}</span>
      </div>
    </footer>
  )
}
