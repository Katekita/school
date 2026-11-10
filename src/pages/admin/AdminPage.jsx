import { useCallback, useEffect, useState } from 'react'
import PageBanner from '../../components/PageBanner'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const [users,setUsers]=useState([]); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [issued,setIssued]=useState([])
  const [form,setForm]=useState({full_name:'',username:'',role:'student',class_name:''})
  const refresh=useCallback(async()=>{const {data,error:err}=await supabase.from('profiles').select('user_id,username,full_name,role,class_id,is_blocked,must_change_password').order('full_name');if(err)throw err;setUsers(data||[])},[])
  useEffect(()=>{refresh().catch(e=>setError(e.message))},[refresh])
  const invoke=async body=>{const {data,error:err}=await supabase.functions.invoke('admin-users',{body});if(err)throw err;if(data?.error)throw new Error(data.error);return data}
  const run=async fn=>{setBusy(true);setError('');setIssued([]);try{await fn();await refresh()}catch(e){setError(e.message||'Не удалось выполнить операцию.')}finally{setBusy(false)}}
  const create=e=>{e.preventDefault();run(async()=>{const data=await invoke({action:'create',user:form});setIssued(data.results||[]);setForm({full_name:'',username:'',role:'student',class_name:''})})}
  const importCsv=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>1024*1024){setError('CSV должен быть не больше 1 МБ.');return}const csv=await file.text();run(async()=>{const data=await invoke({action:'import',csv});setIssued(data.results||[])})}
  return <><PageBanner title="Управление аккаунтами" eyebrow="ТОЛЬКО ДЛЯ РУКОВОДСТВА"/><section className="content-section"><div className="page-container admin-panel">
    <h2>Создать аккаунт</h2><form className="admin-form" onSubmit={create}><label>ФИО<input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label><label>Логин<input required value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></label><label>Роль<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="student">Ученик</option><option value="teacher">Учитель</option><option value="admin">Руководство</option></select></label>{form.role==='student'&&<label>Класс<input required placeholder="Например, 10А" value={form.class_name} onChange={e=>setForm({...form,class_name:e.target.value})}/></label>}<button disabled={busy}>Создать и показать временный пароль</button></form>
    <label className="csv-upload">Импорт CSV (колонки: full_name,class,role,username)<input type="file" accept=".csv,text/csv" onChange={importCsv}/></label>
    {issued.length>0&&<section className="issued-passwords" aria-live="polite"><h3>Временные пароли — сохраните сейчас</h3><p>После закрытия страницы они больше не будут показаны.</p>{issued.map((item,i)=><p key={i}><strong>{item.username}</strong>: <code>{item.temporary_password||item.error}</code></p>)}</section>}
    {error&&<p className="auth-error" role="alert">{error}</p>}
    <h2>Аккаунты ({users.length})</h2><div className="admin-users">{users.map(u=><article key={u.user_id}><div><strong>{u.full_name}</strong><span>{u.username} · {u.role}{u.must_change_password?' · ожидает смены пароля':''}{u.is_blocked?' · заблокирован':''}</span></div><div className="admin-actions"><select aria-label={`Роль ${u.username}`} value={u.role} disabled={busy} onChange={e=>run(()=>invoke({action:'role',user_id:u.user_id,role:e.target.value,class_id:u.class_id}))}><option value="student">Ученик</option><option value="teacher">Учитель</option><option value="admin">Руководство</option></select><button disabled={busy} onClick={()=>run(()=>invoke({action:u.is_blocked?'unblock':'block',user_id:u.user_id}))}>{u.is_blocked?'Разблокировать':'Заблокировать'}</button></div></article>)}</div>
  </div></section></>
}
