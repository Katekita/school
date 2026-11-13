import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowRight, CalendarDays, ChevronDown, Search, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { getNews } from '../services'
import { useLanguage } from '../i18n/LanguageContext'
import useSpotlight from '../hooks/useSpotlight'
import { dayKey, formatDayHeader } from '../utils/newsDates'
import { buildQuery, readSearchParams, searchItems, uniqueCategories } from '../utils/newsList'

const newsItems = getNews()

const PAGE_SIZE = 9

/**
 * Основная лента /news: группы по дням с липкими заголовками,
 * чипы категорий, поиск и сортировка — всё синхронизировано с URL,
 * чтобы ссылку с фильтрами можно было передать дальше.
 */
export default function NewsFeed() {
  const { t, lang } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const spotlight = useSpotlight()
  const { pathname } = location
  const searchParams = useMemo(() => readSearchParams(location), [location])

  const [draftQuery, setDraftQuery] = useState(searchParams.q)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const searchBox = useRef(null)
  const firstRender = useRef(true)

  // Ввод с debounce ~200 мс: набираем локально, в URL уходит уже «тихое» значение.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const id = setTimeout(() => {
      if (draftQuery === searchParams.q) return
      navigate(
        { pathname, search: buildQuery(searchParams.category, draftQuery, searchParams.sort, location.search) },
        { replace: true },
      )
    }, 200)
    return () => clearTimeout(id)
  }, [draftQuery, pathname, location.search, navigate, searchParams.category, searchParams.q, searchParams.sort])

  // Снаружи (кнопка «сбросить», кнопка «назад» браузера) — подхватываем значение из URL.
  useEffect(() => {
    setDraftQuery((current) => (current === searchParams.q ? current : searchParams.q))
  }, [searchParams.q])

  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [searchParams.category, searchParams.q, searchParams.sort])

  const categories = useMemo(() => uniqueCategories(newsItems), [])

  const groups = useMemo(() => {
    const filtered = searchItems(
      searchParams.category ? newsItems.filter((item) => item.category === searchParams.category) : newsItems,
      searchParams.q,
    )
    const sorted = [...filtered].sort((a, b) => {
      const left = Date.parse(a.date) || 0
      const right = Date.parse(b.date) || 0
      return searchParams.sort === 'old' ? left - right : right - left
    })

    const buckets = new Map()
    for (const item of sorted) {
      const key = dayKey(item.date) || 'undated'
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(item)
    }
    return [...buckets].map(([key, items]) => ({ key, items }))
  }, [searchParams.category, searchParams.q, searchParams.sort])

  const total = groups.reduce((sum, group) => sum + group.items.length, 0)
  const shown = groups.reduce((acc, group) => {
    if (acc.count >= visible) return acc
    const take = Math.min(group.items.length, visible - acc.count)
    acc.groups.push({ ...group, items: group.items.slice(0, take) })
    return { count: acc.count + take, groups: acc.groups }
  }, { count: 0, groups: [] })

  function update(next) {
    const category = Object.prototype.hasOwnProperty.call(next, 'category') ? next.category : searchParams.category
    const q = Object.prototype.hasOwnProperty.call(next, 'q') ? next.q : searchParams.q
    const sort = Object.prototype.hasOwnProperty.call(next, 'sort') ? next.sort : searchParams.sort
    navigate(
      { pathname, search: buildQuery(category, q, sort, location.search) },
      { replace: true },
    )
  }

  if (!newsItems.length) return null

  return (
    <section className="news-feed" ref={spotlight} aria-labelledby="news-feed-heading">
      <div className="news-feed-heading">
        <div>
          <p className="eyebrow">{t('news.archiveEyebrow')}</p>
          <h3 id="news-feed-heading">{t('news.feedTitle')}</h3>
        </div>
        <span className="news-feed-total">{total}</span>
      </div>

      <div className="news-feed-controls">
        <form
          className="news-feed-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            update({ q: draftQuery })
          }}
        >
          <Search size={16} aria-hidden="true" />
          <input
            ref={searchBox}
            type="search"
            value={draftQuery}
            placeholder={t('news.searchPlaceholder')}
            aria-label={t('news.searchLabel')}
            onChange={(event) => setDraftQuery(event.target.value)}
          />
          {draftQuery && (
            <button
              type="button"
              aria-label={t('news.searchClear')}
              onClick={() => {
                setDraftQuery('')
                update({ q: '' })
                searchBox.current?.focus()
              }}
            >
              <X size={15} />
            </button>
          )}
        </form>

        <label className="news-feed-sort">
          <span>{t('news.sortLabel')}</span>
          <span className="news-feed-sort-select">
            <select
              value={searchParams.sort}
              onChange={(event) => update({ sort: event.target.value })}
            >
              <option value="new">{t('news.sortNew')}</option>
              <option value="old">{t('news.sortOld')}</option>
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </span>
        </label>
      </div>

      {categories.length > 0 && (
        <div className="news-feed-chips" role="group" aria-label={t('news.filterLabel')}>
          <button
            type="button"
            className={!searchParams.category ? 'is-active' : ''}
            aria-pressed={!searchParams.category}
            onClick={() => update({ category: null })}
          >
            {t('news.filterAll')}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={searchParams.category === category ? 'is-active' : ''}
              aria-pressed={searchParams.category === category}
              onClick={() => update({ category: searchParams.category === category ? null : category })}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {total === 0 ? (
        <div className="news-feed-none">
          <p>{t('news.searchEmpty')}</p>
          <button
            type="button"
            className="news-feed-reset"
            onClick={() => {
              setDraftQuery('')
              update({ category: null, q: '', sort: 'new' })
            }}
          >
            {t('news.searchReset')}
          </button>
        </div>
      ) : (
        <div className="news-feed-days">
          {shown.groups.map((group, groupIndex) => (
            <div className="news-feed-day" key={group.key}>
              <h4 className="news-feed-day-title">
                <CalendarDays size={15} aria-hidden="true" />
                {group.key === 'undated' ? t('news.archiveUndated') : formatDayHeader(`${group.key}T12:00:00Z`, lang, t)}
              </h4>
              <div className="news-archive-grid">
                {group.items.map((article, index) => {
                  const lead = groupIndex === 0 && index === 0
                  return (
                    <FeedCard
                      key={article.slug}
                      article={article}
                      lead={lead}
                      location={location}
                      motion={!reducedMotion}
                      readLabel={t('news.readNews')}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > visible && (
        <button className="news-archive-more" type="button" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
          {t('news.archiveShowMore')} <ArrowDown size={15} />
        </button>
      )}
    </section>
  )
}

function FeedCard({ article, lead, location, motion: animate, readLabel }) {
  const card = (
    <Link
      className={`news-archive-card${lead ? ' is-lead' : ''}${article.cover ? '' : ' is-text'}`}
      to={{ pathname: `/news/${article.slug}`, search: location.search }}
      state={{
        newsViewer: true,
        returnTo: `${location.pathname}${location.search}`,
        returnScrollY: window.scrollY,
      }}
    >
      {article.cover ? (
        <span className="news-archive-image">
          <img
            src={article.cover}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(event) => { event.currentTarget.remove() }}
          />
        </span>
      ) : (
        <span className="news-archive-image news-archive-image-placeholder" aria-hidden="true">
          <CalendarDays size={28} />
        </span>
      )}
      <span className="news-archive-card-copy">
        {article.category && <span className="news-archive-category">{article.category}</span>}
        <strong>{article.title}</strong>
        {article.excerpt && <span className="news-archive-excerpt">{article.excerpt}</span>}
        <span className="news-archive-read">{readLabel} <ArrowRight size={14} /></span>
      </span>
    </Link>
  )

  if (!animate) {
    return <div className={`news-feed-item spotlight${lead ? ' is-lead-item' : ''}`}>{card}</div>
  }
  return (
    <motion.div
      className={`news-feed-item spotlight${lead ? ' is-lead-item' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {card}
    </motion.div>
  )
}
