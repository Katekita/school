import catalog from './scheduleCatalog.json' with { type: 'json' }

// Источник расписания — скан-таблицы школы, разобранные скриптом
// scripts/build-schedule-catalog.mjs в scheduleCatalog.json. Supabase сейчас
// пуст, поэтому портал показывает именно этот каталог; когда школа внесёт
// изменения в базу, её данные перекроют каталог на фронте.

export const scheduleYear = catalog.year

export const weekDays = [
  { id: 'mon', ky: 'Дүйшөмбү', ru: 'Понедельник', en: 'Monday' },
  { id: 'tue', ky: 'Шейшемби', ru: 'Вторник', en: 'Tuesday' },
  { id: 'wed', ky: 'Шаршемби', ru: 'Среда', en: 'Wednesday' },
  { id: 'thu', ky: 'Бейшемби', ru: 'Четверг', en: 'Thursday' },
  { id: 'fri', ky: 'Жума', ru: 'Пятница', en: 'Friday' },
]

const dayIds = weekDays.map((day) => day.id)

export const subjectNames = catalog.subjectNames

export function subjectName(key, lang) {
  const entry = subjectNames[key]
  if (!entry) return key
  return entry[lang] || entry.ky
}

// Классы в порядке параллели → буква → программа обучения.
export const scheduleClasses = catalog.classes.map((item) => item.id)

const classIndex = new Map(catalog.classes.map((item) => [item.id, item]))

function normalizeClassName(value) {
  return String(value || '').toLocaleLowerCase().replace(/[\s‐‑–—-]/g, '')
}

export function getClass(id) {
  return classIndex.get(id) || null
}

export function getClassByName(name) {
  const normalized = normalizeClassName(name)
  return catalog.classes.find((item) => normalizeClassName(item.id) === normalized) || null
}

export function getBellSchedule(classData, dayId) {
  return classData?.bellsByDay?.[dayId] || classData?.bells || []
}

export function classLabel(item) {
  if (!item) return ''
  return item.program ? `${item.grade}-${item.letter} (${item.program})` : `${item.grade}-${item.letter}`
}

// Старый формат { classKey: { dayId: [{ subject, room }] } } оставлен как
// совместимое представление: часть кода (ics, статистика) уже переведена на
// каталог, но единый вид упрощает сверку с базой школы.
export const schedule10 = Object.fromEntries(
  catalog.classes.map((item) => [
    item.id,
    Object.fromEntries(
      dayIds
        .map((day) => [day, item.week[day] || []])
        .filter(([, lessons]) => lessons.length > 0),
    ),
  ]),
)

// Совместимый сет первой смены для блоков, которым нужен один общий список.
export const lessonTimes = catalog.classes.find((item) => item.id === '10А')?.bells
  || catalog.classes[0].bells

export const breaks = [
  { after: 1, minutes: 5 },
  { after: 2, minutes: 5 },
  { after: 3, minutes: 10 },
  { after: 4, minutes: 5 },
  { after: 5, minutes: 5 },
]

// Параллели для группировки в интерфейсе: 1–4 (начальные), 5–9 (средние),
// 10–11 (старшие).
export const gradeGroups = [
  { id: 'primary', from: 1, to: 4, ky: 'Башталгыч', ru: 'Начальные', en: 'Primary' },
  { id: 'middle', from: 5, to: 9, ky: 'Орточу', ru: 'Средние', en: 'Middle' },
  { id: 'senior', from: 10, to: 11, ky: 'Жогорку', ru: 'Старшие', en: 'Senior' },
]

export function groupOf(grade) {
  return gradeGroups.find((group) => grade >= group.from && grade <= group.to) || gradeGroups[1]
}

// Уроки класса в виде плоских записей, совместимых с формой строк
// supabase.schedule_entries: weekday (1–7), lesson_number, starts_at, ends_at.
export function entriesFor(classId) {
  const item = classIndex.get(classId)
  if (!item) return []
  const rows = []
  dayIds.forEach((day, dayIndex) => {
    for (const lesson of item.week[day] || []) {
      const bell = getBellSchedule(item, day)[lesson.number - 1]
      if (!bell) continue
      rows.push({
        weekday: dayIndex + 1,
        lesson_number: lesson.number,
        starts_at: `${bell.start}:00`,
        ends_at: `${bell.end}:00`,
        subject: lesson.subject,
        room: lesson.room || '',
        academic_year: catalog.year,
        timing_known: item.timingKnown,
      })
    }
  })
  return rows
}

export const scheduleSource = catalog.source
