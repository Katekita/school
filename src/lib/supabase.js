import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key
  ? createClient(url, key, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } })
  : null

export function usernameEmail(username) {
  const domain = import.meta.env.VITE_LOGIN_EMAIL_DOMAIN
  if (!domain) throw new Error('Не настроен домен логинов Supabase.')
  return `${username.trim().toLowerCase()}@${domain}`
}
