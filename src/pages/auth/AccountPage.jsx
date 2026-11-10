import { Link } from 'react-router-dom'
import { ExternalLink, LogOut } from 'lucide-react'
import PageBanner from '../../components/PageBanner'
import { useAuth } from '../../auth/AuthContext'

export default function AccountPage() {
  const { profile, signOut } = useAuth()
  return <><PageBanner title="Личный кабинет" eyebrow="ШКОЛЬНЫЙ ПОРТАЛ"/><section className="content-section"><div className="page-container"><div className="auth-card">
    <p>Здравствуйте, <strong>{profile?.full_name}</strong>.</p><p>Роль: {profile?.role === 'admin' ? 'Руководство' : profile?.role === 'teacher' ? 'Учитель' : 'Ученик'}</p>
    {profile?.role === 'student' && <p>Класс: {profile.class_id ? 'назначен администрацией' : 'не назначен'}</p>}
    {profile?.role === 'teacher' && <p><Link to="/teacher-materials">Материалы для учителей</Link></p>}
    {profile?.role === 'admin' && <p><Link to="/admin">Управление порталом</Link></p>}
    <p><a className="button button-primary" href="https://kundoluk.edu.gov.kg/" target="_blank" rel="noopener noreferrer">Открыть «Күндөлүк» <ExternalLink size={16}/></a></p>
    <button className="button" onClick={() => signOut()}><LogOut size={16}/>Выйти</button>
  </div></div></section></>
}
