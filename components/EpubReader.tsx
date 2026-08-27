'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import ePub, { Book, Rendition } from 'epubjs'
import { db } from '@/utils/db'
import { createClient } from '@/utils/supabase/client'
import { useThemeStore, type ThemeConfig } from '@/store/themeStore'
import ThemePanel from '@/components/ThemePanel'
import Link from 'next/link'

interface EpubReaderProps {
  bookId: string
}

interface TranslationData {
  text: string
  translatedText: string | null
  x: number
  y: number
  loading: boolean
}

export default function EpubReader({ bookId }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<Book | null>(null)
  const renditionRef = useRef<Rendition | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | 'none'>('none')
  const [title, setTitle] = useState<string>('Reading')
  const [translation, setTranslation] = useState<TranslationData | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(0)

  const { theme, isPanelOpen, togglePanel } = useThemeStore()
  const prevThemeRef = useRef<ThemeConfig>(theme)

  // Build the CSS string for Epub.js rendition
  const buildThemeCSS = useCallback((t: ThemeConfig) => ({
    body: {
      background: t.bgColor + ' !important',
      color: t.textColor + ' !important',
      'font-size': `${t.fontSize}% !important`,
      'font-family': `${t.fontFamily} !important`,
      'line-height': `${t.lineHeight} !important`,
      margin: '0 !important',
      padding: '0 !important',
    },
    'p, h1, h2, h3, h4, div, span': {
      'word-break': 'break-word !important',
      'max-width': '100% !important',
    },
    'img, video, svg': {
      'max-width': '100% !important',
      'height': 'auto !important',
    },
    a: { color: t.linkColor + ' !important' },
  }), [])

  const applyThemeToRendition = useCallback((rendition: Rendition, t: ThemeConfig) => {
    rendition.themes.register('custom', buildThemeCSS(t))
    rendition.themes.select('custom')
  }, [buildThemeCSS])

  const initBook = useCallback(async (epubData: ArrayBuffer | Blob, currentTheme: ThemeConfig) => {
    if (!viewerRef.current) return

    // Destroy previous instance
    if (bookRef.current) {
      bookRef.current.destroy()
      bookRef.current = null
      renditionRef.current = null
    }
    // Clear viewer
    viewerRef.current.innerHTML = ''

    const book = ePub(epubData as ArrayBuffer)
    bookRef.current = book

    const renditionOptions =
      currentTheme.readingMode === 'paginated'
        ? {
            width: '100%',
            height: '100%',
            spread: 'none' as const,
            flow: 'paginated' as const,
          }
        : {
            width: '100%',
            height: '100%',
            flow: 'scrolled-doc' as const,
          }

    const rendition = book.renderTo(viewerRef.current, renditionOptions)
    renditionRef.current = rendition

    applyThemeToRendition(rendition, currentTheme)
    await rendition.display()

    // Track page info on navigation
    rendition.on('relocated', (location: any) => {
      try {
        const displayed = location?.start?.displayed
        if (displayed) {
          setCurrentPage(displayed.page ?? 0)
          setTotalPages(displayed.total ?? 0)
        }
      } catch (_) {}
    })

    // Keyboard navigation
    rendition.on('keyup', (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    })

    // Text selection for translation
    rendition.on('selected', async (cfiRange: string, contents: any) => {
      try {
        const range = await book.getRange(cfiRange)
        const text = range.toString().trim()
        if (!text) return
        
        // Get bounding rect
        const selection = contents.window.getSelection()
        if (!selection || selection.rangeCount === 0) return
        const rect = selection.getRangeAt(0).getBoundingClientRect()
        
        setTranslation({
          text,
          translatedText: null,
          x: rect.left + rect.width / 2,
          y: rect.top,
          loading: true
        })

        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        })
        const data = await res.json()
        if (data.result) {
          setTranslation(prev => prev && prev.text === text ? { ...prev, translatedText: data.result, loading: false } : prev)
        } else {
          setTranslation(prev => prev && prev.text === text ? { ...prev, translatedText: 'Translation failed', loading: false } : prev)
        }
      } catch (err) {
        setTranslation(prev => prev ? { ...prev, translatedText: 'Error', loading: false } : null)
      }
    })

    // Dismiss popup when user starts interacting again (not on click, which fires after selection)
    rendition.on('mousedown', () => setTranslation(null))
    rendition.on('touchstart', () => setTranslation(null))
  }, [applyThemeToRendition])

  // Load book from cache or Supabase
  useEffect(() => {
    let cancelled = false

    const loadBook = async () => {
      try {
        setLoading(true)
        setError(null)

        let epubData: ArrayBuffer | Blob | null = null
        const cached = await db.books.get(bookId)

        if (cached) {
          epubData = cached.epubData
          setTitle(cached.title || 'Reading')
        } else {
           throw new Error('Book not found on this device.')
        }

        if (!cancelled && epubData) {
          await initBook(epubData, theme)
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? 'Failed to load book')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadBook()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId])

  // React to reading mode change — re-init rendition
  useEffect(() => {
    if (prevThemeRef.current.readingMode !== theme.readingMode && bookRef.current) {
      const rebind = async () => {
        if (!viewerRef.current) return
        const cached = await db.books.get(bookId)
        if (cached) {
          await initBook(cached.epubData, theme)
        }
      }
      rebind()
    }
    prevThemeRef.current = theme
  }, [theme.readingMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // React to visual-only theme changes (no re-init needed)
  useEffect(() => {
    if (renditionRef.current) {
      applyThemeToRendition(renditionRef.current, theme)
    }
  }, [theme.bgColor, theme.textColor, theme.linkColor, theme.fontSize, theme.fontFamily, theme.lineHeight, applyThemeToRendition])

  const handleNext = useCallback(() => {
    if (!renditionRef.current || isAnimating) return
    if (theme.readingMode === 'paginated') {
      setSlideDir('left')
      setIsAnimating(true)
      setTimeout(() => {
        renditionRef.current?.next()
        setIsAnimating(false)
        setSlideDir('none')
      }, 200)
    } else {
      renditionRef.current.next()
    }
  }, [isAnimating, theme.readingMode])

  const handlePrev = useCallback(() => {
    if (!renditionRef.current || isAnimating) return
    if (theme.readingMode === 'paginated') {
      setSlideDir('right')
      setIsAnimating(true)
      setTimeout(() => {
        renditionRef.current?.prev()
        setIsAnimating(false)
        setSlideDir('none')
      }, 200)
    } else {
      renditionRef.current.prev()
    }
  }, [isAnimating, theme.readingMode])

  const handleThemeChange = useCallback((newTheme: ThemeConfig) => {
    if (renditionRef.current) {
      applyThemeToRendition(renditionRef.current, newTheme)
    }
  }, [applyThemeToRendition])

  // Swipe gesture support
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const diffX = touchStartX.current - e.changedTouches[0].clientX
    const diffY = touchStartY.current - e.changedTouches[0].clientY
    // Only trigger horizontal swipe if horizontal movement is dominant
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0) handleNext()
      else handlePrev()
    }
  }

  const slideClass = slideDir === 'left'
    ? 'translate-x-[-20px] opacity-0'
    : slideDir === 'right'
    ? 'translate-x-[20px] opacity-0'
    : 'translate-x-0 opacity-100'

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
    >
      {/* ── Toolbar ───────────────────────────────────────────── */}
      <header
        className="h-14 shrink-0 flex items-center justify-between px-4 z-20 shadow-sm border-b border-black/10"
        style={{ backgroundColor: theme.bgColor }}
      >
        <Link
          href="/library"
          className="flex items-center gap-1.5 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Library
        </Link>

        <p className="text-sm font-semibold opacity-70 truncate max-w-[40%] text-center">
          {title}
        </p>

        <div className="flex items-center gap-2">
          {/* Reading mode quick-switch */}
          <button
            onClick={() => {
              const next = theme.readingMode === 'paginated' ? 'scrolled' : 'paginated'
              useThemeStore.getState().setTheme({ readingMode: next })
            }}
            className="p-2 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            title={theme.readingMode === 'paginated' ? 'Switch to Scroll' : 'Switch to Pages'}
          >
            {theme.readingMode === 'paginated' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            )}
          </button>

          {/* Theme panel toggle */}
          <button
            onClick={togglePanel}
            className={`p-2 rounded-lg transition-all ${isPanelOpen ? 'bg-black/10 opacity-100' : 'opacity-60 hover:opacity-100'}`}
            title="Reading Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Reader Area ───────────────────────────────────────── */}
      <div
        className="flex-1 relative flex overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Loading overlay */}
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center z-20"
            style={{ backgroundColor: theme.bgColor }}
          >
            <div
              className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderBottomColor: theme.textColor,
                borderLeftColor: theme.textColor,
                borderRightColor: theme.textColor,
                borderTopColor: 'transparent'
              }}
            />
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-20 p-8">
            <div className="max-w-md text-center space-y-3 bg-red-50 border border-red-200 rounded-xl p-6">
              <p className="text-red-600 font-bold">Failed to load book</p>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Prev button — desktop only (mobile uses swipe) */}
        {theme.readingMode === 'paginated' && (
          <button
            onClick={handlePrev}
            className="hidden sm:flex absolute left-0 top-0 bottom-0 w-14 z-10 items-center justify-center opacity-0 hover:opacity-100 transition-opacity group"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-black/10 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: theme.bgColor }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>
        )}

        {/* EPUB Viewer */}
        <div
          className={`flex-1 min-w-0 h-full transition-all duration-200 ease-out ${slideClass} flex px-4 sm:px-8 md:px-12 lg:px-20 py-2 sm:py-6`}
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Inner container to match iframe size exactly for popup positioning */}
          <div className="relative w-full h-full min-w-0">
            <div ref={viewerRef} className="w-full h-full min-w-0 overflow-hidden" />
            
            {/* Translation Popup */}
            {translation && (
              <div
                className="absolute z-50 transform -translate-x-1/2 -translate-y-full pb-3"
                style={{
                  left: translation.x,
                  top: translation.y,
                }}
              >
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-black/5 p-4 w-64 md:w-80 pointer-events-auto">
                  {/* Little triangle arrow pointing down */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-b border-r border-black/5 transform rotate-45"></div>
                  
                  <div className="relative z-10">
                    <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                      Terjemahan
                    </div>
                    {translation.loading ? (
                      <div className="flex items-center gap-3 text-sm text-secondary py-1">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        Menerjemahkan...
                      </div>
                    ) : (
                      <div className="text-sm text-base-content font-medium leading-relaxed">
                        {translation.translatedText}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next button — desktop only (mobile uses swipe) */}
        {theme.readingMode === 'paginated' && (
          <button
            onClick={handleNext}
            className="hidden sm:flex absolute right-0 top-0 bottom-0 w-14 z-10 items-center justify-center opacity-0 hover:opacity-100 transition-opacity group"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-black/10 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: theme.bgColor }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* ── Bottom Nav Bar (paginated) ────────────────────────── */}
      {theme.readingMode === 'paginated' && (
        <div
          className="shrink-0 flex items-center justify-between px-4 sm:px-8 border-t border-black/10"
          style={{ backgroundColor: theme.bgColor, paddingTop: '10px', paddingBottom: '14px' }}
        >
          {/* Prev button */}
          <button
            onClick={handlePrev}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border border-black/15 hover:bg-black/5 active:bg-black/10 transition-colors min-w-[80px] justify-center select-none"
            style={{ color: theme.textColor }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Prev</span>
          </button>

          {/* Page indicator */}
          <div className="flex flex-col items-center gap-0.5">
            {totalPages > 0 ? (
              <>
                <span className="text-sm font-bold" style={{ color: theme.textColor }}>
                  {currentPage}
                  <span className="font-normal opacity-40 mx-1">/</span>
                  {totalPages}
                </span>
                <span className="text-[10px] opacity-35 font-medium tracking-wide uppercase" style={{ color: theme.textColor }}>Halaman</span>
              </>
            ) : (
              <span className="text-xs opacity-30" style={{ color: theme.textColor }}>· · ·</span>
            )}
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border border-black/15 hover:bg-black/5 active:bg-black/10 transition-colors min-w-[80px] justify-center select-none"
            style={{ color: theme.textColor }}
          >
            <span>Next</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Theme Panel ───────────────────────────────────────── */}
      <ThemePanel onThemeChange={handleThemeChange} />
    </div>
  )
}
