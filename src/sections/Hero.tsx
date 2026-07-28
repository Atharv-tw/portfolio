import { lazy, Suspense } from 'react'
import { person } from '../content/resume'
import ScrambleText from '../components/ScrambleText'
import { usePrefersReducedMotion } from '../lib/hooks'
import './Hero.css'

const HeroView = lazy(() => import('../three/HeroView'))

export default function Hero() {
  const reduced = usePrefersReducedMotion()
  return (
    <section id="hero" data-section="hero" className="hero">
      <div className="hero-aurora" aria-hidden="true" />
      {!reduced && (
        <Suspense fallback={null}>
          <HeroView />
        </Suspense>
      )}
      <div className="container hero-inner">
        <ScrambleText as="p" className="mono-label hero-kicker" text={person.role} delay={200} />
        <h1 className="display-xl hero-name">
          <span className="hero-mask">
            <span className="hero-line">Atharv</span>
          </span>
          <span className="hero-mask">
            <span className="hero-line hero-line-2">Tiwari</span>
          </span>
        </h1>
        <div className="hero-foot">
          <p className="body-lg hero-sub">{person.heroSub}</p>
          <div className="chip-row hero-chips">
            <span className="chip">📍 {person.location}</span>
            <span className="chip chip-accent">{person.tagline}</span>
          </div>
        </div>
      </div>
      <div className="hero-cue mono-label" aria-hidden="true">
        scroll
        <span className="hero-cue-line" />
      </div>
    </section>
  )
}
