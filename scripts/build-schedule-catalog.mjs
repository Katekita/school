// Извлекает расписание 1–11 классов из markdown-таблиц источника (jina.txt)
// и превращает их в машиночитаемый каталог src/data/scheduleCatalog.json.
//
// Таблицы устроены как «класс в столбце»: заголовок перечисляет классы,
// а каждая строка — один урок одного дня. Поэтому разбор идёт по заголовку:
// привязка «столбец → класс» берётся из него, а не из эвристики по тексту.

import fs from 'node:fs'

const SOURCE = 'jina.txt'
const OUTPUT = 'src/data/scheduleCatalog.json'

const DAY_IDS = {
  'Дүйшөмбү': 'mon',
  'Шейшемби': 'tue',
  'Шаршемби': 'wed',
  'Бейшемби': 'thu',
  'Жума': 'fri',
}

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri']
const GENERAL_TIMING_RULES = {
  shiftStarts: { morning: '07:30', afternoon: '13:00' },
  lessonMinutesByDay: { mon: 45, tue: 45, wed: 40, thu: 45, fri: 45 },
}
// Exact grade 1–4 bell grids from the supplied 2026–2027 school DOCX.
const LOWER_GRADE_TIMING_RULES = new Map([
  [1, { shiftStarts: { morning: '07:30' }, lessonMinutes: 40 }],
  [2, { shiftStarts: { morning: '07:30', afternoon: '13:30' }, lessonMinutes: 40 }],
  [3, { shiftStarts: { morning: '07:30', afternoon: '13:30' }, lessonMinutes: 45 }],
  [4, { shiftStarts: { afternoon: '13:30' }, lessonMinutes: 45 }],
])

const CONFIRMED_SHIFT_BY_GRADE = new Map([
  [5, 'afternoon'],
  [6, 'afternoon'],
  [7, 'afternoon'],
  [8, 'morning'],
  [9, 'morning'],
  [10, 'morning'],
  [11, 'morning'],
])

// Предметы приводятся к каноническому ключу: в источнике одно и то же
// название написано десятью способами («Матем», «Математика», «Алгебра»).
const SUBJECT_SYNONYMS = [
  ['math', ['математика', 'матем', 'м-та']],
  ['algebra', ['алгебра']],
  ['geometry', ['геометрия']],
  ['physics', ['физика']],
  ['chemistry', ['химия']],
  ['biology', ['биология', 'биол']],
  ['geography', ['география', 'геогр']],
  ['history', ['тарых', 'история']],
  ['russian', ['русский язык', 'орус тили', 'о тили', 'о-тили', 'о-тил', 'орус тил', 'о тили жана окуу', 'орус. тили']],
  ['russianLit', ['русская литература', 'орус адаб', 'о-адабият', 'о-адабияты', 'о.адабияты', 'о.адабият', 'русск. адап', 'орус. адап']],
  ['kyrgyz', ['кыргыз тили', 'к тили', 'к-тили', 'к.тили', 'кырг. тили', 'кырг тил', 'кырг. тил', 'к тили жана окуу']],
  ['kyrgyzLit', ['кыргыз адабияты', 'к-адабият', 'к-адабияты', 'к.адабият', 'к.адабияты', 'кырг. адаб', 'кырг. адап']],
  ['literature', ['адабий окуу', 'адабий окуу']],
  ['foreign', ['чет тили', 'чет-тили', 'иностранный язык', 'английский']],
  ['pe', ['дене тарбия', 'д-тарбия', 'д.тарбия', 'д-тарб', 'д. тарбия', 'физкультура']],
  ['informatics', ['информатика', 'информат', 'информ', 'инфор-ка']],
  ['technology', ['технология', 'эмгек']],
  ['art', ['көркөм өнөр', 'искусство']],
  ['music', ['музыка']],
  ['social', ['адам жана коом', 'ад. ж. коом', 'мен жана дүйнө', 'мен ж/а дүйнө', 'мен жана дүйн', 'мен жана д.', 'мен ж. дүйнө', 'мен ж. дүй', 'мен ж/а д.', 'человек и общество', 'окружающий мир', 'т-таануу', 'тарых таануу', 'адам жан. к', 'адам жана к.', 'мен ж/д.']],
  ['religion', ['дин өнүгүү', 'дин. өнүгүү', 'дин өн. т', 'дин. өн. т', 'дин өн', 'дин. өн. тар']],
  ['achd', ['ачд']],
  ['classHour', ['кл. саат', 'кл.саат', 'классный час']],
]

const SUBJECT_NAMES = {
  math: { ky: 'Математика', ru: 'Математика', en: 'Mathematics' },
  algebra: { ky: 'Алгебра', ru: 'Алгебра', en: 'Algebra' },
  geometry: { ky: 'Геометрия', ru: 'Геометрия', en: 'Geometry' },
  physics: { ky: 'Физика', ru: 'Физика', en: 'Physics' },
  chemistry: { ky: 'Химия', ru: 'Химия', en: 'Chemistry' },
  biology: { ky: 'Биология', ru: 'Биология', en: 'Biology' },
  geography: { ky: 'География', ru: 'География', en: 'Geography' },
  history: { ky: 'Тарых', ru: 'История', en: 'History' },
  russian: { ky: 'Орус тили', ru: 'Русский язык', en: 'Russian' },
  russianLit: { ky: 'Орус адабияты', ru: 'Русская литература', en: 'Russian literature' },
  kyrgyz: { ky: 'Кыргыз тили', ru: 'Кыргызский язык', en: 'Kyrgyz' },
  kyrgyzLit: { ky: 'Кыргыз адабияты', ru: 'Кыргызская литература', en: 'Kyrgyz literature' },
  literature: { ky: 'Адабий окуу', ru: 'Литературное чтение', en: 'Reading' },
  foreign: { ky: 'Чет тили', ru: 'Иностранный язык', en: 'Foreign language' },
  pe: { ky: 'Дене тарбия', ru: 'Физкультура', en: 'Physical education' },
  informatics: { ky: 'Информатика', ru: 'Информатика', en: 'Computer science' },
  technology: { ky: 'Технология', ru: 'Технология', en: 'Technology' },
  art: { ky: 'Көркөм өнөр', ru: 'ИЗО', en: 'Art' },
  music: { ky: 'Музыка', ru: 'Музыка', en: 'Music' },
  social: { ky: 'Адам жана коом', ru: 'Человек и общество', en: 'Society' },
  religion: { ky: 'Дин өнүгүү', ru: 'Основы религиозной культуры', en: 'Religious culture' },
  achd: { ky: 'АЧД', ru: 'АЧД', en: 'ACHD' },
  classHour: { ky: 'Класс сааты', ru: 'Классный час', en: 'Homeroom' },
}

function normalizeSubject(raw) {
  const text = raw.toLowerCase().replace(/\s*\([^)]*\)\s*/g, ' ').replace(/[.,]+$/g, '').trim()
  if (!text || text === '—' || text === '-') return null
  let best = null
  let bestLength = 0
  for (const [key, synonyms] of SUBJECT_SYNONYMS) {
    for (const synonym of synonyms) {
      if (text.startsWith(synonym) && synonym.length > bestLength) {
        best = key
        bestLength = synonym.length
      }
    }
  }
  if (best) return best
  for (const [key, synonyms] of SUBJECT_SYNONYMS) {
    for (const synonym of synonyms) {
      if (text.includes(synonym) && synonym.length > bestLength) {
        best = key
        bestLength = synonym.length
      }
    }
  }
  return best
}

function extractRoom(raw) {
  const matches = [...raw.matchAll(/\(([^)]*)\)/g)]
  if (!matches.length) return null
  const value = matches[matches.length - 1][1].trim()
  if (!value || value === '—') return null
  return value
}

const TIME_RE = /(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/

function addMinutes(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// Строка таблицы → массив ячеек
function cells(line) {
  return line.split('|').slice(1, -1).map((cell) => cell.trim())
}

function isSeparator(line) {
  return /^\|[\s:|-]+\|$/.test(line.trim())
}

// Заголовок таблицы: «1-А (каб.)» → класс, «1-я смена (время)» → столбец времени
function parseHeader(header) {
  const columns = []
  header.forEach((cell, index) => {
    const clean = cell.replace(/\*\*/g, '')
    const timeShift = clean.match(/^(\d+-я смена)/i)
    if (timeShift) {
      columns.push({ index, kind: 'shiftTime', shift: Number(timeShift[1]) === 1 ? 'morning' : 'afternoon' })
      return
    }
    const klass = clean.match(/^(\d{1,2})(?:[-\s]?)([А-Яа-яA-ZЁё])?(?:\((1[12])\))?/)
    if (!klass) {
      columns.push({ index, kind: 'meta', label: clean })
      return
    }
    const grade = Number(klass[1])
    const letter = (klass[2] || '').toUpperCase()
    const program = klass[3] ? Number(klass[3]) : null
    if (grade < 1 || grade > 11) {
      columns.push({ index, kind: 'meta', label: clean })
      return
    }
    const id = program ? `${grade}${letter} (${program})` : `${grade}${letter}`
    columns.push({ index, kind: 'class', id, grade, letter, program, label: clean })
  })
  return columns
}

function collectTables(lines) {
  const tables = []
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (!line.trim().startsWith('|')) continue
    if (i + 1 < lines.length && isSeparator(lines[i + 1])) {
      const header = cells(line)
      const rows = []
      let j = i + 2
      for (; j < lines.length; j += 1) {
        if (!lines[j].trim().startsWith('|')) break
        rows.push(cells(lines[j]))
      }
      tables.push({ header, rows, startLine: i })
      i = j - 1
    }
  }
  return tables
}

function shiftFromSection(lines, lineIndex) {
  for (let index = lineIndex; index >= 0; index -= 1) {
    const heading = lines[index].match(/^#{1,6}\s+(.+)$/)?.[1].toLowerCase()
    if (!heading) continue
    const hasMorning = /1-я смена/.test(heading)
    const hasAfternoon = /2-я смена/.test(heading)
    if (hasMorning === hasAfternoon) return null
    return hasAfternoon ? 'afternoon' : 'morning'
  }
  return null
}

const raw = fs.readFileSync(SOURCE, 'utf8')
const lines = raw.split(/\r?\n/)

// Секции нужны только чтобы понять, к какой параллели относится таблица.
const catalog = new Map()
const warnings = []
let maxSlots = 0

for (const table of collectTables(lines)) {
  const sectionShift = shiftFromSection(lines, table.startLine)
  const columns = parseHeader(table.header)
  const classColumns = columns.filter((column) => column.kind === 'class')
  if (!classColumns.length) continue
  const shiftTimeByClass = new Map()
  let activeShiftTime = null
  for (const column of columns) {
    if (column.kind === 'shiftTime') activeShiftTime = column
    else if (column.kind === 'class') shiftTimeByClass.set(column.id, activeShiftTime)
  }

  const numberColumn = table.header.findIndex((cell) => /^№/.test(cell.replace(/\*\*/g, '')))
  if (numberColumn < 0) {
    warnings.push(`Нет столбца «№»: ${table.header.join(' | ')}`)
    continue
  }

  let day = null
  for (const row of table.rows) {
    const first = row[0] || ''
    const dayMatch = Object.keys(DAY_IDS).find((name) => first.includes(name))
    if (dayMatch) day = DAY_IDS[dayMatch]

    const slotText = row[numberColumn] || ''
    const slotMatch = slotText.match(/^\s*(\d{1,2})/)
    if (!day || !slotMatch) continue
    const slot = Number(slotMatch[1])

    // Время урока: либо прямо в столбце «№ / Время», либо в столбце смены.
    let time = slotText.match(TIME_RE)
    let times = null
    if (time) {
      times = { start: time[1], end: time[2] }
    }

    for (const column of classColumns) {
      const value = row[column.index] || ''
      if (!value || value === '—' || value === '-') continue
      let classTimes = times
      if (!time && shiftTimeByClass.get(column.id)) {
        const candidate = (row[shiftTimeByClass.get(column.id).index] || '').match(TIME_RE)
        classTimes = candidate ? { start: candidate[1], end: candidate[2] } : null
      }
      const subject = normalizeSubject(value)
      const room = extractRoom(value)

      if (!subject) {
        warnings.push(`Не распознан предмет «${value}» (${column.id}, ${day} ${slot})`)
      }

      if (!catalog.has(column.id)) {
        catalog.set(column.id, {
          id: column.id,
          grade: column.grade,
          letter: column.letter,
          program: column.program,
          shift: null,
          week: {},
        })
      }

      const entry = catalog.get(column.id)
      if (classTimes) {
        entry.shift = toMinutes(classTimes.start) >= 12 * 60 ? 'afternoon' : 'morning'
      } else if (!entry.shift && sectionShift) {
        entry.shift = sectionShift
      }
      if (slot === 0) {
        entry.classHours ||= {}
        entry.classHours[day] = { subject: subject || 'classHour', room }
        continue
      }
      const lessons = (entry.week[day] ||= [])
      const existing = lessons.find((lesson) => lesson.slot === slot)
      if (existing) {
        existing.subject = subject || existing.subject || 'other'
        existing.raw = value
        if (room) existing.room = room
        if (classTimes && !existing.time) existing.time = classTimes
        continue
      }
      lessons.push({ slot, subject: subject || 'other', raw: value, room, time: classTimes })
    }
  }
}

// Дни приводятся к порядку Пн→Пт, а классный час с номером 0 хранится отдельно
// и не занимает один из шести уроков.
function breakAfter(lessonNumber) {
  return lessonNumber === 3 ? 10 : 5
}

function buildBells(grade, shift, lessonCount, day) {
  const bells = []
  const gradeRules = LOWER_GRADE_TIMING_RULES.get(grade)
  const rules = gradeRules || GENERAL_TIMING_RULES
  const shiftStart = rules.shiftStarts[shift]
  if (!shiftStart) return bells
  let cursor = shiftStart
  const duration = gradeRules ? gradeRules.lessonMinutes : rules.lessonMinutesByDay[day]

  for (let number = 1; number <= lessonCount; number += 1) {
    if (number > 1) cursor = addMinutes(cursor, breakAfter(number - 1))
    const start = cursor
    const end = addMinutes(start, duration)
    bells.push({ start, end })
    cursor = end
  }

  return bells
}

const classes = []
for (const entry of catalog.values()) {
  const week = {}
  let maxLessonNumber = 0

  for (const day of DAY_ORDER) {
    const lessons = (entry.week[day] || [])
      .filter((lesson) => lesson.slot > 0)
      .sort((a, b) => a.slot - b.slot)
    week[day] = lessons.map((lesson) => {
      maxLessonNumber = Math.max(maxLessonNumber, lesson.slot)
      return { number: lesson.slot, subject: lesson.subject, room: lesson.room }
    })
    if (maxLessonNumber > maxSlots) maxSlots = maxLessonNumber
  }

  const shift = entry.shift || CONFIRMED_SHIFT_BY_GRADE.get(entry.grade) || 'unknown'
  const bellsByDay = Object.fromEntries(
    DAY_ORDER.map((day) => [day, buildBells(entry.grade, shift, maxLessonNumber, day)]),
  )

  classes.push({
    id: entry.id,
    grade: entry.grade,
    letter: entry.letter,
    program: entry.program,
    shift,
    timingKnown: shift !== 'unknown',
    classHours: entry.classHours || {},
    bellsByDay,
    bells: bellsByDay.mon,
    week,
  })
}

classes.sort((a, b) => a.grade - b.grade || a.letter.localeCompare(b.letter, 'ru') || String(a.program).localeCompare(String(b.program)))

const output = {
  year: '2026–2027',
  source: 'Расписание №68 на 2026–2027 год: скан-таблицы и утверждённое расписание 1–4 классов',
  generatedAt: new Date().toISOString().slice(0, 10),
  maxSlots,
  timingRules: {
    general: GENERAL_TIMING_RULES,
    grades1To4: Object.fromEntries(LOWER_GRADE_TIMING_RULES),
  },
  subjectNames: SUBJECT_NAMES,
  classes,
}

fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`)

// Лёгкая сводка для секции «школа в цифрах» на главной: страница не должна
// тянуть весь каталог ради нескольких чисел (см. src/data/stats.js).
const summarySubjects = new Set()
const summaryRooms = new Set()
let summaryLessons = 0
let firstBell = null
let lastBell = null
const bellToMinutes = (value) => {
  const [hours, minutes] = String(value).split(':').map(Number)
  return hours * 60 + minutes
}
for (const item of classes) {
  for (const lessons of Object.values(item.week)) {
    for (const lesson of lessons) {
      summaryLessons += 1
      summarySubjects.add(lesson.subject)
      String(lesson.room || '')
        .split('/')
        .map((room) => room.trim())
        .filter(Boolean)
        .forEach((room) => summaryRooms.add(room))
    }
  }
  for (const bells of Object.values(item.bellsByDay)) {
    for (const bell of bells) {
      if (!firstBell || bellToMinutes(bell.start) < bellToMinutes(firstBell)) firstBell = bell.start
      if (!lastBell || bellToMinutes(bell.end) > bellToMinutes(lastBell)) lastBell = bell.end
    }
  }
}

const SUMMARY_OUTPUT = 'src/data/scheduleSummary.json'
fs.writeFileSync(
  SUMMARY_OUTPUT,
  `${JSON.stringify({
    classes: classes.length,
    subjects: summarySubjects.size,
    rooms: summaryRooms.size,
    lessons: summaryLessons,
    bellRange: firstBell && lastBell ? `${firstBell}\u2013${lastBell}` : '',
    year: output.year,
  }, null, 2)}\n`,
)
console.log(`Сводка записана: ${SUMMARY_OUTPUT}`)

const byGrade = new Map()
for (const item of classes) {
  byGrade.set(item.grade, (byGrade.get(item.grade) || 0) + 1)
}
console.log(`Классов: ${classes.length}`)
console.log([...byGrade.entries()].sort((a, b) => a[0] - b[0]).map(([grade, count]) => `${grade}-е: ${count}`).join(', '))
console.log(`Максимум слотов в день: ${maxSlots}`)
const lessonsTotal = classes.reduce((sum, item) => sum + Object.values(item.week).reduce((s, l) => s + l.length, 0), 0)
console.log(`Уроков всего: ${lessonsTotal}`)
const other = [...catalog.values()]
  .flatMap((item) => Object.values(item.week).flat())
  .filter((lesson) => !lesson.subject || lesson.subject === 'other')
console.log(`Нераспознанных предметов: ${other.length}`)
if (other.length) console.log([...new Set(other.map((lesson) => lesson.raw))].slice(0, 25).join(' | '))
if (warnings.length) console.log(`Предупреждений: ${warnings.length}\n${[...new Set(warnings)].slice(0, 15).join('\n')}`)
