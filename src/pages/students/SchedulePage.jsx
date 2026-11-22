import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, DoorOpen, GraduationCap, List, Navigation, Sparkles } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import ScheduleActions from '../../components/ScheduleActions'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../auth/AuthContext'
import useNow from '../../hooks/useNow'
import * as scheduleCatalog from '../../data/schedule'
import { readSavedClass, saveClass } from '../../utils/classStorage'
import { getEntriesLiveStatus, toMinutes, weekdayId } from '../../utils/scheduleLive'
import SchedulePlanner from '../../components/SchedulePlanner'
import DataNotice from '../../components/DataNotice'

const {
  entriesFor,
  getBellSchedule,
  getClassByName,
  lessonTimes,
  scheduleClasses,
  scheduleYear,
  subjectName,
  weekDays,
} = scheduleCatalog

const weekdayNumber = Object.fromEntries(weekDays.map((day, index) => [day.id, index + 1]))
// 6-х классов в школе нет. 3-е и 7-е классы с 12-летним обучением —
// отдельные вкладки: у них своё расписание и отдельная программа.
// Классы 11-летней программы (например «3Б (11)») остаются в обычной параллели.
const gradeOptions = [
  { id: '1', grade: 1, program: null },
  { id: '2', grade: 2, program: null },
  { id: '3', grade: 3, program: null },
  { id: '3-12', grade: 3, program: 12 },
  { id: '4', grade: 4, program: null },
  { id: '5', grade: 5, program: null },
  { id: '7', grade: 7, program: null },
  { id: '7-12', grade: 7, program: 12 },
  { id: '8', grade: 8, program: null },
  { id: '9', grade: 9, program: null },
  { id: '10', grade: 10, program: null },
  { id: '11', grade: 11, program: null },
]
const catalogClassRows = scheduleClasses.map((id) => ({ id, name: id }))
const VIEW_MODE_KEY = 'school68_schedule_view'

function formatTime(value) {
  return String(value || '').slice(0, 5)
}

function classGrade(value) {
  const grade = Number(String(value || '').match(/^\s*(\d{1,2})/)?.[1])
  return grade >= 1 && grade <= 11 ? grade : 0
}

function classProgram(value) {
  return Number(String(value || '').match(/\((1[12])\)\s*$/)?.[1]) || null
}

function belongsToGroup(name, group) {
  if (!group || classGrade(name) !== group.grade) return false
  return group.program ? classProgram(name) === group.program : classProgram(name) !== 12
}

function groupOfClassName(name) {
  return gradeOptions.find((group) => belongsToGroup(name, group))?.id || ''
}

function groupLabel(group) {
  return group.program ? `${group.grade} (${group.program})` : String(group.grade)
}

function displayClassName(value) {
  return String(value || '').replace(/\s+\(12\)$/, '(12)')
}

function readViewMode() {
  try {
    const saved = localStorage.getItem(VIEW_MODE_KEY)
    if (['today', 'week', 'list'].includes(saved)) return saved
  } catch {
    // View mode is an optional preference.
  }
  const day = weekdayId()
  return weekdayNumber[day] ? 'today' : 'week'
}

function saveViewMode(mode) {
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  } catch {
    // View mode is an optional preference.
  }
}

export default function SchedulePage() {
  const { t, lang } = useLanguage()
  const { profile } = useAuth()
  const role = profile?.role
  const [params, setParams] = useSearchParams()
  const classParam = params.get('class')
  // Старые ссылки вида ?grade=7 остаются валидными: id группы совпадает
  // с номером параллели для обычных классов ('7'), 12-летние — '7-12'.
  const groupParam = params.get('grade') || ''
  const now = useNow(20_000)
  const [classes, setClasses] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState(gradeOptions[0].id)
  const [entries, setEntries] = useState([])
  const [usingCatalogSchedule, setUsingCatalogSchedule] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState(readViewMode)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        // Список классов всегда берётся из локального каталога: в Supabase
        // пока нет согласованных названий, а подстановка пустых или
        // несовпадающих строк базы лишала страницу всех параллелей.
        const list = catalogClassRows

        const fromUrl = classParam
        const fromUrlGroup = gradeOptions.find((group) => group.id === groupParam) || null
        const savedName = readSavedClass()
        const selected = list.find((item) => item.id === fromUrl || item.name === fromUrl)?.id
          || (fromUrlGroup
            ? list.find((item) => belongsToGroup(item.name, fromUrlGroup))?.id
            : list.find((item) => item.name === savedName)?.id
              || list[0]?.id)

        let lessons = []
        let usingLocalCatalog = false
        const selectedClass = list.find((item) => item.id === selected)
        if (selectedClass) {
          const catalogClass = getClassByName(selectedClass.name) || scheduleCatalog.getClass(selected)
          if (catalogClass) {
            lessons = entriesFor(catalogClass.id)
            usingLocalCatalog = true
          }
        }

        if (!active) return
        setClasses(list)
        setSelectedId(selected || '')
        setSelectedGroupId(
          fromUrlGroup?.id
          || groupOfClassName(selectedClass?.name)
          || gradeOptions[0].id,
        )
        setEntries(lessons)
        setUsingCatalogSchedule(usingLocalCatalog)
        if (selectedClass) saveClass(selectedClass.name)

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

    load()
    return () => { active = false }
  }, [role, classParam, groupParam, setParams])

  const selectedClass = classes.find((item) => item.id === selectedId)
  const selectedGroup = gradeOptions.find((group) => group.id === selectedGroupId) || gradeOptions[0]
  const selectedCatalogClass = getClassByName(selectedClass?.name) || scheduleCatalog.getClass(selectedId)
  const requestedDay = weekDays.some((day) => day.id === params.get('day')) ? params.get('day') : ''
  const todayId = weekdayId(now)
  const bellsDayId = requestedDay || (weekdayNumber[todayId] ? todayId : 'mon')
  const selectedBells = useMemo(() => {
    if (usingCatalogSchedule && selectedCatalogClass) {
      return getBellSchedule(selectedCatalogClass, bellsDayId)
    }
    const bells = new Map()
    entries
      .filter((entry) => entry.weekday === weekdayNumber[bellsDayId])
      .forEach((entry) => {
        if (!bells.has(entry.lesson_number)) {
          bells.set(entry.lesson_number, {
            start: formatTime(entry.starts_at),
            end: formatTime(entry.ends_at),
          })
        }
      })
    return bells.size
      ? [...bells.entries()].sort(([a], [b]) => a - b).map(([, bell]) => bell)
      : selectedCatalogClass
        ? getBellSchedule(selectedCatalogClass, bellsDayId)
        : lessonTimes
  }, [entries, selectedCatalogClass, usingCatalogSchedule, bellsDayId])
  const days = useMemo(() => weekDays.map((day) => ({
    ...day,
    lessons: entries.filter((item) => item.weekday === weekdayNumber[day.id]),
    classHour: usingCatalogSchedule ? selectedCatalogClass?.classHours?.[day.id] : null,
  })), [entries, selectedCatalogClass, usingCatalogSchedule])
  const todayClassHour = days.find((day) => day.id === todayId)?.classHour
  const live = useMemo(() => getEntriesLiveStatus(entries, now), [entries, now])
  const visibleDays = viewMode === 'today'
    ? days.filter((day) => day.id === todayId)
    : days
  const liveTitle = live.kind === 'lesson'
    ? subjectName(live.lesson.subject, lang)
    : live.kind === 'before' || live.kind === 'break'
      ? subjectName(live.lesson.subject, lang)
      : live.kind === 'weekend'
        ? t('live.weekend')
        : live.kind === 'done'
          ? t('live.done')
          : live.kind === 'unknown'
            ? t('live.timeUnknown')
          : t('live.empty')
  const liveLabel = live.kind === 'lesson'
    ? t('live.now')
    : live.kind === 'break'
      ? t('live.break')
      : live.kind === 'before'
      ? t('live.next')
      : live.kind === 'unknown'
        ? t('live.timeUnknown')
      : t('live.liveTitle')

  useEffect(() => {
    if (loading || !requestedDay) return
    document.getElementById(`schedule-${requestedDay}`)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' })
  }, [loading, requestedDay, selectedId])

  function selectClass(item) {
    setSelectedId(item.id)
    setSelectedGroupId(groupOfClassName(item.name) || gradeOptions[0].id)
    setEntries([])
    setUsingCatalogSchedule(false)
    saveClass(item.name)
    const next = new URLSearchParams(params)
    next.set('class', item.id)
    next.delete('grade')
    next.delete('day')
    setParams(next, { replace: true })
  }

  function selectGroup(group) {
    const firstClass = classes.find((item) => belongsToGroup(item.name, group))
    if (firstClass) {
      selectClass(firstClass)
      return
    }

    setSelectedGroupId(group.id)
    setSelectedId('')
    setEntries([])
    setUsingCatalogSchedule(false)
    const next = new URLSearchParams(params)
    next.delete('class')
    next.delete('day')
    next.set('grade', group.id)
    setParams(next, { replace: true })
  }

  function jumpToToday() {
    setViewMode('today')
    saveViewMode('today')
    const next = new URLSearchParams(params)
    next.set('day', todayId)
    setParams(next, { replace: true })
  }

  function showWeek() {
    setViewMode('week')
    saveViewMode('week')
    const next = new URLSearchParams(params)
    next.delete('day')
    setParams(next, { replace: true })
  }

  function showList() {
    setViewMode('list')
    saveViewMode('list')
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
          <DataNotice />
          <Reveal>
            <div className="schedule-intro">
              <div className="schedule-intro-copy">
                <span className="schedule-year"><CalendarDays size={14} />{year}</span>
                <h2>{t('schedule.weekTitle')}</h2>
                <p>{t('schedule.weekText')}</p>
                {usingCatalogSchedule && selectedCatalogClass && !selectedCatalogClass.timingKnown && (
                  <p className="schedule-grade-empty" role="status">{t('schedule.approximateTimes')}</p>
                )}
                {selectedClass && entries.length > 0 && (
                  <ScheduleActions
                    classKey={selectedClass.name}
                    lang={lang}
                    entries={entries}
                    allowCalendar={!usingCatalogSchedule || selectedCatalogClass?.timingKnown}
                  />
                )}
              </div>
              <div className="schedule-intro-badge" aria-hidden="true">
                <GraduationCap size={22} />
                <strong>{displayClassName(selectedClass?.name) || '—'}</strong>
                <span>{t('schedule.classLabel')}</span>
              </div>
            </div>
          </Reveal>

          {classes.length > 1 && (
            <Reveal>
              <div className="schedule-class-selector">
                <div className="schedule-grade-picker" role="group" aria-label={t('schedule.gradeLabel')}>
                  {gradeOptions.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      className={group.id === selectedGroupId ? 'is-active' : ''}
                      aria-pressed={group.id === selectedGroupId}
                      onClick={() => selectGroup(group)}
                    >
                      {groupLabel(group)}
                    </button>
                  ))}
                </div>
                {classes.some((item) => belongsToGroup(item.name, selectedGroup)) ? (
                  <div className="class-switcher" role="group" aria-label={`${t('schedule.classLabel')} ${groupLabel(selectedGroup)}`}>
                    {classes.filter((item) => belongsToGroup(item.name, selectedGroup)).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`class-tab${item.id === selectedId ? ' is-active' : ''}`}
                        aria-pressed={item.id === selectedId}
                        onClick={() => selectClass(item)}
                      >
                        {displayClassName(item.name)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="schedule-grade-empty" role="status">
                    {t('schedule.gradeUnavailable')}
                  </p>
                )}
              </div>
            </Reveal>
          )}

          {error && <p role="alert" className="auth-error">{error}</p>}
          {loading && !entries.length ? (
            <div className="page-loader" role="status" aria-live="polite">
              <span className="page-loader-spinner" />
            </div>
          ) : entries.length > 0 ? (
            <>
              <div className="schedule-view-toggle" role="group" aria-label={t('schedule.weekTitle')}>
                <button
                  type="button"
                  aria-pressed={viewMode === 'today'}
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
                <button
                  type="button"
                  aria-pressed={viewMode === 'list'}
                  className={viewMode === 'list' ? 'is-active' : ''}
                  onClick={showList}
                >
                  <List size={15} /> {t('schedule.listView')}
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
                    {(live.kind === 'lesson' || live.kind === 'before' || live.kind === 'break') && (
                      <p className="schedule-live-meta">
                        <Clock size={14} /> {live.lesson.lesson_number}. {formatTime(live.lesson.starts_at)}–{formatTime(live.lesson.ends_at)}
                        {live.lesson.room && <><DoorOpen size={14} /> {live.lesson.room}</>}
                      </p>
                    )}
                  </div>
                  {(live.kind === 'lesson' || live.kind === 'before' || live.kind === 'break') && (
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
                  {weekdayNumber[todayId] && (
                    <button type="button" className="schedule-today-button" onClick={jumpToToday}>
                      <Navigation size={15} /> {t('schedule.today')}
                    </button>
                  )}
                </section>
              </Reveal>

              {viewMode === 'today' && todayClassHour && (
                <p className="schedule-homeroom-note">
                  {subjectName(todayClassHour.subject, lang)}
                  {todayClassHour.room ? ` · ${todayClassHour.room}` : ''}
                </p>
              )}

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
                        const start = toMinutes(item.starts_at)
                        const isNow = live.kind === 'lesson' && live.lesson.lesson_number === item.lesson_number
                        const isDone = live.completed > item.lesson_number - 1
                        const previous = live.lessons[index - 1]
                        const breakMinutes = previous ? start - toMinutes(previous.ends_at) : 0
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

              {viewMode === 'list' ? (
                <div className="schedule-compact-wrap">
                  <table className="schedule-compact-table">
                    <thead>
                      <tr>
                        <th scope="col">{t('schedule.dayLabel')}</th>
                        <th scope="col">{t('schedule.lessonLabel')}</th>
                        <th scope="col">{t('schedule.timeLabel')}</th>
                        <th scope="col">{t('schedule.subjectLabel')}</th>
                        <th scope="col">{t('schedule.room')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {days.flatMap((day) => [
                        ...(day.classHour ? [
                          <tr key={`${day.id}-class-hour`}>
                            <td>{day[lang] || day.ky}</td>
                            <td>—</td>
                            <td>—</td>
                            <td>{subjectName(day.classHour.subject, lang)}</td>
                            <td>{day.classHour.room || '—'}</td>
                          </tr>,
                        ] : []),
                        ...day.lessons.map((item) => (
                          <tr key={`${day.id}-${item.lesson_number}`}>
                            <td>{day[lang] || day.ky}</td>
                            <td>{item.lesson_number}</td>
                            <td>{formatTime(item.starts_at)}–{formatTime(item.ends_at)}</td>
                            <td>{subjectName(item.subject, lang)}</td>
                            <td>{item.room || '—'}</td>
                          </tr>
                        )),
                      ])}
                    </tbody>
                  </table>
                </div>
              ) : visibleDays.length ? (
                <div className={`week-grid${viewMode === 'week' ? ' is-week' : ''}`}>
                {visibleDays.map((day, index) => {
                  const isToday = day.id === todayId
                  return (
                    <Reveal key={day.id} delay={index * 35}>
                      <article id={`schedule-${day.id}`} className={`day-card${isToday ? ' is-today' : ''}${requestedDay === day.id ? ' is-focused' : ''}`}>
                        <header className="day-card-head">
                          <h3>{day[lang] || day.ky}</h3>
                          {isToday && <span className="day-today">{t('schedule.today')}</span>}
                        </header>
                        {day.classHour && (
                          <p className="schedule-homeroom-note">
                            {subjectName(day.classHour.subject, lang)}
                            {day.classHour.room ? ` · ${day.classHour.room}` : ''}
                          </p>
                        )}
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
              ) : (
                <p className="day-empty">{t('live.weekend')}</p>
              )}

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
                    {selectedBells.map((time, index) => (
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
          {!loading && <SchedulePlanner />}
        </div>
      </section>
    </>
  )
}
