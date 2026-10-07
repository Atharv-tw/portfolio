import * as THREE from 'three'

export type FaceMood =
  | 'idle'
  | 'confident'
  | 'listening'
  | 'focus'
  | 'calm'
  | 'alert'
  | 'happy'
  | 'dizzy'
  | 'sleep'
  | 'wow'

export interface FaceState {
  mood: FaceMood
  /** eye colour — warm white by default, a project's colour inside its scene */
  color: string
  /** where he is looking, -1…1 */
  gazeX: number
  gazeY: number
  /** 0 open → 1 shut */
  blink: number
  /** 0…1 position of the scan bar across the visor, or -1 for none */
  scan: number
}

const W = 512
const H = 288
const EYE_Y = 128
const EYE_DX = 104

/**
 * The bot's face is a 2D canvas texture on his visor — cheap, expressive, easy
 * to tweak. A GLB body only has to provide a mesh to put this texture on.
 */
export function createFace() {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const c = canvas.getContext('2d')!
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4

  const state: FaceState = { mood: 'idle', color: '#fff4e4', gazeX: 0, gazeY: 0, blink: 0, scan: -1 }
  let dirty = true

  function set(next: Partial<FaceState>) {
    for (const key of Object.keys(next) as Array<keyof FaceState>) {
      const a = state[key]
      const b = next[key]
      if (b === undefined) continue
      if (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) > 0.004 : a !== b) {
        ;(state as unknown as Record<string, unknown>)[key] = b
        dirty = true
      }
    }
  }

  /**
   * Knock a lid off the top of an eye. A positive slant drops the inner corner
   * (determined); negative drops the outer one (soft, a little sad).
   */
  function lid(x: number, y: number, w: number, h: number, cut: number, slant: number, side: number) {
    c.save()
    c.globalCompositeOperation = 'destination-out'
    c.translate(x, y - h / 2 + h * cut)
    c.rotate(-slant * side)
    c.fillRect(-w, -h * 1.5, w * 2, h * 1.5)
    c.restore()
  }

  function capsuleEye(x: number, y: number, w: number, h: number) {
    c.beginPath()
    c.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) / 2)
    c.fill()
  }

  function draw() {
    const { mood, color, gazeX, gazeY, blink, scan } = state
    c.clearRect(0, 0, W, H)
    c.fillStyle = color
    c.strokeStyle = color
    c.lineCap = 'round'
    c.shadowColor = color
    c.shadowBlur = 16

    const gx = gazeX * 16
    const gy = -gazeY * 10
    const open = 1 - blink * 0.93

    for (const side of [-1, 1]) {
      const x = W / 2 + side * EYE_DX + gx
      const y = EYE_Y + gy

      switch (mood) {
        case 'idle':
        case 'confident':
        case 'listening':
        case 'focus': {
          const w = mood === 'focus' ? 104 : 92
          const h = (mood === 'focus' ? 62 : 136) * open
          capsuleEye(x, y, w, Math.max(8, h))
          if (open > 0.5) {
            c.shadowBlur = 0
            // the cut is what gives him attitude: inner corners drop for confident
            if (mood === 'confident') lid(x, y, w, h, 0.2, 0.13, side)
            else if (mood === 'listening') lid(x, y, w, h, 0.44, -0.05, side)
            else if (mood === 'focus') lid(x, y, w, h, 0.3, 0.16, side)
            if (mood !== 'focus') {
              // pupil — it travels further than the eye, so he visibly looks at things
              const drop = mood === 'listening' ? 26 : mood === 'confident' ? 12 : 4
              c.save()
              c.globalCompositeOperation = 'destination-out'
              c.beginPath()
              c.arc(x + gazeX * 17, y + drop - gazeY * 24, 19, 0, Math.PI * 2)
              c.fill()
              c.restore()
              // catch-light inside the pupil
              c.beginPath()
              c.arc(x + gazeX * 17 + 7, y + drop - gazeY * 24 - 7, 5.5, 0, Math.PI * 2)
              c.fill()
            }
            c.shadowBlur = 16
          }
          break
        }
        case 'alert': {
          c.beginPath()
          c.arc(x, y, 56, 0, Math.PI * 2)
          c.fill()
          c.save()
          c.shadowBlur = 0
          c.globalCompositeOperation = 'destination-out'
          c.beginPath()
          c.arc(x + gazeX * 24, y - gazeY * 22, 15, 0, Math.PI * 2)
          c.fill()
          c.restore()
          break
        }
        case 'calm': {
          c.lineWidth = 17
          c.beginPath()
          c.arc(x, y - 20, 42, Math.PI * 0.16, Math.PI * 0.84)
          c.stroke()
          break
        }
        case 'happy': {
          c.lineWidth = 19
          c.beginPath()
          c.arc(x, y + 30, 46, Math.PI * 1.14, Math.PI * 1.86)
          c.stroke()
          break
        }
        case 'sleep': {
          c.lineWidth = 14
          c.beginPath()
          c.moveTo(x - 40, y + 8)
          c.lineTo(x + 40, y + 8)
          c.stroke()
          break
        }
        case 'dizzy': {
          c.lineWidth = 10
          c.beginPath()
          for (let a = 0; a < Math.PI * 5; a += 0.12) {
            const r = 3 + a * 4.2
            const px = x + Math.cos(a + side) * r
            const py = y + Math.sin(a + side) * r
            if (a === 0) c.moveTo(px, py)
            else c.lineTo(px, py)
          }
          c.stroke()
          break
        }
        case 'wow': {
          c.lineWidth = 17
          c.beginPath()
          c.arc(x, y, 44, 0, Math.PI * 2)
          c.stroke()
          break
        }
      }
    }

    // mouth — small on purpose, the eyes do the talking
    const mx = W / 2 + gx * 0.6
    const my = 244 + gy * 0.5
    c.lineWidth = 11
    c.beginPath()
    if (mood === 'happy') {
      c.lineWidth = 13
      c.arc(mx, my - 22, 26, Math.PI * 0.12, Math.PI * 0.88)
    } else if (mood === 'confident') {
      c.arc(mx + 10, my - 22, 22, Math.PI * 0.18, Math.PI * 0.62)
    } else if (mood === 'idle' || mood === 'listening' || mood === 'calm') {
      c.arc(mx, my - 26, 20, Math.PI * 0.25, Math.PI * 0.75)
    } else if (mood === 'alert') {
      c.moveTo(mx - 12, my - 6)
      c.lineTo(mx + 12, my - 6)
    } else if (mood === 'wow' || mood === 'sleep') {
      c.arc(mx, my - 8, mood === 'wow' ? 15 : 9, 0, Math.PI * 2)
    }
    c.stroke()

    // blush
    if (mood === 'happy' || mood === 'calm') {
      c.shadowBlur = 0
      c.globalAlpha = 0.3
      for (const side of [-1, 1]) {
        c.beginPath()
        c.ellipse(W / 2 + side * 190 + gx, 206 + gy, 28, 14, 0, 0, Math.PI * 2)
        c.fill()
      }
      c.globalAlpha = 1
    }

    // scan bar sweeping the visor
    if (scan >= 0) {
      c.shadowBlur = 0
      const sx = scan * W
      const g = c.createLinearGradient(sx - 70, 0, sx + 6, 0)
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(1, color)
      c.globalAlpha = 0.38
      c.fillStyle = g
      c.fillRect(sx - 70, 0, 76, H)
      c.globalAlpha = 0.95
      c.fillStyle = color
      c.fillRect(sx, 0, 4, H)
      c.globalAlpha = 1
    }

    c.shadowBlur = 0
    texture.needsUpdate = true
  }

  /** redraws only when something actually changed */
  function render() {
    if (!dirty) return
    dirty = false
    draw()
  }

  render()
  return { texture, state, set, render }
}

export type Face = ReturnType<typeof createFace>

function canvasTexture(size: number, paint: (c: CanvasRenderingContext2D, s: number) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  paint(canvas.getContext('2d')!, size)
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** soft blob for the contact shadow under his feet */
export function makeShadowTexture() {
  return canvasTexture(128, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2)
    g.addColorStop(0, 'rgba(0,0,0,0.55)')
    g.addColorStop(0.55, 'rgba(0,0,0,0.2)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = g
    c.fillRect(0, 0, s, s)
  })
}

/** white glyph sprite, tinted through the material: z for sleep, ♪ for music */
export function makeGlyphTexture(glyph: string) {
  return canvasTexture(64, (c) => {
    c.font = '700 46px "JetBrains Mono Variable", ui-monospace, monospace'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillStyle = '#fff'
    c.fillText(glyph, 32, 35)
  })
}

/** white ring sprite: bubbles and pulse rings */
export function makeRingTexture(thickness = 5) {
  return canvasTexture(128, (c, s) => {
    c.strokeStyle = '#fff'
    c.lineWidth = thickness
    c.beginPath()
    c.arc(s / 2, s / 2, s / 2 - thickness - 2, 0, Math.PI * 2)
    c.stroke()
    c.globalAlpha = 0.5
    c.lineWidth = thickness * 0.7
    c.beginPath()
    c.arc(s / 2, s / 2, s / 2 - thickness * 4.2, Math.PI * 1.1, Math.PI * 1.45)
    c.stroke()
  })
}

/** basketball skin for the off-duty scene */
export function makeBallTexture() {
  const t = canvasTexture(256, (c, s) => {
    c.fillStyle = '#e8641c'
    c.fillRect(0, 0, s, s)
    c.strokeStyle = '#1c1210'
    c.lineWidth = 7
    c.beginPath()
    c.moveTo(0, s / 2)
    c.lineTo(s, s / 2)
    for (const x of [0, s / 2, s]) {
      c.moveTo(x, 0)
      c.lineTo(x, s)
    }
    for (const x of [s / 4, (s * 3) / 4]) {
      c.moveTo(x, 0)
      c.bezierCurveTo(x - 46, s * 0.3, x - 46, s * 0.7, x, s)
    }
    c.stroke()
  })
  t.wrapS = THREE.RepeatWrapping
  return t
}
