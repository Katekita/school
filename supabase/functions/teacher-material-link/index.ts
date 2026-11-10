import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, projectKeys } from '../_shared/admin.ts'

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers:corsHeaders })
  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'')
    if (!token) return Response.json({error:'Unauthorized'},{status:401,headers:corsHeaders})
    const url=Deno.env.get('SUPABASE_URL')!
    const { anonKey, secretKey } = projectKeys()
    const service=createClient(url,secretKey,{auth:{persistSession:false}})
    const auth=createClient(url,anonKey,{auth:{persistSession:false}})
    const {data:{user},error}=await auth.auth.getUser(token)
    if(error||!user)return Response.json({error:'Unauthorized'},{status:401,headers:corsHeaders})
    const {data:profile}=await service.from('profiles').select('role,is_blocked,must_change_password').eq('user_id',user.id).maybeSingle()
    if(!profile||profile.is_blocked||profile.must_change_password||!['teacher','admin'].includes(profile.role))return Response.json({error:'Forbidden'},{status:403,headers:corsHeaders})
    const {path}=await req.json()
    if(typeof path!=='string'||path.includes('..'))return Response.json({error:'Invalid path'},{status:400,headers:corsHeaders})
    const {data,error:signError}=await service.storage.from('teacher-materials').createSignedUrl(path,300)
    if(signError)throw signError
    return Response.json({url:data.signedUrl,expires_in:300},{headers:corsHeaders})
  }catch{return Response.json({error:'Request failed'},{status:400,headers:corsHeaders})}
})
