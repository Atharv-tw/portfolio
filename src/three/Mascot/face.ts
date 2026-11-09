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
  | 'wink'
  | 'love'
  | 'angry'
  | 'sad'
  | 'smug'
  | 'think'
  | 'laugh'
  | 'skeptic'
  | 'star'
  | 'shy'

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
  /** 0 closed → 1 wide open, while he is talking */
  talk: number
}

const W = 512
const H = 288
const EYE_Y = 128
const EYE_DX = 104

/** what each eye does in a mood; most moods are the same on both sides */
type EyeShape = 'open' | 'focus' | 'alert' | 'arc' | 'smile' | 'line' | 'spiral' | 'ring' | 'heart' | 'star' | 'chevron' | 'squint'

function eyeFor(mood: FaceMood, side: number): EyeShape {
  switch (mood) {
    case 'focus':
      return 'focus'
    case 'alert':
      return 'alert'
    case 'calm':
      return 'arc'
    case 'happy':
    case 'shy':
      return 'smile'
    case 'sleep':
      return 'line'
    case 'dizzy':
      return 'spiral'
    case 'wow':
      return 'ring'
    case 'love':
      return 'heart'
    case 'star':
      return 'star'
    case 'laugh':
      return 'chevron'
    case 'wink':
      return side > 0 ? 'smile' : 'open'
    case 'skeptic':
      return side > 0 ? 'squint' : 'open'
    default:
      return 'open'
  }
}

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

  const state: FaceState = { mood: 'idle', color: '#fff4e4', gazeX: 0, gazeY: 0, blink: 0, scan: -1, talk: 0 }
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

  /** a pupil punched out of the eye, with a catch-light inside it */
  function pupil(x: number, y: number, drop: number) {
    const { gazeX, gazeY } = state
    c.save()
    c.shadowBlur = 0
    c.globalCompositeOperation = 'destination-out'
    c.beginPath()
    c.arc(x + gazeX * 17, y + drop - gazeY * 24, 19, 0, Math.PI * 2)
    c.fill()
    c.restore()
    c.beginPath()
    c.arc(x + gazeX * 17 + 7, y + drop - gazeY * 24 - 7, 5.5, 0, Math.PI * 2)
    c.fill()
  }

  /** a brow: a short glowing bar, its inner end raised (worried) or dropped (cross) */
  function brow(x: number, y: number, side: number, inner: number, outer: number) {
    c.save()
    c.lineWidth = 13
    c.beginPath()
    c.moveTo(x - side * 40, y + inner)
    c.lineTo(x + side * 44, y + outer)
    c.stroke()
    c.restore()
  }

  function heart(x: number, y: number, s: number) {
    c.beginPath()
    c.moveTo(x, y + 40 * s)
    c.bezierCurveTo(x - 74 * s, y - 4 * s, x - 42 * s, y - 60 * s, x, y - 24 * s)
    c.bezierCurveTo(x + 42 * s, y - 60 * s, x + 74 * s, y - 4 * s, x, y + 40 * s)
    c.fill()
  }

  function star(x: number, y: number, r: number) {
    c.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const rr = i % 2 ? r * 0.45 : r
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
    }
    c.closePath()
    c.fill()
  }

  function eye(shape: EyeShape, x: number, y: number, side: number, open: number) {
    const { mood, gazeX, gazeY } = state
    switch (shape) {
      case 'open':
      case 'focus':
      case 'squint': {
        const narrow = shape === 'focus' || shape === 'squint'
        const w = narrow ? 104 : mood === 'angry' ? 96 : 92
        const tall = shape === 'squint' ? 52 : shape === 'focus' ? 62 : mood === 'angry' ? 112 : mood === 'smug' ? 104 : 136
        const h = tall * open
        capsuleEye(x, y, w, Math.max(8, h))
        if (open > 0.5) {
          c.shadowBlur = 0
          // the cut is what gives him attitude: inner corners drop for confident
          if (mood === 'confident') lid(x, y, w, h, 0.2, 0.13, side)
          else if (mood === 'listening') lid(x, y, w, h, 0.44, -0.05, side)
          else if (shape === 'focus') lid(x, y, w, h, 0.3, 0.16, side)
          else if (mood === 'angry') lid(x, y, w, h, 0.36, 0.34, side)
          else if (mood === 'sad') lid(x, y, w, h, 0.3, -0.28, side)
          else if (mood === 'smug') lid(x, y, w, h, 0.5, 0.04, side)
          else if (mood === 'think') lid(x, y, w, h, 0.16, -0.06, side)
          if (shape === 'open') {
            // pupil — it travels further than the eye, so he visibly looks at things
            const drop = mood === 'listening' || mood === 'sad' ? 26 : mood === 'smug' ? 30 : mood === 'confident' ? 12 : 4
            pupil(x, y, drop)
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
      case 'arc': {
        c.lineWidth = 17
        c.beginPath()
        c.arc(x, y - 20, 42, Math.PI * 0.16, Math.PI * 0.84)
        c.stroke()
        break
      }
      case 'smile': {
        c.lineWidth = 19
        c.beginPath()
        c.arc(x, y + 30, 46, Math.PI * 1.14, Math.PI * 1.86)
        c.stroke()
        break
      }
      case 'line': {
        c.lineWidth = 14
        c.beginPath()
        c.moveTo(x - 40, y + 8)
        c.lineTo(x + 40, y + 8)
        c.stroke()
        break
      }
      case 'spiral': {
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
      case 'ring': {
        c.lineWidth = 17
        c.beginPath()
        c.arc(x, y, 44, 0, Math.PI * 2)
        c.stroke()
        break
      }
      case 'heart':
        heart(x, y, 1.05)
        break
      case 'star':
        star(x, y, 58)
        break
      case 'chevron': {
        // > <, pointing in at each other: laughing too hard to look
        const tip = -side
        c.lineWidth = 18
        c.lineJoin = 'round'
        c.beginPath()
        c.moveTo(x - tip * 30, y - 36)
        c.lineTo(x + tip * 26, y)
        c.lineTo(x - tip * 30, y + 36)
        c.stroke()
        break
      }
    }
  }

  function draw() {
    const { mood, color, gazeX, gazeY, blink, scan, talk } = state
    c.clearRect(0, 0, W, H)
    c.fillStyle = color
    c.strokeStyle = color
    c.lineCap = 'round'
    c.lineJoin = 'miter'
    c.shadowColor = color
    c.shadowBlur = 16

    const gx = gazeX * 16
    const gy = -gazeY * 10
    const open = 1 - blink * 0.93

    for (const side of [-1, 1]) {
      const x = W / 2 + side * EYE_DX + gx
      const y = EYE_Y + gy
      eye(eyeFor(mood, side), x, y, side, open)

      // brows, for the moods that need more than eyes
      if (mood === 'angry') brow(x, y - 74, side, 22, -8)
      else if (mood === 'sad') brow(x, y - 84, side, -20, 6)
      else if (mood === 'think' && side > 0) brow(x, y - 92, side, 4, -14)
      else if (mood === 'skeptic') brow(x, y - (side > 0 ? 50 : 98), side, side > 0 ? 6 : -4, side > 0 ? 6 : -16)
    }

    // a tear, when it is that kind of day
    if (mood === 'sad') {
      c.globalAlpha = 0.75
      c.beginPath()
      const tx = W / 2 + EYE_DX * 0.72 + gx
      c.moveTo(tx, EYE_Y + 70)
      c.quadraticCurveTo(tx + 14, EYE_Y + 96, tx, EYE_Y + 104)
      c.quadraticCurveTo(tx - 14, EYE_Y + 96, tx, EYE_Y + 70)
      c.fill()
      c.globalAlpha = 1
    }

    // mouth — small on purpose, the eyes do the talking
    const mx = W / 2 + gx * 0.6
    const my = 244 + gy * 0.5
    c.lineWidth = 11
    c.beginPath()
    if (talk > 0.05) {
      c.ellipse(mx, my - 16, 17, 4 + talk * 15, 0, 0, Math.PI * 2)
      c.fill()
    } else if (mood === 'happy' || mood === 'star' || mood === 'love') {
      c.lineWidth = 13
      c.arc(mx, my - 22, 26, Math.PI * 0.12, Math.PI * 0.88)
    } else if (mood === 'laugh') {
      // wide open D
      c.moveTo(mx - 30, my - 30)
      c.lineTo(mx + 30, my - 30)
      c.arc(mx, my - 30, 30, 0, Math.PI)
      c.fill()
    } else if (mood === 'confident' || mood === 'wink') {
      c.arc(mx + 10, my - 22, 22, Math.PI * 0.18, Math.PI * 0.62)
    } else if (mood === 'smug') {
      c.moveTo(mx - 22, my - 10)
      c.quadraticCurveTo(mx + 6, my - 4, mx + 26, my - 22)
    } else if (mood === 'idle' || mood === 'listening' || mood === 'calm') {
      c.arc(mx, my - 26, 20, Math.PI * 0.25, Math.PI * 0.75)
    } else if (mood === 'angry' || mood === 'sad') {
      c.arc(mx, my + 2, 20, Math.PI * 1.22, Math.PI * 1.78)
    } else if (mood === 'think' || mood === 'skeptic') {
      c.moveTo(mx - 18, my - 8)
      c.lineTo(mx + 16, my - 14)
    } else if (mood === 'shy') {
      c.lineWidth = 8
      c.moveTo(mx - 18, my - 12)
      c.quadraticCurveTo(mx - 9, my - 20, mx, my - 12)
      c.quadraticCurveTo(mx + 9, my - 4, mx + 18, my - 12)
    } else if (mood === 'alert') {
      c.moveTo(mx - 12, my - 6)
      c.lineTo(mx + 12, my - 6)
    } else if (mood === 'wow' || mood === 'sleep') {
      c.arc(mx, my - 8, mood === 'wow' ? 15 : 9, 0, Math.PI * 2)
    }
    c.stroke()

    // blush
    if (mood === 'happy' || mood === 'calm' || mood === 'shy' || mood === 'love') {
      c.shadowBlur = 0
      c.globalAlpha = mood === 'shy' || mood === 'love' ? 0.55 : 0.3
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
