import { lessonTimes, schedule10, scheduleClasses, subjectName, weekDays } from '../data/schedule.js'
import { currentWeekStart } from './scheduleLive.js'

// Экспорт недели в формат iCalendar (.ics): работает офлайн, без бэкенда.
// Каждый урок — отдельное событие с кабинетом в описании.

const dayOffsets = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4 }

function pad(value) {
  return String(value).padStart(2, '0')
}

// Локальное время без смещения: школа работает в одном часовом поясе.
function icsDate(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00`
  )
}

function icsUtcStamp(date) {
  return `${icsDate(date)}Z`
}

function escapeText(value) {
  return value.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
}

function line(value) {
  // RFC 5545 требует перенос длинных строк
  if (value.length <= 74) return value
  return `${value.slice(0, 74)}\r\n ${value.slice(74)}`
}

export function buildIcs(classKey, lang, scheduleEntries = null) {
  const monday = currentWeekStart()
  const stamp = new Date()

  const events = []
  const rows = Array.isArray(scheduleEntries)
    ? scheduleEntries.map((entry) => ({
        day: weekDays[entry.weekday - 1],
        index: entry.lesson_number - 1,
        item: entry,
        time: {
          start: String(entry.starts_at).slice(0, 5),
          end: String(entry.ends_at).slice(0, 5),
        },
      }))
    : weekDays.flatMap((day) =>
        (schedule10[classKey]?.[day.id] || []).map((item, index) => ({
          day,
          index,
          item,
          time: lessonTimes[index],
        })),
      )

  for (const { day, index, item, time } of rows) {
      if (!day || dayOffsets[day.id] === undefined || !time) continue
      const offset = dayOffsets[day.id]
      const [sh, sm] = time.start.split(':').map(Number)
      const [eh, em] = time.end.split(':').map(Number)
      const start = new Date(monday)
      start.setUTCDate(monday.getUTCDate() + offset)
      start.setUTCHours(sh, sm, 0, 0)
      const end = new Date(monday)
      end.setUTCDate(monday.getUTCDate() + offset)
      end.setUTCHours(eh, em, 0, 0)

      const subject = subjectName(item.subject, lang)
      events.push(
        [
          'BEGIN:VEVENT',
          `UID:${classKey}-${day.id}-${index + 1}@school68.local`,
          `DTSTAMP:${icsUtcStamp(stamp)}`,
          `DTSTART;TZID=Asia/Bishkek:${icsDate(start)}`,
          `DTEND;TZID=Asia/Bishkek:${icsDate(end)}`,
          line(`SUMMARY:${escapeText(subject)}`),
          line(
            `DESCRIPTION:${escapeText(
              `${index + 1}-сабак · ${time.start}–${time.end}` +
                (item.room ? ` · ${item.room}` : ''),
            )}`,
          ),
          line(`LOCATION:${escapeText(`№68 мектеп, ${day[lang] || day.ky}`)}`),
          'RRULE:FREQ=WEEKLY',
          'END:VEVENT',
        ].join('\r\n'),
      )
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//School 68//Schedule//KG',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Bishkek',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0600',
    'TZOFFSETTO:+0600',
    'TZNAME:+06',
    'END:STANDARD',
    'END:VTIMEZONE',
    line(`X-WR-CALNAME:${escapeText(`${classKey} · №68`)}`),
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(classKey, lang, scheduleEntries = null) {
  const blob = new Blob([buildIcs(classKey, lang, scheduleEntries)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `schedule-${classKey}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function buildEventIcs(event) {
  const date = String(event?.date || '').slice(0, 10)
  const parsedDate = new Date(`${date}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new Error('Event date must be a valid ISO date')
  }

  const endDate = new Date(parsedDate)
  endDate.setUTCDate(endDate.getUTCDate() + 1)
  const uid = String(event.slug || `${date}-${event.title}`).replace(/[^a-zA-Z0-9._-]/g, '-')
  const summary = String(event.title || '')
  const description = String(event.summary || event.excerpt || '')
  const location = String(event.location || '')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//School 68//Events//KG',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@school68.local`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART;VALUE=DATE:${date.replace(/-/g, '')}`,
    `DTEND;VALUE=DATE:${endDate.toISOString().slice(0, 10).replace(/-/g, '')}`,
    line(`SUMMARY:${escapeText(summary)}`),
    ...(description ? [line(`DESCRIPTION:${escapeText(description)}`)] : []),
    ...(location ? [line(`LOCATION:${escapeText(location)}`)] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadEventIcs(event) {
  const blob = new Blob([buildEventIcs(event)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `event-${String(event.slug || event.date).replace(/[^a-zA-Z0-9_-]/g, '-')}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Ссылки на все классы сразу — для печати/сохранения учителем.
export const allClasses = scheduleClasses
