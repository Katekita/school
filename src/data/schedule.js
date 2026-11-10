// Public display metadata only. Lesson assignments belong in the protected
// Supabase table and must never be bundled into the static GitHub Pages app.
export const scheduleYear = '2026–2027'
export const scheduleClasses = []
export const schedule10 = {}

export const weekDays = [
  { id: 'mon', ky: 'Дүйшөмбү', ru: 'Понедельник', en: 'Monday' },
  { id: 'tue', ky: 'Шейшемби', ru: 'Вторник', en: 'Tuesday' },
  { id: 'wed', ky: 'Шаршемби', ru: 'Среда', en: 'Wednesday' },
  { id: 'thu', ky: 'Бейшемби', ru: 'Четверг', en: 'Thursday' },
  { id: 'fri', ky: 'Жума', ru: 'Пятница', en: 'Friday' },
]

export const lessonTimes = []
export const breaks = []
export function subjectName(key) { return key }
