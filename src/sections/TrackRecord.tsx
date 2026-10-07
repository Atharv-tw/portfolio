import { trackRecord } from '../content/resume'
import CountUp from '../components/CountUp'
import Heatmap from '../components/Heatmap'
import RiseText from '../components/RiseText'
import ScrambleText from '../components/ScrambleText'
import './TrackRecord.css'

/** Credibility, quickly. A few numbers and the three results worth naming. */
export default function TrackRecord() {
  const { stats, role, highlights, also } = trackRecord

  return (
    <section id="track" data-section="track" data-env="0.94" className="section track">
      <div className="container">
        <div className="section-head">
          <ScrambleText as="p" className="mono-label" text="Track record — 004" />
          <RiseText as="h2" className="display-lg" text="Proof, briefly." />
          <div className="rule" />
        </div>

        <dl className="track-stats">
          <div className="track-stat">
            <dd>{role.value}</dd>
            <dt className="mono-label">{role.label}</dt>
          </div>
          {stats.map((s) => (
            <div key={s.label} className="track-stat">
              <dd>
                <CountUp value={s.value} suffix={s.suffix} />
              </dd>
              <dt className="mono-label">{s.label}</dt>
            </div>
          ))}
        </dl>

        <div className="track-grid">
          <ol className="track-highlights">
            {highlights.map((h) => (
              <li key={h.title} className={`track-highlight ${h.lead ? 'is-lead' : ''}`}>
                <span className="mono-label track-result">{h.result}</span>
                <h3 className="track-title">{h.title}</h3>
                <p className="track-detail">{h.detail}</p>
              </li>
            ))}
          </ol>

          <p className="track-also">
            <span className="mono-label">Also</span>
            {also.join(' · ')}
          </p>
        </div>

        <div className="track-activity">
          <p className="mono-label">GitHub, last twelve months</p>
          <Heatmap />
        </div>
      </div>
    </section>
  )
}
