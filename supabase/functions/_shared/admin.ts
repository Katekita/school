import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function projectKeys() {
  const publishables = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}')
  const secrets = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
  const anonKey = publishables.default ?? Deno.env.get('SUPABASE_ANON_KEY')
  const secretKey = secrets.default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!anonKey || !secretKey) throw new Error('Supabase API keys are unavailable in the Edge Function runtime')
  return { anonKey, secretKey }
}

export async function requireAdmin(req: Request) {
  const authorization = req.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) throw new Error('unauthorized')
  const url = Deno.env.get('SUPABASE_URL')!
  const { anonKey, secretKey } = projectKeys()
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } }, auth: { persistSession: false },
  })
  const { data: { user }, error } = await userClient.auth.getUser(authorization.slice(7))
  if (error || !user) throw new Error('unauthorized')
  const admin = createClient(url, secretKey, { auth: { persistSession: false } })
  const { data: profile } = await admin.from('profiles')
    .select('role,is_blocked,must_change_password').eq('user_id', user.id).maybeSingle()
  if (profile?.role !== 'admin' || profile.is_blocked || profile.must_change_password) throw new Error('forbidden')
  return { admin, user }
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('PORTAL_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
