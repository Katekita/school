import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BookOpen, CalendarDays, MapPin, Menu, Search, X } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'

export default function SiteHeader() {
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    [t('nav.school'), '/mektep'],
    [t('nav.history'), '/about/history'],
    [t('nav.news'), '/news'],
    [t('nav.events'), '/events'],
    [t('nav.documents'), '/documents'],
    [t('nav.schedule'), '/students/schedule'],
    [t('nav.teachers'), '/mugalimder'],
    [t('nav.faq'), '/faq'],
  ]

  return (
    <>
      <div className="utility-bar">
        <div className="utility-left">
          <span className="utility-item"><MapPin size={13} /> {t('header.city')}</span>
          <span className="utility-item"><CalendarDays size={13} /> {t('header.schoolYear')}</span>
        </div>
        <div className="utility-right">
          <NavLink to="/dariek">{t('header.map')}</NavLink>
          <NavLink to="/baylanysh">{t('header.leaveRequest')}</NavLink>
        </div>
      </div>
      <header className="site-header">
        <div className="header-inner">
          <NavLink className="brand" to="/" aria-label={t('header.homeAria')}>
            <span className="brand-mark"><BookOpen size={23} /></span>
            <span className="brand-copy">
              <strong>{t('common.schoolName')}</strong>
              <small>{t('common.portalSubtitle')}</small>
            </span>
          </NavLink>
          <nav className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="main">
            {links.map(([label, to]) => (
              <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}>{label}</NavLink>
            ))}
          </nav>
          <div className="header-right">
            <NavLink className="header-action" to="/search?q=" onClick={() => setMenuOpen(false)}>
              <Search size={16} /> <span className="header-action-text">{t('common.search')}</span>
            </NavLink>
            <LanguageSwitcher />
            <button
              className="menu-toggle"
              type="button"
              aria-label={menuOpen ? t('header.closeMenu') : t('header.openMenu')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
