import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, projectKeys } from '../_shared/admin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    const url = Deno.env.get('SUPABASE_URL')!
    const { anonKey, secretKey } = projectKeys()
    const anon = createClient(url, anonKey, { auth: { persistSession: false } })
    const { data: { user }, error } = await anon.auth.getUser(token)
    if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    const { password } = await req.json()
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return Response.json({ error: 'Password must be 12-128 characters' }, { status: 400, headers: corsHeaders })
    }
    const admin = createClient(url, secretKey, { auth: { persistSession: false } })
    const { data: profile } = await admin.from('profiles').select('is_blocked').eq('user_id', user.id).maybeSingle()
    if (!profile || profile.is_blocked) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders })
    const { error: passwordError } = await admin.auth.admin.updateUserById(user.id, { password })
    if (passwordError) throw passwordError
    const { error: profileError } = await admin.from('profiles').update({ must_change_password: false, updated_at: new Date().toISOString() }).eq('user_id', user.id)
    if (profileError) throw profileError
    return Response.json({ ok: true }, { headers: corsHeaders })
  } catch {
    return Response.json({ error: 'Request failed' }, { status: 400, headers: corsHeaders })
  }
})
