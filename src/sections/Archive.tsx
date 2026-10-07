import { useState } from 'react'
import { archive } from '../content/resume'
import Motif from '../components/motifs/Motif'
import { useApp } from '../store'
import './Archive.css'

/** The rest of the work: still here, deliberately quieter than the featured four. */
export default function Archive() {
  const setCaseOpenId = useApp((s) => s.setCaseOpenId)
  const [activeId, setActiveId] = useState(archive[0]?.id ?? '')
  const active = archive.find((p) => p.id === activeId) ?? archive[0]

  if (!active) return null

  return (
    <section id="archive" data-section="archive" data-env="0.86" className="section archive">
      <div className="container">
        <header className="archive-head">
          <p className="mono-label">More work</p>
          <h2 className="display-md">Also built.</h2>
        </header>

        <div className="archive-grid">
          <ul className="archive-list">
            {archive.map((p) => (
              <li key={p.id}>
                <button
                  className={`archive-row ${p.id === active.id ? 'is-active' : ''}`}
                  style={{ ['--project-accent' as string]: p.accent }}
                  onClick={() => setCaseOpenId(p.id)}
                  onPointerEnter={() => setActiveId(p.id)}
                  onFocus={() => setActiveId(p.id)}
                  data-cursor="open"
                >
                  <span className="mono-label archive-index">{p.index}</span>
                  <span className="archive-title">
                    <span className="archive-name">{p.name}</span>
                    <span className="archive-statement">{p.statement}</span>
                  </span>
                  <span className="mono-label archive-kind">
                    {p.kind}
                    {p.year && ` — ${p.year}`}
                  </span>
                  <span className="archive-go" aria-hidden="true">
                    ↗
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* one small stage, showing whichever row you are on */}
          <div
            className="archive-preview env-dark"
            style={{ ['--project-accent' as string]: active.accent, ['--project-stage' as string]: active.stage }}
            aria-hidden="true"
          >
            <Motif key={active.id} project={active} />
          </div>
        </div>
      </div>
    </section>
  )
}
