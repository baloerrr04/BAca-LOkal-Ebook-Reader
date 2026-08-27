'use client'

import React, { useEffect, useRef } from 'react'
import { useThemeStore, PRESETS, type ThemeConfig, type FontFamily, type ReadingMode } from '@/store/themeStore'
import { saveThemePreference } from '@/app/reader/actions'

const FONT_OPTIONS: { label: string; value: FontFamily }[] = [
  { label: 'Georgia (Serif)', value: 'Georgia, serif' },
  { label: 'Merriweather', value: "'Merriweather', serif" },
  { label: 'Open Sans', value: "'Open Sans', sans-serif" },
  { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
  { label: 'Lora (Serif)', value: "'Lora', serif" },
  { label: 'Inter (Sans)', value: "'Inter', sans-serif" },
  { label: 'Roboto (Sans)', value: "'Roboto', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Fira Code', value: "'Fira Code', monospace" },
]

interface ThemePanelProps {
  onThemeChange?: (theme: ThemeConfig) => void
}

export default function ThemePanel({ onThemeChange }: ThemePanelProps = {}) {
  const { theme, isPanelOpen, setTheme, applyPreset, setPanelOpen } = useThemeStore()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced save to Supabase on theme change
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveThemePreference(theme).catch(() => {/* silent fail — localStorage still persists */})
      if (typeof onThemeChange === 'function') {
        onThemeChange(theme)
      }
    }, 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [theme, onThemeChange])

  const handleChange = (patch: Partial<ThemeConfig>) => {
    setTheme(patch)
    if (typeof onThemeChange === 'function') {
      onThemeChange({ ...theme, ...patch })
    }
  }

  const handlePreset = (preset: keyof typeof PRESETS) => {
    applyPreset(preset)
    if (typeof onThemeChange === 'function') {
      onThemeChange({
        ...theme,
        bgColor: PRESETS[preset].bgColor,
        textColor: PRESETS[preset].textColor,
        linkColor: PRESETS[preset].linkColor,
      })
    }
  }

  if (!isPanelOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
        onClick={() => setPanelOpen(false)}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-14 bottom-0 z-40 w-80 shadow-2xl overflow-y-auto
                   border-l border-white/10 transition-transform duration-300"
        style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
      >
        <div className="p-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg tracking-tight">Pengaturan Membaca</h2>
            <button
              onClick={() => setPanelOpen(false)}
              className="p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          {/* Color Presets */}
          <section>
            <label className="block text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
              Tema
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => (
                <button
                  key={key}
                  onClick={() => handlePreset(key)}
                  title={PRESETS[key].label}
                  className="h-9 w-full rounded-lg border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: PRESETS[key].bgColor,
                    color: PRESETS[key].textColor,
                    borderColor:
                      theme.bgColor === PRESETS[key].bgColor
                        ? PRESETS[key].textColor
                        : 'transparent',
                  }}
                >
                  A
                </button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2 mt-1">
              {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => (
                <span
                  key={key}
                  className="text-center text-[10px] opacity-50"
                >
                  {PRESETS[key].label}
                </span>
              ))}
            </div>
          </section>

          {/* Custom Colors */}
          <section>
            <label className="block text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
              Warna Kustom
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Latar Belakang</span>
                <input
                  type="color"
                  value={theme.bgColor}
                  onChange={(e) => handleChange({ bgColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Warna Teks</span>
                <input
                  type="color"
                  value={theme.textColor}
                  onChange={(e) => handleChange({ textColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="border-t opacity-10" />

          {/* Font Size */}
          <section>
            <label className="block text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
              Ukuran Huruf: {theme.fontSize}%
            </label>
            <div className="flex items-center gap-3">
              <span className="text-sm opacity-60">A</span>
              <input
                type="range"
                min="70"
                max="180"
                step="5"
                value={theme.fontSize}
                onChange={(e) => handleChange({ fontSize: parseInt(e.target.value) })}
                className="flex-1 accent-current"
              />
              <span className="text-lg opacity-60">A</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[80, 100, 120, 150].map((size) => (
                <button
                  key={size}
                  onClick={() => handleChange({ fontSize: size })}
                  className={`flex-1 py-1 rounded text-xs transition-all ${
                    theme.fontSize === size ? 'ring-2 ring-current font-bold' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {size}%
                </button>
              ))}
            </div>
          </section>

          {/* Font Family */}
          <section>
            <label className="block text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
              Jenis Huruf
            </label>
            <div className="space-y-1">
              {FONT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChange({ fontFamily: opt.value })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    theme.fontFamily === opt.value
                      ? 'ring-2 ring-current font-semibold bg-black/10'
                      : 'opacity-70 hover:opacity-100 hover:bg-black/5'
                  }`}
                  style={{ fontFamily: opt.value }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Line Height */}
          <section>
            <label className="block text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
              Jarak Baris: {theme.lineHeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="1.2"
              max="2.5"
              step="0.1"
              value={theme.lineHeight}
              onChange={(e) => handleChange({ lineHeight: parseFloat(e.target.value) })}
              className="w-full accent-current"
            />
            <div className="flex justify-between text-xs opacity-40 mt-1">
              <span>Rapat</span>
              <span>Renggang</span>
            </div>
          </section>

          {/* Divider */}
          <div className="border-t opacity-10" />

          {/* Reading Mode */}
          <section>
            <label className="block text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
              Mode Membaca
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['paginated', 'scrolled'] as ReadingMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleChange({ readingMode: mode })}
                  className={`py-3 px-2 rounded-xl text-sm flex flex-col items-center gap-1.5 transition-all border-2 ${
                    theme.readingMode === mode
                      ? 'border-current font-semibold'
                      : 'border-transparent opacity-50 hover:opacity-80 bg-black/5'
                  }`}
                >
                  {mode === 'paginated' ? (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Halaman</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span>Gulir</span>
                    </>
                  )}
                </button>
              ))}
            </div>
            {theme.readingMode === 'paginated' && (
              <p className="text-xs opacity-50 mt-2 text-center">
                Usap atau gunakan tombol panah untuk membalik halaman
              </p>
            )}
          </section>
          {/* Divider */}
          <div className="border-t opacity-10" />

          {/* Theme Copas (Export/Import) */}
          <section>
            <label className="block text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
              Salin Tema (Ekspor/Impor)
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const themeStr = JSON.stringify(theme)
                  navigator.clipboard.writeText(themeStr)
                  alert('Tema disalin ke papan klip!')
                }}
                className="flex-1 py-2 bg-black/10 hover:bg-black/20 text-xs font-bold rounded-lg transition-colors"
              >
                Salin Tema
              </button>
              <button
                onClick={() => {
                  const input = prompt('Tempel JSON tema Anda di sini:')
                  if (!input) return
                  try {
                    const parsed = JSON.parse(input)
                    if (parsed && typeof parsed === 'object') {
                      handleChange(parsed)
                      alert('Tema berhasil diterapkan!')
                    }
                  } catch (e) {
                    alert('Format tema tidak valid')
                  }
                }}
                className="flex-1 py-2 bg-black/10 hover:bg-black/20 text-xs font-bold rounded-lg transition-colors"
              >
                Tempel Tema
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
