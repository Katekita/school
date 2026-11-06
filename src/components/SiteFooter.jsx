import { BookOpen, ExternalLink, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import schoolData from '../data/school'

export default function SiteFooter() {
  const { t } = useLanguage()
  const schoolSocial = schoolData.socialLinks[0]
  const phoneHref = schoolData.phone.replace(/[^+\d]/g, '')

  return (
    <footer className="site-footer">
      <div className="page-container footer-main">
        <div className="footer-brand-block">
          <Link className="brand footer-brand" to="/">
            <span className="brand-mark"><BookOpen size={22} /></span>
            <span className="brand-copy">
              <strong>{t('common.schoolShort')}</strong>
              <small>{t('header.city')}</small>
            </span>
          </Link>
          <p className="footer-note">{t('footer.note')}</p>
        </div>
        <div className="footer-column">
          <h3>{t('footer.aboutTitle')}</h3>
          <div className="footer-links">
            <Link to="/mektep">{t('footer.aboutSchool')}</Link>
            <Link to="/about/history">{t('nav.history')}</Link>
            <Link to="/about/alykul-osmonov">{t('nav.alykul')}</Link>
            <Link to="/faq">{t('nav.faq')}</Link>
          </div>
        </div>
        <div className="footer-column">
          <h3>{t('footer.contactTitle')}</h3>
          <div className="footer-links">
            <a href={schoolData.addressSourceUrl} target="_blank" rel="noreferrer">
              <MapPin size={14} /> {schoolData.address} · {schoolData.addressSource}
            </a>
            <a href={`tel:${phoneHref}`}>
              <Phone size={14} /> {schoolData.phone} · {t('footer.directoryNote')}
            </a>
            <a href={schoolSocial.url} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> {schoolSocial.handle}
            </a>
            <Link to="/baylanysh">{t('footer.requestForm')}</Link>
          </div>
        </div>
      </div>
      <div className="page-container footer-bottom">
        <span>{t('footer.copyright')}</span>
        <span>{t('footer.verify')}</span>
      </div>
    </footer>
  )
}
