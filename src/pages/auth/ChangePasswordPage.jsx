import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'

export default function ChangePasswordPage() {
  const { session } = useAuth(); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const navigate=useNavigate()
  const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{const {error:err}=await supabase.functions.invoke('change-password',{body:{password}});if(err)throw err;navigate('/account',{replace:true});window.location.reload()}catch{setError('Не удалось сменить пароль. Убедитесь, что он содержит не менее 12 символов, и повторите попытку.')}finally{setBusy(false)}}
  return <><PageBanner title="Смена временного пароля" eyebrow="ТРЕБУЕТСЯ ПРИ ПЕРВОМ ВХОДЕ"/><section className="content-section"><div className="page-container"><form className="auth-card" onSubmit={submit}><p>Задайте новый пароль, чтобы открыть закрытые разделы.</p><label>Новый пароль<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="auth-error">{error}</p>}<button className="button button-primary" disabled={busy||!session}>{busy?'Сохраняем…':'Сохранить пароль'}</button></form></div></section></>
}
