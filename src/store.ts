import { create } from 'zustand'
import type { SceneId, SectionId } from './content/resume'

export type BotMood = 'idle' | 'happy' | 'dizzy' | 'sleep' | 'wave' | 'flip' | 'party'

interface AppState {
  /** user clicked Enter on the preloader (also unlocks audio) */
  entered: boolean
  enter: () => void
  muted: boolean
  toggleMuted: () => void
  section: SectionId
  setSection: (s: SectionId) => void
  /** the section, or the featured project currently on stage — drives the bot */
  scene: SceneId
  setScene: (s: SceneId) => void
  botMood: BotMood
  setBotMood: (m: BotMood) => void
  paletteOpen: boolean
  setPaletteOpen: (v: boolean) => void
  caseOpenId: string | null
  setCaseOpenId: (id: string | null) => void
  logOpen: boolean
  setLogOpen: (v: boolean) => void
  menuOpen: boolean
  setMenuOpen: (v: boolean) => void
}

const storedMute =
  typeof window !== 'undefined' && window.localStorage.getItem('at-muted') === '1'

export const useApp = create<AppState>((set) => ({
  entered: false,
  enter: () => set({ entered: true }),
  muted: storedMute,
  toggleMuted: () =>
    set((s) => {
      const muted = !s.muted
      window.localStorage.setItem('at-muted', muted ? '1' : '0')
      return { muted }
    }),
  section: 'hero',
  setSection: (section) => set({ section }),
  scene: 'hero',
  setScene: (scene) => set({ scene }),
  botMood: 'idle',
  setBotMood: (botMood) => set({ botMood }),

  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  caseOpenId: null,
  setCaseOpenId: (caseOpenId) => set({ caseOpenId }),
  logOpen: false,
  setLogOpen: (logOpen) => set({ logOpen }),
  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
}))

// dev-only handle for poking at state from the console; stripped from builds
if (import.meta.env.DEV) {
  ;(window as unknown as { __app?: typeof useApp }).__app = useApp
}
