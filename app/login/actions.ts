'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function loginWithGoogle() {
  const supabase = await createClient()
  
  // Get host dynamically to ensure callback works in dev/prod
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${protocol}://${host}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?message=Could not authenticate with Google')
  }

  if (data.url) {
    redirect(data.url)
  }
}
