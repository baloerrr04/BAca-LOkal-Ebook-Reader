'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/utils/db'
import { useThemeStore } from '@/store/themeStore'
import ThemePanel from '@/components/ThemePanel'

export default function TxtReader({ bookId }: { bookId: string }) {
  const router = useRouter()
  const { theme, isPanelOpen, togglePanel } = useThemeStore()
  
  const [text, setText] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadTxt = async () => {
      try {
        const cached = await db.books.get(bookId)
        if (!cached || !cached.epubData) {
          throw new Error('File teks tidak ditemukan di perangkat')
        }

        setTitle(cached.title || 'Unknown TXT')

        // Read ArrayBuffer or Blob as Text
        let txtString = ''
        if (cached.epubData instanceof Blob) {
          txtString = await cached.epubData.text()
        } else {
          const decoder = new TextDecoder('utf-8')
          txtString = decoder.decode(cached.epubData)
        }
        
        setText(txtString)
      } catch (err: any) {
        setError(err.message || 'Gagal memuat file TXT')
      } finally {
        setLoading(false)
      }
    }

    loadTxt()
  }, [bookId])

  // Handle panel click outside
  const handleWrapperClick = () => {
    if (isPanelOpen) togglePanel()
  }

  // Define dynamic style based on theme
  const contentStyle = {
    backgroundColor: theme.bgColor,
    color: theme.textColor,
    fontFamily: theme.fontFamily,
    fontSize: `${theme.fontSize}%`,
    lineHeight: theme.lineHeight,
  }

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden" style={{ backgroundColor: theme.bgColor }}>
      {/* Header Bar */}
      <div 
        className="h-14 shrink-0 flex items-center px-4 shadow-sm z-20 border-b border-black/5"
        style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
      >
        <button
          onClick={() => router.push('/library')}
          className="btn btn-ghost btn-sm btn-circle absolute left-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="w-full text-center truncate px-12">
          <span className="font-semibold opacity-90 text-sm md:text-base">{title}</span>
        </div>
        <button
          onClick={togglePanel}
          className="btn btn-ghost btn-sm btn-circle absolute right-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* Viewer Area (Scrollable) */}
      <div 
        className="flex-1 w-full overflow-y-auto overflow-x-hidden relative"
        onClick={handleWrapperClick}
        style={{ backgroundColor: theme.bgColor }}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-base-content">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="animate-pulse font-medium">Memuat teks...</p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-error gap-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="font-semibold">{error}</p>
            <button onClick={() => router.push('/library')} className="btn btn-primary mt-4">Kembali</button>
          </div>
        )}

        {!loading && !error && (
          <div 
            className="w-full max-w-3xl mx-auto px-6 sm:px-12 md:px-16 py-8 sm:py-12"
          >
            <div 
              ref={contentRef}
              className="whitespace-pre-wrap break-words"
              style={contentStyle}
            >
              {text}
            </div>
          </div>
        )}
      </div>

      {/* Theme Options Panel */}
      <ThemePanel />
    </div>
  )
}
