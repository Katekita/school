import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { newsItems } from '../data/mockData'
import { useLanguage } from '../i18n/LanguageContext'
import { readNewsSeen } from '../utils/newsSeen'

let newsDetailPromise
function preloadNewsDetail() {
  if (!newsDetailPromise) newsDetailPromise = import('../pages/news/NewsDetailPage')
  return newsDetailPromise
}

export default function NewsStrip() {
  const { t, lang } = useLanguage()
  const location = useLocation()
  const stripRef = useRef(null)
  const drag = useRef(null)
  const suppressClick = useRef(false)
  const scrollFrame = useRef(0)
  const [position, setPosition] = useState(location.state?.restoreStripIndex ?? 0)
  const [dragging, setDragging] = useState(false)
  const [seen] = useState(readNewsSeen)

  useEffect(() => () => cancelAnimationFrame(scrollFrame.current), [])

  useEffect(() => {
    const strip = stripRef.current
    const card = strip?.querySelector('.news-strip-card')
    if (!strip || !card || !location.state?.restoreStripIndex) return
    strip.scrollLeft = location.state.restoreStripIndex * (card.offsetWidth + 16)
  }, [location.state?.restoreStripIndex])

  function scroll(direction) {
    const strip = stripRef.current
    if (!strip) return
    const card = strip.querySelector('.news-strip-card')
    strip.scrollBy({ left: (card?.getBoundingClientRect().width || 260) * direction, behavior: 'smooth' })
  }

  function updatePosition() {
    if (scrollFrame.current) return
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = 0
      const strip = stripRef.current
      if (!strip) return
      const card = strip.querySelector('.news-strip-card')
      if (!card) return
      const nextPosition = Math.round(strip.scrollLeft / (card.offsetWidth + 16))
      setPosition((current) => current === nextPosition ? current : nextPosition)
    })
  }

  function pointerDown(event) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    drag.current = { x: event.clientX, left: stripRef.current.scrollLeft, moved: false }
    suppressClick.current = false
    setDragging(true)
  }

  function pointerMove(event) {
    if (!drag.current) return
    const delta = event.clientX - drag.current.x
    if (Math.abs(delta) > 5) drag.current.moved = true
    stripRef.current.scrollLeft = drag.current.left - delta
  }

  function pointerUp() {
    if (drag.current?.moved) suppressClick.current = true
    if (drag.current) drag.current = null
    setDragging(false)
  }

  if (!newsItems.length) return null

  return (
    <div className="news-strip-wrap">
      <div className="news-strip-controls">
        <span aria-live="polite">{position + 1} / {newsItems.length}</span>
        <button type="button" aria-label={t('news.previous')} onClick={() => scroll(-1)}><ArrowLeft size={18} /></button>
        <button type="button" aria-label={t('news.next')} onClick={() => scroll(1)}><ArrowRight size={18} /></button>
      </div>
      <div
        ref={stripRef}
        className={`news-strip${dragging ? ' is-dragging' : ''}`}
        onScroll={updatePosition}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      >
        {newsItems.map((item) => {
          const timestamp = Date.parse(item.date)
          return (
            <Link
              key={item.slug}
              className={`news-strip-card${!seen[item.slug] ? ' is-unread' : ''}`}
              to={{ pathname: `/news/${item.slug}`, search: location.search }}
              state={{
                newsViewer: true,
                returnTo: `${location.pathname}${location.search}`,
                returnScrollY: window.scrollY,
                returnStripIndex: position,
              }}
              onClick={(event) => { if (suppressClick.current) { event.preventDefault(); suppressClick.current = false } }}
              onPointerEnter={() => { void preloadNewsDetail().catch(() => {}) }}
              onFocus={() => { void preloadNewsDetail().catch(() => {}) }}
            >
              {item.cover ? <img src={item.cover} alt="" loading="lazy" /> : <span className="news-strip-cover" aria-hidden="true" />}
              <span className="news-strip-copy">
                <strong>{item.title}</strong>
                {Number.isFinite(timestamp) && <span className="news-strip-date"><CalendarDays size={13} />{new Intl.DateTimeFormat(lang).format(new Date(timestamp))}</span>}
              </span>
              {!seen[item.slug] && <span className="news-unread-ring">{t('news.newLabel')}</span>}
            </Link>
          )
        })}
      </div>
      <div className="news-strip-dots" aria-hidden="true">
        {newsItems.map((item, index) => <span key={item.slug} className={index === position ? 'is-active' : ''} />)}
      </div>
    </div>
  )
}
