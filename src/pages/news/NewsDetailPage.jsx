import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, UserRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import PageBanner from '../../components/PageBanner'
import { newsItems } from '../../data/mockData'
import { useLanguage } from '../../i18n/LanguageContext'
import NewsViewer from '../../components/NewsViewer'
import { markNewsSeen } from '../../utils/newsSeen'

export default function NewsDetailPage() {
  const { t } = useLanguage()
  const location = useLocation()
  const { slug } = useParams()
  const article = newsItems.find((item) => item.slug === slug)
  const articleSlug = article?.slug

  useEffect(() => { if (articleSlug) markNewsSeen(articleSlug) }, [articleSlug])

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

  if (location.state?.newsViewer) return <NewsViewer article={article} />

  const articleIndex = newsItems.findIndex((item) => item.slug === article.slug)
  const previous = newsItems[articleIndex - 1]
  const next = newsItems[articleIndex + 1]
  const bodyParagraphs = String(article.content || '').split(/\s*---\s*|\n\s*\n/).map((text) => text.trim()).filter(Boolean)
  const date = Date.parse(article.date)
  const formatDate = (value) => {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? new Intl.DateTimeFormat(document.documentElement.lang || 'ky').format(new Date(parsed)) : ''
  }
  const formattedDate = Number.isFinite(date) ? formatDate(article.date) : ''

  return (
    <>
      <PageBanner title={article.title} eyebrow={article.category} />
      <section className="content-section">
        <div className="page-container article-layout">
          <nav className="news-breadcrumbs" aria-label={t('news.listBack')}>
            <Link to={{ pathname: '/news', search: location.search }}>{t('news.listBack')}</Link><ChevronRight size={15} /><span aria-current="page">{article.title}</span>
          </nav>
          <div className="article-body">
            {article.cover && <img className="article-cover" src={article.cover} alt={t('news.coverAlt')} />}
            {formattedDate && <div className="meta-row">
              <CalendarDays size={14} /> <time dateTime={article.date}>{formattedDate}</time>
            </div>}
            <div className="meta-row">
              <UserRound size={14} /> {t('newsDetail.author')}
            </div>
            <p className="article-intro">{article.excerpt}</p>
            {bodyParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            <nav className="news-article-nav" aria-label={t('news.title')}>
              {previous ? <Link to={{ pathname: `/news/${previous.slug}`, search: location.search }}><ChevronLeft size={17} /><span><small>{t('news.previousNews')}</small><strong>{previous.title}</strong><time>{formatDate(previous.date)}</time></span></Link> : <span />}
              {next ? <Link to={{ pathname: `/news/${next.slug}`, search: location.search }}><span><small>{t('news.nextNews')}</small><strong>{next.title}</strong><time>{formatDate(next.date)}</time></span><ChevronRight size={17} /></Link> : <span />}
            </nav>
            <Link className="text-link back-link" to={{ pathname: '/news', search: location.search }}><ArrowLeft size={14} /> {t('news.listBack')}</Link>
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
