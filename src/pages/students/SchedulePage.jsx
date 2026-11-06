import { useMemo, useState } from 'react'
import { CalendarDays, Clock, DoorOpen, GraduationCap } from 'lucide-react'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  lessonTimes,
  schedule10,
  scheduleClasses,
  scheduleYear,
  subjectName,
  weekDays,
} from '../../data/schedule'

const CLASS_STORAGE_KEY = 'school68_schedule_class'

const todayId = (() => {
  const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return map[new Date().getDay()] || ''
})()

function readSavedClass() {
  try {
    const saved = localStorage.getItem(CLASS_STORAGE_KEY)
    if (saved && scheduleClasses.includes(saved)) return saved
  } catch {
    /* localStorage может быть недоступен — показываем первый класс */
  }
  return scheduleClasses[0]
}

export default function SchedulePage() {
  const { t, lang } = useLanguage()
  const [selectedClass, setSelectedClass] = useState(readSavedClass)

  const days = useMemo(
    () =>
      weekDays.map((day) => ({
        ...day,
        title: day[lang] || day.ky,
        lessons: schedule10[selectedClass]?.[day.id] || [],
      })),
    [lang, selectedClass],
  )

  function pickClass(className) {
    setSelectedClass(className)
    try {
      localStorage.setItem(CLASS_STORAGE_KEY, className)
    } catch {
      /* сохранение выбора не критично */
    }
  }

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

          <div className="week-grid">
            {days.map((day, index) => (
              <Reveal key={day.id} delay={index * 40}>
                <article className={`day-card${day.id === todayId ? ' is-today' : ''}`}>
                  <header className="day-card-head">
                    <h3>{day.title}</h3>
                    {day.id === todayId && <span className="day-today">{t('schedule.today')}</span>}
                  </header>

                  {day.lessons.length ? (
                    <ol className="lesson-list">
                      {day.lessons.map((item, lessonIndex) => {
                        const time = lessonTimes[lessonIndex]
                        return (
                          <li className="lesson-row" key={`${day.id}-${lessonIndex}`}>
                            <span className="lesson-num">{lessonIndex + 1}</span>
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
            ))}
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
                  <div className="bell" key={time.start}>
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
