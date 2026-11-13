import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, CalendarDays, MapPin, Sparkles } from 'lucide-react'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import NewsEmptyState from '../../components/NewsEmptyState'
import TodayStrip from '../../components/TodayStrip'
import { getEvents, getNews, getNewsError, getSchoolInfo } from '../../services'
import { useLanguage } from '../../i18n/LanguageContext'
import useNow from '../../hooks/useNow'
import { formatFullDate, formatShortDate, isToday } from '../../utils/newsDates'
import NewsFeed from '../../components/NewsFeed'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'

const events = getEvents()
const newsItems = getNews()
const newsDataError = getNewsError()
const schoolData = getSchoolInfo()

export default function NewsPage() {
  const { t, lang } = useLanguage()
  const location = useLocation()
  // «Сегодня» пересчитывается раз в минуту, чтобы полночь в Asia/Bishkek не оставила
  // вчерашние публикации в ленте уже открытой страницы.
  const now = useNow(60_000)

  // Источник синхронный (src/data/generated/*.json), поэтому «данные повреждены»
  // здесь — это исключение при разборе: показываем error state вместо пустого экрана.
  const { today, latest, hasData } = useMemo(() => {
    const dated = newsItems.filter((item) => Number.isFinite(Date.parse(item.date)))
    const rest = newsItems.filter((item) => !Number.isFinite(Date.parse(item.date)))
    const ordered = [...dated, ...rest]
    return {
      today: ordered.filter((item) => isToday(item.date, now)),
      latest: ordered.slice(0, 3),
      hasData: ordered.length > 0,
    }
  }, [now])

  const status = newsDataError ? 'error' : 'ready'

  return (
    <>
      <PageBanner title={t('news.title')} eyebrow={t('news.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <section className="news-group" id="news" aria-labelledby="news-heading">
            {status === 'error' && (
              <ErrorState
                className="news-empty-state"
                title={t('news.errorTitle')}
                description={t('news.errorText')}
                action={<button type="button" className="button-primary" onClick={() => window.location.reload()}>{t('news.retry')}</button>}
              />
            )}

            {status === 'ready' && !hasData && (
              <>
                <h2 id="news-heading" className="section-title">{t('news.sectionTitle')}</h2>
                <NewsEmptyState />
              </>
            )}

            {status === 'ready' && hasData && (
              <>
                <div className="today-head">
                  <div>
                    <p className="eyebrow">{t('news.today')}</p>
                    <h2 id="news-heading" className="section-title">
                      {formatFullDate(now, lang)}
                    </h2>
                  </div>
                  <span className="today-count">
                    {today.length} {t('news.todayCount')}
                  </span>
                </div>

                {today.length > 0 ? (
                  <TodayStrip items={today} now={now} />
                ) : (
                  <div className="today-empty">
                    <p className="today-empty-note">
                      <Sparkles size={16} /> {t('news.todayNone')}
                    </p>
                    <h3 className="today-subtitle">{t('news.todayLatest')}</h3>
                    <div className="today-latest-grid">
                      {latest.map((item) => (
                        <Link
                          key={item.slug}
                          className="today-latest-card"
                          to={{ pathname: `/news/${item.slug}`, search: location.search }}
                          state={{ newsViewer: true, returnTo: `${location.pathname}${location.search}` }}
                        >
                          {item.cover ? (
                            <span className="today-latest-cover">
                              <img src={item.cover} alt="" loading="lazy" decoding="async" onError={(event) => event.currentTarget.remove()} />
                            </span>
                          ) : (
                            <span className="today-latest-cover" aria-hidden="true" />
                          )}
                          <span className="today-latest-body">
                            {item.category && <span className="today-card-tag">{item.category}</span>}
                            <span className="today-latest-title">{item.title}</span>
                            {Number.isFinite(Date.parse(item.date)) && (
                              <span className="today-card-meta">
                                <CalendarDays size={13} />
                                {formatShortDate(item.date, lang)}
                              </span>
                            )}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <NewsFeed />
              </>
            )}
          </section>

          <section className="news-group events-group" id="events" aria-labelledby="events-heading">
            <div className="news-group-heading">
              <div>
                <p className="eyebrow">{t('events.eyebrow')}</p>
                <h2 id="events-heading" className="section-title">{t('events.title')}</h2>
              </div>
            </div>
            {events.length ? (
              <div className="event-grid">
                {events.map((event) => (
                  <Reveal key={event.id}>
                    <article className="page-card event-card">
                      <span className="meta-chip">{event.category}</span>
                      <h3>{event.title}</h3>
                      <div className="meta-row">
                        <CalendarDays size={14} />{' '}
                        {new Date(event.date).toLocaleDateString('ru-RU')}
                      </div>
                      {event.place && <div className="meta-row"><MapPin size={14} /> {event.place}</div>}
                      <p>{event.description}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            ) : (
              <EmptyState className="news-empty-state" title={t('events.emptyTitle')} description={t('events.emptyText')}>
                <a className="text-link" href={schoolData.socialLinks[0].url} target="_blank" rel="noreferrer">
                  {t('events.socialLink')} {schoolData.socialLinks[0].handle} <ArrowRight size={14} />
                </a>
              </EmptyState>
            )}
          </section>
        </div>
      </section>
    </>
  )
}
