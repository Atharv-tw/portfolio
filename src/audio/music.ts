/**
 * Zero-asset generative music — a warm, loopable lofi bed built live from
 * oscillators on the same AudioContext the SFX synth uses. No audio files,
 * no licensing, endless variation. Runs its own lookahead scheduler and
 * publishes a loudness/beat signal to `musicState` so the mascot and the
 * on-screen visualizer can dance to it.
 */
import { getCtx, unlockAudio } from './synth'
import { musicState } from './musicState'

// ---- musical material: vi – IV – I – V in C (hopeful, easy-going) ----
interface Chord {
  bass: number
  tones: number[]
}
const PROG: Chord[] = [
  { bass: 110.0, tones: [220.0, 261.63, 329.63, 392.0] }, // Am7
  { bass: 87.31, tones: [174.61, 220.0, 261.63, 329.63] }, // Fmaj7
  { bass: 130.81, tones: [261.63, 329.63, 392.0, 493.88] }, // Cmaj7
  { bass: 98.0, tones: [196.0, 246.94, 293.66, 349.23] }, // G7
]

const BPM = 74
const STEPS_PER_BAR = 16
const LOOP_STEPS = STEPS_PER_BAR * PROG.length
const SEC_PER_STEP = 60 / BPM / 4 // 16th notes
const LOOKAHEAD = 0.1 // seconds scheduled ahead
const TICK_MS = 25
const BUS_LEVEL = 0.5

let ctx: AudioContext | null = null
let bus: GainNode | null = null
let analyser: AnalyserNode | null = null
let noiseBuf: AudioBuffer | null = null

let timer = 0
let rafId = 0
let nextStepTime = 0
let step = 0
let playing = false

const listeners = new Set<(v: boolean) => void>()

function build(c: AudioContext) {
  if (bus) return
  bus = c.createGain()
  bus.gain.value = 0

  const warmth = c.createBiquadFilter()
  warmth.type = 'lowpass'
  warmth.frequency.value = 2600
  warmth.Q.value = 0.4

  const comp = c.createDynamicsCompressor()
  comp.threshold.value = -18
  comp.knee.value = 20
  comp.ratio.value = 6
  comp.attack.value = 0.004
  comp.release.value = 0.16

  analyser = c.createAnalyser()
  analyser.fftSize = 128
  analyser.smoothingTimeConstant = 0.72

  bus.connect(warmth)
  warmth.connect(comp)
  comp.connect(analyser)
  analyser.connect(c.destination)
}

function getNoise(c: AudioContext) {
  if (noiseBuf) return noiseBuf
  const len = Math.floor(c.sampleRate * 0.5)
  noiseBuf = c.createBuffer(1, len, c.sampleRate)
  const d = noiseBuf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return noiseBuf
}

// ---- voices ----
function pluck(freq: number, t: number, dur: number, peak: number, type: OscillatorType) {
  if (!ctx || !bus) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g)
  g.connect(bus)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

function pad(tones: number[], t: number, dur: number) {
  if (!ctx || !bus) return
  tones.forEach((f, i) => {
    const osc = ctx!.createOscillator()
    const g = ctx!.createGain()
    osc.type = i % 2 ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(f, t)
    osc.detune.setValueAtTime((i - 1.5) * 4, t) // slight spread = warmth
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.05, t + 0.25)
    g.gain.setValueAtTime(0.05, t + dur * 0.6)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g)
    g.connect(bus!)
    osc.start(t)
    osc.stop(t + dur + 0.1)
  })
}

function bass(freq: number, t: number, dur: number) {
  if (!ctx || !bus) return
  const osc = ctx.createOscillator()
  const sub = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'triangle'
  sub.type = 'sine'
  osc.frequency.setValueAtTime(freq, t)
  sub.frequency.setValueAtTime(freq / 2, t)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.16, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g)
  sub.connect(g)
  g.connect(bus)
  osc.start(t)
  sub.start(t)
  osc.stop(t + dur + 0.05)
  sub.stop(t + dur + 0.05)
}

function kick(t: number) {
  if (!ctx || !bus) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, t)
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.12)
  g.gain.setValueAtTime(0.3, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
  osc.connect(g)
  g.connect(bus)
  osc.start(t)
  osc.stop(t + 0.26)
}

function hat(t: number, peak: number) {
  if (!ctx || !bus) return
  const src = ctx.createBufferSource()
  src.buffer = getNoise(ctx)
  const f = ctx.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = 7500
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  src.connect(f)
  f.connect(g)
  g.connect(bus)
  src.start(t)
  src.stop(t + 0.08)
}

// walking arp index across the current chord's tones
let arpWalk = 0

function scheduleStep(s: number, t: number) {
  const bar = Math.floor(s / STEPS_PER_BAR) % PROG.length
  const inBar = s % STEPS_PER_BAR
  const chord = PROG[bar]

  // pad + downbeat bass at the top of every bar
  if (inBar === 0) {
    pad(chord.tones, t, SEC_PER_STEP * STEPS_PER_BAR * 1.02)
    bass(chord.bass, t, SEC_PER_STEP * 6)
  }
  if (inBar === 8) bass(chord.bass, t, SEC_PER_STEP * 5)

  // kick on beats 1 & 3 — publish the beat to wall-clock for the visuals
  if (inBar === 0 || inBar === 8) {
    kick(t)
    const delay = Math.max(0, (t - (ctx?.currentTime ?? 0)) * 1000)
    window.setTimeout(() => {
      musicState.beatAt = performance.now()
    }, delay)
  }

  // lazy hats on the off-beats
  if (inBar === 4 || inBar === 12) hat(t, 0.05)
  if (inBar === 6 || inBar === 14) hat(t, 0.025)

  // gentle arp / melody on 8th notes, with room to breathe
  if (inBar % 2 === 0 && Math.random() > 0.22) {
    arpWalk = (arpWalk + 1 + (Math.random() > 0.7 ? 1 : 0)) % chord.tones.length
    const oct = Math.random() > 0.78 ? 2 : 1
    pluck(chord.tones[arpWalk] * oct, t, 0.5, 0.1, 'triangle')
  }
}

function scheduler() {
  if (!ctx) return
  while (nextStepTime < ctx.currentTime + LOOKAHEAD) {
    scheduleStep(step, nextStepTime)
    nextStepTime += SEC_PER_STEP
    step = (step + 1) % LOOP_STEPS
  }
}

const freqData = new Uint8Array(64)
function raf() {
  if (!playing || !analyser) return
  analyser.getByteFrequencyData(freqData)
  let sum = 0
  for (let i = 0; i < 40; i++) sum += freqData[i] // low-mids carry the groove
  const level = sum / (40 * 255)
  musicState.level += (Math.min(1, level * 1.7) - musicState.level) * 0.16
  musicState.hue = (musicState.hue + 0.0006) % 1
  rafId = requestAnimationFrame(raf)
}

export function isMusicPlaying() {
  return playing
}

export function getMusicAnalyser() {
  return analyser
}

export function onMusicChange(cb: (v: boolean) => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function playMusic() {
  if (playing) return
  unlockAudio()
  ctx = getCtx()
  if (!ctx) return
  build(ctx)
  void ctx.resume()
  playing = true
  musicState.playing = true
  step = 0
  nextStepTime = ctx.currentTime + 0.08
  bus!.gain.cancelScheduledValues(ctx.currentTime)
  bus!.gain.setValueAtTime(bus!.gain.value, ctx.currentTime)
  bus!.gain.linearRampToValueAtTime(BUS_LEVEL, ctx.currentTime + 0.6)
  timer = window.setInterval(scheduler, TICK_MS)
  rafId = requestAnimationFrame(raf)
  listeners.forEach((cb) => cb(true))
}

export function pauseMusic() {
  if (!playing || !ctx || !bus) return
  playing = false
  musicState.playing = false
  bus.gain.cancelScheduledValues(ctx.currentTime)
  bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime)
  bus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
  window.clearInterval(timer)
  cancelAnimationFrame(rafId)
  musicState.level = 0
  listeners.forEach((cb) => cb(false))
}

export function toggleMusic() {
  playing ? pauseMusic() : playMusic()
}
