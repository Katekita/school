import { lessonTimes, schedule10, scheduleClasses } from './schedule'

// Числа для секции «школа в цифрах»: считаем из фактического расписания,
// а не придумываем — так блок остаётся честным до подтверждения школой.
export function scheduleStats() {
  const rooms = new Set()
  const subjects = new Set()
  let lessonCount = 0

  for (const classKey of scheduleClasses) {
    const week = schedule10[classKey] || {}
    for (const lessons of Object.values(week)) {
      lessonCount += lessons.length
      for (const lesson of lessons) {
        subjects.add(lesson.subject)
        String(lesson.room || '')
          .split('/')
          .map((r) => r.trim())
          .filter(Boolean)
          .forEach((r) => rooms.add(r))
      }
    }
  }

  const first = lessonTimes[0].start
  const last = lessonTimes[lessonTimes.length - 1].end

  return {
    classes: scheduleClasses.length,
    subjects: subjects.size,
    rooms: rooms.size,
    lessons: lessonCount,
    lessonMinutes: 45,
    bellRange: `${first}–${last}`,
  }
}
