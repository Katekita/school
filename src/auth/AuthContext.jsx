import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, usernameEmail } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, setState] = useState({ session: null, profile: null, loading: Boolean(supabase), error: null })

  useEffect(() => {
    if (!supabase) return
    let alive = true
    const load = async (session) => {
      if (!session) {
        if (alive) setState({ session: null, profile: null, loading: false, error: null })
        return
      }
      const { data, error } = await supabase.from('profiles')
        .select('user_id, username, role, full_name, class_id, is_blocked, must_change_password')
        .eq('user_id', session.user.id).maybeSingle()
      if (!alive) return
      setState({ session, profile: data, loading: false, error: error?.message || null })
      if (data?.is_blocked) await supabase.auth.signOut({ scope: 'global' })
    }
    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => load(session))
    })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])

  const signIn = async (username, password, captchaToken) => {
    if (!supabase) throw new Error('Вход ещё не настроен: добавьте параметры Supabase в окружение.')
    return supabase.auth.signInWithPassword({
      email: usernameEmail(username), password,
      options: captchaToken ? { captchaToken } : undefined,
    })
  }

  const signOut = () => supabase?.auth.signOut({ scope: 'local' })
  return <AuthContext.Provider value={{ ...state, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth должен вызываться внутри AuthProvider')
  return value
}
