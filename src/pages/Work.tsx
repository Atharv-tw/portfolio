import { projects } from '../content/site'
import ProjectCard from '../components/ProjectCard'
import Marquee from '../components/Marquee'
import Reveal from '../components/Reveal'

export default function Work() {
  return (
    <>
      <section className="page-head grid-bg">
        <div className="shell">
          <span className="hand">everything I've built</span>
          <h1 className="display page-head__title">WORK</h1>
          <p className="page-head__lede">
            Six products across security, health, fintech and outreach — each one with the
            edge cases still attached.
          </p>
        </div>
      </section>

      <Marquee text="SELECTED WORK" />

      <section className="section grid-bg">
        <div className="shell">
          <div className="work-grid">
            {projects.map((p, i) => (
              <Reveal key={p.id} delay={(i % 2) * 80}>
                <ProjectCard project={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
