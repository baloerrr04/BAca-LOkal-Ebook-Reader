import { loginWithGoogle } from './actions'
import Link from 'next/link'

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center px-6">
      <div className="card bg-base-200/50 border border-base-300/40 w-full max-w-sm shadow-sm rounded-2xl">
        <div className="card-body p-8 text-center">
          <div className="flex flex-col items-center gap-4 mb-6">
            <Link href="/" className="btn btn-ghost btn-circle bg-base-100 shadow-sm mb-2">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </Link>
            <h2 className="text-2xl font-bold text-base-content">Masuk ke Baloer</h2>
            <p className="text-sm text-secondary">Akses sinkronisasi buku di semua perangkat Anda.</p>
          </div>

          <form action={loginWithGoogle}>
            <button className="btn btn-outline w-full rounded-xl gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Lanjutkan dengan Google
            </button>
          </form>

          {searchParams?.message && (
            <p className="mt-6 text-sm text-center text-error bg-error/10 p-3 rounded-xl">
              {searchParams.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
