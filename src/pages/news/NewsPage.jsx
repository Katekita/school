import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { events, newsItems } from '../../data/mockData'
import { useLanguage } from '../../i18n/LanguageContext'
import schoolData from '../../data/school'
import NewsArchive from '../../components/NewsArchive'

export default function NewsPage() {
  const { t } = useLanguage()
  return (
    <>
      <PageBanner title={t('news.title')} eyebrow={t('news.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <section className="news-group" id="news" aria-labelledby="news-heading">
            <div className="news-group-heading">
              <div>
                <p className="eyebrow">{t('news.eyebrow')}</p>
                <h2 id="news-heading" className="section-title">{t('news.sectionTitle')}</h2>
              </div>
            </div>
            {newsItems.length ? (
              <NewsArchive />
            ) : (
              <div className="empty-state news-empty-state">
                <h3>{t('news.emptyTitle')}</h3>
                <p>{t('news.emptyText')}</p>
                <a className="text-link" href={schoolData.socialLinks[0].url} target="_blank" rel="noreferrer">
                  {t('news.socialLink')} {schoolData.socialLinks[0].handle} <ArrowRight size={14} />
                </a>
              </div>
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
              <div className="empty-state news-empty-state">
                <h3>{t('events.emptyTitle')}</h3>
                <p>{t('events.emptyText')}</p>
                <a className="text-link" href={schoolData.socialLinks[0].url} target="_blank" rel="noreferrer">
                  {t('events.socialLink')} {schoolData.socialLinks[0].handle} <ArrowRight size={14} />
                </a>
              </div>
            )}
          </section>
        </div>
      </section>
    </>
  )
}
