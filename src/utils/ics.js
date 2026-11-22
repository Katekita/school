import { subjectName, weekDays } from '../data/schedule.js'
import { entriesFor } from '../data/schedule.js'
import { currentWeekStart } from './scheduleLive.js'
import { escapeText, line } from './icsText.js'

// Экспорт недели в формат iCalendar (.ics): работает офлайн, без бэкенда.
// Каждый урок — отдельное событие с кабинетом в описании.
// Модуль зависит от каталога расписания, поэтому попадает только в ленивый
// чанк страницы расписания. Экспорт событий вынесен в eventIcs.js.

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

export function buildIcs(classKey, lang, scheduleEntries = null) {
  const monday = currentWeekStart()
  const stamp = new Date()

  const events = []
  const rows = (Array.isArray(scheduleEntries) ? scheduleEntries : entriesFor(classKey))
    .map((item) => ({
      day: weekDays[item.weekday - 1],
      index: item.lesson_number - 1,
      item,
      time: {
        start: String(item.starts_at).slice(0, 5),
        end: String(item.ends_at).slice(0, 5),
      },
    }))

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

