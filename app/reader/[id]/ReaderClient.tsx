'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/utils/db'
import EpubReader from '@/components/EpubReader'
import TxtReader from '@/components/TxtReader'
import dynamic from 'next/dynamic'

// Dynamically import PdfReader with SSR disabled because react-pdf requires browser APIs (DOMMatrix, window, canvas)
const PdfReader = dynamic(() => import('@/components/PdfReader'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-base-100">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
})

export default function ReaderClient({ bookId }: { bookId: string }) {
  const [fileType, setFileType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkType = async () => {
      try {
        const cached = await db.books.get(bookId)
        if (cached) {
          // If no fileType exists in old records, assume it's epub for backward compatibility
          setFileType(cached.fileType || 'epub')
        }
      } catch (err) {
        console.error('Failed to get book fileType', err)
      } finally {
        setLoading(false)
      }
    }
    checkType()
  }, [bookId])

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-base-100">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (fileType === 'pdf') {
    return <PdfReader bookId={bookId} />
  }
  
  if (fileType === 'txt') {
    return <TxtReader bookId={bookId} />
  }

  // Default to epub
  return <EpubReader bookId={bookId} />
}
