import { useMemo, useState } from 'react'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { getNews } from '../services'
import { useLanguage } from '../i18n/LanguageContext'

const newsItems = getNews()

const pageSize = 12

function getDateKey(value) {
  const date = String(value || '')
  const dateOnly = date.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  if (dateOnly) {
    const parsedDate = new Date(`${dateOnly}T00:00:00Z`)
    if (Number.isFinite(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === dateOnly) return dateOnly
  }
  const timestamp = Date.parse(date)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : null
}

const newsDays = (() => {
  const days = new Map()
  for (const article of newsItems) {
    const key = getDateKey(article.date) || 'undated'
    if (!days.has(key)) days.set(key, [])
    days.get(key).push(article)
  }
  return [...days].map(([key, articles]) => ({ key, articles }))
})()

export default function NewsArchive() {
  const { t, lang } = useLanguage()
  const location = useLocation()
  const [selectedDay, setSelectedDay] = useState(newsDays[0]?.key)
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
    [lang],
  )
  const dayFormat = useMemo(
    () => new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' }),
    [lang],
  )
  const day = newsDays.find((item) => item.key === selectedDay) || newsDays[0]

  if (!day) return null

  const formattedDate = (key, short = false) => {
    if (key === 'undated') return t('news.archiveUndated')
    const date = new Date(`${key}T12:00:00Z`)
    if (lang === 'ky') {
      const dayNumber = String(date.getUTCDate()).padStart(2, '0')
      const monthNumber = String(date.getUTCMonth() + 1).padStart(2, '0')
      return short ? `${dayNumber}.${monthNumber}` : `${dayNumber}.${monthNumber}.${date.getUTCFullYear()}`
    }
    return (short ? dayFormat : dateFormat).format(date)
  }

  return (
    <section className="news-archive" aria-labelledby="news-archive-heading">
      <div className="news-archive-heading">
        <div>
          <p className="eyebrow">{t('news.archiveEyebrow')}</p>
          <h3 id="news-archive-heading">{t('news.archiveTitle')}</h3>
        </div>
        <CalendarDays aria-hidden="true" size={22} />
      </div>
      <nav className="news-archive-days" aria-label={t('news.archiveDays')}>
        {newsDays.map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.key === day.key ? 'is-selected' : ''}
            aria-label={formattedDate(item.key)}
            aria-pressed={item.key === day.key}
            onClick={() => {
              setSelectedDay(item.key)
              setVisibleCount(pageSize)
            }}
          >
            <time dateTime={item.key === 'undated' ? undefined : item.key}>
              {formattedDate(item.key, true)}
            </time>
            <span aria-hidden="true">{item.articles.length}</span>
          </button>
        ))}
      </nav>
      <div className="news-archive-results" aria-live="polite">
        <h4>{formattedDate(day.key)}</h4>
        <div className="news-archive-grid">
          {day.articles.slice(0, visibleCount).map((article) => (
            <Link
              key={article.slug}
              className="news-archive-card"
              to={{ pathname: `/news/${article.slug}`, search: location.search }}
              state={{
                newsViewer: true,
                returnTo: `${location.pathname}${location.search}`,
                returnScrollY: window.scrollY,
              }}
            >
              {article.cover ? (
                <img className="news-archive-image" src={article.cover} alt="" loading="lazy" decoding="async" />
              ) : (
                <span className="news-archive-image news-archive-image-placeholder" aria-hidden="true">
                  <CalendarDays size={28} />
                </span>
              )}
              <span className="news-archive-card-copy">
                {article.category && <span className="news-archive-category">{article.category}</span>}
                <strong>{article.title}</strong>
                {article.excerpt && <span className="news-archive-excerpt">{article.excerpt}</span>}
                <span className="news-archive-read">{t('news.readNews')} <ArrowRight size={14} /></span>
              </span>
            </Link>
          ))}
        </div>
        {day.articles.length > visibleCount && (
          <button className="news-archive-more" type="button" onClick={() => setVisibleCount((count) => count + pageSize)}>
            {t('news.archiveShowMore')} <ArrowRight size={15} />
          </button>
        )}
      </div>
    </section>
  )
}
