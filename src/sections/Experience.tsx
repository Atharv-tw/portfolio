import { useLayoutEffect, useRef } from 'react'
import { experience } from '../content/resume'
import ScrambleText from '../components/ScrambleText'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { usePrefersReducedMotion } from '../lib/hooks'
import './Experience.css'

export default function Experience() {
  const listRef = useRef<HTMLOListElement>(null)
  const spineRef = useRef<HTMLSpanElement>(null)
  const reduced = usePrefersReducedMotion()

  useLayoutEffect(() => {
    const list = listRef.current
    const spine = spineRef.current
    if (!list || !spine || reduced) return

    // fromTo inside a context, like Projects: the starts get remeasured on every
    // ScrollTrigger.refresh, which matters because the pinned Projects section
    // above us changes how far down these rows actually sit.
    const ctx = gsap.context(() => {
      list.querySelectorAll<HTMLElement>('.xp-row').forEach((row) => {
        gsap.fromTo(
          row.querySelectorAll('.xp-meta > *, .xp-head > *, .xp-headline, .xp-scope li, .xp-bullets li, .xp-tech li'),
          { y: 22, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            ease: 'power3.out',
            stagger: 0.04,
            scrollTrigger: { trigger: row, start: 'top 78%', once: true },
          },
        )
        gsap.fromTo(
          row.querySelector('.xp-dot'),
          { scale: 0 },
          { scale: 1, duration: 0.55, ease: 'back.out(2.6)', scrollTrigger: { trigger: row, start: 'top 74%', once: true } },
        )
      })

      // the timeline spine draws itself as you read down it
      gsap.fromTo(
        spine,
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 72%', end: 'bottom 55%', scrub: 0.5 } },
      )
    }, list)

    // the preloader gate and the pinned Projects section both settle after this
    // effect runs, so remeasure whenever our own box changes
    const ro = new ResizeObserver(() => ScrollTrigger.refresh())
    ro.observe(list)

    return () => {
      ro.disconnect()
      ctx.revert()
    }
  }, [reduced])

  return (
    <section id="experience" data-section="experience" data-env="0.9" className="section experience">
      <div className="container">
        <div className="section-head">
          {/* no display heading here on purpose: the first role is the headline */}
          <ScrambleText as="h2" className="mono-label" text="Experience — 003" />
          <div className="rule" />
        </div>

        <div className="xp-timeline">
          <span className="xp-spine" aria-hidden="true">
            <span className="xp-spine-fill" ref={spineRef} />
          </span>

          <ol className="xp-list" ref={listRef}>
            {experience.map((role) => (
              <li key={role.id} className={`xp-row ${role.current ? 'is-current' : ''} ${role.headline ? 'is-lead' : ''}`}>
                <span className="xp-dot" aria-hidden="true" />

                <div className="xp-meta">
                  <span className="xp-period mono-label">{role.period}</span>
                  <span className="xp-location mono-label">{role.location}</span>
                  {role.current && (
                    <span className="xp-live mono-label">
                      <span className="live-dot" aria-hidden="true" />
                      Currently here
                    </span>
                  )}
                </div>

                <div className="xp-body">
                  <div className="xp-lead">
                    <div className="xp-head">
                      <h3 className="xp-company">
                        {role.company}
                        {role.site && <span className="xp-site">{role.site}</span>}
                      </h3>
                      <p className="xp-title">{role.title}</p>
                    </div>

                    {role.headline && (
                      <p className="xp-headline">
                        <strong>{role.headline.value}</strong>
                        <span>{role.headline.label}</span>
                      </p>
                    )}
                  </div>

                  {role.scope && (
                    <ul className="xp-scope" aria-label="What I own">
                      {role.scope.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  )}

                  <ul className="xp-bullets">
                    {role.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>

                  <ul className="xp-tech">
                    {role.tech.map((t) => (
                      <li key={t} className="mono-label">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
