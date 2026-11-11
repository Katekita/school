import news from './generated/news.json'
import events from './generated/events.json'
import documents from './generated/docs.json'

export const newsItems = news.filter((item) => item.published !== false)
export { events, documents }
export const schedule = []
