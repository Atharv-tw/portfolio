import { useLayoutEffect, useRef } from 'react'
import { featured } from '../content/resume'
import Awaiting from '../components/Awaiting'
import RiseText from '../components/RiseText'
import ScrambleText from '../components/ScrambleText'
import Motif from '../components/motifs/Motif'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { usePrefersReducedMotion } from '../lib/hooks'
import { botTookClick } from '../lib/scrollState'
import { useApp } from '../store'
import './Projects.css'

/**
 * Where each stage sits on the paper → void ramp. The page crosses mid-grey
 * here on purpose: these cards carry their own surface and ink, so nothing
 * page-coloured has to stay legible while it happens.
 */
const ENV = [0.34, 0.5, 0.66, 0.8]

export default function Projects() {
  const listRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const setCaseOpenId = useApp((s) => s.setCaseOpenId)

  // card-stack: as the next panel slides over, the previous one recedes
  useLayoutEffect(() => {
    if (reduced) return
    const list = listRef.current
    if (!list) return
    const panels = Array.from(list.querySelectorAll<HTMLElement>('.project-panel'))

    const ctx = gsap.context(() => {
      panels.forEach((panel, i) => {
        const card = panel.querySelector<HTMLElement>('.project-card')
        if (!card) return

        // content reveal
        gsap.fromTo(
          panel.querySelectorAll('.project-top, .project-kind, .project-statement, .project-summary, .project-foot'),
          { y: 42, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.07,
            scrollTrigger: { trigger: panel, start: 'top 62%', once: true },
          },
        )

        // recede under the next card
        const next = panels[i + 1]
        if (next) {
          // Buried cards stay pinned under the stack to the end of the list.
          // Marked here so they stop rendering (see Projects.css).
          const bury = (self: ScrollTrigger) => {
            const covered = self.progress === 1
            if (covered !== card.hasAttribute('data-covered')) card.toggleAttribute('data-covered', covered)
          }
          gsap.to(card, {
            scale: 0.94,
            yPercent: -3,
            autoAlpha: 0.55,
            ease: 'none',
            scrollTrigger: {
              trigger: next,
              start: 'top bottom',
              end: 'top top',
              // Lenis already eases the scroll; easing the scrub as well leaves this card trailing the next
              scrub: true,
              onUpdate: bury,
              onRefresh: bury,
            },
          })
        }
      })
    }, list)

    ScrollTrigger.refresh()
    return () => {
      ctx.revert()
      list.querySelectorAll('[data-covered]').forEach((el) => el.removeAttribute('data-covered'))
    }
  }, [reduced])

  return (
    <section id="work" data-section="work" className="section projects">
      <div className="container" data-env="0.24">
        <div className="section-head">
          <ScrambleText as="p" className="mono-label" text="Selected work — 002" />
          <RiseText as="h2" className="display-lg" text="The four I'd show you first." />
          <div className="rule" />
        </div>
      </div>

      <div className="projects-list" ref={listRef}>
        {featured.map((p, i) => (
          <article
            key={p.id}
            className="project-panel"
            data-project={p.id}
            data-env={ENV[i] ?? ENV[ENV.length - 1]}
            style={{ ['--project-accent' as string]: p.accent, ['--project-stage' as string]: p.stage }}
          >
            {/* the whole stage opens the project; the button is the same action for keyboards */}
            <div
              className="project-card env-dark"
              data-cursor="open"
              onClick={() => {
                if (!botTookClick()) setCaseOpenId(p.id)
              }}
            >
              <div className="project-grid">
                <div className="project-meta">
                  <div className="project-top">
                    <span className="project-index" aria-hidden="true">
                      {p.index}
                    </span>
                    <h3 className="project-name">{p.name}</h3>
                    <span className="project-tag mono-label">{p.building ? 'Building' : p.year}</span>
                  </div>
                  <p className="mono-label project-kind">{p.kind}</p>
                  <p className="project-statement">{p.statement}</p>
                  <p className="project-summary">{p.summary}</p>
                  <div className="project-foot">
                    <button
                      className="btn project-open"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCaseOpenId(p.id)
                      }}
                      aria-label={`Open ${p.name}`}
                    >
                      Open project ↗
                    </button>
                    {p.topics.length > 0 ? (
                      <ul className="chip-row project-topics" aria-label="Topics">
                        {p.topics.slice(0, 4).map((t) => (
                          <li key={t} className="chip">
                            {t}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Awaiting what="topics" />
                    )}
                  </div>
                </div>

                <div className="project-visual" data-motif={p.motif}>
                  <Motif project={p} />
                  <div className="project-seat" data-bot-seat={p.id} aria-hidden="true" />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
