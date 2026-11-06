// Расписание 10-х классов школы №68 им. А. Осмонова.
// Источник: официальное расписание на 2025/2026 учебный год.
// Номера кабинетов указаны в поле room; «с/з» — спортивный зал,
// запись вида «51/22» означает подгруппы (кабинеты 51 и 22).

export const scheduleYear = '2026–2027'

export const scheduleClasses = ['10А', '10Б', '10В', '10Г', '10Д', '10Е']

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

const lesson = (subject, room) => ({ subject, room })

export const schedule10 = {
  '10А': {
    mon: [
      lesson('russian', '51/22'),
      lesson('kyrgyzLit', '28'),
      lesson('foreign', '26/37'),
      lesson('algebra', '23'),
      lesson('history', '25'),
      lesson('pe', 'с/з'),
    ],
    tue: [
      lesson('geography', '40'),
      lesson('russianLit', '22'),
      lesson('kyrgyz', '28'),
      lesson('physics', '49'),
      lesson('algebra', '23'),
      lesson('chemistry', '28'),
    ],
    wed: [
      lesson('history', '25'),
      lesson('kyrgyzLit', '28'),
      lesson('foreign', '26/37'),
      lesson('russian', '52/22'),
      lesson('biology', '45'),
    ],
    thu: [
      lesson('kyrgyz', '28'),
      lesson('russianLit', '22'),
      lesson('chemistry', '39'),
      lesson('geometry', '23'),
      lesson('physics', '49'),
      lesson('kyrgyzLit', '28'),
    ],
    fri: [
      lesson('physics', '49'),
      lesson('pe', 'с/з'),
      lesson('achd', '52'),
      lesson('achd', '52'),
      lesson('algebra', '23'),
      lesson('social', '25'),
    ],
  },
  '10Б': {
    mon: [
      lesson('kyrgyzLit', '28'),
      lesson('russian', '51/22'),
      lesson('history', '25'),
      lesson('algebra', '48'),
      lesson('physics', '50'),
      lesson('social', '25'),
    ],
    tue: [
      lesson('algebra', '48'),
      lesson('kyrgyz', '28'),
      lesson('foreign', '15/27'),
      lesson('chemistry', '17'),
      lesson('algebra', '48'),
      lesson('russianLit', '22'),
    ],
    wed: [
      lesson('kyrgyzLit', '28'),
      lesson('biology', '45'),
      lesson('russian', '51/22'),
      lesson('history', '25'),
      lesson('physics', '50'),
    ],
    thu: [
      lesson('pe', 'с/з'),
      lesson('chemistry', '39'),
      lesson('foreign', '15/27'),
      lesson('kyrgyz', '28'),
      lesson('kyrgyzLit', '28'),
    ],
    fri: [
      lesson('achd', '52'),
      lesson('achd', '52'),
      lesson('geography', '40'),
      lesson('geometry', '23'),
      lesson('pe', 'с/з'),
      lesson('physics', '50'),
    ],
  },
  '10В': {
    mon: [
      lesson('pe', 'с/з'),
      lesson('geometry', '41'),
      lesson('russian', '51/22'),
      lesson('algebra', '41'),
      lesson('kyrgyzLit', '17'),
      lesson('physics', '50'),
    ],
    tue: [
      lesson('algebra', '41'),
      lesson('kyrgyz', '17'),
      lesson('russianLit', '22'),
      lesson('geography', '40'),
      lesson('chemistry', '43'),
    ],
    wed: [
      lesson('biology', '45'),
      lesson('russian', '51/22'),
      lesson('achd', '52'),
      lesson('achd', '52'),
      lesson('algebra', '41'),
      lesson('physics', '50'),
    ],
    thu: [
      lesson('chemistry', '39'),
      lesson('kyrgyzLit', '17'),
      lesson('history', '25'),
      lesson('pe', 'с/з'),
      lesson('physics', '50'),
      lesson('foreign', '27/37'),
    ],
    fri: [
      lesson('history', '25'),
      lesson('social', '25'),
      lesson('kyrgyz', '17'),
      lesson('russianLit', '27/37'),
      lesson('foreign', '27/37'),
      lesson('kyrgyz', '43'),
    ],
  },
  '10Г': {
    mon: [
      lesson('history', '25'),
      lesson('kyrgyzLit', '43'),
      lesson('achd', '52'),
      lesson('achd', '52'),
      lesson('pe', 'с/з'),
      lesson('foreign', '26/37'),
    ],
    tue: [
      lesson('kyrgyz', '17'),
      lesson('algebra', '23'),
      lesson('chemistry', '17'),
      lesson('kyrgyzLit', '17'),
      lesson('biology', '45'),
      lesson('geography', '40'),
    ],
    wed: [
      lesson('kyrgyzLit', '17'),
      lesson('foreign', '15/37'),
      lesson('history', '25'),
      lesson('pe', 'с/з'),
      lesson('algebra', '23'),
      lesson('physics', '49'),
    ],
    thu: [
      lesson('kyrgyzLit', '17'),
      lesson('geometry', '23'),
      lesson('russian', '20/22'),
      lesson('physics', '39'),
      lesson('russianLit', '22'),
      lesson('chemistry', '39'),
    ],
    fri: [
      lesson('algebra', '23'),
      lesson('russian', '20/22'),
      lesson('physics', '49'),
      lesson('social', '22'),
    ],
  },
  '10Д': {
    mon: [
      lesson('algebra', '41'),
      lesson('history', '25'),
      lesson('kyrgyz', '43'),
      lesson('russian', '51/22'),
      lesson('achd', '52'),
      lesson('achd', '52'),
    ],
    tue: [
      lesson('chemistry', '43'),
      lesson('foreign', '15/27'),
      lesson('history', '25'),
      lesson('biology', '45'),
      lesson('russianLit', '22'),
      lesson('physics', '23'),
    ],
    wed: [
      lesson('russian', '51/22'),
      lesson('kyrgyzLit', '17'),
      lesson('pe', 'с/з'),
      lesson('geometry', '41'),
      lesson('physics', '25'),
      lesson('algebra', '41'),
    ],
    thu: [
      lesson('russianLit', '22'),
      lesson('foreign', '15/27'),
      lesson('kyrgyz', '43'),
      lesson('chemistry', '39'),
      lesson('geography', '40'),
    ],
    fri: [
      lesson('kyrgyzLit', '17'),
      lesson('algebra', '41'),
      lesson('social', '25'),
      lesson('pe', 'с/з'),
      lesson('kyrgyz', '17'),
      lesson('physics', ''),
    ],
  },
  '10Е': {
    mon: [
      lesson('achd', '52'),
      lesson('achd', '52'),
      lesson('kyrgyzLit', '28'),
      lesson('history', '25'),
      lesson('algebra', '48'),
      lesson('kyrgyz', '28'),
    ],
    tue: [
      lesson('foreign', '15/27'),
      lesson('algebra', '48'),
      lesson('physics', '49'),
      lesson('russianLit', '22'),
      lesson('kyrgyz', '28'),
    ],
    wed: [
      lesson('geometry', '23'),
      lesson('history', '25'),
      lesson('biology', '45'),
      lesson('physics', '49'),
      lesson('pe', 'с/з'),
      lesson('kyrgyzLit', '28'),
    ],
    thu: [
      lesson('foreign', '15/27'),
      lesson('pe', 'с/з'),
      lesson('russian', '20/22'),
      lesson('chemistry', '39'),
      lesson('geography', '40'),
    ],
    fri: [
      lesson('russianLit', '22'),
      lesson('algebra', '48'),
      lesson('russian', '20/22'),
      lesson('physics', '49'),
      lesson('social', '25'),
      lesson('chemistry', ''),
    ],
  },
}
