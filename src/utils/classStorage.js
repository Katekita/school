import { scheduleClasses } from '../data/schedule'

const CLASS_STORAGE_KEY = 'school68_schedule_class'

// Выбранный класс запоминаем локально: шапке и главной нужен «следующий урок»
// без запроса к серверу, а страница расписания дополнительно читает ?class=.
export function readSavedClass() {
  try {
    const saved = localStorage.getItem(CLASS_STORAGE_KEY)
    if (saved && scheduleClasses.includes(saved)) return saved
  } catch {
    /* localStorage может быть недоступен */
  }
  return scheduleClasses[0]
}

export function saveClass(className) {
  try {
    localStorage.setItem(CLASS_STORAGE_KEY, className)
  } catch {
    /* сохранение выбора не критично */
  }
}
