import { useMemo } from 'react'
import { ExternalLink, Search, SearchX } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import { documents, events, newsItems } from '../../data/mockData'
import { useLanguage } from '../../i18n/LanguageContext'
import schoolData from '../../data/school'
import textbookCatalog from '../../data/textbooks.json'

export default function SearchPage() {
  const { t, lang } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const allResults = useMemo(() => [
    ...newsItems.map((item) => ({ ...item, type: t('search.typeNews') })),
    ...events.map((event) => ({ ...event, type: t('search.typeEvents') })),
    ...documents.map((doc) => ({ ...doc, type: t('search.typeDocuments') })),
    ...textbookCatalog.books.map((book) => ({
      id: `book-${book.id}-${book.grade}-${book.language}`,
      title: lang === 'ky' ? (book.titleKg || book.title) : book.title,
      excerpt: `${book.grade} ${t('documents.grade')} · ${book.subject} · ${book.subjectKg} · ${book.author}`,
      category: `${book.subject} ${book.subjectKg}`,
      searchText: `${book.titleKg} ${book.title} ${book.subjectKg} ${book.subject} ${book.author}`,
      type: t('search.typeBooks'),
      externalUrl: book.readUrl,
    })),
  ], [lang, t])

  const results = useMemo(() => query
    ? allResults.filter((item) =>
        `${item.title} ${item.excerpt || ''} ${item.category || ''} ${item.searchText || ''}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : [], [allResults, query])

  function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    setSearchParams(q ? { q } : {})
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
              onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
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
              {results.slice(0, 48).map((item) => (
                item.externalUrl ? (
                  <a className="search-result" key={`${item.type}-${item.id}`} href={item.externalUrl} target="_blank" rel="noreferrer">
                    <span className="meta-chip">{item.type}</span>
                    <strong>{item.title} <ExternalLink size={14} /></strong>
                    <p>{item.excerpt || item.description || item.category}</p>
                  </a>
                ) : (
                  <Link
                    className="search-result"
                    key={`${item.type}-${item.id || item.slug}`}
                    to={
                      item.slug
                        ? `/news/${item.slug}`
                        : item.type === t('search.typeEvents')
                          ? '/news#events'
                          : item.type === t('search.typeDocuments')
                            ? '/documents'
                            : '/news'
                    }
                  >
                    <span className="meta-chip">{item.type}</span>
                    <strong>{item.title}</strong>
                    <p>{item.excerpt || item.description || item.category}</p>
                  </Link>
                )
              ))}
              {results.length > 48 && (
                <Link className="text-link" to={`/documents?q=${encodeURIComponent(query)}`}>
                  {t('search.moreResults')}
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
