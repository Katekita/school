import news from './generated/news.json'
import devFixture from './__fixtures__/news.dev.json'
import events from './generated/events.json'
import documents from './generated/docs.json'

const sourceNews = Array.isArray(news) ? [...devFixture, ...news] : news

const isNewsRecord = (item) => item && typeof item === 'object' && !Array.isArray(item)
  && typeof item.slug === 'string' && Boolean(item.slug.trim())
  && typeof item.title === 'string' && Boolean(item.title.trim())
const validSourceNews = Array.isArray(sourceNews)
  ? [...new Map(sourceNews.filter(isNewsRecord).map((item) => [item.slug, item])).values()]
  : []

export const newsDataError = !Array.isArray(sourceNews)
  || sourceNews.filter(isNewsRecord).length !== sourceNews.length
export const newsItems = validSourceNews.filter((item) => item.published !== false).map((item) => ({
  ...item,
  excerpt: item.excerpt ?? item.summary ?? '',
  content: item.content ?? item.body ?? '',
  cover: item.cover ?? '',
  slides: item.slides ?? '',
})).sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))
export { events, documents }
export const schedule = []
