import { breaks, lessonTimes, schedule10, scheduleClasses, weekDays } from '../data/schedule'

// Живой статус расписания: какой урок/перемена идёт прямо сейчас.
// Логика чисто локальная (без сервера): считаем от времени браузера.

const dayIds = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// Понедельник текущей недели — точка отсчёта для дат в .ics.
export function currentWeekStart(now = new Date()) {
  const date = new Date(now)
  const offset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - offset)
  date.setHours(0, 0, 0, 0)
  return date
}

export function weekdayId(now = new Date()) {
  return dayIds[now.getDay()]
}

export function isWeekend(now = new Date()) {
  const d = now.getDay()
  return d === 0 || d === 6
}

/**
 * Возвращает живой статус дня: сейчас урок, перемена или выходной.
 * @param {string} classKey выбранный класс
 * @param {Date} now текущее время
 */
export function getLiveStatus(classKey, now = new Date()) {
  const dayId = weekdayId(now)
  if (isWeekend(now)) return { kind: 'weekend' }

  const lessons = schedule10[classKey]?.[dayId] || []
  if (!lessons.length) return { kind: 'empty', dayId }

  const minutes = now.getHours() * 60 + now.getMinutes()

  for (let i = 0; i < lessons.length; i += 1) {
    const time = lessonTimes[i]
    if (!time) break
    const start = toMinutes(time.start)
    const end = toMinutes(time.end)

    if (minutes >= start && minutes < end) {
      return {
        kind: 'lesson',
        index: i,
        lesson: lessons[i],
        start,
        end,
        progress: (minutes - start) / (end - start),
        dayId,
      }
    }

    // Окно между уроками — перемена (последний урок не имеет «после себя» паузы).
    const brk = breaks.find((b) => b.after === i + 1)
    if (brk && minutes >= end && minutes < end + brk.minutes) {
      return {
        kind: 'break',
        after: i,
        minutes: brk.minutes,
        endsIn: end + brk.minutes - minutes,
        nextIndex: i + 1,
        nextLesson: lessons[i + 1] || null,
        dayId,
      }
    }
  }

  const first = toMinutes(lessonTimes[0].start)
  const lastEnd = toMinutes(lessonTimes[Math.min(lessons.length, lessonTimes.length) - 1].end)

  if (minutes < first) {
    return { kind: 'before', startsIn: first - minutes, dayId, lessons }
  }
  if (minutes >= lastEnd) {
    return { kind: 'done', dayId }
  }
  return { kind: 'done', dayId }
}

// Ближайший урок сегодня (для виджета «следующий урок»).
export function getNextLesson(classKey, now = new Date()) {
  const dayId = weekdayId(now)
  const lessons = schedule10[classKey]?.[dayId] || []
  const minutes = now.getHours() * 60 + now.getMinutes()
  const index = lessons.findIndex((_, i) => minutes < toMinutes(lessonTimes[i].end))
  if (index === -1) return null
  return { index, lesson: lessons[index], time: lessonTimes[index], dayId }
}

export function dayTitle(dayId, lang) {
  const day = weekDays.find((d) => d.id === dayId)
  if (!day) return ''
  return day[lang] || day.ky
}

export function isValidClass(value) {
  return scheduleClasses.includes(value)
}
