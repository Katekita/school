import {
  getBellSchedule,
  getClassByName,
  schedule10,
  scheduleClasses,
  subjectName,
  weekDays,
} from '../src/data/schedule.js'
import { getEntriesLiveStatus, getNextLesson, currentWeekStart } from '../src/utils/scheduleLive.js'
import { buildIcs } from '../src/utils/ics.js'

const errors = []
const roomConflicts = []
const lowerGradeTimingRules = {
  1: { shiftStarts: { morning: '07:30' }, lessonMinutes: 40 },
  2: { shiftStarts: { morning: '07:30', afternoon: '13:30' }, lessonMinutes: 40 },
  3: { shiftStarts: { morning: '07:30', afternoon: '13:30' }, lessonMinutes: 45 },
  4: { shiftStarts: { afternoon: '13:30' }, lessonMinutes: 45 },
}
const toMinutes = (value) => {
  const [hours, minutes] = String(value).slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}
const formatMinutes = (value) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`

for (const [className, expectedShift] of [
  ['2Г', 'afternoon'],
  ['2Д', 'afternoon'],
  ['5А', 'afternoon'],
  ['7А', 'afternoon'],
  ['7А (12)', 'afternoon'],
  ['8А', 'morning'],
  ['11А', 'morning'],
]) {
  const classData = getClassByName(className)
  if (classData?.shift !== expectedShift) {
    errors.push(`${className}: expected ${expectedShift} shift`)
  }
}
if (getClassByName('7А')?.id === getClassByName('7А (12)')?.id) {
  errors.push('11-year and 12-year grade 7 classes must remain separate')
}
if (scheduleClasses.some((className) => getClassByName(className)?.grade === 6)) {
  errors.push('grade 6 must not be added without source lesson data')
}
const grade5Homeroom = getClassByName('5Б')?.classHours?.thu
if (!grade5Homeroom || schedule10['5Б']?.thu?.some((lesson) => lesson.subject === 'classHour')) {
  errors.push('zero-period homeroom must be separate from numbered lessons')
}
for (const [date, expectedEnd] of [
  ['2026-11-16T01:00:00Z', '13:45'],
  ['2026-11-18T01:00:00Z', '13:40'],
]) {
  const next = getNextLesson('5А', new Date(date))
  if (next?.time.start !== '13:00' || next?.time.end !== expectedEnd) {
    errors.push(`grade 5 next lesson on ${date} should be 13:00–${expectedEnd}`)
  }
}
const sampleEntries = [
  { weekday: 5, lesson_number: 1, starts_at: '07:30:00', ends_at: '08:15:00', subject: 'physics', room: '101' },
  { weekday: 5, lesson_number: 2, starts_at: '08:20:00', ends_at: '09:05:00', subject: 'chemistry', room: '102' },
]
const liveCases = [
  ['lesson', new Date('2026-11-13T01:35:00Z'), sampleEntries],
  ['break', new Date('2026-11-13T02:17:00Z'), sampleEntries],
  ['before', new Date('2026-11-13T01:00:00Z'), sampleEntries],
  ['done', new Date('2026-11-13T03:05:00Z'), sampleEntries],
  ['weekend', new Date('2026-11-14T03:00:00Z'), sampleEntries],
  ['empty', new Date('2026-11-16T01:00:00Z'), []],
]

for (const [expected, now, entries] of liveCases) {
  const actual = getEntriesLiveStatus(entries, now).kind
  if (actual !== expected) errors.push(`live status at ${now.toISOString()}: expected ${expected}, got ${actual}`)
}

if (getEntriesLiveStatus(sampleEntries, new Date('2026-11-13T02:15:00Z')).kind !== 'break') {
  errors.push('lesson end boundary should start a break')
}
if (getEntriesLiveStatus(sampleEntries, new Date('2026-11-13T02:20:00Z')).kind !== 'lesson') {
  errors.push('lesson start boundary should start the lesson')
}
if (currentWeekStart(new Date('2026-11-13T01:00:00Z')).toISOString().slice(0, 10) !== '2026-11-09') {
  errors.push('week start should use the Asia/Bishkek calendar date')
}

const calendar = buildIcs('10a', 'ru', sampleEntries)
for (const requiredLine of [
  'TZID:Asia/Bishkek',
  'DTSTART;TZID=Asia/Bishkek:',
  'DTEND;TZID=Asia/Bishkek:',
  'DTSTAMP:',
  'RRULE:FREQ=WEEKLY',
]) {
  if (!calendar.includes(requiredLine)) errors.push(`weekly calendar is missing ${requiredLine}`)
}
if (!/DTSTAMP:\d{8}T\d{6}Z/.test(calendar)) errors.push('calendar DTSTAMP must be UTC per RFC 5545')

const roomAssignments = new Map()
const unknownTimingClasses = []
for (const className of scheduleClasses) {
  const week = schedule10[className]
  const classData = getClassByName(className)
  if (!week) {
    errors.push(`${className}: missing weekly schedule`)
    continue
  }
  if (classData?.id !== className) errors.push(`${className}: class name lookup failed`)
  if (!classData?.timingKnown) unknownTimingClasses.push(className)
  for (const day of weekDays) {
    const lessons = week[day.id]
    const bells = getBellSchedule(classData, day.id)
    const gradeRules = lowerGradeTimingRules[classData?.grade]
    const expectedStart = gradeRules?.shiftStarts[classData?.shift]
      || (classData?.shift === 'afternoon' ? '13:00' : '07:30')
    const expectedDuration = gradeRules
      ? gradeRules.lessonMinutes
      : day.id === 'wed' ? 40 : 45

    if (!Array.isArray(lessons) || lessons.length === 0) {
      errors.push(`${className}, ${day.id}: no lessons`)
      continue
    }
    if (lessons.length > 6) errors.push(`${className}, ${day.id}: class-hour row must not count as a seventh lesson`)
    if (bells[0]?.start !== expectedStart) errors.push(`${className}, ${day.id}: expected first bell at ${expectedStart}`)
    for (let index = 0; index < bells.length; index += 1) {
      const bell = bells[index]
      if (toMinutes(bell.end) - toMinutes(bell.start) !== expectedDuration) {
        errors.push(`${className}, ${day.id} lesson ${index + 1}: expected ${expectedDuration}-minute duration`)
      }
      if (index > 0) {
        const expectedBreak = index === 3 ? 10 : 5
        if (toMinutes(bell.start) - toMinutes(bells[index - 1].end) !== expectedBreak) {
          errors.push(`${className}, ${day.id} lesson ${index + 1}: expected ${expectedBreak}-minute break`)
        }
      }
    }
    if (bells.length === 6) {
      const expectedEnd = formatMinutes(toMinutes(expectedStart) + expectedDuration * 6 + 30)
      if (bells[5].end !== expectedEnd) {
        errors.push(`${className}, ${day.id}: expected sixth lesson to end at ${expectedEnd}`)
      }
    }
    for (const lesson of lessons) {
      const slot = `${className}/${day.id}/${lesson?.number}`
      const bell = bells[lesson?.number - 1]
      if (!lesson || !lesson.subject) errors.push(`${slot}: missing subject`)
      else if (subjectName(lesson.subject, 'en') === lesson.subject) errors.push(`${slot}: unknown subject "${lesson.subject}"`)
      if (!bell) {
        errors.push(`${slot}: missing bell time`)
        continue
      }
      if (lesson?.room && classData?.timingKnown) {
        const room = String(lesson.room).trim()
        const key = `${day.id}/${room.toLocaleLowerCase()}`
        const assignments = roomAssignments.get(key) || []
        const start = toMinutes(bell.start)
        const end = toMinutes(bell.end)
        const conflict = assignments.find((item) => start < item.end && end > item.start)
        if (conflict) {
          roomConflicts.push(`${day.id} ${bell.start}: room ${room} assigned to ${conflict.className} and ${className}`)
        }
        assignments.push({ className, start, end })
        roomAssignments.set(key, assignments)
      }
    }
  }
}

if (unknownTimingClasses.length) {
  console.warn(`Exact room-time conflicts were not checked for ${unknownTimingClasses.length} classes with estimated bells.`)
}
if (roomConflicts.length) {
  console.warn(`Schedule contains ${roomConflicts.length} possible room conflicts in classes with confirmed bell times:`)
  roomConflicts.slice(0, 30).forEach((conflict) => console.warn(`- ${conflict}`))
  if (roomConflicts.length > 30) console.warn(`- ...and ${roomConflicts.length - 30} more`)
}
if (errors.length) {
  console.error(`Schedule validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`)
  errors.slice(0, 30).forEach((error) => console.error(`- ${error}`))
  if (errors.length > 30) console.error(`- ...and ${errors.length - 30} more`)
  process.exitCode = 1
} else if (scheduleClasses.length === 0) {
  console.log('Schedule is empty by design; no class allocations are published.')
} else {
  console.log(`Schedule validation passed for ${scheduleClasses.length} classes.`)
}
