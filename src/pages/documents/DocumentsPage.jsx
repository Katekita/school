import { useMemo, useState } from 'react'
import { ArrowUpRight, BookOpen, ExternalLink, Library, Search, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import { useLanguage } from '../../i18n/LanguageContext'
import textbookCatalog from '../../data/textbooks.json'

const BOOKS_PER_PAGE = 24
const officialLibraryUrl = 'https://kitep.edu.kg/'
const approvedListUrl = 'https://egov.kg/ru/ministry/education/news/46163'

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
}

export default function DocumentsPage() {
  const { t, lang } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [grade, setGrade] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [language, setLanguage] = useState('')
  const [visibleCount, setVisibleCount] = useState(BOOKS_PER_PAGE)
  const books = textbookCatalog.books

  const subjects = useMemo(() => {
    const unique = new Map()
    for (const book of books) {
      if (!unique.has(book.catalogId)) {
        unique.set(book.catalogId, {
          id: String(book.catalogId),
          grade: book.grade,
          title: lang === 'ky' ? book.subjectKg : book.subject,
        })
      }
    }
    return [...unique.values()].sort((a, b) => a.grade - b.grade || a.title.localeCompare(b.title, lang === 'ky' ? 'ky' : 'ru'))
  }, [books, lang])

  const results = useMemo(() => {
    const search = normalize(query.trim())
    return books.filter((book) => {
      if (grade && book.grade !== Number(grade)) return false
      if (subjectId && String(book.catalogId) !== subjectId) return false
      if (language && book.language !== language) return false
      if (!search) return true
      return normalize([
        book.title,
        book.titleKg,
        book.subject,
        book.subjectKg,
        book.author,
        book.publisher,
        book.grade,
        book.year,
      ].join(' ')).includes(search)
    })
  }, [books, grade, language, query, subjectId])

  function updateFilter(setter, value) {
    setter(value)
    setVisibleCount(BOOKS_PER_PAGE)
  }

  return (
    <>
      <PageBanner title={t('documents.title')} eyebrow={t('documents.eyebrow')} />
      <section className="content-section textbook-library">
        <div className="page-container">
          <section className="textbook-intro" aria-labelledby="textbook-intro-title">
            <div className="textbook-intro-copy">
              <span className="eyebrow"><Library size={14} /> {t('documents.libraryEyebrow')}</span>
              <h2 id="textbook-intro-title">{t('documents.libraryTitle')}</h2>
              <p>{t('documents.libraryText')}</p>
              <div className="textbook-source-actions">
                <a className="button-primary" href={officialLibraryUrl} target="_blank" rel="noreferrer">
                  {t('documents.openLibrary')} <ExternalLink size={15} />
                </a>
                <a className="text-link" href={approvedListUrl} target="_blank" rel="noreferrer">
                  {t('documents.approvedList')} <ArrowUpRight size={15} />
                </a>
              </div>
            </div>
            <div className="textbook-count-card" aria-label={`${books.length} ${t('documents.booksCount')}`}>
              <BookOpen size={22} />
              <strong>{books.length}</strong>
              <span>{t('documents.booksCount')}</span>
            </div>
          </section>

          <section className="textbook-search-panel" aria-label={t('documents.searchLabel')}>
            <label className="textbook-search-box">
              <Search size={19} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setSearchParams(event.target.value ? { q: event.target.value } : {}, { replace: true })
                  setVisibleCount(BOOKS_PER_PAGE)
                }}
                placeholder={t('documents.searchBooks')}
                aria-label={t('documents.searchLabel')}
                autoComplete="off"
              />
            </label>
            <div className="textbook-filters">
              <label>
                <span>{t('documents.grade')}</span>
                <select value={grade} onChange={(event) => {
                  updateFilter(setGrade, event.target.value)
                  setSubjectId('')
                }}>
                  <option value="">{t('documents.allGrades')}</option>
                  {Array.from({ length: 11 }, (_, index) => index + 1).map((item) => (
                    <option value={item} key={item}>{item} {t('documents.grade')}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t('documents.subject')}</span>
                <select value={subjectId} onChange={(event) => updateFilter(setSubjectId, event.target.value)}>
                  <option value="">{t('documents.allSubjects')}</option>
                  {subjects
                    .filter((item) => !grade || item.grade === Number(grade))
                    .map((item) => <option value={item.id} key={item.id}>
                      {!grade && `${item.grade} ${t('documents.grade')} · `}{item.title}
                    </option>)}
                </select>
              </label>
              <label>
                <span>{t('documents.language')}</span>
                <select value={language} onChange={(event) => updateFilter(setLanguage, event.target.value)}>
                  <option value="">{t('documents.allLanguages')}</option>
                  <option value="kg">{t('documents.languageKg')}</option>
                  <option value="ru">{t('documents.languageRu')}</option>
                </select>
              </label>
            </div>
            <div className="textbook-results-meta" aria-live="polite">
              <span><SlidersHorizontal size={14} /> {t('documents.found')}: <strong>{results.length}</strong></span>
              {(grade || subjectId || language || query) && (
                <button type="button" onClick={() => {
                  setSearchParams({}, { replace: true })
                  setGrade('')
                  setSubjectId('')
                  setLanguage('')
                  setVisibleCount(BOOKS_PER_PAGE)
                }}>
                  {t('documents.resetFilters')}
                </button>
              )}
            </div>
          </section>

          {results.length ? (
            <>
              <div className="textbook-grid">
                {results.slice(0, visibleCount).map((book) => (
                  <article className="textbook-card" key={`${book.id}-${book.grade}-${book.language}`}>
                    <div className="textbook-card-top">
                      <span className="textbook-grade">{book.grade} {t('documents.grade')}</span>
                      <span className="textbook-language">{t(book.language === 'kg' ? 'documents.languageKg' : 'documents.languageRu')}</span>
                    </div>
                    <span className="textbook-subject">{lang === 'ky' ? book.subjectKg : book.subject}</span>
                    <h3>{lang === 'ky' ? (book.titleKg || book.title) : book.title}</h3>
                    <div className="textbook-details">
                      {book.author && <span><small>{t('documents.author')}</small>{book.author}</span>}
                      {(book.publisher || book.year) && (
                        <span><small>{t('documents.publisher')} · {t('documents.year')}</small>{[book.publisher, book.year].filter(Boolean).join(' · ')}</span>
                      )}
                    </div>
                    <a className="textbook-open-link" href={book.readUrl} target="_blank" rel="noreferrer">
                      <BookOpen size={15} /> {t('documents.readOnline')} <ExternalLink size={13} />
                    </a>
                  </article>
                ))}
              </div>
              {results.length > visibleCount && (
                <div className="textbook-more-wrap">
                  <button className="button-outline textbook-more" type="button" onClick={() => setVisibleCount((current) => current + BOOKS_PER_PAGE)}>
                    {t('documents.showMore')} <span>{Math.min(BOOKS_PER_PAGE, results.length - visibleCount)}</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state textbook-empty">
              <Search size={30} />
              <h3>{t('documents.noBooksTitle')}</h3>
              <p>{t('documents.noBooksText')}</p>
            </div>
          )}

          <aside className="textbook-source-note">
            <BookOpen size={17} />
            <p><strong>{t('documents.sourceLabel')}</strong><br />{t('documents.sourceText')}</p>
            <a href={officialLibraryUrl} target="_blank" rel="noreferrer" aria-label={t('documents.openLibrary')}>
              <ExternalLink size={16} />
            </a>
          </aside>
        </div>
      </section>
    </>
  )
}
