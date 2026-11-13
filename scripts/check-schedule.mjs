import { schedule10, scheduleClasses, subjectName, weekDays } from '../src/data/schedule.js'
import { getEntriesLiveStatus, currentWeekStart } from '../src/utils/scheduleLive.js'
import { buildIcs } from '../src/utils/ics.js'

const errors = []
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

const roomsBySlot = new Map()
for (const className of scheduleClasses) {
  const week = schedule10[className]
  if (!week) {
    errors.push(`${className}: missing weekly schedule`)
    continue
  }
  for (const day of weekDays) {
    const lessons = week[day.id]
    if (!Array.isArray(lessons) || lessons.length === 0) {
      errors.push(`${className}, ${day.id}: no lessons`)
      continue
    }
    lessons.forEach((lesson, index) => {
      const slot = `${className}/${day.id}/${index + 1}`
      if (!lesson || !lesson.subject || !lesson.room) errors.push(`${slot}: empty lesson slot`)
      else if (subjectName(lesson.subject, 'en') === lesson.subject) errors.push(`${slot}: unknown subject "${lesson.subject}"`)
      if (lesson?.room) {
        for (const room of String(lesson.room).split('/').map((item) => item.trim()).filter(Boolean)) {
          const key = `${day.id}/${index + 1}/${room.toLocaleLowerCase()}`
          const previous = roomsBySlot.get(key)
          if (previous && previous !== className) errors.push(`${day.id} lesson ${index + 1}: room ${room} assigned to ${previous} and ${className}`)
          else roomsBySlot.set(key, className)
        }
      }
    })
  }
}

if (errors.length) {
  console.error(`Schedule validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exitCode = 1
} else if (scheduleClasses.length === 0) {
  console.log('Schedule is empty by design; no class allocations are published.')
} else {
  console.log(`Schedule validation passed for ${scheduleClasses.length} classes.`)
}
