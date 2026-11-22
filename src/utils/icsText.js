// Общие helper'ы формата iCalendar (RFC 5545).
// Вынесены, чтобы модули экспорта не зависели друг от друга.

export function escapeText(value) {
  return value.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
}

export function line(value) {
  // RFC 5545 требует перенос длинных строк
  if (value.length <= 74) return value
  return `${value.slice(0, 74)}\r\n ${value.slice(74)}`
}
