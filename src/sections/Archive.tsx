import { archive, projects } from '../content/resume'
import './Archive.css'

/**
 * The rest of the work lives on its own page (/projects). Here it is one row
 * in the archive's style, the door to that page.
 */
export default function Archive() {
  if (archive.length === 0) return null

  return (
    <section id="archive" data-section="archive" data-env="0.86" className="section archive">
      <div className="container">
        <header className="archive-head">
          <p className="mono-label">More work</p>
          <h2 className="display-md">Also built.</h2>
        </header>

        <a className="archive-all" href="/projects" data-cursor="open">
          <span className="archive-all-label">
            See all {projects.length} projects <span aria-hidden="true">↗</span>
          </span>
          <span className="mono-label archive-all-names">{archive.map((p) => p.name).join(' · ')}</span>
        </a>
      </div>
    </section>
  )
}
