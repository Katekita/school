import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, DoorOpen, GraduationCap, Navigation, Sparkles } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import ScheduleActions from '../../components/ScheduleActions'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../auth/AuthContext'
import { supabase } from '../../lib/supabase'
import useNow from '../../hooks/useNow'
import { lessonTimes, scheduleYear, subjectName, weekDays } from '../../data/schedule'
import { readSavedClass, saveClass } from '../../utils/classStorage'

const weekdayNumber = Object.fromEntries(weekDays.map((day, index) => [day.id, index + 1]))
const dayIds = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function timeMinutes(value) {
  const [hours, minutes] = String(value).split(':').map(Number)
  return hours * 60 + minutes
}

function formatTime(value) {
  return String(value || '').slice(0, 5)
}

function getTodayStatus(entries, now) {
  const weekday = now.getDay()
  if (weekday === 0 || weekday === 6) return { kind: 'weekend' }

  const lessons = entries
    .filter((entry) => entry.weekday === weekday)
    .sort((a, b) => a.lesson_number - b.lesson_number)
  if (!lessons.length) return { kind: 'empty' }

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const currentIndex = lessons.findIndex((entry) =>
    currentMinutes >= timeMinutes(entry.starts_at) && currentMinutes < timeMinutes(entry.ends_at),
  )
  const completed = lessons.filter((entry) => timeMinutes(entry.ends_at) <= currentMinutes).length
  let progress = completed / lessons.length

  if (currentIndex >= 0) {
    const current = lessons[currentIndex]
    const start = timeMinutes(current.starts_at)
    const end = timeMinutes(current.ends_at)
    const lessonProgress = (currentMinutes - start) / Math.max(1, end - start)
    progress = (completed + lessonProgress) / lessons.length
    return {
      kind: 'lesson',
      lesson: current,
      remaining: Math.max(1, Math.ceil(end - currentMinutes)),
      lessonProgress,
      progress,
      completed,
      total: lessons.length,
      lessons,
    }
  }

  const nextIndex = lessons.findIndex((entry) => timeMinutes(entry.starts_at) > currentMinutes)
  if (nextIndex >= 0) {
    const next = lessons[nextIndex]
    const previous = lessons[nextIndex - 1]
    const remaining = Math.max(1, Math.ceil(timeMinutes(next.starts_at) - currentMinutes))
    if (previous && currentMinutes >= timeMinutes(previous.ends_at)) {
      const breakTotal = timeMinutes(next.starts_at) - timeMinutes(previous.ends_at)
      return {
        kind: 'break',
        lesson: next,
        remaining,
        breakProgress: (currentMinutes - timeMinutes(previous.ends_at)) / Math.max(1, breakTotal),
        completed,
        total: lessons.length,
        progress,
        lessons,
      }
    }
    return { kind: 'next', lesson: next, remaining, completed, total: lessons.length, progress, lessons }
  }

  return { kind: 'done', completed: lessons.length, total: lessons.length, progress: 1, lessons }
}

export default function SchedulePage() {
  const { t, lang } = useLanguage()
  const { profile } = useAuth()
  const profileId = profile?.user_id
  const profileClassId = profile?.class_id
  const role = profile?.role
  const [params, setParams] = useSearchParams()
  const classParam = params.get('class')
  const now = useNow(20_000)
  const [classes, setClasses] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState(() => {
    const day = new Date().getDay()
    return day >= 1 && day <= 5 ? 'today' : 'week'
  })

  useEffect(() => {
    let active = true
    async function load() {
      if (!supabase) {
        setError('Подключение к расписанию пока недоступно. Обратитесь к администратору школы.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      setEntries([])
      try {
        let query = supabase.from('classes').select('id,name').order('name')
        if (role === 'student') query = query.eq('id', profileClassId)
        const { data: classRows, error: classError } = await query
        if (classError) throw classError

        const list = classRows || []
        const fromUrl = classParam
        const savedName = readSavedClass()
        const selected = role === 'student'
          ? list[0]?.id
          : list.find((item) => item.id === fromUrl || item.name === fromUrl)?.id
            || list.find((item) => item.name === savedName)?.id
            || list[0]?.id

        let lessons = []
        if (selected) {
          const { data, error: scheduleError } = await supabase
            .from('schedule_entries')
            .select('weekday,lesson_number,starts_at,ends_at,subject,room,academic_year')
            .eq('class_id', selected)
            .eq('academic_year', scheduleYear)
            .order('weekday')
            .order('lesson_number')
          if (scheduleError) throw scheduleError
          lessons = data || []
        }

        if (!active) return
        setClasses(list)
        setSelectedId(selected || '')
        setEntries(lessons)
        const selectedClass = list.find((item) => item.id === selected)
        if (selectedClass && role !== 'student') saveClass(selectedClass.name)

        if (selected && role !== 'student' && fromUrl !== selected) {
          setParams((current) => {
            const next = new URLSearchParams(current)
            next.set('class', selected)
            return next
          }, { replace: true })
        }
      } catch {
        if (active) setError('Не удалось загрузить расписание. Проверьте подключение или обратитесь к администратору.')
      } finally {
        if (active) setLoading(false)
      }
    }

    if (role) load()
    return () => { active = false }
  }, [profileId, profileClassId, role, classParam, setParams])

  const selectedClass = classes.find((item) => item.id === selectedId)
  const days = useMemo(() => weekDays.map((day) => ({
    ...day,
    lessons: entries.filter((item) => item.weekday === weekdayNumber[day.id]),
  })), [entries])
  const requestedDay = weekDays.some((day) => day.id === params.get('day')) ? params.get('day') : ''
  const todayId = dayIds[now.getDay()]
  const live = useMemo(() => getTodayStatus(entries, now), [entries, now])
  const visibleDays = viewMode === 'today' && weekdayNumber[todayId]
    ? days.filter((day) => day.id === todayId)
    : days
  const liveTitle = live.kind === 'lesson'
    ? subjectName(live.lesson.subject, lang)
    : live.kind === 'next' || live.kind === 'break'
      ? subjectName(live.lesson.subject, lang)
      : live.kind === 'weekend'
        ? t('live.weekend')
        : live.kind === 'done'
          ? t('live.done')
          : t('live.empty')
  const liveLabel = live.kind === 'lesson'
    ? t('live.now')
    : live.kind === 'break'
      ? t('live.break')
      : live.kind === 'next'
      ? t('live.next')
      : t('live.liveTitle')

  useEffect(() => {
    if (loading || !requestedDay) return
    document.getElementById(`schedule-${requestedDay}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [loading, requestedDay, selectedId])

  function selectClass(item) {
    setSelectedId(item.id)
    saveClass(item.name)
    const next = new URLSearchParams(params)
    next.set('class', item.id)
    next.delete('day')
    setParams(next, { replace: true })
  }

  function jumpToToday() {
    if (todayId === 'sun' || todayId === 'sat') return
    setViewMode('today')
    const next = new URLSearchParams(params)
    next.set('day', todayId)
    setParams(next, { replace: true })
  }

  function showWeek() {
    setViewMode('week')
    const next = new URLSearchParams(params)
    next.delete('day')
    setParams(next, { replace: true })
  }

  function jumpToDay(dayId) {
    const next = new URLSearchParams(params)
    next.set('day', dayId)
    setParams(next, { replace: true })
  }

  const year = entries[0]?.academic_year || scheduleYear

  return (
    <>
      <PageBanner title={t('schedule.title')} eyebrow={t('schedule.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <Reveal>
            <div className="schedule-intro">
              <div className="schedule-intro-copy">
                <span className="schedule-year"><CalendarDays size={14} />{year}</span>
                <h2>{t('schedule.weekTitle')}</h2>
                <p>{t('schedule.weekText')}</p>
                {selectedClass && entries.length > 0 && <ScheduleActions classKey={selectedClass.name} lang={lang} entries={entries} />}
              </div>
              <div className="schedule-intro-badge" aria-hidden="true">
                <GraduationCap size={22} />
                <strong>{selectedClass?.name || '—'}</strong>
                <span>{t('schedule.classLabel')}</span>
              </div>
            </div>
          </Reveal>

          {profile?.role !== 'student' && classes.length > 1 && (
            <Reveal>
              <div className="class-switcher" role="group" aria-label={t('schedule.classLabel')}>
                {classes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`class-tab${item.id === selectedId ? ' is-active' : ''}`}
                    aria-pressed={item.id === selectedId}
                    onClick={() => selectClass(item)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </Reveal>
          )}

          {error && <p role="alert" className="auth-error">{error}</p>}
          {loading ? (
            <div className="page-loader" role="status" aria-live="polite">
              <span className="page-loader-spinner" />
            </div>
          ) : entries.length > 0 ? (
            <>
              <div className="schedule-view-toggle" role="group" aria-label={t('schedule.weekTitle')}>
                <button
                  type="button"
                  aria-pressed={viewMode === 'today'}
                  disabled={todayId === 'sun' || todayId === 'sat'}
                  className={viewMode === 'today' ? 'is-active' : ''}
                  onClick={jumpToToday}
                >
                  <Sparkles size={15} /> {t('schedule.today')}
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === 'week'}
                  className={viewMode === 'week' ? 'is-active' : ''}
                  onClick={showWeek}
                >
                  <CalendarDays size={15} /> {t('schedule.weekView')}
                </button>
              </div>

              {viewMode === 'week' && (
                <nav className="schedule-day-picker" aria-label={t('schedule.weekTitle')}>
                  {days.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      className={requestedDay === day.id ? 'is-active' : ''}
                      aria-current={requestedDay === day.id ? 'location' : undefined}
                      onClick={() => jumpToDay(day.id)}
                    >
                      <span>{day[lang] || day.ky}</span>
                      <small>{day.lessons.length}</small>
                    </button>
                  ))}
                </nav>
              )}

              <Reveal>
                <section className={`schedule-live-card is-${live.kind}`} aria-live="polite">
                  <div className="schedule-live-copy">
                    <span className="live-card-eyebrow">
                      <span className={`live-card-dot${live.kind === 'lesson' ? ' is-pulsing' : ''}`} aria-hidden="true" />
                      {liveLabel}
                    </span>
                    <h2>{liveTitle}</h2>
                    {(live.kind === 'lesson' || live.kind === 'next' || live.kind === 'break') && (
                      <p className="schedule-live-meta">
                        <Clock size={14} /> {live.lesson.lesson_number}. {formatTime(live.lesson.starts_at)}–{formatTime(live.lesson.ends_at)}
                        {live.lesson.room && <><DoorOpen size={14} /> {live.lesson.room}</>}
                      </p>
                    )}
                  </div>
                  {(live.kind === 'lesson' || live.kind === 'next' || live.kind === 'break') && (
                    <div className="schedule-live-countdown">
                      <strong>{live.kind === 'lesson' ? t('live.endsIn') : t('live.startsIn')}</strong>
                      <span>{live.remaining} {t('live.minutes')}</span>
                    </div>
                  )}
                  {(live.kind === 'lesson' || live.kind === 'break') && (
                    <div className="schedule-live-progress" aria-hidden="true">
                      <span style={{ transform: `scaleX(${live.kind === 'lesson' ? live.lessonProgress : live.breakProgress})` }} />
                    </div>
                  )}
                  {todayId !== 'sun' && todayId !== 'sat' && (
                    <button type="button" className="schedule-today-button" onClick={jumpToToday}>
                      <Navigation size={15} /> {t('schedule.today')}
                    </button>
                  )}
                </section>
              </Reveal>

              {viewMode === 'today' && live.lessons?.length > 0 && (
                <Reveal>
                  <section className="day-timeline" aria-labelledby="day-timeline-title">
                    <header className="day-timeline-head">
                      <div>
                        <span className="eyebrow"><Sparkles size={13} /> {t('live.liveEyebrow')}</span>
                        <h2 id="day-timeline-title">{t('schedule.dayPlan')}</h2>
                      </div>
                      <div className="day-progress-ring" style={{ '--day-progress': `${live.progress * 100}%` }} aria-label={`${live.completed} / ${live.total}`}>
                        <strong>{live.completed}<small>/{live.total}</small></strong>
                      </div>
                    </header>
                    <ol className="day-timeline-list">
                      {live.lessons.map((item, index) => {
                        const start = timeMinutes(item.starts_at)
                        const end = timeMinutes(item.ends_at)
                        const isNow = live.kind === 'lesson' && live.lesson.lesson_number === item.lesson_number
                        const isDone = now.getHours() * 60 + now.getMinutes() >= end
                        const previous = live.lessons[index - 1]
                        const breakMinutes = previous ? start - timeMinutes(previous.ends_at) : 0
                        return (
                          <li className="day-timeline-item" key={item.lesson_number}>
                            {breakMinutes > 0 && (
                              <div className={`timeline-break${live.kind === 'break' && live.lesson.lesson_number === item.lesson_number ? ' is-now' : ''}`}>
                                <span>{t('live.break')}</span>
                                <small>{breakMinutes} {t('live.minutes')}</small>
                              </div>
                            )}
                            <article className={`timeline-lesson${isNow ? ' is-now' : ''}${isDone ? ' is-done' : ''}`}>
                              <span className="timeline-lesson-number">{item.lesson_number}</span>
                              <div className="timeline-lesson-copy">
                                <strong>{subjectName(item.subject, lang)}</strong>
                                <span><Clock size={12} /> {formatTime(item.starts_at)}–{formatTime(item.ends_at)}</span>
                              </div>
                              {item.room && <span className="timeline-room"><DoorOpen size={13} />{item.room}</span>}
                              {isNow && <span className="timeline-progress" style={{ transform: `scaleX(${live.lessonProgress})` }} />}
                            </article>
                          </li>
                        )
                      })}
                    </ol>
                  </section>
                </Reveal>
              )}

              <div className="week-grid">
                {visibleDays.map((day, index) => {
                  const isToday = day.id === todayId
                  return (
                    <Reveal key={day.id} delay={index * 35}>
                      <article id={`schedule-${day.id}`} className={`day-card${isToday ? ' is-today' : ''}${requestedDay === day.id ? ' is-focused' : ''}`}>
                        <header className="day-card-head">
                          <h3>{day[lang] || day.ky}</h3>
                          {isToday && <span className="day-today">{t('schedule.today')}</span>}
                        </header>
                        {day.lessons.length ? (
                          <ol className="lesson-list">
                            {day.lessons.map((item) => {
                              const isNow = isToday && live.kind === 'lesson' && live.lesson.lesson_number === item.lesson_number
                              return (
                                <li className={`lesson-row${isNow ? ' is-now' : ''}`} key={`${day.id}-${item.lesson_number}`}>
                                  <span className="lesson-num">
                                    {isNow && <span className="lesson-now-dot" aria-hidden="true" />}
                                    {item.lesson_number}
                                  </span>
                                  <div className="lesson-body">
                                    <strong className="lesson-subject">{subjectName(item.subject, lang)}</strong>
                                    <span className="lesson-time"><Clock size={12} /> {formatTime(item.starts_at)}–{formatTime(item.ends_at)}</span>
                                  </div>
                                  <span className="lesson-room" title={t('schedule.room')}><DoorOpen size={12} />{item.room || '—'}</span>
                                </li>
                              )
                            })}
                          </ol>
                        ) : (
                          <p className="day-empty">{t('schedule.noLessons')}</p>
                        )}
                      </article>
                    </Reveal>
                  )
                })}
              </div>

              <Reveal>
                <aside className="bells-card">
                  <div className="bells-head">
                    <span className="bells-icon"><Clock size={18} /></span>
                    <div>
                      <strong>{t('schedule.bellsTitle')}</strong>
                      <p>{t('schedule.bellsNote')}</p>
                    </div>
                  </div>
                  <div className="bells-list">
                    {lessonTimes.map((time, index) => (
                      <div className={`bell${live.kind === 'lesson' && live.lesson.lesson_number === index + 1 ? ' is-now' : ''}`} key={time.start}>
                        <span className="bell-num">{index + 1}</span>
                        <span className="bell-time">{time.start}–{time.end}</span>
                      </div>
                    ))}
                  </div>
                </aside>
              </Reveal>
            </>
          ) : (
            <div className="empty-state">
              <CalendarDays size={30} />
              <h3>{t('schedule.emptyTitle')}</h3>
              <p>{t('schedule.emptyText')}</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
