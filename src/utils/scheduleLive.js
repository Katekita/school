import { lessonTimes, schedule10, scheduleClasses, weekDays } from '../data/schedule.js'

// Живой статус расписания: какой урок/перемена идёт прямо сейчас.
// Логика чисто локальная (без сервера): считаем от времени браузера.

const dayIds = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const weekdayNumbers = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

export function toMinutes(hhmm) {
  const [h, m] = String(hhmm).slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

export function bishkekTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bishkek',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  const dayId = dayIds.find((id) => id.startsWith(values.weekday.toLowerCase().slice(0, 3)))
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    dayId,
    weekday: weekdayNumbers[dayId],
  }
}

// Monday at midnight in Bishkek, represented with UTC fields for timezone-safe calendar export.
export function currentWeekStart(now = new Date()) {
  const { year, month, day, weekday } = bishkekTime(now)
  const date = new Date(Date.UTC(year, month - 1, day))
  const offset = (weekday + 6) % 7
  date.setUTCDate(date.getUTCDate() - offset)
  return date
}

export function weekdayId(now = new Date()) {
  return bishkekTime(now).dayId
}

export function isWeekend(now = new Date()) {
  const { weekday } = bishkekTime(now)
  return weekday === 0 || weekday === 6
}

export function getEntriesLiveStatus(entries, now = new Date()) {
  const { weekday, hour, minute } = bishkekTime(now)
  if (weekday === 0 || weekday === 6) return { kind: 'weekend' }

  const lessons = entries
    .filter((entry) => entry.weekday === weekday)
    .sort((a, b) => a.lesson_number - b.lesson_number)
  if (!lessons.length) return { kind: 'empty' }

  const currentMinutes = hour * 60 + minute
  const completed = lessons.filter((entry) => toMinutes(entry.ends_at) <= currentMinutes).length
  const currentIndex = lessons.findIndex((entry) =>
    currentMinutes >= toMinutes(entry.starts_at) && currentMinutes < toMinutes(entry.ends_at),
  )

  if (currentIndex >= 0) {
    const lesson = lessons[currentIndex]
    const start = toMinutes(lesson.starts_at)
    const end = toMinutes(lesson.ends_at)
    const lessonProgress = (currentMinutes - start) / Math.max(1, end - start)
    return {
      kind: 'lesson',
      lesson,
      index: currentIndex,
      start,
      end,
      remaining: Math.max(1, Math.ceil(end - currentMinutes)),
      lessonProgress,
      progress: (completed + lessonProgress) / lessons.length,
      completed,
      total: lessons.length,
      lessons,
    }
  }

  const nextIndex = lessons.findIndex((entry) => toMinutes(entry.starts_at) > currentMinutes)
  if (nextIndex >= 0) {
    const next = lessons[nextIndex]
    const previous = lessons[nextIndex - 1]
    const remaining = Math.max(1, Math.ceil(toMinutes(next.starts_at) - currentMinutes))
    const breakStart = previous ? toMinutes(previous.ends_at) : 0
    const breakEnd = toMinutes(next.starts_at)
    if (previous && currentMinutes >= breakStart && currentMinutes < breakEnd) {
      return {
        kind: 'break',
        lesson: next,
        nextIndex: next.lesson_number - 1,
        nextLesson: next,
        endsIn: remaining,
        remaining,
        breakProgress: (currentMinutes - breakStart) / Math.max(1, breakEnd - breakStart),
        completed,
        total: lessons.length,
        progress: completed / lessons.length,
        lessons,
      }
    }
    return {
      kind: 'before',
      lesson: next,
      startsIn: remaining,
      remaining,
      completed,
      total: lessons.length,
      progress: completed / lessons.length,
      lessons,
    }
  }

  return { kind: 'done', completed: lessons.length, total: lessons.length, progress: 1, lessons }
}

/**
 * Возвращает живой статус дня: сейчас урок, перемена или выходной.
 * @param {string} classKey выбранный класс
 * @param {Date} now текущее время
 */
export function getLiveStatus(classKey, now = new Date()) {
  const dayId = weekdayId(now)
  const { weekday } = bishkekTime(now)
  if (isWeekend(now)) return { kind: 'weekend' }

  const lessons = schedule10[classKey]?.[dayId] || []
  if (!lessons.length) return { kind: 'empty', dayId }
  const entries = lessons.map((lesson, index) => ({
    ...lesson,
    weekday,
    lesson_number: index + 1,
    starts_at: lessonTimes[index]?.start,
    ends_at: lessonTimes[index]?.end,
  }))
  return { ...getEntriesLiveStatus(entries, now), dayId }
}

// Ближайший урок сегодня (для виджета «следующий урок»).
export function getNextLesson(classKey, now = new Date()) {
  const dayId = weekdayId(now)
  const lessons = schedule10[classKey]?.[dayId] || []
  const { hour, minute } = bishkekTime(now)
  const minutes = hour * 60 + minute
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
