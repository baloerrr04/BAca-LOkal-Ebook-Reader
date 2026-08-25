'use server'

import { createClient } from '@/utils/supabase/server'
import type { ThemeConfig } from '@/store/themeStore'

export async function saveThemePreference(theme: ThemeConfig) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        id: user.id,
        theme_preference: theme,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

  if (error) return { error: error.message }
  return { success: true }
}

export async function loadThemePreference(): Promise<ThemeConfig | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('theme_preference')
    .eq('id', user.id)
    .single()

  if (error || !data?.theme_preference) return null
  return data.theme_preference as ThemeConfig
}
