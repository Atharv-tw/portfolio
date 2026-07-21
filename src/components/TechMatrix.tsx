import { Fragment, useMemo, useState } from 'react'
import { projects, skillEdges, skillNodes } from '../content/resume'
import { useApp } from '../store'
import './TechMatrix.css'

const GROUP_LABELS: Array<{ key: string; label: string }> = [
  { key: 'lang', label: 'Languages' },
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'data', label: 'Data' },
  { key: 'ai', label: 'AI' },
  { key: 'ops', label: 'Ops' },
]

/**
 * Which tech powers which project. Built from the same edge list the site
 * already keeps in resume.ts, so it can never drift from the content.
 */
export default function TechMatrix() {
  const setCaseOpenId = useApp((s) => s.setCaseOpenId)
  const [hotRow, setHotRow] = useState<string | null>(null)
  const [hotCol, setHotCol] = useState<string | null>(null)

  const { groups, spare, colCounts } = useMemo(() => {
    const projectIds = new Set(projects.map((p) => p.id))

    // skillId -> projects using it (edges are [project, skill], but be safe)
    const usage = new Map<string, Set<string>>()
    for (const [a, b] of skillEdges) {
      const [proj, skill] = projectIds.has(a) ? [a, b] : projectIds.has(b) ? [b, a] : [null, null]
      if (!proj || !skill) continue
      if (!usage.has(skill)) usage.set(skill, new Set())
      usage.get(skill)!.add(proj)
    }

    const skills = skillNodes.filter((n) => n.group !== 'project')
    const used = skills.filter((s) => (usage.get(s.id)?.size ?? 0) > 0)

    const groups = GROUP_LABELS.map((g) => ({
      ...g,
      rows: used
        .filter((s) => s.group === g.key)
        .map((s) => ({ ...s, projects: usage.get(s.id)! })),
    })).filter((g) => g.rows.length > 0)

    // honest about the rest: in the toolkit, just not in these five builds
    const spare = skills.filter((s) => (usage.get(s.id)?.size ?? 0) === 0)

    const colCounts = new Map(
      projects.map((p) => [p.id, used.filter((s) => usage.get(s.id)!.has(p.id)).length]),
    )

    return { groups, spare, colCounts }
  }, [])

  const cols = projects.length + 1

  return (
    <div className="matrix" onPointerLeave={() => { setHotRow(null); setHotCol(null) }}>
      <table className="matrix-table">
        <caption className="visually-hidden">
          Which technologies were used in which project
        </caption>
        <thead>
          <tr>
            <th className="matrix-corner" scope="col">
              <span className="mono-label">tech / project</span>
            </th>
            {projects.map((p) => (
              <th
                key={p.id}
                scope="col"
                className={`matrix-colhead ${hotCol === p.id ? 'is-hot' : ''}`}
                style={{ ['--c' as string]: p.accent }}
              >
                <button
                  className="matrix-colbtn"
                  onPointerEnter={() => setHotCol(p.id)}
                  onFocus={() => setHotCol(p.id)}
                  onClick={() => setCaseOpenId(p.id)}
                  title={`${p.name} — open case study`}
                >
                  <span className="matrix-colname">{p.short}</span>
                  <span className="matrix-colcount mono-label">{colCounts.get(p.id)} tech</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {groups.map((g) => (
            <Fragment key={g.key}>
              <tr className="matrix-grouprow">
                <th scope="colgroup" colSpan={cols} className="mono-label">
                  {g.label}
                </th>
              </tr>
              {g.rows.map((s) => (
                <tr
                  key={s.id}
                  className={`matrix-row ${hotRow === s.id ? 'is-hot' : ''}`}
                  onPointerEnter={() => setHotRow(s.id)}
                >
                  <th scope="row" className="matrix-rowhead">
                    {s.label}
                    <span className="matrix-rowcount mono-label">{s.projects.size}</span>
                  </th>
                  {projects.map((p) => {
                    const on = s.projects.has(p.id)
                    const lit = on && (hotCol === p.id || hotRow === s.id)
                    return (
                      <td
                        key={p.id}
                        className={`matrix-cell ${on ? 'is-on' : ''} ${lit ? 'is-lit' : ''} ${
                          hotCol === p.id ? 'in-col' : ''
                        }`}
                        style={{ ['--c' as string]: p.accent }}
                        onPointerEnter={() => setHotCol(p.id)}
                      >
                        <span className="matrix-dot" />
                        <span className="visually-hidden">
                          {on ? `${s.label} used in ${p.name}` : ''}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>

      {spare.length > 0 && (
        <p className="matrix-foot mono-label">
          also in the toolkit — {spare.map((s) => s.label).join(' · ')}
        </p>
      )}
    </div>
  )
}
