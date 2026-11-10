import { requireAdmin, corsHeaders } from '../_shared/admin.ts'

const usernameOk = (s: string) => /^[a-z0-9][a-z0-9._-]{2,39}$/.test(s)
const tempPassword = () => `${crypto.randomUUID()}!${crypto.randomUUID().slice(0, 8)}A9`

function parseCsv(text: string) {
  // RFC4180-style quoted fields, including commas and line breaks.
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted && c === '"' && text[i + 1] === '"') { field += '"'; i++ }
    else if (c === '"') quoted = !quoted
    else if (c === ',' && !quoted) { row.push(field); field = '' }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); if (row.some(x => x.trim())) rows.push(row); row = []; field = ''
    } else field += c
  }
  if (quoted) throw new Error('CSV contains an unclosed quote')
  row.push(field); if (row.some(x => x.trim())) rows.push(row)
  return rows
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
    const { admin, user: actor } = await requireAdmin(req)
    const body = await req.json()
    if (body.action === 'create' || body.action === 'import') {
      const rows = body.action === 'create' ? [body.user] : parseCsv(String(body.csv ?? ''))
      if (rows.length > 500) return Response.json({ error: 'Maximum 500 rows per import' }, { status: 400, headers: corsHeaders })
      const normalized = body.action === 'create' ? rows : (() => {
        const [header, ...values] = rows
        const ix = Object.fromEntries(header.map((h, i) => [h.trim().toLowerCase(), i]))
        for (const key of ['full_name','class','role','username']) if (ix[key] === undefined) throw new Error(`Missing CSV column: ${key}`)
        return values.map(r => ({ full_name:r[ix.full_name], class_name:r[ix.class], role:r[ix.role], username:r[ix.username] }))
      })()
      const results = []
      const domain = Deno.env.get('INTERNAL_LOGIN_DOMAIN')
      if (!domain) throw new Error('Internal login domain is not configured')
      for (const input of normalized) {
        const row = { full_name:String(input.full_name ?? '').trim(), username:String(input.username ?? '').trim().toLowerCase(), role:String(input.role ?? '').trim(), class_name:String(input.class_name ?? '').trim() }
        if (!row.full_name || !usernameOk(row.username) || !['student','teacher','admin'].includes(row.role)) { results.push({ username:row.username, error:'Invalid name, username or role' }); continue }
        let classId: string | null = null
        if (row.role === 'student') {
          const { data: cls } = await admin.from('classes').select('id').eq('name', row.class_name).maybeSingle()
          if (!cls) { results.push({ username:row.username, error:'Unknown class' }); continue }
          classId = cls.id
        }
        const password = tempPassword()
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email: `${row.username}@${domain}`, password, email_confirm: true,
        })
        if (createError || !created.user) { results.push({ username:row.username, error:'Could not create account' }); continue }
        const { error: profileError } = await admin.from('profiles').insert({
          user_id:created.user.id, username:row.username, role:row.role,
          full_name:row.full_name, class_id:classId, must_change_password:true,
        })
        if (profileError) {
          await admin.auth.admin.deleteUser(created.user.id)
          results.push({ username:row.username, error:'Could not save profile' }); continue
        }
        await admin.from('audit_log').insert({ actor_id:actor.id, action:'account_created', target_user_id:created.user.id })
        // Returned once in this response only; never persisted or logged.
        results.push({ username:row.username, temporary_password:password })
      }
      return Response.json({ results }, { headers:corsHeaders })
    }

    const targetId = String(body.user_id ?? '')
    if (!targetId) return Response.json({ error:'Missing user id' }, { status:400, headers:corsHeaders })
    if (body.action === 'block' || body.action === 'unblock') {
      const blocked = body.action === 'block'
      const { error } = await admin.from('profiles').update({ is_blocked:blocked, updated_at:new Date().toISOString() }).eq('user_id', targetId)
      if (error) throw error
      const { error: authError } = await admin.auth.admin.updateUserById(targetId, { ban_duration: blocked ? '876000h' : 'none' })
      if (authError) throw authError
      // Blocked flag is checked in every RLS helper immediately. Auth ban prevents refresh/new sessions.
      await admin.from('audit_log').insert({ actor_id:actor.id, action:blocked?'account_blocked':'account_unblocked', target_user_id:targetId })
      return Response.json({ ok:true }, { headers:corsHeaders })
    }
    if (body.action === 'role') {
      if (!['student','teacher','admin'].includes(body.role)) return Response.json({ error:'Invalid role' }, { status:400, headers:corsHeaders })
      const { error } = await admin.from('profiles').update({ role:body.role, class_id:body.role==='student' ? body.class_id : null, updated_at:new Date().toISOString() }).eq('user_id',targetId)
      if (error) throw error
      await admin.from('audit_log').insert({ actor_id:actor.id, action:'role_changed', target_user_id:targetId, details:{ role:body.role } })
      return Response.json({ ok:true }, { headers:corsHeaders })
    }
    return Response.json({ error:'Unknown action' }, { status:400, headers:corsHeaders })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status = message === 'unauthorized' ? 401 : message === 'forbidden' ? 403 : 400
    return Response.json({ error:status === 400 ? 'Invalid request' : message }, { status, headers:corsHeaders })
  }
})
