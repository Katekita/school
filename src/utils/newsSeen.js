const STORAGE_KEY = 'school68_news_seen'

export function readNewsSeen() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function markNewsSeen(slug) {
  try {
    const seen = readNewsSeen()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...seen, [slug]: Date.now() }))
  } catch {}
}
