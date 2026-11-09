import * as THREE from 'three'
import type { Day } from '../../lib/week'
import type { FaceMood } from './face'
import type { Pose } from './states'

/**
 * Little things he does on his own between visitors' moves: look round, yawn
 * and stretch, bob his head to the music, think with a hand on his chin. Each
 * is a short shape over time that bends the pose the rig has already worked
 * out (see MascotRig), and lets go of it smoothly at the end.
 */
export type Act =
  | 'look'
  | 'yawn'
  | 'wave'
  | 'headbob'
  | 'think'
  | 'shrug'
  | 'hop'
  | 'scratch'
  | 'watch'
  | 'dance'
  | 'wink'
  | 'kick'
  | 'shiver'

/** seconds each one takes */
export const ACT_LEN: Record<Act, number> = {
  look: 2.6,
  yawn: 2.4,
  wave: 1.8,
  headbob: 4,
  think: 3,
  shrug: 1.6,
  hop: 0.9,
  scratch: 1.8,
  watch: 2.2,
  dance: 3.2,
  wink: 1.1,
  kick: 1.1,
  shiver: 2,
}

const BY_POSE: Record<Pose, Act[]> = {
  stand: ['look', 'yawn', 'wave', 'headbob', 'think', 'shrug', 'hop', 'scratch', 'watch', 'wink'],
  sit: ['look', 'yawn', 'headbob', 'think', 'wink', 'kick'],
  float: ['look', 'wave', 'wink', 'think'],
  wave: [],
  dribble: ['wink'],
}

/** what each day of the week leans towards, matching what he is wearing */
const BY_DAY: Record<Day, Act[]> = {
  mon: ['watch', 'think'],
  tue: ['headbob', 'headbob'],
  wed: ['kick', 'kick'],
  thu: ['shiver', 'think'],
  fri: ['dance', 'hop'],
  sat: ['hop', 'hop'],
  sun: ['yawn', 'yawn'],
}

export function pickAct(pose: Pose, day: Day, pointerSeen: boolean): Act | null {
  const pool = [...BY_POSE[pose]]
  if (pose === 'stand') pool.push(...BY_DAY[day])
  else pool.push(...BY_DAY[day].filter((a) => BY_POSE[pose].includes(a)))
  // late at night he is sleepier
  const hour = new Date().getHours()
  if (hour >= 23 || hour < 6) pool.push('yawn', 'yawn')
  const choices = pool.filter((a) => pointerSeen || a !== 'wave')
  return choices.length ? choices[Math.floor(Math.random() * choices.length)] : null
}

/** the pose the rig hands over, which an act bends */
export interface Body {
  mood: FaceMood | null
  aL: number
  aR: number
  fwdL: number
  fwdR: number
  headX: number
  headY: number
  headZ: number
  hop: number
  legX: number
  spin: number
  shake: number
  gazeX: number | null
  gazeY: number | null
  float: 'note' | 'q' | null
}

const lerp = THREE.MathUtils.lerp
const smoothstep = THREE.MathUtils.smoothstep

/** k: 0 → 1 through the act; t: the clock, for anything that wiggles */
export function applyAct(act: Act, k: number, t: number, b: Body, pose: Pose) {
  // in, hold, out: every act eases in and lets go
  const w = smoothstep(k, 0, 0.15) * (1 - smoothstep(k, 0.85, 1))
  switch (act) {
    case 'look': {
      const sweep = Math.sin(k * Math.PI * 2)
      b.headY += sweep * 0.6 * w
      b.gazeX = sweep * 0.95
      b.gazeY = 0.1
      b.mood = 'idle'
      break
    }
    case 'yawn':
      b.mood = k < 0.62 ? 'wow' : 'calm'
      b.aL = lerp(b.aL, -2.7, w)
      b.aR = lerp(b.aR, 2.7, w)
      b.headX -= 0.3 * w
      break
    case 'wave':
      b.aR = lerp(b.aR, 2.5 + Math.sin(t * 9) * 0.32, w)
      b.headZ += 0.08 * w
      b.mood = 'happy'
      break
    case 'headbob':
      b.headX += Math.sin(t * 7) * 0.12 * w
      b.headZ += Math.sin(t * 3.5) * 0.07 * w
      b.mood = 'calm'
      b.float = 'note'
      break
    case 'think':
      b.aR = lerp(b.aR, 0.45, w)
      b.fwdR = lerp(b.fwdR, -2.05, w)
      b.headZ += 0.12 * w
      b.gazeX = 0.6
      b.gazeY = 0.75
      b.mood = 'think'
      b.float = 'q'
      break
    case 'shrug':
      b.aL = lerp(b.aL, -1.05, w)
      b.aR = lerp(b.aR, 1.05, w)
      b.fwdL = b.fwdR = lerp(b.fwdL, -0.4, w)
      b.headZ += 0.16 * w
      b.hop += Math.max(0, Math.sin(k * Math.PI * 3)) * 0.04 * w
      b.mood = 'skeptic'
      break
    case 'hop':
      b.hop += Math.max(0, Math.sin(Math.PI * k)) * 0.45
      b.aL = lerp(b.aL, -0.9, w)
      b.aR = lerp(b.aR, 0.9, w)
      b.mood = 'happy'
      break
    case 'scratch':
      b.aR = lerp(b.aR, 2.85 + Math.sin(t * 14) * 0.07, w)
      b.fwdR = lerp(b.fwdR, -0.6, w)
      b.headZ -= 0.1 * w
      b.mood = 'shy'
      break
    case 'watch':
      // checks the watch on his left wrist
      b.fwdL = lerp(b.fwdL, -1.5, w)
      b.aL = lerp(b.aL, -0.15, w)
      b.headX += 0.28 * w
      b.headY -= 0.25 * w
      b.gazeX = -0.4
      b.gazeY = -0.6
      b.mood = k < 0.7 ? 'focus' : 'wow'
      break
    case 'dance':
      b.spin += Math.sin(t * 5) * 0.5 * w
      b.aL = lerp(b.aL, -1.6 + Math.sin(t * 8) * 0.9, w)
      b.aR = lerp(b.aR, 1.6 + Math.sin(t * 8 + Math.PI) * 0.9, w)
      b.hop += Math.abs(Math.sin(t * 8)) * 0.12 * w
      b.mood = 'star'
      break
    case 'wink':
      b.headZ += 0.1 * w
      b.mood = 'wink'
      break
    case 'kick':
      if (pose === 'sit') {
        b.legX += Math.sin(t * 9) * 0.35 * w
        b.mood = 'happy'
      } else {
        // a flying side kick, more or less: up, legs out, hands in guard
        b.hop += Math.max(0, Math.sin(Math.PI * k)) * 0.5
        b.legX = lerp(b.legX, -1.1, w)
        b.fwdL = b.fwdR = lerp(b.fwdL, -1.0, w)
        b.mood = 'confident'
      }
      break
    case 'shiver':
      b.shake += Math.sin(t * 42) * 0.035 * w
      b.aL = lerp(b.aL, -0.04, w)
      b.aR = lerp(b.aR, 0.04, w)
      b.fwdL = b.fwdR = lerp(b.fwdL, -0.8, w)
      b.mood = 'sad'
      break
  }
}

export function blankBody(): Body {
  return { mood: null, aL: 0, aR: 0, fwdL: 0, fwdR: 0, headX: 0, headY: 0, headZ: 0, hop: 0, legX: 0, spin: 0, shake: 0, gazeX: null, gazeY: null, float: null }
}
