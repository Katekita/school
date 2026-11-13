// Единый индекс для командной палитры (Ctrl+K) и страницы поиска.
// Собирается из переводов: разделы и FAQ. Закрытые уроки в поиск не попадают.

const sections = [
  { to: '/', group: 'nav', key: 'common.backHome', icon: 'Home' },
  { to: '/mektep', group: 'nav', key: 'nav.school', icon: 'School' },
  { to: '/about/history', group: 'nav', key: 'nav.history', icon: 'History' },
  { to: '/about/alykul-osmonov', group: 'nav', key: 'nav.alykul', icon: 'Feather' },
  { to: '/jetekchilik', group: 'nav', key: 'nav.leadership', icon: 'Crown' },
  { to: '/mugalimder', group: 'nav', key: 'nav.teachers', icon: 'UsersRound' },
  { to: '/kabyl-aluu', group: 'nav', key: 'nav.admission', icon: 'GraduationCap' },
  { to: '/parents', group: 'nav', key: 'nav.parents', icon: 'HeartHandshake' },
  { to: '/students', group: 'nav', key: 'nav.students', icon: 'Backpack' },
  { to: '/students/schedule', group: 'nav', key: 'nav.schedule', icon: 'CalendarDays' },
  { to: '/news', group: 'nav', key: 'nav.news', icon: 'Newspaper' },
  { to: '/documents', group: 'nav', key: 'nav.documents', icon: 'FileText' },
  { to: '/dariek', group: 'nav', key: 'nav.location', icon: 'MapPin' },
  { to: '/baylanysh', group: 'nav', key: 'nav.contact', icon: 'Phone' },
  { to: '/faq', group: 'nav', key: 'nav.faq', icon: 'HelpCircle' },
  { to: '/search', group: 'nav', key: 'common.search', icon: 'Search' },
]

export function buildIndex({ t, get, news = [], documents = [] }) {
  const items = sections.map((s) => ({
    id: `section:${s.to}`,
    title: t(s.key),
    subtitle: t('palette.sectionHint'),
    group: t('palette.groupSections'),
    to: s.to,
    icon: s.icon,
    kind: 'section',
  }))

  const faqs = get('faq.items') || []
  faqs.forEach((item, i) => {
    items.push({
      id: `faq:${i}`,
      title: item.q,
      subtitle: item.a,
      group: t('palette.groupFaq'),
      to: `/faq#faq-${i}`,
      icon: 'HelpCircle',
      kind: 'faq',
    })
  })

  news.forEach((item) => {
    items.push({
      id: `news:${item.slug}`,
      title: item.title,
      subtitle: item.excerpt,
      searchText: `${item.content || ''} ${item.category || ''}`,
      group: t('nav.news'),
      to: `/news/${encodeURIComponent(item.slug)}`,
      icon: 'Newspaper',
      kind: 'news',
    })
  })

  documents.forEach((item) => {
    const url = typeof item.url === 'string' && /^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(item.url)
      ? item.url
      : '/documents'
    items.push({
      id: `document:${item.id}`,
      title: item.title,
      subtitle: item.category || item.excerpt,
      searchText: `${item.content || ''} ${item.category || ''}`,
      group: t('nav.documents'),
      to: url,
      icon: 'FileText',
      kind: 'document',
    })
  })

  return items
}

// Простое нечёткое совпадение: подстрока или все токены вопроса присутствуют.
export function searchIndex(index, query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const tokens = q.split(/\s+/).filter(Boolean)
  return index
    .map((item) => {
      const haystack = `${item.title} ${item.subtitle} ${item.searchText || ''} ${item.group}`.toLowerCase()
      let score = 0
      if (haystack.startsWith(q)) score += 100
      if (item.title.toLowerCase().includes(q)) score += 60
      if (haystack.includes(q)) score += 30
      for (const token of tokens) {
        if (haystack.includes(token)) score += 12
      }
      return { item, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((r) => r.item)
}

export const quickActions = {
  copyLink: 'palette.actionCopy',
  print: 'palette.actionPrint',
  ics: 'palette.actionIcs',
  toggleTheme: 'palette.actionTheme',
}
