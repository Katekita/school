import { motion } from 'motion/react'
import { ArrowRight, BellRing, Clock, DoorOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import useNow from '../hooks/useNow'
import { getNextLesson, getLiveStatus, weekdayId } from '../utils/scheduleLive'
import { readSavedClass } from '../utils/classStorage'
import { subjectName } from '../data/schedule'

// Живой виджет: что происходит в школе прямо сейчас и что будет следующим.
// Состояние нигде не хранится — всё считается из часов браузера на тике useNow,
// поэтому виджет правдив и без сервера.
export default function LiveScheduleWidget({ variant = 'card' }) {
  const { t, lang } = useLanguage()
  const now = useNow(20_000)
  const classKey = readSavedClass()
  const live = getLiveStatus(classKey, now)
  const next = getNextLesson(classKey, now)

  const headline = {
    lesson: t('live.now'),
    break: t('live.break'),
    before: t('live.before'),
    done: t('live.done'),
    weekend: t('live.weekend'),
    empty: t('live.unpublished'),
    unknown: t('live.timeUnknown'),
  }[live.kind]

  const detail = (() => {
    if (live.kind === 'lesson') {
      return {
        title: subjectName(live.lesson.subject, lang),
        meta: `${live.lesson.lesson_number} · ${String(live.lesson.starts_at).slice(0, 5)}–${String(live.lesson.ends_at).slice(0, 5)}`,
        room: live.lesson.room,
        countdown: `${t('live.endsIn')} ${live.remaining} ${t('live.minutes')}`,
        progress: live.progress,
      }
    }
    if (live.kind === 'break') {
      return {
        title: live.nextLesson
          ? subjectName(live.nextLesson.subject, lang)
          : t('live.done'),
        meta: live.nextLesson ? String(live.nextLesson.starts_at).slice(0, 5) : '',
        countdown: `${t('live.startsIn')} ${live.endsIn} ${t('live.minutes')}`,
      }
    }
    if (live.kind === 'before' && live.lesson) {
      return {
        title: subjectName(live.lesson.subject, lang),
        meta: String(live.lesson.starts_at).slice(0, 5),
        countdown: `${t('live.startsIn')} ${live.remaining} ${t('live.minutes')}`,
      }
    }
    return { title: headline, meta: '' }
  })()

  const isLive = live.kind === 'lesson' || live.kind === 'break'

  if (variant === 'bar') {
    return (
      <div className={`live-bar is-${live.kind}`}>
        <span className="live-bar-dot" aria-hidden="true" />
        <strong>{headline}</strong>
        {detail.title && <span>{detail.title}</span>}
      </div>
    )
  }

  return (
    <motion.section
      className={`live-card is-${live.kind}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      aria-label={t('live.liveTitle')}
    >
      <div className="live-card-head">
        <span className="live-card-eyebrow">
          <span className={`live-card-dot${isLive ? ' is-pulsing' : ''}`} aria-hidden="true" />
          {t('live.liveEyebrow')}
        </span>
        <h2>{headline}</h2>
        <p>{t('live.liveHint')}</p>
      </div>

      <div className="live-card-body">
        <span className="live-card-icon">
          {live.kind === 'break' ? <BellRing size={22} /> : <Clock size={22} />}
        </span>
        <div className="live-card-info">
          <strong>{detail.title}</strong>
          <span className="live-card-meta">
            {detail.meta && (
              <>
                <Clock size={12} /> {detail.meta}
              </>
            )}
            {detail.room && (
              <>
                <DoorOpen size={12} /> {detail.room}
              </>
            )}
          </span>
          {detail.countdown && (
            <span className="live-card-countdown">{detail.countdown}</span>
          )}
        </div>
        {live.kind === 'lesson' && detail.progress != null && (
          <span className="live-card-progress" aria-hidden="true">
            <span style={{ transform: `scaleX(${detail.progress})` }} />
          </span>
        )}
      </div>

      {next && (
        <div className="live-card-next">
          <span>{t('live.next')}</span>
          <strong>{subjectName(next.lesson.subject, lang)}</strong>
          <small>
            {next.time.start}
            {next.lesson.room ? ` · ${next.lesson.room}` : ''}
          </small>
        </div>
      )}

      <Link className="text-link live-card-link" to={`/students/schedule?class=${classKey}&day=${weekdayId(now)}`}>
        {t('live.viewSchedule')} <ArrowRight size={14} />
      </Link>
    </motion.section>
  )
}
