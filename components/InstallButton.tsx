'use client'

import React, { useEffect, useState } from 'react'

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      // Update UI notify the user they can install the PWA
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      setIsInstallable(false)
      setDeferredPrompt(null)
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
    setIsInstallable(false)
  }

  if (!isInstallable) {
    return (
      <button 
        className="btn btn-outline btn-primary btn-sm w-full max-w-xs gap-2 opacity-50 cursor-not-allowed" 
        title="Tombol ini akan aktif jika browser Anda mendukung PWA dan Service Worker sudah berjalan."
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Download (Hanya di Produksi)
      </button>
    )
  }

  return (
    <button
      onClick={handleInstallClick}
      className="btn btn-outline btn-primary btn-sm w-full max-w-xs gap-2 hover:scale-[1.02] transition-transform"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download App
    </button>
  )
}
