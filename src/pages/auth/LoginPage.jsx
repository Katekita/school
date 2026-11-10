import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import PageBanner from '../../components/PageBanner'
import { useAuth } from '../../auth/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const { error: authError } = await signIn(username, password)
      if (authError) throw authError
      navigate(location.state?.from?.pathname || '/account', { replace: true })
    } catch { setError('Не удалось войти. Проверьте логин и пароль или обратитесь к администратору.') }
    finally { setBusy(false) }
  }
  return <><PageBanner title="Вход в личный кабинет" eyebrow="АККАУНТ ШКОЛЫ"/><section className="content-section"><div className="page-container"><form className="auth-card" onSubmit={submit}>
    <label>Логин<input autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)} /></label>
    <label>Пароль<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
    {error && <p role="alert" className="auth-error">{error}</p>}
    <button className="button button-primary" disabled={busy}><LogIn size={17}/>{busy?'Входим…':'Войти'}</button>
    <p>Аккаунты выдаёт администрация школы. <Link to="/baylanysh">Связаться со школой</Link></p>
  </form></div></section></>
}
