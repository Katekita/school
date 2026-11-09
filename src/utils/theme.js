// Единая точка управления темой: значение живёт в localStorage,
// применяется к <html data-theme>, а компоненты синхронизируются через событие.

const STORAGE_KEY = 'school68_theme'
export const THEME_EVENT = 'school68:theme'

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

export function readTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'auto'
  } catch {
    return 'auto'
  }
}

export function isDarkActive() {
  return document.documentElement.dataset.theme === 'dark'
}

export function applyTheme(value) {
  const dark = value === 'dark' || (value === 'auto' && prefersDark())
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* localStorage недоступен — тема действует только до перезагрузки */
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: value }))
  return dark
}

export function cycleTheme() {
  const order = ['auto', 'light', 'dark']
  const next = order[(order.indexOf(readTheme()) + 1) % order.length]
  applyTheme(next)
  return next
}
