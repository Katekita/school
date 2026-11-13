import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { formatNewsTime, isFresh } from '../utils/newsDates'
import { readNewsSeen } from '../utils/newsSeen'

/**
 * Лента «Сегодня»: горизонтальный scroll-snap ряд карточек.
 * Прокрутка мышью (перетаскивание), тачем и клавиатурой (←/→, Tab).
 */
export default function TodayStrip({ items, now }) {
  const { t, lang } = useLanguage()
  const reduceMotion = useReducedMotion()
  const location = useLocation()
  const trackRef = useRef(null)
  const progressRef = useRef(null)
  const frame = useRef(0)
  const drag = useRef(null)
  const suppressClick = useRef(false)
  const [seen] = useState(readNewsSeen)

  const syncProgress = useCallback(() => {
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const track = trackRef.current
      const bar = progressRef.current
      if (!track || !bar) return
      const max = track.scrollWidth - track.clientWidth
      const ratio = max > 2 ? track.scrollLeft / max : 1
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0.08, ratio))})`
    })
  }, [])

  useEffect(() => {
    syncProgress()
    return () => cancelAnimationFrame(frame.current)
  }, [items.length, syncProgress])

  function scrollByCard(direction) {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector('.today-card')
    const step = card ? card.getBoundingClientRect().width + 14 : track.clientWidth * 0.8
    track.scrollBy({ left: step * direction, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollByCard(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollByCard(-1)
    }
  }

  function onPointerDown(event) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    drag.current = { x: event.clientX, left: trackRef.current.scrollLeft, moved: false }
    suppressClick.current = false
  }

  function onPointerMove(event) {
    if (!drag.current) return
    const delta = event.clientX - drag.current.x
    if (Math.abs(delta) > 5 && !drag.current.moved) {
      drag.current.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    trackRef.current.scrollLeft = drag.current.left - delta
  }

  function onPointerUp() {
    if (drag.current?.moved) suppressClick.current = true
    drag.current = null
  }

  return (
    <div className="today-strip-wrap">
      <div className="today-strip-head">
        <span className="today-strip-hint" aria-hidden="true">{t('news.todayHint')}</span>
        <div className="today-strip-controls">
          <button type="button" aria-label={t('news.previous')} onClick={() => scrollByCard(-1)}>
            <ArrowLeft size={18} />
          </button>
          <button type="button" aria-label={t('news.next')} onClick={() => scrollByCard(1)}>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="today-strip"
        role="group"
        aria-label={t('news.today')}
        tabIndex={0}
        onScroll={syncProgress}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {items.map((item) => {
          const unread = !seen[item.slug]
          const time = formatNewsTime(item.date, lang)
          return (
            <Link
              key={item.slug}
              className={`today-card${unread ? ' is-unread' : ''}`}
              to={{ pathname: `/news/${item.slug}`, search: location.search }}
              state={{ newsViewer: true, returnTo: `${location.pathname}${location.search}` }}
              onClick={(event) => {
                if (suppressClick.current) {
                  event.preventDefault()
                  suppressClick.current = false
                }
              }}
            >
              {item.cover ? (
                <span className="today-card-cover">
                  <img src={item.cover} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.remove() }} />
                </span>
              ) : (
                <span className="today-card-cover" aria-hidden="true" />
              )}
              <span className="today-card-body">
                {item.category && <span className="today-card-tag">{item.category}</span>}
                <span className="today-card-title">{item.title}</span>
                {item.excerpt && <span className="today-card-excerpt">{item.excerpt}</span>}
                {time && <span className="today-card-meta"><Clock size={13} />{time}</span>}
              </span>
              {isFresh(item.date, 3, now.getTime()) && <span className="today-card-badge">{t('news.newLabel')}</span>}
            </Link>
          )
        })}
      </div>
      <div className="today-strip-progress" aria-hidden="true">
        <span ref={progressRef} />
      </div>
    </div>
  )
}
