import { useEffect } from 'react'
import { archive, featured, person, projects } from '../content/resume'
import { initSmoothScroll, destroySmoothScroll } from '../lib/smoothScroll'
import { usePrefersReducedMotion } from '../lib/hooks'
import { unlockAudio } from '../audio/synth'
import SoundFX from '../audio/SoundFX'
import CommandPalette from '../components/CommandPalette'
import Cursor from '../components/Cursor'
import Environment from '../components/Environment'
import LogOverlay from '../components/LogOverlay'
import Nav from '../components/Nav'
import ProjectList from '../components/ProjectList'
import RiseText from '../components/RiseText'
import ScrambleText from '../components/ScrambleText'
import ProjectCase from '../sections/ProjectCase'
import { useApp } from '../store'
import './ProjectsPage.css'

const pad = (n: number) => String(n).padStart(2, '0')

const groups = [
  { id: 'featured', label: 'Featured', projects: featured },
  { id: 'more', label: 'More work', projects: archive },
].filter((g) => g.projects.length > 0)

const projectFromHash = () => {
  const id = decodeURIComponent(window.location.hash.slice(1))
  return projects.some((p) => p.id === id) ? id : null
}

/**
 * /projects — every project, in the home page's archive rows. A row opens the
 * same modal as on the home page; the open project is kept in the hash, so
 * /projects#onyx is a link to Onyx.
 */
export default function ProjectsPage() {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    initSmoothScroll(reduced)
    return () => destroySmoothScroll()
  }, [reduced])

  useEffect(() => {
    const { setCaseOpenId } = useApp.getState()
    const fromHash = () => {
      const id = projectFromHash()
      if (id || !window.location.hash) setCaseOpenId(id)
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)

    // replaceState: opening and closing a project should not pile up history
    const unsubscribe = useApp.subscribe((s, prev) => {
      if (s.caseOpenId === prev.caseOpenId) return
      const hash = s.caseOpenId ? `#${s.caseOpenId}` : ''
      if (window.location.hash !== hash) {
        history.replaceState(history.state, '', window.location.pathname + window.location.search + hash)
      }
    })

    return () => {
      window.removeEventListener('hashchange', fromHash)
      unsubscribe()
    }
  }, [])

  // there is no preloader here to click through, so the first touch of the page wakes the audio
  useEffect(() => {
    const wake = () => {
      unlockAudio()
      window.removeEventListener('pointerdown', wake, true)
      window.removeEventListener('keydown', wake, true)
    }
    window.addEventListener('pointerdown', wake, true)
    window.addEventListener('keydown', wake, true)
    return () => {
      window.removeEventListener('pointerdown', wake, true)
      window.removeEventListener('keydown', wake, true)
    }
  }, [])

  return (
    <div className="app">
      <SoundFX />
      <Cursor />
      <Environment />
      <Nav />
      <main>
        <section id="projects" data-section="projects" data-env="0.86" className="section allwork">
          <div className="container">
            <header className="allwork-head">
              <ScrambleText as="p" className="mono-label" text={`Index — ${projects.length} projects`} />
              <RiseText as="h1" className="allwork-title" text="All work." />
            </header>

            {groups.map((g) => (
              <section key={g.id} className="allwork-group" aria-labelledby={`group-${g.id}`}>
                <header className="allwork-group-head">
                  <h2 id={`group-${g.id}`} className="mono-label">
                    {g.label}
                  </h2>
                  <span className="mono-label allwork-group-count">{pad(g.projects.length)}</span>
                </header>
                <ProjectList projects={g.projects} />
              </section>
            ))}

            <footer className="allwork-foot">
              <a className="mono-label" href="/">
                ← Home
              </a>
              <a className="mono-label" href="/#contact">
                Contact ↗
              </a>
              <span className="mono-label allwork-foot-note">
                © 2026 {person.name} — {person.location}
              </span>
            </footer>
          </div>
        </section>
      </main>
      <ProjectCase />
      <LogOverlay />
      <CommandPalette />

      <div className="grain" aria-hidden="true" />
    </div>
  )
}
