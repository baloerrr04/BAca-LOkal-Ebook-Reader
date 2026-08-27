import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Baloer Reader',
    short_name: 'Baloer',
    description: 'Baca file EPUB langsung dari browser. Tanpa akun. Privat. Ringan.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9F5EE',
    theme_color: '#475569',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: '192x192 512x512 any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
