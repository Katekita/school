/**
 * Даты новостей в часовом поясе школы — Asia/Bishkek (UTC+5).
 * Одна точка правды для «сегодня / вчера / на этой неделе», чтобы
 * логика не дублировалась в ленте, архиве и детальной странице.
 */

const TZ = 'Asia/Bishkek'

/** YYYY-MM-DD для момента в Asia/Bishkek. */
export function dayKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  // en-CA даёт ISO-порядок (ГГГГ-ММ-ДД), timeZone приводит к бишкекскому дню.
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TZ,
  }).format(date)
}

export function todayKey(now = new Date()) {
  return dayKey(now)
}

export function isToday(value, now = new Date()) {
  const key = dayKey(value)
  return Boolean(key) && key === todayKey(now)
}

export function isYesterday(value, now = new Date()) {
  const key = dayKey(value)
  if (!key) return false
  const yesterday = new Date(`${todayKey(now)}T12:00:00Z`)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  return key === dayKey(yesterday)
}

/** true, если публикация младше N часов — на неё вешается метка «Новое». */
export function isFresh(value, hours = 3, now = Date.now()) {
  const time = new Date(value).getTime()
  const age = now - time
  return Number.isFinite(time) && age >= 0 && age < hours * 3600_000
}

/** Время публикации в часовом поясе школы. */
export function formatNewsTime(value, lang) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(date)
}

/** Заголовок группы дня: «Сегодня» / «Вчера» / «12 ноября». */
export function formatDayHeader(value, lang, t) {
  if (isToday(value)) return t('news.today')
  if (isYesterday(value)) return t('news.yesterday')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', timeZone: TZ }).format(date)
}

/** Полная дата для шапки блока «Сегодня»: «13 ноября, пятница». */
export function formatFullDate(value, lang) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(lang, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    timeZone: TZ,
  }).format(date)
}

/** Короткая дата: «13 нояб. 2026». */
export function formatShortDate(value, lang) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }).format(date)
}

/** Время чтения по числу слов (~200 слов/мин). */
export function readTimeMinutes(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}
