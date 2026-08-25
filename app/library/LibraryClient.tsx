'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { db } from '@/utils/db'

interface BookMetadata {
  id: string
  title: string
  author: string
  uploaded_at: string
}

export default function LibraryClient() {
  const [localBooks, setLocalBooks] = useState<BookMetadata[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const loadLocalBooks = async () => {
      try {
        const allLocal = await db.books.toArray()
        const mappedBooks: BookMetadata[] = allLocal.map(b => ({
          id: b.id,
          title: b.title || 'Unknown Title',
          author: b.author || 'Unknown Author',
          uploaded_at: new Date(b.cachedAt).toISOString(),
        }))
        mappedBooks.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
        setLocalBooks(mappedBooks)
      } catch (err) {
        console.error('Failed to load local books', err)
      }
    }
    loadLocalBooks()
  }, [])

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['epub', 'pdf', 'txt'].includes(ext || '')) {
      throw new Error('Hanya file EPUB atau PDF yang didukung')
    }
    
    const localId = crypto.randomUUID()
    const title = file.name.replace(`.${ext}`, '')
    const arrayBuffer = await file.arrayBuffer()
    
    await db.books.put({
      id: localId,
      epubData: arrayBuffer,
      cachedAt: Date.now(),
      title: title,
      author: 'Unknown Author',
      fileType: ext
    })
    return { id: localId, title, author: 'Unknown Author', uploaded_at: new Date().toISOString() }
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUploading(true)
    setError(null)
    try {
      const formData = new FormData(e.currentTarget)
      const file = formData.get('file') as File
      if (!file) throw new Error('No file selected')
      const newBook = await processFile(file)
      setLocalBooks(prev => [newBook, ...prev])
      ;(e.target as HTMLFormElement).reset()
    } catch (err: any) {
      setError(err.message || 'Failed to open file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    setIsUploading(true)
    setError(null)
    try {
      const newBook = await processFile(file)
      setLocalBooks(prev => [newBook, ...prev])
    } catch (err: any) {
      setError(err.message || 'Failed to open file')
    } finally {
      setIsUploading(false)
    }
  }

  const [deleteTarget, setDeleteTarget] = useState<{ id: string, title: string } | null>(null)

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await db.books.delete(deleteTarget.id)
      setLocalBooks(prev => prev.filter(b => b.id !== deleteTarget.id))
    } catch (err) {
      console.error('Failed to delete book', err)
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="border-b border-base-300/50 bg-base-100/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-base-content tracking-tight">My Library</h1>
          </div>
          <Link href="/" className="btn btn-ghost btn-sm rounded-xl gap-1.5 text-secondary hover:text-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 space-y-8">
        {/* Upload / Drop Zone */}
        <div
          className={`card border-2 border-dashed transition-all duration-200 ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-base-300/60 bg-base-200/40 hover:border-base-300'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="card-body items-center justify-center text-center p-12">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-4 text-primary transition-transform group-hover:scale-110 group-hover:rotate-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <div className="font-semibold text-lg text-base-content mb-2">Upload buku baru</div>
            <div className="text-sm text-secondary px-8">Seret & lepas file EPUB atau PDF ke sini, atau klik tombol di bawah</div>

            <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3 items-center w-full max-w-md mt-6">
              <input
                type="file"
                name="file"
                accept=".epub,.pdf,.txt"
                className="file-input file-input-bordered file-input-sm w-full rounded-xl"
                required
                disabled={isUploading}
              />
              <button
                type="submit"
                disabled={isUploading}
                className="btn btn-primary btn-sm rounded-xl px-6 w-full sm:w-auto shadow-sm"
              >
                {isUploading ? (
                  <><span className="loading loading-spinner loading-xs"></span> Loading</>
                ) : (
                  '📖 Open'
                )}
              </button>
            </form>
            {error && (
              <div className="alert alert-error mt-4 rounded-xl text-sm py-2 px-4">
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Banner for PDF Limitations */}
        <div className="w-full bg-base-200/50 border border-base-300/60 rounded-2xl p-4 flex gap-3 shadow-sm transition-all hover:bg-base-200/80">
          <div className="text-secondary mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-base-content mb-1">Sekilas Info</h3>
            <p className="text-xs text-base-content/80 leading-relaxed">
              Jika Anda mengunggah file <b>PDF</b>, harap diingat bahwa tata letaknya kaku (jenis huruf dan ukurannya tidak dapat diubah). 
              Untuk pengalaman membaca yang jauh lebih nyaman, interaktif, dan dapat disesuaikan sesuka hati, kami sangat menyarankan Anda 
              membaca buku dengan <b>format EPUB</b>.
            </p>
          </div>
        </div>

        {/* Book Grid */}
        <div>
          <h2 className="text-lg font-bold text-base-content mb-5 flex items-center gap-2">
            <span>📚</span> Recently Opened
            {localBooks.length > 0 && (
              <span className="badge badge-sm badge-ghost rounded-lg font-medium">{localBooks.length}</span>
            )}
          </h2>
          {localBooks.length === 0 ? (
            <div className="card bg-base-200/40 border border-base-300/40 rounded-2xl">
              <div className="card-body items-center text-center py-16">
                <div className="text-5xl mb-4">📖</div>
                <div className="font-semibold text-lg text-base-content mb-2">Upload buku baru</div>
                <div className="text-sm text-secondary px-8">Seret & lepas file EPUB atau PDF ke sini, atau klik tombol di bawah</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {localBooks.map((book) => (
                <div
                  key={book.id}
                  className="card bg-base-200/50 border border-base-300/40 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group relative rounded-2xl"
                >
                  <Link href={`/reader/${book.id}`} className="card-body p-5 gap-3">
                    {/* Book icon */}
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <svg className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base-content truncate group-hover:text-primary transition-colors text-sm">
                        {book.title}
                      </h3>
                      <p className="text-xs text-secondary/60 truncate mt-0.5">{book.author}</p>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDelete(book.id, book.title || 'Buku ini')
                    }}
                    className="absolute top-3 right-3 btn btn-ghost btn-xs btn-circle text-error/40 opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error/10 transition-all"
                    title="Hapus dari browser"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DaisyUI Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl">
            <h3 className="font-bold text-lg text-base-content">Hapus Buku?</h3>
            <p className="py-4 text-base-content/80 text-sm">
              Apakah Anda yakin ingin menghapus buku <strong className="text-base-content font-semibold">"{deleteTarget.title}"</strong> dari perangkat ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="modal-action">
              <button 
                className="btn btn-ghost rounded-xl" 
                onClick={() => setDeleteTarget(null)}
              >
                Batal
              </button>
              <button 
                className="btn btn-error rounded-xl shadow-sm text-white" 
                onClick={confirmDelete}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
          {/* Backdrop click to close */}
          <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
            <button className="cursor-default">close</button>
          </div>
        </div>
      )}
    </div>
  )
}
