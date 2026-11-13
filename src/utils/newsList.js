/**
 * Debounce — возвращает функцию, которая выполнится не раньше,
 * чем через `delay` мс после последнего вызова.
 */
export function debounce(fn, delay) {
  let id
  return (...args) => {
    clearTimeout(id)
    id = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Считывает URL-параметры для ленты новостей.
 * @returns {{ category: string | null, q: string, sort: 'new' | 'old' }}
 */
export function readSearchParams(location) {
  const params = new URLSearchParams(location.search)
  return {
    category: params.get('category') || null,
    q: params.get('q') || '',
    sort: params.get('sort') === 'old' ? 'old' : 'new',
  }
}

/**
 * Формирует строку query-параметров для навигации по ленте.
 */
export function buildQuery(category, q, sort, currentSearch = '') {
  const params = new URLSearchParams(currentSearch)
  params.delete('category')
  params.delete('q')
  params.delete('sort')
  if (category) params.set('category', category)
  if (q) params.set('q', q)
  if (sort === 'old') params.set('sort', 'old')
  const s = params.toString()
  return s ? `?${s}` : ''
}

/**
 * Собирает уникальные категории из массива новостей.
 */
export function uniqueCategories(items) {
  const set = new Set()
  for (const item of items) {
    if (item.category && String(item.category).trim()) set.add(String(item.category).trim())
  }
  return [...set]
}

/**
 * Ищет по заголовку и тексту (без учёта регистра).
 */
export function searchItems(items, query) {
  if (!query.trim()) return items
  const q = query.toLowerCase()
  return items.filter((item) => {
    const title = (item.title || '').toLowerCase()
    const excerpt = (item.excerpt || '').toLowerCase()
    const body = (item.content || '').toLowerCase()
    return title.includes(q) || excerpt.includes(q) || body.includes(q)
  })
}
