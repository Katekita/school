import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CornerDownLeft, SearchX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import PaletteIcon from './PaletteIcon'
import { buildIndex, searchIndex } from '../utils/searchIndex'
import { cycleTheme, readTheme } from '../utils/theme'

const RECENTS_KEY = 'school68_recent'

function readRecents() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function pushRecent(id) {
  try {
    const next = [id, ...readRecents().filter((x) => x !== id)].slice(0, 5)
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
  } catch {
    /* история просмотров — необязательная часть */
  }
}

export default function CommandPalette({ open, onClose }) {
  const { t, get, setLang } = useLanguage()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const index = useMemo(() => buildIndex({ t, get }), [t, get])

  // Быстрые действия доступны всегда, даже без введённого запроса.
  const actions = useMemo(
    () => [
      {
        id: 'action:copy',
        title: t('palette.actionCopy'),
        group: t('palette.groupActions'),
        icon: 'Copy',
        run: () => navigator.clipboard?.writeText(window.location.href).catch(() => {}),
      },
      {
        id: 'action:print',
        title: t('palette.actionPrint'),
        group: t('palette.groupActions'),
        icon: 'Printer',
        run: () => window.print(),
      },
      {
        id: 'action:theme',
        title: `${t('palette.actionTheme')} · ${t(`theme.${readTheme()}`)}`,
        group: t('palette.groupActions'),
        icon: 'Moon',
        run: () => cycleTheme(),
      },
      ...['ky', 'ru', 'en'].map((code) => ({
        id: `action:lang:${code}`,
        title: `${t('palette.actionLang')} — ${code.toUpperCase()}`,
        group: t('palette.groupActions'),
        icon: 'Hash',
        run: () => setLang(code),
      })),
    ],
    [t, setLang],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      const recent = readRecents()
        .map((id) => index.find((item) => item.id === id))
        .filter(Boolean)
      return [...recent, ...actions].slice(0, 14)
    }
    const found = searchIndex(index, query)
    const matchedActions = actions.filter((a) => a.title.toLowerCase().includes(q))
    return [...found, ...matchedActions].slice(0, 14)
  }, [query, index, actions])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => inputRef.current?.focus(), 40)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(timer)
      document.body.style.overflow = prev
    }
  }, [open])

  function choose(item) {
    if (!item) return
    pushRecent(item.id)
    if (item.run) {
      item.run()
      onClose()
      return
    }
    onClose()
    navigate(item.to)
  }

  function onKeyDown(event) {
    const size = Math.max(results.length, 1)
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (i + 1) % size)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i - 1 + size) % size)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(results[active])
    }
  }

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [active])

  // Сброс активной строки при смене запроса — через обработчик, а не эффект.
  function onQueryChange(value) {
    setQuery(value)
    setActive(0)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label={t('palette.title')}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="palette-search" onKeyDown={onKeyDown}>
              <PaletteIcon name="Command" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder={t('palette.placeholder')}
                aria-label={t('palette.title')}
                autoComplete="off"
                spellCheck="false"
              />
              <kbd>{t('palette.escHint')}</kbd>
            </div>

            <ul className="palette-list" ref={listRef}>
              {results.length === 0 && (
                <li className="palette-empty">
                  <SearchX size={15} /> {t('palette.empty')}
                </li>
              )}
              {results.map((item, i) => (
                <li key={item.id} data-active={i === active}>
                  <button
                    type="button"
                    className={`palette-item${i === active ? ' is-active' : ''}`}
                    onMouseMove={() => setActive(i)}
                    onClick={() => choose(item)}
                  >
                    <span className="palette-item-icon">
                      <PaletteIcon name={item.icon} />
                    </span>
                    <span className="palette-item-copy">
                      <strong>{item.title}</strong>
                      {item.subtitle && <small>{item.subtitle}</small>}
                    </span>
                    <span className="palette-item-group">{item.group}</span>
                    {i === active && <CornerDownLeft size={14} className="palette-enter" />}
                  </button>
                </li>
              ))}
            </ul>

            <div className="palette-footer">
              <span>{t('palette.hintNav')}</span>
              <span>{t('palette.hintSections')}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
