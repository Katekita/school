import { useState } from 'react'
import { ArrowLeft, CalendarDays, ChevronRight, Clock, Share2, UserRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import PageBanner from '../../components/PageBanner'
import { getNews } from '../../services'
import { useLanguage } from '../../i18n/LanguageContext'
import NewsViewer from '../../components/NewsViewer'
import { markNewsSeen } from '../../utils/newsSeen'
import { formatShortDate, readTimeMinutes } from '../../utils/newsDates'

const newsItems = getNews()

export default function NewsDetailPage() {
  const { t, lang } = useLanguage()
  const location = useLocation()
  const { slug } = useParams()
  const [failedCoverSlug, setFailedCoverSlug] = useState('')
  const [shareStatus, setShareStatus] = useState('')
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
              <Link className="button-primary" to={{ pathname: '/news', search: location.search }}>
                {t('newsDetail.back')}
              </Link>
            </div>
          </div>
        </section>
      </>
    )
  }

  if (location.state?.newsViewer) return <NewsViewer article={article} />

  const bodyParagraphs = String(article.content || '').split(/\s*---\s*|\n\s*\n/).map((text) => text.trim()).filter(Boolean)
  const related = article.category
    ? newsItems.filter((item) => item.slug !== article.slug && item.category === article.category).slice(0, 3)
    : []
  const formattedDate = Number.isFinite(Date.parse(article.date)) ? formatShortDate(article.date, lang) : ''
  const readingMinutes = readTimeMinutes([article.excerpt, article.content].filter(Boolean).join(' '))

  async function shareArticle() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: article.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareStatus(t('common.copied'))
    } catch (error) {
      if (error?.name === 'AbortError') return
      setShareStatus(t('newsDetail.shareFailed'))
    }
  }

  return (
    <>
      <PageBanner title={article.title} eyebrow={article.category} />
      <section className="content-section">
        <div className="page-container article-layout">
          <nav className="news-breadcrumbs" aria-label={t('news.listBack')}>
            <Link to={{ pathname: '/news', search: location.search }}>{t('news.listBack')}</Link><ChevronRight size={15} /><span aria-current="page">{article.title}</span>
          </nav>
          <article className="article-body news-detail-body">
            {article.cover && (failedCoverSlug === article.slug
              ? <span className="article-cover-fallback" aria-hidden="true" />
              : <img className="article-cover" src={article.cover} alt={t('news.coverAlt')} loading="lazy" decoding="async" onError={() => setFailedCoverSlug(article.slug)} />)}
            <div className="news-detail-meta">
              {formattedDate && <span className="meta-row"><CalendarDays size={14} /> <time dateTime={article.date}>{formattedDate}</time></span>}
              {article.category && <span className="meta-chip">{article.category}</span>}
              {article.author && <span className="meta-row"><UserRound size={14} /> {article.author}</span>}
              <span className="meta-row"><Clock size={14} /> {t('newsDetail.readingTime')} · {readingMinutes} {t('newsDetail.minutes')}</span>
            </div>
            {article.excerpt && <p className="article-intro">{article.excerpt}</p>}
            {bodyParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            <div className="news-detail-actions">
              <Link className="text-link back-link" to={{ pathname: '/news', search: location.search }}><ArrowLeft size={16} /> {t('newsDetail.back')}</Link>
              <button type="button" className="news-share-button" onClick={shareArticle}><Share2 size={16} /> {t('common.share')}</button>
              <span className="news-share-status" role="status" aria-live="polite">{shareStatus}</span>
            </div>
          </article>
          <aside className="placeholder-panel news-related" aria-labelledby="news-related-heading">
            <h2 id="news-related-heading">{t('newsDetail.relatedTitle')}</h2>
            {related.length ? (
              <div>
                {related.map((item) => (
                  <Link key={item.slug} to={{ pathname: `/news/${item.slug}`, search: location.search }}>
                    <strong>{item.title}</strong>
                    {Number.isFinite(Date.parse(item.date)) && <time dateTime={item.date}>{formatShortDate(item.date, lang)}</time>}
                  </Link>
                ))}
              </div>
            ) : <p>{t('newsDetail.noRelated')}</p>}
          </aside>
        </div>
      </section>
    </>
  )
}
