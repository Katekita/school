import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, HelpCircle, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { newsItems } from '../data/mockData'
import { useLanguage } from '../i18n/LanguageContext'
import { markNewsSeen } from '../utils/newsSeen'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function splitParagraphs(article) {
  const raw = Array.isArray(article.slides)
    ? article.slides
    : String(article.slides || article.content || '').split(/\s*---\s*/)
  const paragraphs = raw.flatMap((part) => String(part).split(/\n\s*\n/)).map((part) => part.trim()).filter(Boolean)
  return paragraphs.flatMap((paragraph) => {
    if (paragraph.length <= 480) return [paragraph]
    const sentences = paragraph.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) || [paragraph]
    const chunks = []
    let chunk = ''
    for (const sentence of sentences) {
      if (chunk && chunk.length + sentence.length > 480) { chunks.push(chunk.trim()); chunk = '' }
      chunk += sentence
    }
    if (chunk.trim()) chunks.push(chunk.trim())
    return chunks
  })
}

function buildSlides(article) {
  const textSlides = splitParagraphs(article)
  const contentSlides = textSlides.flatMap((text) => {
    const slides = []
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g
    let start = 0
    for (const match of text.matchAll(imagePattern)) {
      const plainText = text.slice(start, match.index).trim()
      if (plainText) slides.push({ type: 'text', text: plainText })
      slides.push({ type: 'photo', alt: match[1], src: match[2] })
      start = match.index + match[0].length
    }
    const trailing = text.slice(start).trim()
    if (trailing) slides.push({ type: 'text', text: trailing })
    return slides.length ? slides : [{ type: 'text', text }]
  })
  const photoSlides = (Array.isArray(article.images) ? article.images : []).filter(Boolean).map((image) =>
    typeof image === 'string' ? { type: 'photo', src: image, alt: '' } : { type: 'photo', src: image.src, alt: image.alt || '' },
  )
  return [
    { type: 'cover' },
    ...contentSlides,
    ...photoSlides,
  ]
}

export default function NewsViewer({ article }) {
  const dialogRef = useRef(null)
  const touchStart = useRef(null)
  const pauseReasons = useRef({ hover: false, focus: false, hold: false })
  const navigate = useNavigate()
  const location = useLocation()
  const { t, lang } = useLanguage()
  const returnTo = location.state?.returnTo || '/news'
  const [slideIndex, setSlideIndex] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [paused, setPaused] = useState(false)
  const [reduce, setReduce] = useState(reducedMotion)
  const slides = useMemo(() => buildSlides(article), [article])
  const storyIndex = newsItems.findIndex((item) => item.slug === article.slug)
  const previous = newsItems[storyIndex + 1]
  const next = newsItems[storyIndex - 1]
  const close = useCallback(() => {
    dialogRef.current?.close()
    navigate(returnTo, { replace: true })
  }, [navigate, returnTo])
  const openStory = useCallback((item) => {
    if (!item) return
    navigate({ pathname: `/news/${item.slug}`, search: location.search }, { state: { newsViewer: true, returnTo } })
  }, [location.search, navigate, returnTo])
  const changeSlide = useCallback((direction) => {
    setSlideIndex((value) => Math.max(0, Math.min(slides.length - 1, value + direction)))
  }, [slides.length])
  const onKeyDown = useCallback((event) => {
    if (!dialogRef.current?.open) return
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]') && event.key !== 'Escape') return
    if (event.key === 'Escape') { event.preventDefault(); close(); return }
    if (event.key === '?') { setHelpOpen((value) => !value); return }
    if (event.key === 'ArrowLeft' && event.shiftKey) { event.preventDefault(); openStory(previous); return }
    if (event.key === 'ArrowRight' && event.shiftKey) { event.preventDefault(); openStory(next); return }
    if (event.key === 'ArrowLeft') { event.preventDefault(); changeSlide(-1) }
    if (event.key === 'ArrowRight') { event.preventDefault(); changeSlide(1) }
  }, [changeSlide, close, next, openStory, previous])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduce(query.matches)
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
      dialog.querySelector('button')?.focus()
    }
    markNewsSeen(article.slug)
  }, [article.slug])

  useEffect(() => {
    if (!next?.cover || typeof window === 'undefined') return
    const image = new Image()
    image.src = next.cover
  }, [next?.cover])

  useEffect(() => {
    if (!autoAdvance || paused || reduce || slides.length < 2) return undefined
    const timer = window.setInterval(() => setSlideIndex((value) => (value + 1) % slides.length), 5000)
    return () => window.clearInterval(timer)
  }, [autoAdvance, paused, reduce, slides.length])

  function setPauseReason(reason, value) {
    pauseReasons.current[reason] = value
    setPaused(Object.values(pauseReasons.current).some(Boolean))
  }

  useEffect(() => {
    const handleKey = (event) => onKeyDown(event)
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onKeyDown])

  function finishGesture(x, y) {
    if (!touchStart.current) return
    const dx = x - touchStart.current.x
    const dy = y - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) > 55) openStory(dx < 0 ? previous : next)
    else if (dy > 70 && Math.abs(dy) > Math.abs(dx)) close()
  }

  function onPointerUp(event) { finishGesture(event.clientX, event.clientY) }
  function onTouchStart(event) {
    const touch = event.touches[0]
    if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY }
  }
  function onTouchEnd(event) {
    const touch = event.changedTouches[0]
    if (touch) finishGesture(touch.clientX, touch.clientY)
  }

  const currentSlide = slides[slideIndex]
  const numberText = `${t('news.storyPosition')} ${Math.max(1, storyIndex + 1)} ${t('news.slideOf')} ${newsItems.length}, ${t('news.slidePosition').toLowerCase()} ${slideIndex + 1} ${t('news.slideOf')} ${slides.length}`
  const coverDate = Number.isFinite(Date.parse(article.date)) ? new Intl.DateTimeFormat(lang).format(new Date(article.date)) : ''

  return (
    <dialog
      ref={dialogRef}
      className="news-viewer"
      aria-label={article.title}
      onCancel={(event) => { event.preventDefault(); close() }}
      onPointerEnter={() => setPauseReason('hover', true)}
      onPointerLeave={() => setPauseReason('hover', false)}
      onPointerDown={() => setPauseReason('hold', true)}
      onPointerUpCapture={() => setPauseReason('hold', false)}
      onPointerCancel={() => setPauseReason('hold', false)}
      onFocusCapture={() => setPauseReason('focus', true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPauseReason('focus', false) }}
    >
      <div className="news-viewer-progress" aria-hidden="true">
        {slides.map((_, index) => <span key={index} className={index <= slideIndex ? 'is-done' : ''}><i /></span>)}
      </div>
      <header className="news-viewer-toolbar">
        <button type="button" aria-label={t('news.viewerHelp')} onClick={() => setHelpOpen((value) => !value)}><HelpCircle size={21} /></button>
        <span aria-live="polite" aria-atomic="true">{numberText}</span>
        <button type="button" aria-label={t('news.closeViewer')} onClick={close}><X size={22} /></button>
      </header>
      <div className="news-viewer-stage" onPointerDown={(event) => { touchStart.current = { x: event.clientX, y: event.clientY } }} onPointerUp={onPointerUp} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={(event) => {
        if (event.target.closest('button, a, input, summary, details')) return
        const rect = event.currentTarget.getBoundingClientRect()
        if (event.clientX < rect.left + rect.width / 3) changeSlide(-1)
        else if (event.clientX > rect.right - rect.width / 3) changeSlide(1)
      }}>
        <div key={`${article.slug}-${slideIndex}`} className="news-viewer-slide">
          {currentSlide.type === 'cover' && (
            <article className="news-viewer-cover">
              {article.cover && <img src={article.cover} alt="" />}
              <div className="news-viewer-cover-copy">
                <p>{article.category}</p><h1>{article.title}</h1>{coverDate && <time dateTime={article.date}>{coverDate}</time>}
              </div>
            </article>
          )}
          {currentSlide.type === 'text' && <p className="news-viewer-text">{currentSlide.text}</p>}
          {currentSlide.type === 'photo' && <img className="news-viewer-photo" src={currentSlide.src} alt={currentSlide.alt || article.title} />}
        </div>
        <button type="button" className="news-viewer-side news-viewer-side-prev" aria-label={t('news.previous')} onClick={() => changeSlide(-1)}><ArrowLeft size={22} /></button>
        <button type="button" className="news-viewer-side news-viewer-side-next" aria-label={t('news.next')} onClick={() => changeSlide(1)}><ArrowRight size={22} /></button>
      </div>
      <footer className="news-viewer-footer">
        <button type="button" aria-label={t('news.previousNews')} disabled={!previous} onClick={() => openStory(previous)}><ArrowLeft size={18} /></button>
        <label className={reduce ? 'is-disabled' : ''}>
          <input type="checkbox" checked={autoAdvance && !reduce} disabled={reduce} onChange={(event) => setAutoAdvance(event.target.checked)} />
          {t('news.autoplay')}
        </label>
        <button type="button" aria-label={t('news.nextNews')} disabled={!next} onClick={() => openStory(next)}><ArrowRight size={18} /></button>
      </footer>
      {helpOpen && <aside className="news-viewer-help" role="status"><p>{t('news.helpInstructions')}</p></aside>}
    </dialog>
  )
}
