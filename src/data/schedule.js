// Bell times and subject labels are display metadata.
// Lesson allocations stay in the protected Supabase table.

export const scheduleYear = '2026–2027'

export const scheduleClasses = []

export const weekDays = [
  { id: 'mon', ky: 'Дүйшөмбү', ru: 'Понедельник', en: 'Monday' },
  { id: 'tue', ky: 'Шейшемби', ru: 'Вторник', en: 'Tuesday' },
  { id: 'wed', ky: 'Шаршемби', ru: 'Среда', en: 'Wednesday' },
  { id: 'thu', ky: 'Бейшемби', ru: 'Четверг', en: 'Thursday' },
  { id: 'fri', ky: 'Жума', ru: 'Пятница', en: 'Friday' },
]

// Урок — 45 минут, перемены по 5 минут, после третьего урока — 10 минут.
// Первый урок начинается в 07:30, шестой заканчивается в 12:30.
export const lessonTimes = [
  { start: '07:30', end: '08:15' },
  { start: '08:20', end: '09:05' },
  { start: '09:10', end: '09:55' },
  { start: '10:05', end: '10:50' },
  { start: '10:55', end: '11:40' },
  { start: '11:45', end: '12:30' },
]

export const breaks = [
  { after: 1, minutes: 5 },
  { after: 2, minutes: 5 },
  { after: 3, minutes: 10 },
  { after: 4, minutes: 5 },
  { after: 5, minutes: 5 },
]

const subjectNames = {
  russian: { ky: 'Орус тили', ru: 'Русский язык', en: 'Russian language' },
  kyrgyzLit: { ky: 'Кырг. адаб.', ru: 'Кыргызская литература', en: 'Kyrgyz literature' },
  foreign: { ky: 'Чет тили', ru: 'Иностранный язык', en: 'Foreign language' },
  algebra: { ky: 'Алгебра', ru: 'Алгебра', en: 'Algebra' },
  geometry: { ky: 'Геометрия', ru: 'Геометрия', en: 'Geometry' },
  history: { ky: 'Тарых', ru: 'История', en: 'History' },
  pe: { ky: 'Дене тарбия', ru: 'Физкультура', en: 'Physical education' },
  social: { ky: 'Ад. ж. коом', ru: 'Человек и общество', en: 'Man and society' },
  physics: { ky: 'Физика', ru: 'Физика', en: 'Physics' },
  chemistry: { ky: 'Химия', ru: 'Химия', en: 'Chemistry' },
  biology: { ky: 'Биология', ru: 'Биология', en: 'Biology' },
  geography: { ky: 'География', ru: 'География', en: 'Geography' },
  russianLit: { ky: 'Орус адаб.', ru: 'Русская литература', en: 'Russian literature' },
  kyrgyz: { ky: 'Кырг. тили', ru: 'Кыргызский язык', en: 'Kyrgyz language' },
  achd: { ky: 'АЧД', ru: 'АЧД', en: 'ACHD' },
}

export function subjectName(key, lang) {
  const entry = subjectNames[key]
  if (!entry) return key
  return entry[lang] || entry.ky
}

export const schedule10 = {}
