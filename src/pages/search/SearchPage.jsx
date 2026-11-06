import { useState } from 'react'
import { Search, SearchX } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import { documents, events, newsItems } from '../../data/mockData'
import { useLanguage } from '../../i18n/LanguageContext'
import schoolData from '../../data/school'

export default function SearchPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const allResults = [
    ...newsItems.map((item) => ({ ...item, type: t('search.typeNews') })),
    ...events.map((event) => ({ ...event, type: t('search.typeEvents') })),
    ...documents.map((doc) => ({ ...doc, type: t('search.typeDocuments') })),
  ]

  const results = query
    ? allResults.filter((item) =>
        `${item.title} ${item.excerpt || ''} ${item.category || ''}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : []

  function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <PageBanner title={t('search.title')} eyebrow={t('search.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <form className="search-form" onSubmit={handleSubmit}>
            <input
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              aria-label={t('search.aria')}
            />
            <button type="submit">
              <Search size={16} /> {t('search.button')}
            </button>
          </form>

          {query && results.length === 0 ? (
            <div className="empty-state">
              <SearchX size={34} />
              <h3>«{query}» {t('search.notFoundTitle')}</h3>
              <p>{t('search.notFoundText')}</p>
              <a className="text-link" href={schoolData.socialLinks[0].url} target="_blank" rel="noreferrer">
                {t('search.socialLink')} {schoolData.socialLinks[0].handle}
              </a>
            </div>
          ) : !query ? (
            <div className="empty-state">
              <Search size={34} />
              <h3>{t('search.startTitle')}</h3>
              <p>{t('search.startText')}</p>
            </div>
          ) : (
            <div className="search-results">
              {results.map((item) => (
                <Link
                  className="search-result"
                  key={`${item.type}-${item.id || item.slug}`}
                  to={item.slug ? `/news/${item.slug}` : '/news'}
                >
                  <span className="meta-chip">{item.type}</span>
                  <strong>{item.title}</strong>
                  <p>{item.excerpt || item.description || item.category}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
