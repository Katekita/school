import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { newsItems } from '../../data/mockData'
import { useLanguage } from '../../i18n/LanguageContext'
import schoolData from '../../data/school'

export default function NewsPage() {
  const { t } = useLanguage()
  return (
    <>
      <PageBanner title={t('news.title')} eyebrow={t('news.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          {newsItems.length ? (
            <div className="news-grid">
              {newsItems.map((item) => (
                <Reveal key={item.slug}>
                  <article className="page-card">
                    <span className="meta-chip">{item.category}</span>
                    <div className="meta-row">
                      <CalendarDays size={14} />{' '}
                      {new Date(item.date).toLocaleDateString('ru-RU')}
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    <Link className="text-link" to={`/news/${item.slug}`}>
                      {t('news.readNews')} <ArrowRight size={14} />
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>{t('news.emptyTitle')}</h3>
              <p>{t('news.emptyText')}</p>
              <a className="text-link" href={schoolData.socialLinks[0].url} target="_blank" rel="noreferrer">
                {t('news.socialLink')} {schoolData.socialLinks[0].handle} <ArrowRight size={14} />
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
