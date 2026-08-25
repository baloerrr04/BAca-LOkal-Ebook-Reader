'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/utils/db'
import { Document, Page, pdfjs } from 'react-pdf'
import { useThemeStore } from '@/store/themeStore'
import ThemePanel from '@/components/ThemePanel'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

// Helper to determine if a hex color is dark
function isColorDark(hex: string) {
  const c = hex.substring(1) // strip #
  const rgb = parseInt(c, 16)
  const r = (rgb >> 16) & 0xff
  const g = (rgb >>  8) & 0xff
  const b = (rgb >>  0) & 0xff
  // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b))
  return hsp < 127.5
}

export default function PdfReader({ bookId }: { bookId: string }) {
  const router = useRouter()
  const { theme, togglePanel } = useThemeStore()
  const isDark = isColorDark(theme.bgColor)
  
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState(1.0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const cached = await db.books.get(bookId)
        if (!cached || !cached.epubData) {
          throw new Error('Buku tidak ditemukan di perangkat')
        }

        // react-pdf can accept a File or Blob directly
        const pdfFile = new File([cached.epubData], cached.title || 'book.pdf', { type: 'application/pdf' })
        setFile(pdfFile)
      } catch (err: any) {
        setError(err.message || 'Gagal memuat PDF')
      } finally {
        setLoading(false)
      }
    }

    loadPdf()
  }, [bookId])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  const changePage = (offset: number) => {
    setPageNumber(prev => Math.min(Math.max(1, prev + offset), numPages))
  }

  const changeScale = (offset: number) => {
    setScale(prev => Math.min(Math.max(0.5, prev + offset), 3.0))
  }

  // Swipe / Drag support for both touch (mobile) and mouse (laptop)
  const touchStartX = useRef<number>(0)
  
  const handleDragStart = (clientX: number) => {
    touchStartX.current = clientX
  }

  const handleDragEnd = (clientX: number) => {
    const diff = touchStartX.current - clientX
    // If user dragged more than 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        changePage(1) // Next page
      } else {
        changePage(-1) // Prev page
      }
    }
  }

  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX)
  const onTouchEnd = (e: React.TouchEvent) => handleDragEnd(e.changedTouches[0].clientX)
  
  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX)
  const onMouseUp = (e: React.MouseEvent) => handleDragEnd(e.clientX)

  return (
    <div className="flex flex-col h-screen w-full bg-base-200">
      {/* Header Bar */}
      <div 
        className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-black/10 relative z-20 shadow-sm"
        style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
      >
        <button
          onClick={() => router.push('/library')}
          className="btn btn-ghost btn-sm btn-circle"
          style={{ color: theme.textColor }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-black/10 rounded-full px-2 py-1">
          <button onClick={() => changeScale(-0.1)} className="btn btn-ghost btn-xs btn-circle opacity-70 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
          </button>
          <span className="text-xs font-medium w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => changeScale(0.1)} className="btn btn-ghost btn-xs btn-circle opacity-70 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
          </button>
        </div>

        <button
          onClick={togglePanel}
          className="btn btn-ghost btn-sm btn-circle"
          style={{ color: theme.textColor }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* Viewer Area */}
      <div 
        className="flex-1 w-full relative overflow-auto flex flex-col items-center p-4 cursor-grab active:cursor-grabbing" 
        ref={containerRef}
        style={{ backgroundColor: theme.bgColor }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-base-content">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="animate-pulse">Menyiapkan PDF...</p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-error gap-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p>{error}</p>
            <button onClick={() => router.push('/library')} className="btn btn-primary mt-4">Kembali</button>
          </div>
        )}

        {file && !error && (
          <div 
            className="shadow-2xl bg-white mb-20 transition-transform origin-top"
            style={{
              // If the background is dark, we invert the PDF to simulate Dark Mode
              filter: isDark ? 'invert(1) hue-rotate(180deg)' : 'none'
            }}
          >
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="p-20 text-center animate-pulse">Memuat dokumen...</div>}
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="max-w-full"
              />
            </Document>
          </div>
        )}
      </div>

      {/* Bottom Nav / Pagination */}
      {numPages > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-base-100/90 backdrop-blur shadow-lg border border-black/10 px-6 py-3 rounded-full z-30">
          <button 
            onClick={() => changePage(-1)} 
            disabled={pageNumber <= 1}
            className="btn btn-circle btn-sm btn-ghost hover:bg-black/5 disabled:opacity-30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-sm font-medium whitespace-nowrap min-w-[80px] text-center">
            {pageNumber} / {numPages}
          </div>
          <button 
            onClick={() => changePage(1)} 
            disabled={pageNumber >= numPages}
            className="btn btn-circle btn-sm btn-ghost hover:bg-black/5 disabled:opacity-30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* Theme Options Panel */}
      <ThemePanel />
    </div>
  )
}
