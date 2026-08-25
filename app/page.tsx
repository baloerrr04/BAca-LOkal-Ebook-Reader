import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import InstallButton from '@/components/InstallButton'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center px-6">
      <main className="flex flex-col items-center justify-center w-full flex-1 text-center max-w-lg">
        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-base-content tracking-tight leading-tight">
          Baloer
          <span className="text-primary text-lg sm:text-xl block mt-3 font-semibold tracking-normal">
            BAca LOkal Ebook Reader
          </span>
        </h1>

        <p className="text-base text-secondary mt-4 mb-10 leading-relaxed">
          Tampilan nyaman, baca makin asyik. <br className="hidden sm:block" />
          Tanpa perlu akun. Privat. Ringan. ✨
        </p>

        {user ? (
          <div className="card bg-base-200/60 backdrop-blur-sm border border-base-300/50 w-full shadow-sm">
            <div className="card-body items-center text-center gap-5 p-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-base-content text-sm">
                Masuk sebagai <strong className="text-primary font-semibold">{user.email}</strong>
              </p>
              <div className="card-actions gap-3">
                <Link href="/library" className="btn btn-primary btn-sm px-6 shadow-sm">
                  📚 Buka Library
                </Link>
                <form action={signOut}>
                  <button className="btn btn-ghost btn-sm text-error hover:bg-error/10">
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <Link
              href="/library"
              className="btn btn-primary btn-lg w-full max-w-xs shadow-md hover:shadow-lg gap-2 text-base rounded-2xl"
            >
              📚 Mulai Membaca
            </Link>
            <InstallButton />
            <Link href="/login" className="btn btn-ghost btn-sm text-secondary hover:text-primary mt-2">
              Sudah punya akun? Masuk
            </Link>
          </div>
        )}
      </main>

      <footer className="py-8 text-xs text-secondary/60">
        Built with 🍵 for comfortable reading
      </footer>
    </div>
  )
}
