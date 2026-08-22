import { useCallback, useRef, useState } from 'react'

/**
 * Drag-and-zoom scrapbook.
 *
 * Tiles are inline SVG placeholders for now — swapping in a real photo is a
 * one-line change per tile: replace <Placeholder/> with <img src=… />.
 */

interface Tile {
  id: string
  caption: string
  color: string
  /** tile width in px at zoom 1 */
  width: number
  rotate: number
  x: number
  y: number
}

const INITIAL: Tile[] = [
  { id: 't1', caption: 'first hackathon',  color: '#ff6a35', width: 300, rotate: -4, x: 60,   y: 40 },
  { id: 't2', caption: 'onyx, 3am',        color: '#2b57d6', width: 240, rotate: 3,  x: 420,  y: 150 },
  { id: 't3', caption: 'whiteboard mess',  color: '#f7c948', width: 360, rotate: -2, x: 720,  y: 30 },
  { id: 't4', caption: 'the winning demo', color: '#16b06a', width: 210, rotate: 6,  x: 180,  y: 330 },
  { id: 't5', caption: 'outreach v1',      color: '#ff4d8d', width: 270, rotate: -6, x: 520,  y: 420 },
  { id: 't6', caption: 'sticker haul',     color: '#a9dfc6', width: 330, rotate: 2,  x: 880,  y: 380 },
  { id: 't7', caption: 'uhm',              color: '#f3e2ad', width: 190, rotate: -8, x: 1120, y: 170 },
  { id: 't8', caption: 'found it!',        color: '#ff6a35', width: 220, rotate: 5,  x: 300,  y: 620 },
]

/** Crayon-ish placeholder art, deterministic per tile. */
function Placeholder({ color, seed }: { color: string; seed: number }) {
  return (
    <svg viewBox="0 0 200 150" className="tile__art" role="presentation">
      <rect width="200" height="150" fill={color} opacity="0.22" />
      <circle cx={50 + (seed % 3) * 40} cy={60} r={28 + (seed % 4) * 6} fill={color} opacity="0.55" />
      <rect
        x={90 + (seed % 2) * 20}
        y={70 + (seed % 3) * 10}
        width="70"
        height="52"
        fill={color}
        opacity="0.8"
        transform={`rotate(${(seed % 5) * 4 - 8} 125 96)`}
      />
      <path
        d={`M10 ${130 - (seed % 3) * 12} Q 60 ${90 - (seed % 4) * 8} 110 ${125 - (seed % 2) * 15} T 195 ${110 + (seed % 3) * 6}`}
        stroke={color}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Playground() {
  const [tiles, setTiles] = useState<Tile[]>(INITIAL)
  const [zoom, setZoom] = useState(1)
  const [top, setTop] = useState<string | null>(null)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, tile: Tile) => {
      // Capture keeps the drag alive if the cursor outruns the tile. Not fatal
      // if the browser refuses it — the move handler still works.
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* no capture available; drag degrades to pointer-over-element */
      }
      drag.current = {
        id: tile.id,
        dx: e.clientX / zoom - tile.x,
        dy: e.clientY / zoom - tile.y,
      }
      setTop(tile.id)
    },
    [zoom],
  )

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const x = e.clientX / zoom - d.dx
    const y = e.clientY / zoom - d.dy
    setTiles((prev) => prev.map((t) => (t.id === d.id ? { ...t, x, y } : t)))
    // zoom intentionally read fresh from closure below
  }, [zoom])

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      /* nothing to release */
    }
    drag.current = null
  }, [])

  return (
    <section className="pg grid-bg">
      <div className="pg__label">
        <span className="hand">just for fun</span>
        <p className="mono">drag things around · {tiles.length} scraps</p>
      </div>

      {/* Decorative canvas — captions are exposed as a list below for AT. */}
      <div className="pg__stage" aria-hidden="true">
        <div className="pg__zoom" style={{ transform: `scale(${zoom})` }}>
          {tiles.map((tile, i) => (
            <div
              key={tile.id}
              className="tile"
              onPointerDown={(e) => onPointerDown(e, tile)}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={{
                left: tile.x,
                top: tile.y,
                width: tile.width,
                zIndex: top === tile.id ? 20 : 1,
                transform: `rotate(${tile.rotate}deg)`,
              }}
            >
              <Placeholder color={tile.color} seed={i + 1} />
              <span className="tile__caption mono">{tile.caption}</span>
            </div>
          ))}
        </div>
      </div>

      <ul className="sr-only">
        {tiles.map((t) => (
          <li key={t.id}>{t.caption}</li>
        ))}
      </ul>

      <div className="pg__controls">
        <button
          className="pg__btn"
          onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          className="pg__btn"
          onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
          aria-label="Zoom out"
        >
          −
        </button>
        <button className="pg__btn pg__btn--wide mono" onClick={() => { setTiles(INITIAL); setZoom(1) }}>
          Reset
        </button>
      </div>
    </section>
  )
}
