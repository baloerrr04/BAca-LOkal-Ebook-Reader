'use client'

import React, { useEffect, useState } from 'react'

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    }
    // Check if the event already fired globally before this component mounted
    if (typeof window !== 'undefined' && (window as any).globalDeferredPrompt) {
      setDeferredPrompt((window as any).globalDeferredPrompt)
      setIsInstallable(true)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      if (typeof window !== 'undefined') {
        (window as any).globalDeferredPrompt = e
      }
      // Update UI notify the user they can install the PWA
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      setIsInstallable(false)
      setDeferredPrompt(null)
      if (typeof window !== 'undefined') {
        (window as any).globalDeferredPrompt = null
      }
      console.log('PWA was installed')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    // Show the install prompt
    deferredPrompt.prompt()
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null)
    if (typeof window !== 'undefined') {
      (window as any).globalDeferredPrompt = null
    }
    setIsInstallable(false)
  }

  if (isStandalone) {
    return null
  }

  if (!isInstallable) {
    return (
      <button 
        className="btn btn-outline btn-primary btn-sm w-full max-w-xs gap-2 opacity-50 cursor-not-allowed" 
        title="Otomatis aktif jika browser Anda mendukung PWA"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Unduh Aplikasi
      </button>
    )
  }

  return (
    <button 
      onClick={handleInstallClick}
      className="btn btn-outline btn-primary btn-sm w-full max-w-xs gap-2 shadow-sm hover:shadow-md"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Unduh Aplikasi
    </button>
  )
}
