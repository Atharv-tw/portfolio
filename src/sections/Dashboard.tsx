import { lazy, Suspense } from 'react'
import { stats } from '../content/resume'
import CountUp from '../components/CountUp'
import Heatmap from '../components/Heatmap'
import RiseText from '../components/RiseText'
import ScrambleText from '../components/ScrambleText'
import { usePrefersReducedMotion } from '../lib/hooks'
import './Dashboard.css'

const ConstellationView = lazy(() => import('../three/ConstellationView'))

export default function Dashboard() {
  const reduced = usePrefersReducedMotion()
  return (
    <section id="proof" data-section="proof" className="section dashboard">
      <div className="container">
        <div className="section-head">
          <ScrambleText as="p" className="mono-label" text="Proof of work — 003" />
          <RiseText as="h2" className="display-lg" text="Numbers don't lie." />
          <div className="rule" />
        </div>

        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <CountUp className="stat-value" value={s.value} prefix={s.prefix} suffix={s.suffix} />
              <span className="stat-label">{s.label}</span>
              {s.sub && <span className="stat-sub mono-label">{s.sub}</span>}
            </div>
          ))}
        </div>

        <div className="dash-panels">
          <div className="dash-panel">
            <p className="mono-label">GitHub activity</p>
            <Heatmap />
          </div>
          <div className="dash-panel is-constellation" data-cursor="drag">
            <p className="mono-label">Skill constellation — grab a node</p>
            <div className="constellation-host">
              {reduced ? (
                <div className="dash-panel-body mono-label">calm mode: interactive graph paused</div>
              ) : (
                <Suspense fallback={<div className="dash-panel-body mono-label">loading constellation…</div>}>
                  <ConstellationView />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
