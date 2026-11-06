import { ArrowRight, FileQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import Reveal from '../../components/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'

export default function NotFoundPage() {
  const { t } = useLanguage()
  return (
    <section className="content-section not-found-section">
      <div className="page-container">
        <Reveal>
          <div className="empty-state not-found">
            <FileQuestion size={48} />
            <h3>{t('notFound.title')}</h3>
            <p>{t('notFound.text')}</p>
            <Link className="button-primary" to="/">
              {t('notFound.button')} <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
