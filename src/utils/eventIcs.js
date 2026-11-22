// Экспорт событий (мероприятий) в формат .ics.
// Живёт отдельно от ics.js: он не зависит от каталога расписания
// (scheduleCatalog.json ~517 КБ), поэтому главная страница, подключая
// этот модуль, не тянет тяжёлый каталог в стартовый бандл.

import { escapeText, line } from './icsText'

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
