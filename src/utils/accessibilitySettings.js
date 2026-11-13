export const ACCESSIBILITY_SETTINGS_EVENT = 'school68:accessibility-settings'

const STORAGE_KEYS = {
  textSize: 'school68_text_size',
  reduceMotion: 'school68_reduce_motion',
  visibleFocus: 'school68_visible_focus',
}

export const DEFAULT_ACCESSIBILITY_SETTINGS = {
  textSize: 'medium',
  reduceMotion: false,
  visibleFocus: false,
}

export function readAccessibilitySettings() {
  try {
    const textSize = localStorage.getItem(STORAGE_KEYS.textSize)
    return {
      textSize: ['small', 'medium', 'large'].includes(textSize) ? textSize : DEFAULT_ACCESSIBILITY_SETTINGS.textSize,
      reduceMotion: localStorage.getItem(STORAGE_KEYS.reduceMotion) === 'true',
      visibleFocus: localStorage.getItem(STORAGE_KEYS.visibleFocus) === 'true',
    }
  } catch {
    return { ...DEFAULT_ACCESSIBILITY_SETTINGS }
  }
}

export function applyAccessibilitySettings(settings) {
  const normalized = {
    textSize: ['small', 'medium', 'large'].includes(settings.textSize)
      ? settings.textSize
      : DEFAULT_ACCESSIBILITY_SETTINGS.textSize,
    reduceMotion: Boolean(settings.reduceMotion),
    visibleFocus: Boolean(settings.visibleFocus),
  }
  const root = document.documentElement
  root.dataset.textSize = normalized.textSize
  root.dataset.reducedMotion = String(normalized.reduceMotion)
  root.dataset.visibleFocus = String(normalized.visibleFocus)

  let saved = true
  try {
    localStorage.setItem(STORAGE_KEYS.textSize, normalized.textSize)
    localStorage.setItem(STORAGE_KEYS.reduceMotion, String(normalized.reduceMotion))
    localStorage.setItem(STORAGE_KEYS.visibleFocus, String(normalized.visibleFocus))
  } catch {
    saved = false
  }
  window.dispatchEvent(new CustomEvent(ACCESSIBILITY_SETTINGS_EVENT, { detail: normalized }))
  return saved
}
