import { lessonTimes, schedule10, scheduleClasses, subjectName, weekDays } from '../data/schedule'
import { currentWeekStart } from './scheduleLive'

// Экспорт недели в формат iCalendar (.ics): работает офлайн, без бэкенда.
// Каждый урок — отдельное событие с кабинетом в описании.

const dayOffsets = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4 }

function pad(value) {
  return String(value).padStart(2, '0')
}

// Локальное время без смещения: школа работает в одном часовом поясе.
function icsDate(date) {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  )
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
      start.setDate(monday.getDate() + offset)
      start.setHours(sh, sm, 0, 0)
      const end = new Date(monday)
      end.setDate(monday.getDate() + offset)
      end.setHours(eh, em, 0, 0)

      const subject = subjectName(item.subject, lang)
      events.push(
        [
          'BEGIN:VEVENT',
          `UID:${classKey}-${day.id}-${index + 1}@school68.local`,
          `DTSTAMP:${icsDate(stamp)}`,
          `DTSTART:${icsDate(start)}`,
          `DTEND:${icsDate(end)}`,
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

// Ссылки на все классы сразу — для печати/сохранения учителем.
export const allClasses = scheduleClasses
