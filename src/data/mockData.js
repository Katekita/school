import news from './generated/news.json'
import devFixture from './__fixtures__/news.dev.json'
import events from './generated/events.json'
import documents from './generated/docs.json'

let sourceNews = news
if (import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1') {
  sourceNews = devFixture
}

export const newsItems = sourceNews.filter((item) => item.published !== false).map((item) => ({
  ...item,
  excerpt: item.excerpt ?? item.summary ?? '',
  content: item.content ?? item.body ?? '',
  cover: item.cover ?? '',
  slides: item.slides ?? '',
})).sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))
export { events, documents }
export const schedule = []
