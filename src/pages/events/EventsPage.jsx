import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { events } from '../../data/mockData'
import { useLanguage } from '../../i18n/LanguageContext'
import schoolData from '../../data/school'

export default function EventsPage() {
  const { t } = useLanguage()
  return (
    <>
      <PageBanner title={t('events.title')} eyebrow={t('events.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          {events.length ? (
            <div className="event-grid">
              {events.map((event) => (
                <Reveal key={event.id}>
                  <article className="page-card">
                    <span className="meta-chip">{event.category}</span>
                    <h3>{event.title}</h3>
                    <div className="meta-row">
                      <CalendarDays size={14} />{' '}
                      {new Date(event.date).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="meta-row">
                      <MapPin size={14} /> {event.place}
                    </div>
                    <p>{event.description}</p>
                    <Link className="text-link" to="/events">
                      {t('common.readMore')} <ArrowRight size={14} />
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>{t('events.emptyTitle')}</h3>
              <p>{t('events.emptyText')}</p>
              <a className="text-link" href={schoolData.socialLinks[0].url} target="_blank" rel="noreferrer">
                {t('events.socialLink')} {schoolData.socialLinks[0].handle} <ArrowRight size={14} />
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
