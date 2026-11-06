import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

export default function PageBanner({ title, eyebrow }) {
  const { t } = useLanguage()
  return (
    <section className="page-banner">
      <div className="page-container">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <div className="breadcrumbs">
          <Link to="/">
            {t('common.backHome')}
          </Link>
          <ChevronRight size={13} />
          <span>{title}</span>
        </div>
      </div>
    </section>
  )
}
