import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ReadingMode = 'paginated' | 'scrolled'
export type FontFamily = 
  | 'Georgia, serif' 
  | "'Merriweather', serif" 
  | "'Open Sans', sans-serif" 
  | "'Source Code Pro', monospace"
  | "'Lora', serif"
  | "'Inter', sans-serif"
  | "'Roboto', sans-serif"
  | "'Playfair Display', serif"
  | "'Fira Code', monospace"

export interface ThemeConfig {
  // Colors
  bgColor: string
  textColor: string
  linkColor: string
  // Typography
  fontSize: number // percentage, e.g. 100 = 100%
  fontFamily: FontFamily
  lineHeight: number // e.g. 1.6
  // Layout
  readingMode: ReadingMode
}

export const PRESETS = {
  paper: {
    label: 'Paper',
    bgColor: '#F9F5EE',
    textColor: '#3D3221',
    linkColor: '#8B6914',
  },
  sepia: {
    label: 'Sepia',
    bgColor: '#EDE0C8',
    textColor: '#4A3728',
    linkColor: '#8B5E3C',
  },
  dark: {
    label: 'Dark',
    bgColor: '#1E1E2E',
    textColor: '#CDD6F4',
    linkColor: '#89B4FA',
  },
  night: {
    label: 'Night',
    bgColor: '#121212',
    textColor: '#B0AFAF',
    linkColor: '#BB86FC',
  },
  light: {
    label: 'Light',
    bgColor: '#FAFAFA',
    textColor: '#111111',
    linkColor: '#1A73E8',
  },
  oled: {
    label: 'OLED (Pure Black)',
    bgColor: '#000000',
    textColor: '#E0E0E0',
    linkColor: '#BB86FC',
  },
  rosePine: {
    label: 'Rosé Pine',
    bgColor: '#191724',
    textColor: '#e0def4',
    linkColor: '#c4a7e7',
  },
  solarizedLight: {
    label: 'Solar Light',
    bgColor: '#fdf6e3',
    textColor: '#657b83',
    linkColor: '#268bd2',
  },
  solarizedDark: {
    label: 'Solar Dark',
    bgColor: '#002b36',
    textColor: '#839496',
    linkColor: '#2aa198',
  },
  nord: {
    label: 'Nord',
    bgColor: '#2e3440',
    textColor: '#d8dee9',
    linkColor: '#81a1c1',
  },
}

export const DEFAULT_THEME: ThemeConfig = {
  bgColor: PRESETS.paper.bgColor,
  textColor: PRESETS.paper.textColor,
  linkColor: PRESETS.paper.linkColor,
  fontSize: 100,
  fontFamily: 'Georgia, serif',
  lineHeight: 1.7,
  readingMode: 'paginated',
}

interface ThemeStore {
  theme: ThemeConfig
  isPanelOpen: boolean
  setTheme: (patch: Partial<ThemeConfig>) => void
  applyPreset: (preset: keyof typeof PRESETS) => void
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      isPanelOpen: false,
      setTheme: (patch) =>
        set((state) => ({ theme: { ...state.theme, ...patch } })),
      applyPreset: (preset) =>
        set((state) => ({
          theme: {
            ...state.theme,
            bgColor: PRESETS[preset].bgColor,
            textColor: PRESETS[preset].textColor,
            linkColor: PRESETS[preset].linkColor,
          },
        })),
      togglePanel: () =>
        set((state) => ({ isPanelOpen: !state.isPanelOpen })),
      setPanelOpen: (open) => set({ isPanelOpen: open }),
    }),
    {
      name: 'ebook-theme-storage', // localStorage key
    }
  )
)
