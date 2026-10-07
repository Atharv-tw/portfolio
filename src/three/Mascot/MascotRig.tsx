import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from '../../lib/gsap'
import { sfx } from '../../audio/synth'
import { scrollState } from '../../lib/scrollState'
import { env } from '../../lib/environment'
import { usePrefersReducedMotion } from '../../lib/hooks'
import { useApp } from '../../store'
import type { SceneId } from '../../content/resume'
import MascotBody from './MascotBody'
import {
  createFace,
  makeBallTexture,
  makeGlyphTexture,
  makeRingTexture,
  makeShadowTexture,
  type FaceMood,
} from './face'
import type { MascotParts } from './parts'
import { BOT, SCENES, type SceneState } from './states'

const SLEEP_AFTER_MS = 30_000
const BURST_COUNT = 16
const FLOATIES = 4
const RINGS = 2

const clamp = THREE.MathUtils.clamp
const smoothstep = THREE.MathUtils.smoothstep

/**
 * The bot's behaviour: where he is, what he is doing, how he feels about it.
 * Drives a body through the MascotParts handles only (see parts.ts), so the
 * body can become a GLB without any of this changing.
 */
export default function MascotRig() {
  const root = useRef<THREE.Group>(null!)
  const parts = useRef<MascotParts>(null)
  const shadow = useRef<THREE.Sprite>(null!)
  const floaties = useRef<THREE.Group>(null!)
  const rings = useRef<THREE.Group>(null!)
  const ball = useRef<THREE.Mesh>(null!)
  const burst = useRef<THREE.Points>(null!)

  const reduced = usePrefersReducedMotion()

  const face = useMemo(() => createFace(), [])
  const tex = useMemo(
    () => ({
      shadow: makeShadowTexture(),
      z: makeGlyphTexture('z'),
      note: makeGlyphTexture('♪'),
      ring: makeRingTexture(),
      ball: makeBallTexture(),
    }),
    [],
  )

  const burstGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BURST_COUNT * 3), 3))
    return g
  }, [])

  // ---- mutable animation state (no re-renders) ----
  const st = useRef({
    /** the seat he currently occupies; null while he is away */
    seatKey: null as SceneId | null,
    cfg: null as SceneState | null,
    seatFor: null as SceneId | null,
    seatEl: null as HTMLElement | null,
    scale: 0,
    /** frames left in which to wipe the canvas after he disappears */
    wipe: 0,
    /** world units per CSS pixel at his depth, refreshed every frame */
    wpp: 0.005,
    everShown: false,
    sleeping: false,
    dizzyUntil: 0,
    happyUntil: 0,
    waveUntil: 0,
    nextBlink: 2.5,
    blinkStart: -1,
    clicks: [] as number[],
    rotX: 0,
    rotY: 0,
    gazeX: 0,
    gazeY: 0,
    burstT: 1e9,
    burstVel: Array.from({ length: BURST_COUNT }, () => new THREE.Vector3()),
    flipping: false,
    tip: new THREE.Color('#ff6a17'),
    tmpColor: new THREE.Color(),
    tmpVec: new THREE.Vector3(),
  })

  // dev-only handle for inspecting him from the console; stripped from builds
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { __bot?: unknown }).__bot = { state: st.current, root }
  }, [])

  const findSeat = (scene: SceneId) => {
    const s = st.current
    if (s.seatFor !== scene || !s.seatEl?.isConnected) {
      s.seatFor = scene
      s.seatEl = document.querySelector<HTMLElement>(`[data-bot-seat="${scene}"]`)
    }
    return s.seatEl
  }

  const popBurst = (origin: THREE.Vector3) => {
    if (reduced) return
    const s = st.current
    const pos = burstGeo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < BURST_COUNT; i++) {
      pos.setXYZ(i, origin.x, origin.y, origin.z)
      s.burstVel[i]
        .set(Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5)
        .normalize()
        .multiplyScalar(2.2 + Math.random() * 2)
    }
    pos.needsUpdate = true
    s.burstT = 0
  }

  const squashPop = (strength = 1) => {
    const sq = parts.current?.squash
    if (!sq || reduced) return
    gsap
      .timeline()
      .to(sq.scale, {
        x: 1 + 0.2 * strength,
        y: 1 - 0.24 * strength,
        z: 1 + 0.2 * strength,
        duration: 0.09,
        ease: 'power2.out',
      })
      .to(sq.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'elastic.out(1.1, 0.32)' })
  }

  const doFlip = () => {
    const s = st.current
    if (s.flipping || reduced) return
    s.flipping = true
    sfx.whoosh()
    gsap.to(root.current.rotation, {
      x: root.current.rotation.x - Math.PI * 2,
      duration: 0.85,
      ease: 'power2.inOut',
      onComplete: () => {
        root.current.rotation.x = 0
        s.flipping = false
        s.happyUntil = performance.now() + 900
      },
    })
  }

  // external commands (palette / konami)
  useEffect(
    () =>
      useApp.subscribe((state, prev) => {
        if (state.botMood === prev.botMood) return
        if (state.botMood === 'flip') {
          doFlip()
          window.setTimeout(() => useApp.getState().setBotMood('idle'), 950)
        } else if (state.botMood === 'party') {
          window.setTimeout(() => useApp.getState().setBotMood('idle'), 4000)
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const onBotDown = () => {
    const s = st.current
    const now = performance.now()
    scrollState.botHitAt = now

    if (s.sleeping) {
      s.sleeping = false
      s.happyUntil = now + 1200
      sfx.boing()
      squashPop(1.2)
      return
    }

    s.clicks = s.clicks.filter((t) => now - t < 1600)
    s.clicks.push(now)

    if (s.clicks.length >= 4 && now > s.dizzyUntil) {
      s.dizzyUntil = now + 2300
      s.clicks = []
      sfx.dizzy()
      squashPop(1.3)
      return
    }

    if (now > s.dizzyUntil) {
      s.happyUntil = now + 900
      sfx.chirp()
      squashPop(1)
      popBurst(root.current.position.clone().add(new THREE.Vector3(0, 0.4, 0.4)))
    }
  }

  // Presses are hit-tested against his on-screen outline here rather than
  // through the canvas: he sits in a layer that ignores the pointer, so the
  // page under him stays fully usable everywhere he is not.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const s = st.current
      if (!root.current?.visible || s.scale < 0.05) return
      if (e.target instanceof Element && e.target.closest('.nav, [role="dialog"]')) return
      const cx = document.documentElement.clientWidth / 2 + root.current.position.x / s.wpp
      const cy = window.innerHeight / 2 - (root.current.position.y - 0.15 * s.scale) / s.wpp
      const rx = ((BOT.width / 2) * s.scale * 0.82) / s.wpp
      const ry = ((BOT.height / 2) * s.scale * 0.92) / s.wpp
      if (((e.clientX - cx) / rx) ** 2 + ((e.clientY - cy) / ry) ** 2 <= 1) onBotDown()
    }
    window.addEventListener('pointerdown', onDown, true)
    return () => window.removeEventListener('pointerdown', onDown, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((state, rawDt) => {
    const p = parts.current
    if (!p) return
    const s = st.current

    // The layer he lives in is the whole viewport, so read the viewport itself
    // and keep the camera honest — the View's own size can lag behind a resize.
    const vw = document.documentElement.clientWidth
    const vh = window.innerHeight
    const cam = state.camera as THREE.PerspectiveCamera
    if (Math.abs(cam.aspect - vw / vh) > 0.001) {
      cam.aspect = vw / vh
      cam.updateProjectionMatrix()
    }
    const wpp = (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z) / vh
    s.wpp = wpp
    const dt = Math.min(rawDt, 0.05)
    // reduced motion freezes every oscillator: he holds a pose instead of moving
    const t = reduced ? 0 : state.clock.elapsedTime
    const now = performance.now()
    const ease = (rate: number) => (reduced ? 1 : 1 - Math.exp(-rate * dt))
    const app = useApp.getState()

    // ---- which seat, if any ----
    const scene = app.scene
    const away = !app.entered || app.caseOpenId !== null || app.logOpen || app.menuOpen
    const wanted = away ? undefined : SCENES[scene]
    let target: { x: number; y: number; s: number } | null = null
    if (wanted) {
      const el = findSeat(scene)
      if (el) {
        const r = el.getBoundingClientRect()
        if (r.width > 4 && r.height > 4 && r.bottom > -vh * 0.3 && r.top < vh * 1.3) {
          const fit = Math.min((r.height * wpp) / BOT.height, (r.width * wpp) / BOT.width)
          const base = wanted.pose === 'sit' ? BOT.seat : BOT.foot
          let y = (vh / 2 - r.bottom) * wpp + base * fit
          // a floater hangs in the middle of his box instead of standing on its floor
          if (wanted.pose === 'float') y += (r.height * wpp - BOT.height * fit) * 0.5 + 0.2 * fit
          target = { x: (r.left + r.width / 2 - vw / 2) * wpp, y, s: fit }
        }
      }
    }

    // ---- change seats by leaving one and arriving at the next, never by drifting over the page ----
    const targetKey = target ? scene : null
    if (targetKey !== s.seatKey) {
      s.scale += (0 - s.scale) * ease(16)
      if (s.scale < 0.03) {
        s.seatKey = targetKey
        s.cfg = target ? wanted! : null
        if (target) {
          root.current.position.set(target.x, target.y, 0)
          squashPop(0.9)
          if (!s.everShown) {
            s.everShown = true
            s.waveUntil = now + 2200
            sfx.pop()
            popBurst(root.current.position.clone().add(s.tmpVec.set(0, 0.3, 0.5)))
          }
        }
      }
    } else if (target) {
      s.scale += (target.s - s.scale) * ease(7)
      root.current.position.x += (target.x - root.current.position.x) * ease(16)
      root.current.position.y += (target.y - root.current.position.y) * ease(16)
    } else {
      s.scale += (0 - s.scale) * ease(16)
    }
    root.current.scale.setScalar(Math.max(s.scale, 0.0001))
    root.current.visible = s.scale > 0.02

    const cfg = s.cfg
    if (!cfg || !root.current.visible) {
      // He can have left his seat (no cfg) while still a few pixels tall. Hide
      // him now: otherwise that last small frame is what the wipe below misses,
      // and it stays on screen as a speck until he next appears.
      root.current.visible = false
      shadow.current.visible = false
      floaties.current.visible = false
      rings.current.visible = false
      ball.current.visible = false
      burst.current.visible = false
      // A canvas only repaints when something is drawn to it, so an empty scene
      // would leave his last frame on screen. Wipe it, then go fully idle.
      if (s.wipe > 0) {
        s.wipe--
        state.gl.setScissorTest(false)
        state.gl.clear()
      }
      return
    }
    s.wipe = 2
    const pose = cfg.pose
    const party = app.botMood === 'party'

    // ---- sleep ----
    if (!s.sleeping && now - scrollState.lastActivity > SLEEP_AFTER_MS) {
      s.sleeping = true
      sfx.sleepy()
    } else if (s.sleeping && now - scrollState.lastActivity < 400) {
      s.sleeping = false
      s.happyUntil = now + 1000
      sfx.boing()
      squashPop(0.8)
    }

    // ---- what he is looking at ----
    // until the pointer has moved (touch, first paint) he looks straight out
    const seen = scrollState.pointerX >= 0
    const px = seen ? (scrollState.pointerX - vw / 2) * wpp : root.current.position.x
    const py = seen ? (vh / 2 - scrollState.pointerY) * wpp : root.current.position.y + 0.5 * s.scale
    const dx = px - root.current.position.x
    const dy = py - (root.current.position.y + 0.5 * s.scale)
    let gazeX = clamp(dx / 2.4, -1, 1)
    let gazeY = clamp(dy / 1.7, -1, 1)
    let lookY = clamp(dx * 0.2, -0.55, 0.55)
    let lookX = clamp(-dy * 0.14, -0.28, 0.3)
    if (s.sleeping) {
      gazeX = gazeY = lookY = 0
      lookX = 0.14
    } else if (cfg.prop === 'scan') {
      // sweeping the room, not watching the cursor
      lookY = Math.sin(t * 0.8) * 0.5
      lookX = 0.04
      gazeX = gazeY = 0
    } else if (cfg.mood === 'alert') {
      // eyes snap between corners a beat ahead of the head
      const dart = Math.floor(t * 0.85) % 3
      gazeX = [-0.85, 0.75, 0.1][dart]
      gazeY = [0.25, -0.1, 0.5][dart]
      lookY = lookY * 0.3 + gazeX * 0.28
    } else if (pose === 'float') {
      gazeX = gazeX * 0.4 + Math.sin(t * 0.45) * 0.55
      gazeY = gazeY * 0.4 + Math.sin(t * 0.3 + 1) * 0.3
    }
    s.rotY += (lookY - s.rotY) * ease(5)
    s.rotX += (lookX - s.rotX) * ease(5)
    s.gazeX += (gazeX - s.gazeX) * ease(cfg.mood === 'alert' ? 22 : 9)
    s.gazeY += (gazeY - s.gazeY) * ease(cfg.mood === 'alert' ? 22 : 9)

    const dizzy = now < s.dizzyUntil
    const listening = cfg.prop === 'notes' && !s.sleeping
    p.head.rotation.set(
      s.rotX + (listening ? Math.sin(t * 6.2) * 0.035 : 0),
      s.rotY,
      (listening ? 0.09 + Math.sin(t * 3.1) * 0.06 : 0) + (dizzy ? Math.sin(t * 15) * 0.12 : 0),
    )
    p.torso.rotation.y = s.rotY * 0.25

    // ---- face ----
    let mood: FaceMood = cfg.mood
    if (s.sleeping) mood = 'sleep'
    else if (dizzy) mood = 'dizzy'
    else if (s.flipping) mood = 'wow'
    else if (now < s.happyUntil || party) mood = 'happy'

    let blink = 0
    if (!reduced && !s.sleeping) {
      if (s.blinkStart < 0 && t > s.nextBlink) {
        s.blinkStart = t
        s.nextBlink = t + 2.2 + Math.random() * 3
      }
      if (s.blinkStart >= 0) {
        const b = (t - s.blinkStart) / 0.16
        if (b >= 1) s.blinkStart = -1
        else blink = 1 - Math.abs(b * 2 - 1)
      }
    }

    const eye = party ? '#' + s.tmpColor.setHSL((t * 0.7) % 1, 1, 0.65).getHexString() : cfg.eye
    face.set({
      mood,
      color: eye,
      gazeX: s.gazeX,
      gazeY: s.gazeY,
      blink,
      scan: cfg.prop === 'scan' && mood === 'focus' && !reduced ? (t * 0.55) % 1.25 : -1,
    })
    face.render()

    // ---- body language ----
    const bobAmp = { stand: 0.03, sit: 0.012, float: 0.12, wave: 0.04, dribble: 0.02 }[pose]
    const bob = Math.sin(t * (s.sleeping ? 0.9 : pose === 'float' ? 1.05 : 1.6)) * bobAmp
    p.squash.position.y = -BOT.foot + bob

    const calm = cfg.prop === 'heartbeat'
    p.torso.scale.y = 1 + Math.sin(t * (calm ? 1.1 : 1.9)) * (calm ? 0.03 : 0.012)

    const waving = (pose === 'wave' || now < s.waveUntil) && !s.sleeping
    const bounce = Math.abs(Math.sin(t * 5.2))
    let aL = -0.22 + Math.sin(t * 1.7 + 1.2) * 0.04
    let aR = 0.22 + Math.sin(t * 1.7) * 0.04
    let aFwd = 0
    if (waving) aR = 2.5 + Math.sin(t * 9) * 0.32
    else if (pose === 'sit') {
      aL = -0.36
      aR = 0.36
      aFwd = -0.4
    } else if (pose === 'float') {
      aL = -0.95 + Math.sin(t * 1.1) * 0.2
      aR = 0.95 + Math.sin(t * 1.1 + 1) * 0.2
    } else if (pose === 'dribble') {
      // the hand follows the ball down and back up
      aL = -(0.62 + bounce * 0.5)
    }
    p.armL.rotation.z += (aL - p.armL.rotation.z) * ease(8)
    p.armR.rotation.z += (aR - p.armR.rotation.z) * ease(8)
    p.armL.rotation.x += (aFwd - p.armL.rotation.x) * ease(8)
    p.armR.rotation.x += (aFwd - p.armR.rotation.x) * ease(8)

    let legX = 0
    if (pose === 'sit') legX = -1.32 + (listening ? Math.sin(t * 3.1) * 0.07 : 0)
    else if (pose === 'float') legX = Math.sin(t * 1.3) * 0.22
    p.legs.rotation.x += (legX - p.legs.rotation.x) * ease(8)

    // lean into the scroll, wobble when dizzy, sway when adrift
    if (!s.flipping) {
      const lean = clamp(scrollState.velocity * 0.01, -0.5, 0.5) * -0.3
      const sway = pose === 'float' ? Math.sin(t * 0.7) * 0.09 : 0
      const wobble = dizzy ? Math.sin(t * 15) * 0.1 : 0
      root.current.rotation.z += ((reduced ? 0 : lean) + sway + wobble - root.current.rotation.z) * ease(4)
      const spin = party ? Math.sin(t * 6) * 0.25 : 0
      root.current.rotation.y += (spin - root.current.rotation.y) * ease(party ? 12 : 3)
    }

    // ---- antenna tip + chest mark take the scene's colour ----
    const tipMat = p.antennaTip.material as THREE.MeshPhysicalMaterial
    if (party) s.tip.setHSL((t * 0.7) % 1, 1, 0.55)
    else s.tip.lerp(s.tmpColor.set(cfg.tip), ease(6))
    tipMat.color.copy(s.tip)
    tipMat.emissive.copy(s.tip)
    tipMat.emissiveIntensity = 1.5 + Math.sin(t * 3.2) * 0.55

    const emblemMat = p.emblem.material as THREE.MeshPhysicalMaterial
    if (cfg.prop === 'heartbeat' && !reduced) {
      // lub-dub
      const ph = (t * 1.05) % 1
      const beat = Math.exp(-(((ph - 0.08) / 0.05) ** 2)) + 0.7 * Math.exp(-(((ph - 0.3) / 0.06) ** 2))
      emblemMat.emissive.copy(s.tip)
      emblemMat.emissiveIntensity = 0.5 + beat * 2.6
      p.emblem.scale.set(1 + beat * 0.2, 1 + beat * 0.2, 0.3)
    } else {
      emblemMat.emissiveIntensity += (0 - emblemMat.emissiveIntensity) * ease(6)
      p.emblem.scale.set(1, 1, 0.3)
    }

    // ---- contact shadow: only where the ground is light enough to show one ----
    const ground = 1 - smoothstep(env.t, 0.22, 0.5)
    const sm = shadow.current.material as THREE.SpriteMaterial
    sm.opacity = ground * (pose === 'float' ? 0.3 : 0.85)
    shadow.current.visible = sm.opacity > 0.01
    shadow.current.position.y = pose === 'sit' ? -BOT.seat - 0.04 : -BOT.foot - 0.03 - (pose === 'float' ? 0.5 : 0)
    const spread = 1 - bob * 1.4
    shadow.current.scale.set(2.1 * spread, 0.4 * spread, 1)

    // ---- little things that float off him: z, ♪, bubbles ----
    const floatKind = s.sleeping ? 'z' : cfg.prop === 'notes' ? 'note' : cfg.prop === 'bubbles' ? 'ring' : null
    floaties.current.visible = !!floatKind && !reduced
    if (floatKind && !reduced) {
      const ink = floatKind === 'ring' ? '#cdeff8' : env.dark ? '#f4f4f6' : '#0e0e11'
      floaties.current.children.forEach((child, i) => {
        const sp = child as THREE.Sprite
        const m = sp.material as THREE.SpriteMaterial
        m.map = tex[floatKind]
        m.color.set(ink)
        const phase = (t * (floatKind === 'ring' ? 0.32 : 0.42) + i / FLOATIES) % 1
        const side = i % 2 ? 1 : -1
        if (floatKind === 'z') {
          sp.position.set(0.85 + phase * 0.4 + i * 0.06, 1.05 + phase * 0.9, 0.3)
          sp.scale.setScalar(0.16 + phase * 0.2)
        } else if (floatKind === 'note') {
          sp.position.set(side * (1.05 + phase * 0.45) + Math.sin(t * 2 + i) * 0.06, 0.55 + phase * 1.0, 0.2)
          sp.scale.setScalar(0.24 + phase * 0.12)
        } else {
          sp.position.set(side * (0.35 + i * 0.16) + Math.sin(t * 1.4 + i * 2) * 0.1, 1.15 + phase * 1.5, 0.1)
          sp.scale.setScalar(0.1 + ((i * 37) % 10) * 0.012 + phase * 0.06)
        }
        m.opacity = Math.sin(phase * Math.PI) * (floatKind === 'ring' ? 0.75 : 0.85)
      })
    }

    // ---- pulse rings off the antenna ----
    rings.current.visible = cfg.prop === 'pulse' && !reduced
    if (rings.current.visible) {
      p.antennaTip.getWorldPosition(s.tmpVec)
      root.current.worldToLocal(s.tmpVec)
      rings.current.children.forEach((child, i) => {
        const sp = child as THREE.Sprite
        const m = sp.material as THREE.SpriteMaterial
        const phase = (t * 0.7 + i / RINGS) % 1
        sp.position.copy(s.tmpVec)
        sp.scale.setScalar(0.15 + phase * 1.15)
        m.color.copy(s.tip)
        m.opacity = (1 - phase) * 0.8
      })
    }

    // ---- basketball, dribbled at his side ----
    ball.current.visible = cfg.prop === 'ball'
    if (ball.current.visible) {
      ball.current.position.set(-1.12, -BOT.foot + 0.27 + (s.sleeping ? 0 : bounce) * 0.78, 0.12)
      ball.current.rotation.x = t * 3
    }

    // ---- click burst particles ----
    if (s.burstT < 0.7) {
      s.burstT += dt
      const pos = burstGeo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < BURST_COUNT; i++) {
        pos.setXYZ(
          i,
          pos.getX(i) + s.burstVel[i].x * dt,
          pos.getY(i) + s.burstVel[i].y * dt - 1.4 * dt * s.burstT,
          pos.getZ(i) + s.burstVel[i].z * dt,
        )
      }
      pos.needsUpdate = true
      const bm = burst.current.material as THREE.PointsMaterial
      bm.opacity = Math.max(0, 1 - s.burstT / 0.65)
      burst.current.visible = true
    } else {
      burst.current.visible = false
    }
  })

  return (
    <group>
      <group ref={root} scale={0.0001} visible={false}>
        <MascotBody ref={parts} faceMap={face.texture} />

        <sprite ref={shadow} position={[0, -BOT.foot, -0.35]} renderOrder={-1}>
          <spriteMaterial map={tex.shadow} transparent opacity={0} depthWrite={false} depthTest={false} />
        </sprite>

        <group ref={floaties} visible={false}>
          {Array.from({ length: FLOATIES }, (_, i) => (
            <sprite key={i} scale={0.15}>
              <spriteMaterial map={tex.z} transparent opacity={0} depthWrite={false} toneMapped={false} />
            </sprite>
          ))}
        </group>

        <group ref={rings} visible={false}>
          {Array.from({ length: RINGS }, (_, i) => (
            <sprite key={i}>
              <spriteMaterial map={tex.ring} transparent opacity={0} depthWrite={false} toneMapped={false} />
            </sprite>
          ))}
        </group>

        <mesh ref={ball} visible={false} rotation-z={0.25}>
          <sphereGeometry args={[0.27, 32, 24]} />
          <meshStandardMaterial map={tex.ball} roughness={0.85} />
        </mesh>
      </group>

      {/* click burst lives in world space so it does not scale with him */}
      <points ref={burst} geometry={burstGeo} visible={false}>
        <pointsMaterial size={0.07} color="#ff6a17" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </points>
    </group>
  )
}
