import { now } from '../content/resume'
import { useApp } from '../store'
import './Now.css'

/** A live snapshot, not a project grid: what is on the desk right now. */
export default function Now() {
  const setCaseOpenId = useApp((s) => s.setCaseOpenId)

  return (
    <section id="now" data-section="now" data-env="0.16" className="section now">
      <div className="container now-grid">
        <header className="now-head">
          <p className="mono-label now-label">
            <span className="live-dot" aria-hidden="true" />
            Now
          </p>
          <h2 className="display-md now-title">Currently building.</h2>
          <p className="mono-label now-updated">Updated {now.updated}</p>
        </header>

        <ol className="now-list">
          {now.items.map((item, i) => {
            const body = (
              <>
                <span className="mono-label now-index">0{i + 1}</span>
                <span className="now-name">{item.name}</span>
                <span className="now-line">{item.line}</span>
                {(item.projectId || item.href) && (
                  <span className="mono-label now-go" aria-hidden="true">
                    {item.projectId ? 'Open ↗' : 'GitHub ↗'}
                  </span>
                )}
              </>
            )
            return (
              <li key={item.id}>
                {item.projectId ? (
                  <button
                    className="now-row is-link"
                    onClick={() => setCaseOpenId(item.projectId)}
                    aria-label={`${item.name}: ${item.line} Open project.`}
                    data-cursor="open"
                  >
                    {body}
                  </button>
                ) : item.href ? (
                  <a
                    className="now-row is-link"
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${item.name}: ${item.line} Open on GitHub.`}
                  >
                    {body}
                  </a>
                ) : (
                  <div className="now-row">{body}</div>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
