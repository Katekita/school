const CLASS_STORAGE_KEY = 'school68_schedule_class'

// Запоминаем последний выбранный класс. Страница сверяет его с перечнем,
// который получает из защищённой таблицы Supabase.
export function readSavedClass() {
  try {
    const saved = localStorage.getItem(CLASS_STORAGE_KEY)
    if (saved) return saved
  } catch {
    /* localStorage может быть недоступен */
  }
  return ''
}

export function saveClass(className) {
  try {
    localStorage.setItem(CLASS_STORAGE_KEY, className)
  } catch {
    /* сохранение выбора не критично */
  }
}
