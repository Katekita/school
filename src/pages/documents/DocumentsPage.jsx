import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, BookOpen, ExternalLink, Library, Search, SlidersHorizontal, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import { useLanguage } from '../../i18n/LanguageContext'
import textbookCatalog from '../../data/textbooks.json'

const BOOKS_PER_PAGE = 24
const officialLibraryUrl = 'https://www.okuma.kg/'
const approvedListUrl = 'https://egov.kg/ru/ministry/education/news/46163'

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
}

export default function DocumentsPage() {
  const { t, lang } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const requestedBookId = searchParams.get('book')
  const [grade, setGrade] = useState('')
  const [category, setCategory] = useState('')
  const [visibleCount, setVisibleCount] = useState(BOOKS_PER_PAGE)
  const readerDialog = useRef(null)
  const books = textbookCatalog.books
  const selectedBook = books.find((item) => String(item.id) === requestedBookId)

  const categories = useMemo(
    () => [...new Map(books.flatMap((book) => book.categoryIds.map((id, index) => [
      String(id),
      { value: String(id), label: lang === 'ky' ? book.categories[index] : book.categoriesRu[index] },
    ]))).values()]
      .sort((a, b) => a.label.localeCompare(b.label, lang)),
    [books, lang],
  )

  const results = useMemo(() => {
    const search = normalize(query.trim())
    return books.filter((book) => {
      if (grade && !book.grades.includes(Number(grade))) return false
      if (category && !book.categoryIds.includes(Number(category))) return false
      if (!search) return true
      return normalize([book.title, ...book.categories, ...book.categoriesRu, book.author, book.grades.join(' ')].join(' ')).includes(search)
    })
  }, [books, category, grade, query])

  useEffect(() => {
    const dialog = readerDialog.current
    if (selectedBook && dialog && !dialog.open) dialog.showModal()
    else if (!selectedBook && dialog?.open) dialog.close()
  }, [selectedBook])

  function updateFilter(setter, value) {
    setter(value)
    setVisibleCount(BOOKS_PER_PAGE)
  }

  function openBook(book) {
    const next = new URLSearchParams(searchParams)
    next.set('book', String(book.id))
    setSearchParams(next)
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
            <div className="textbook-filters textbook-filters-two">
              <label>
                <span>{t('documents.grade')}</span>
                <select value={grade} onChange={(event) => updateFilter(setGrade, event.target.value)}>
                  <option value="">{t('documents.allGrades')}</option>
                  {Array.from({ length: 11 }, (_, index) => index + 1).map((item) => (
                    <option value={item} key={item}>{item} {t('documents.grade')}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t('documents.subject')}</span>
                <select value={category} onChange={(event) => updateFilter(setCategory, event.target.value)}>
                  <option value="">{t('documents.allSubjects')}</option>
                  {categories.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
                </select>
              </label>
            </div>
            <div className="textbook-results-meta" aria-live="polite">
              <span><SlidersHorizontal size={14} /> {t('documents.found')}: <strong>{results.length}</strong></span>
              {(grade || category || query) && (
                <button type="button" onClick={() => {
                  setSearchParams({}, { replace: true })
                  setGrade('')
                  setCategory('')
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
                  <article className="textbook-card" key={book.id}>
                    <div className="textbook-card-top">
                      <span className="textbook-grade">{book.grades.join(', ')} {t('documents.grade')}</span>
                    </div>
                    <span className="textbook-subject">{(lang === 'ky' ? book.categories : book.categoriesRu).join(' · ')}</span>
                    <h3>{book.title}</h3>
                    <div className="textbook-details">
                      {book.author && <span><small>{t('documents.author')}</small>{book.author}</span>}
                    </div>
                    <button className="textbook-open-link" type="button" onClick={() => openBook(book)}>
                      <BookOpen size={15} /> {t('documents.readOnline')}
                    </button>
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
      <dialog
        ref={readerDialog}
        className="book-reader-dialog"
        aria-labelledby="book-reader-title"
        onClose={() => {
          setSearchParams((current) => {
            const next = new URLSearchParams(current)
            next.delete('book')
            return next
          }, { replace: true })
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        {selectedBook && (
          <>
            <header className="book-reader-head">
              <div>
                <span>{selectedBook.grades.join(', ')} {t('documents.grade')} · {(lang === 'ky' ? selectedBook.categories : selectedBook.categoriesRu).join(' · ')}</span>
                <h2 id="book-reader-title">{selectedBook.title}</h2>
              </div>
              <button type="button" className="book-reader-close" aria-label={t('documents.closeReader')} onClick={() => readerDialog.current?.close()}>
                <X size={20} />
              </button>
            </header>
            <iframe className="book-reader-frame" src={selectedBook.readerUrl} title={selectedBook.title} allowFullScreen referrerPolicy="no-referrer" />
            <footer className="book-reader-foot">
              <span>{t('documents.readerNote')}</span>
              <a href={selectedBook.sourcePage} target="_blank" rel="noreferrer">{t('documents.readerFallback')} <ExternalLink size={13} /></a>
            </footer>
          </>
        )}
      </dialog>
    </>
  )
}
