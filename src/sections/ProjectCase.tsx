import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { projects, type Project, type ProjectDeep } from '../content/resume'
import Awaiting from '../components/Awaiting'
import ProjectMedia from '../components/ProjectMedia'
import { lockScroll, unlockScroll } from '../lib/smoothScroll'
import { sfx } from '../audio/synth'
import { useApp } from '../store'
import './ProjectCase.css'

const FOCUSABLE = 'a[href], button:not([disabled]), video[controls], iframe, [tabindex]:not([tabindex="-1"])'

/** a titled block that disappears when it has nothing to say */
function Block({ title, show, awaiting, children }: { title: string; show: boolean; awaiting?: boolean; children: ReactNode }) {
  if (!show) return awaiting ? <Awaiting what={title} /> : null
  return (
    <section className="case-block">
      <h4 className="mono-label case-sub">{title}</h4>
      {children}
    </section>
  )
}

/** One "under the hood" section: specs, points and a table, in whatever mix it has. */
function Deep({ section }: { section: ProjectDeep }) {
  const { title, specs, points, table } = section
  return (
    <section className={`case-deep-block${table ? ' is-wide' : ''}`}>
      <h4 className="mono-label case-sub">{title}</h4>
      {table && (
        <div className="case-table-wrap">
          <table className="case-table">
            <thead>
              <tr>
                {table.head.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, r) => (
                <tr key={row[0]} className={table.ours?.includes(r) ? 'is-ours' : undefined}>
                  {row.map((cell, c) =>
                    c === 0 ? (
                      <th key={c} scope="row">
                        {cell}
                      </th>
                    ) : (
                      <td key={c}>{cell}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {table.note && <p className="case-table-note">{table.note}</p>}
        </div>
      )}
      {specs && (
        <dl className="case-specs">
          {specs.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {points && (
        <ul className="case-bullets">
          {points.map((b) => (
            <li key={b.slice(0, 24)}>{b}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * Screenshots. Listed in `media.shots`; until a featured project has some,
 * `npm run dev` shows the empty frames so the gap is visible. A visitor never
 * sees them.
 */
function Shots({ project }: { project: Project }) {
  const shots = project.media.shots ?? []
  if (shots.length === 0) {
    if (!import.meta.env.DEV || project.tier !== 'featured') return null
    return (
      <section className="case-shots-block" data-awaiting>
        <h4 className="mono-label case-sub">Screens</h4>
        <div className="case-shots">
          {['01', '02', '03'].map((n) => (
            <div key={n} className="case-shot is-empty mono-label">
              Screenshot {n} — add to public/shots/{project.id}/ and list it in media.shots
            </div>
          ))}
        </div>
      </section>
    )
  }
  return (
    <section className="case-shots-block">
      <h4 className="mono-label case-sub">Screens</h4>
      <div className="case-shots">
        {shots.map((shot) => (
          <figure key={shot.src} className="case-shot">
            <img src={shot.src} alt={shot.alt} loading="lazy" decoding="async" />
          </figure>
        ))}
      </div>
    </section>
  )
}

function CaseBody({ project }: { project: Project }) {
  const overview = project.overview.length ? project.overview : project.summary ? [project.summary] : []
  // only the featured four are expected to have a full write-up
  const full = project.tier === 'featured'
  const links = [
    { label: 'Repository ↗', href: project.links.repo },
    { label: 'Live ↗', href: project.links.live },
    { label: 'Case study ↗', href: project.links.caseStudy },
  ].filter((l) => l.href)

  return (
    <>
      <div className="case-hero">
        <p className="mono-label case-kind">
          {project.kind}
          {project.building ? ' — building' : project.year ? ` — ${project.year}` : ''}
        </p>
        <h3 id="case-title" className="case-name">
          {project.name}
        </h3>
        <p className="case-statement">{project.statement}</p>
        {project.context && <p className="mono-label case-context">{project.context}</p>}
      </div>

      <ProjectMedia project={project} />

      <div className="case-grid">
        <div className="case-main">
          <Block title="Overview" show={overview.length > 0}>
            {overview.map((p) => (
              <p key={p.slice(0, 24)} className="case-lead">
                {p}
              </p>
            ))}
          </Block>
          {full && project.overview.length === 0 && <Awaiting what="Overview — the problem, in your words" />}

          <Block title="What I built" show={project.built.length > 0} awaiting={full}>
            <ul className="case-bullets">
              {project.built.map((b) => (
                <li key={b.slice(0, 24)}>{b}</li>
              ))}
            </ul>
          </Block>

          <Block title="Why it matters" show={!!project.why} awaiting={full}>
            <p className="case-why">{project.why}</p>
          </Block>
        </div>

        <aside className="case-aside">
          <Block title="Results" show={project.results.length > 0} awaiting={full}>
            <dl className="case-results">
              {project.results.map((r) => (
                <div key={r.label} className="case-result">
                  <dt>{r.value}</dt>
                  <dd>{r.label}</dd>
                </div>
              ))}
            </dl>
          </Block>

          <Block title="Stack" show={project.topics.length > 0} awaiting={full}>
            <div className="chip-row">
              {project.topics.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
          </Block>

          <Block title="Links" show={links.length > 0} awaiting={full}>
            <div className="case-links">
              {links.map((l) => (
                <a key={l.label} className="btn" href={l.href} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              ))}
            </div>
          </Block>
        </aside>
      </div>

      {project.deep && project.deep.length > 0 && (
        <div className="case-deep">
          <p className="mono-label case-deep-label">Under the hood</p>
          <div className="case-deep-grid">
            {project.deep.map((d) => (
              <Deep key={d.title} section={d} />
            ))}
          </div>
        </div>
      )}

      <Shots project={project} />
    </>
  )
}

/** Immersive project modal — a small case study without leaving the page. */
export default function ProjectCase() {
  const caseOpenId = useApp((s) => s.caseOpenId)
  const setCaseOpenId = useApp((s) => s.setCaseOpenId)
  const project = projects.find((p) => p.id === caseOpenId) ?? null
  const open = project !== null

  const panelRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  // previous / next stay inside the group you came from
  const group = project ? projects.filter((p) => p.tier === project.tier) : []
  const step = (d: number) => {
    if (!project) return
    const i = group.findIndex((p) => p.id === project.id)
    setCaseOpenId(group[(i + d + group.length) % group.length].id)
  }
  const stepRef = useRef(step)
  stepRef.current = step

  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    lockScroll()
    sfx.whoosh()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCaseOpenId(null)
      else if (e.key === 'ArrowRight') stepRef.current(1)
      else if (e.key === 'ArrowLeft') stepRef.current(-1)
      else if (e.key === 'Tab') {
        // keep focus inside the dialog
        const items = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (!items?.length) return
        const first = items[0]
        const last = items[items.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || !panelRef.current?.contains(active))) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && (active === last || !panelRef.current?.contains(active))) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      unlockScroll()
      returnFocus.current?.focus({ preventScroll: true })
    }
  }, [open, setCaseOpenId])

  useEffect(() => {
    if (!caseOpenId) return
    scrollRef.current?.scrollTo(0, 0)
    closeRef.current?.focus({ preventScroll: true })
  }, [caseOpenId])

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="case-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => setCaseOpenId(null)}
        >
          <motion.article
            ref={panelRef}
            className="case-panel env-dark"
            style={{ ['--project-accent' as string]: project.accent, ['--project-stage' as string]: project.stage }}
            initial={{ y: 60, opacity: 0, scale: 0.965 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-title"
          >
            <header className="case-bar">
              <span className="mono-label case-crumb">
                <b>{project.index}</b> / {project.tier === 'featured' ? 'Featured work' : 'More work'}
              </span>
              <div className="case-bar-actions">
                <button className="case-nav" onClick={() => step(-1)} aria-label="Previous project">
                  ←
                </button>
                <button className="case-nav" onClick={() => step(1)} aria-label="Next project">
                  →
                </button>
                <button ref={closeRef} className="case-close" onClick={() => setCaseOpenId(null)} aria-label="Close project">
                  <span className="mono-label">Esc</span>
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
            </header>

            <div className="case-scroll" ref={scrollRef} data-lenis-prevent>
              {/* re-keyed so stepping to another project replays the colour wipe */}
              <motion.div
                key={project.id}
                className="case-content"
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                <CaseBody project={project} />
              </motion.div>
            </div>

            <motion.div
              key={`wipe-${project.id}`}
              className="case-wipe"
              aria-hidden="true"
              initial={{ scaleY: 1 }}
              animate={{ scaleY: 0 }}
              transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
            />
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
