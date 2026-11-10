import { schedule10, scheduleClasses, subjectName, weekDays } from '../data/schedule'

// Единый индекс для командной палитры (Ctrl+K) и страницы поиска.
// Собирается из переводов: разделы, FAQ, предметы расписания.

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

export function buildIndex({ t, get, lang }) {
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

  // Предметы расписания — чтобы «алгебра» вела сразу к нужному дню/классу.
  const seen = new Set()
  for (const classKey of scheduleClasses) {
    for (const day of weekDays) {
      for (const lesson of schedule10[classKey]?.[day.id] || []) {
        const name = subjectName(lesson.subject, lang)
        const uid = `${lesson.subject}`
        if (seen.has(uid)) continue
        seen.add(uid)
        items.push({
          id: `subject:${uid}`,
          title: name,
          subtitle: `${t('schedule.classLabel')} ${classKey}`,
          group: t('palette.groupSubjects'),
          to: `/students/schedule?class=${classKey}&day=${day.id}`,
          icon: 'BookOpen',
          kind: 'subject',
        })
      }
    }
  }

  return items
}

// Простое нечёткое совпадение: подстрока или все токены вопроса присутствуют.
export function searchIndex(index, query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const tokens = q.split(/\s+/).filter(Boolean)
  return index
    .map((item) => {
      const haystack = `${item.title} ${item.subtitle} ${item.group}`.toLowerCase()
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
