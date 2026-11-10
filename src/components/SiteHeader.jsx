import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BookOpen, CalendarDays, Command, LogIn, MapPin, Menu, UserRound, X } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeSwitcher from './ThemeSwitcher'
import useNow from '../hooks/useNow'
import { dayTitle, getLiveStatus, weekdayId } from '../utils/scheduleLive'
import { readSavedClass } from '../utils/classStorage'
import { useAuth } from '../auth/AuthContext'

const navLinks = [
  ['/mektep', 'nav.school'],
  ['/news', 'nav.news'],
  ['/documents', 'nav.documents'],
  ['/students/schedule', 'nav.schedule'],
  ['/mugalimder', 'nav.teachers'],
  ['/faq', 'nav.faq'],
]

export default function SiteHeader({ onOpenPalette }) {
  const { t, lang } = useLanguage()
  const { session } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const now = useNow(30_000)

  const links = navLinks.map(([to, key]) => [t(key), to])

  // Мобильное меню: блокируем прокрутку страницы и закрываем по Escape.
  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // Ctrl/⌘+K — командная палитра.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenPalette?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onOpenPalette])

  const live = getLiveStatus(readSavedClass(), now)
  const liveLabel =
    live.kind === 'lesson'
      ? `${t('live.now')} · ${live.index + 1}`
      : live.kind === 'break'
        ? t('live.break')
        : `${dayTitle(weekdayId(now), lang)}`

  return (
    <>
      <a className="skip-link" href="#main-content">
        {t('common.skipToContent')}
      </a>

      <div className="utility-bar">
        <div className="utility-left">
          <span className="utility-item">
            <MapPin size={13} /> {t('header.city')}
          </span>
          <span className="utility-item">
            <CalendarDays size={13} /> {t('header.schoolYear')}
          </span>
        </div>
        <div className="utility-right">
          <span className={`utility-live is-${live.kind}`}>
            <span className="utility-dot" aria-hidden="true" />
            {liveLabel}
          </span>
          <NavLink to="/dariek">{t('header.map')}</NavLink>
          <NavLink to="/baylanysh">{t('header.leaveRequest')}</NavLink>
        </div>
      </div>

      <header className="site-header">
        <div className="header-inner">
          <NavLink className="brand" to="/" aria-label={t('header.homeAria')}>
            <span className="brand-mark">
              <BookOpen size={23} />
            </span>
            <span className="brand-copy">
              <strong className="brand-name-full">{t('common.schoolName')}</strong>
              <strong className="brand-name-short">{t('common.schoolNameShort')}</strong>
              <small>{t('common.portalSubtitle')}</small>
            </span>
          </NavLink>

          <nav
            id="main-nav"
            className={`main-nav${menuOpen ? ' is-open' : ''}`}
            aria-label={t('header.mainNavigation')}
          >
            {links.map(([label, to]) => (
              <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}>
                {label}
              </NavLink>
            ))}
            <div className="nav-preferences">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </nav>

          <div className="header-right">
            <NavLink className="account-link" to={session ? '/account' : '/login'} aria-label={session ? 'Личный кабинет' : 'Войти'}>
              {session ? <UserRound size={16} /> : <LogIn size={16} />}
              <span>{session ? (lang === 'ky' ? 'Кабинет' : lang === 'en' ? 'Account' : 'Кабинет') : (lang === 'ky' ? 'Кирүү' : lang === 'en' ? 'Sign in' : 'Войти')}</span>
            </NavLink>
            <button
              type="button"
              className="palette-trigger"
              onClick={onOpenPalette}
              title={t('palette.open')}
            >
              <Command size={15} />
              <span className="palette-key">Ctrl K</span>
            </button>
            <button
              className="menu-toggle"
              type="button"
              aria-label={menuOpen ? t('header.closeMenu') : t('header.openMenu')}
              aria-expanded={menuOpen}
              aria-controls="main-nav"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

      </header>

      {menuOpen && (
        <button
          type="button"
          className="nav-backdrop"
          aria-label={t('header.closeMenu')}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  )
}
