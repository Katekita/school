import { useEffect, useMemo, useRef } from 'react'
import { CalendarDays, Clock, DoorOpen, GraduationCap } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import ScheduleActions from '../../components/ScheduleActions'
import { useLanguage } from '../../i18n/LanguageContext'
import useNow from '../../hooks/useNow'
import useSpotlight from '../../hooks/useSpotlight'
import { readSavedClass, saveClass } from '../../utils/classStorage'
import { getLiveStatus, weekdayId } from '../../utils/scheduleLive'
import {
  lessonTimes,
  schedule10,
  scheduleClasses,
  scheduleYear,
  subjectName,
  weekDays,
} from '../../data/schedule'

const validDays = weekDays.map((d) => d.id)

export default function SchedulePage() {
  const { t, lang } = useLanguage()
  const [params, setParams] = useSearchParams()
  const now = useNow(20_000)

  // Класс живёт в URL (?class=10А) — ссылкой можно поделиться, а кнопка «назад»
  // в браузере работает как переключатель классов.
  const urlClass = params.get('class')
  const urlDay = params.get('day')
  const selectedClass = scheduleClasses.includes(urlClass) ? urlClass : readSavedClass()

  const live = useMemo(() => getLiveStatus(selectedClass, now), [selectedClass, now])
  const today = weekdayId(now)
  const highlightDay = validDays.includes(urlDay) ? urlDay : null

  const days = useMemo(
    () =>
      weekDays.map((day) => ({
        ...day,
        title: day[lang] || day.ky,
        lessons: schedule10[selectedClass]?.[day.id] || [],
      })),
    [lang, selectedClass],
  )

  const gridRef = useSpotlight()
  const activeRef = useRef(null)

  function pickClass(className) {
    saveClass(className)
    const next = new URLSearchParams(params)
    next.set('class', className)
    next.delete('day')
    setParams(next, { replace: true })
  }

  // При ?day=… прокручиваем к нужному дню и подсвечиваем карточку.
  useEffect(() => {
    if (!highlightDay) return
    const node = activeRef.current
    if (!node) return
    node.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightDay, selectedClass])

  // Если урок идёт — держим карточку «сегодня» в зоне видимости только при входе.
  const liveIndex = live.kind === 'lesson' ? live.index : -1

  return (
    <>
      <PageBanner title={t('schedule.title')} eyebrow={t('schedule.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <Reveal>
            <div className="schedule-intro">
              <div className="schedule-intro-copy">
                <span className="schedule-year">
                  <CalendarDays size={14} /> {scheduleYear}
                </span>
                <h2>{t('schedule.weekTitle')}</h2>
                <p>{t('schedule.weekText')}</p>
                <ScheduleActions classKey={selectedClass} lang={lang} />
              </div>
              <div className="schedule-intro-badge" aria-hidden="true">
                <GraduationCap size={22} />
                <strong>{selectedClass}</strong>
                <span>{t('schedule.classLabel')}</span>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="class-switcher" role="group" aria-label={t('schedule.classLabel')}>
              {scheduleClasses.map((className) => (
                <button
                  key={className}
                  type="button"
                  className={`class-tab${className === selectedClass ? ' is-active' : ''}`}
                  aria-pressed={className === selectedClass}
                  onClick={() => pickClass(className)}
                >
                  {className}
                </button>
              ))}
            </div>
          </Reveal>

          <p className="visually-hidden" role="status">
            {t('schedule.classLabel')}: {selectedClass}
          </p>

          <div className="week-grid" ref={gridRef}>
            {days.map((day, index) => {
              const isToday = day.id === today
              return (
                <Reveal key={day.id} delay={index * 40}>
                  <article
                    ref={day.id === highlightDay || (isToday && !highlightDay) ? activeRef : null}
                    className={`day-card spotlight${isToday ? ' is-today' : ''}${
                      day.id === highlightDay ? ' is-focused' : ''
                    }`}
                  >
                    <header className="day-card-head">
                      <h3>{day.title}</h3>
                      {isToday && <span className="day-today">{t('schedule.today')}</span>}
                    </header>

                    {day.lessons.length ? (
                      <ol className="lesson-list">
                        {day.lessons.map((item, lessonIndex) => {
                          const time = lessonTimes[lessonIndex]
                          const isNow = isToday && liveIndex === lessonIndex
                          return (
                            <li
                              className={`lesson-row${isNow ? ' is-now' : ''}`}
                              key={`${day.id}-${lessonIndex}`}
                            >
                              <span className="lesson-num">
                                {isNow && <span className="lesson-now-dot" aria-hidden="true" />}
                                {lessonIndex + 1}
                              </span>
                              <div className="lesson-body">
                                <strong className="lesson-subject">
                                  {subjectName(item.subject, lang)}
                                </strong>
                                <span className="lesson-time">
                                  <Clock size={12} /> {time.start}–{time.end}
                                </span>
                              </div>
                              <span className="lesson-room" title={t('schedule.room')}>
                                <DoorOpen size={12} /> {item.room || '—'}
                              </span>
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
                <span className="bells-icon">
                  <Clock size={18} />
                </span>
                <div>
                  <strong>{t('schedule.bellsTitle')}</strong>
                  <p>{t('schedule.bellsNote')}</p>
                </div>
              </div>
              <div className="bells-list">
                {lessonTimes.map((time, index) => (
                  <div
                    className={`bell${liveIndex === index ? ' is-now' : ''}`}
                    key={time.start}
                  >
                    <span className="bell-num">{index + 1}</span>
                    <span className="bell-time">
                      {time.start}–{time.end}
                    </span>
                  </div>
                ))}
              </div>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  )
}
