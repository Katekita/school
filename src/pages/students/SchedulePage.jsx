import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, DoorOpen, GraduationCap } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../auth/AuthContext'
import { supabase } from '../../lib/supabase'
import { weekDays } from '../../data/schedule'

const weekdayNumber = Object.fromEntries(weekDays.map((day, index) => [day.id, index + 1]))

export default function SchedulePage() {
  const { t, lang } = useLanguage()
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const [classes, setClasses] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [entries, setEntries] = useState([])
  const [year, setYear] = useState('2026–2027')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError('')
      try {
        let query = supabase.from('classes').select('id,name').order('name')
        if (profile?.role === 'student') query = query.eq('id', profile.class_id)
        const { data: classRows, error: classError } = await query
        if (classError) throw classError
        const list = classRows || []
        const fromUrl = params.get('class')
        const selected = profile?.role === 'student'
          ? list[0]?.id
          : (list.some(item => item.id === fromUrl) ? fromUrl : list[0]?.id)
        let lessons = []
        if (selected) {
          const { data, error: scheduleError } = await supabase.from('schedule_entries')
            .select('weekday,lesson_number,starts_at,ends_at,subject,room,academic_year')
            .eq('class_id', selected).order('weekday').order('lesson_number')
          if (scheduleError) throw scheduleError
          lessons = data || []
        }
        if (!active) return
        setClasses(list); setSelectedId(selected || ''); setEntries(lessons)
        if (lessons[0]?.academic_year) setYear(lessons[0].academic_year)
        if (selected && profile?.role !== 'student' && fromUrl !== selected) {
          const next = new URLSearchParams(params); next.set('class', selected); setParams(next, { replace: true })
        }
      } catch {
        if (active) setError('Не удалось загрузить расписание. Проверьте подключение или обратитесь к администратору.')
      } finally { if (active) setLoading(false) }
    }
    if (supabase && profile) load()
    return () => { active = false }
  }, [profile, params, setParams])

  const selectedClass = classes.find(item => item.id === selectedId)
  const days = useMemo(() => weekDays.map(day => ({
    ...day,
    lessons: entries.filter(item => item.weekday === weekdayNumber[day.id]),
  })), [entries])

  return <>
    <PageBanner title={t('schedule.title')} eyebrow={t('schedule.eyebrow')} />
    <section className="content-section"><div className="page-container">
      <Reveal><div className="schedule-intro"><div className="schedule-intro-copy">
        <span className="schedule-year"><CalendarDays size={14}/>{year}</span>
        <h2>{t('schedule.weekTitle')}</h2><p>{t('schedule.weekText')}</p>
      </div><div className="schedule-intro-badge" aria-hidden="true"><GraduationCap size={22}/><strong>{selectedClass?.name || '—'}</strong><span>{t('schedule.classLabel')}</span></div></div></Reveal>
      {profile?.role !== 'student' && classes.length > 1 && <div className="class-switcher" role="group" aria-label={t('schedule.classLabel')}>
        {classes.map(item => <button key={item.id} type="button" className={`class-tab${item.id===selectedId?' is-active':''}`} aria-pressed={item.id===selectedId} onClick={()=>{setSelectedId(item.id);const next=new URLSearchParams(params);next.set('class',item.id);setParams(next)}}>{item.name}</button>)}
      </div>}
      {error && <p role="alert" className="auth-error">{error}</p>}
      {loading ? <div className="page-loader" role="status"><span className="page-loader-spinner"/></div> : !entries.length ? <div className="empty-state"><CalendarDays size={30}/><h3>{t('schedule.emptyTitle')}</h3><p>Расписание появится после загрузки и проверки администрацией школы.</p></div> : <div className="week-grid">
        {days.map(day=><Reveal key={day.id}><article className="day-card"><header className="day-card-head"><h3>{day[lang]||day.ky}</h3></header>{day.lessons.length?<ol className="lesson-list">{day.lessons.map(item=><li className="lesson-row" key={`${day.id}-${item.lesson_number}`}><span className="lesson-num">{item.lesson_number}</span><div className="lesson-body"><strong className="lesson-subject">{item.subject}</strong><span className="lesson-time"><Clock size={12}/> {item.starts_at.slice(0,5)}–{item.ends_at.slice(0,5)}</span></div><span className="lesson-room"><DoorOpen size={12}/>{item.room||'—'}</span></li>)}</ol>:<p className="day-empty">{t('schedule.noLessons')}</p>}</article></Reveal>)}
      </div>}
    </div></section>
  </>
}
