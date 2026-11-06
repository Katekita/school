import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import { newsItems } from '../../data/mockData'
import { useLanguage } from '../../i18n/LanguageContext'

export default function NewsDetailPage() {
  const { t } = useLanguage()
  const { slug } = useParams()
  const article = newsItems.find((item) => item.slug === slug)

  if (!article) {
    return (
      <>
        <PageBanner title={t('newsDetail.notFoundTitle')} eyebrow={t('newsDetail.eyebrow')} />
        <section className="content-section">
          <div className="page-container">
            <div className="empty-state">
              <h3>{t('newsDetail.notFoundText')}</h3>
              <Link className="button-primary" to="/news">
                {t('newsDetail.back')}
              </Link>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <PageBanner title={article.title} eyebrow={article.category} />
      <section className="content-section">
        <div className="page-container article-layout">
          <div className="article-body">
            <div className="meta-row">
              <CalendarDays size={14} />{' '}
              {new Date(article.date).toLocaleDateString('ru-RU')}
            </div>
            <div className="meta-row">
              <UserRound size={14} /> {t('newsDetail.author')}
            </div>
            <p className="article-intro">{article.excerpt}</p>
            <p>{article.content}</p>
            <Link className="text-link back-link" to="/news">
              <ArrowLeft size={14} /> {t('newsDetail.back')}
            </Link>
          </div>
          <aside className="placeholder-panel">
            <strong>{t('newsDetail.relatedTitle')}</strong>
            <p>{t('newsDetail.relatedText')}</p>
          </aside>
        </div>
      </section>
    </>
  )
}
