import { ArrowRight, CalendarDays } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import schoolData from '../data/school'

export default function NewsEmptyState() {
  const { t } = useLanguage()

  return (
    <article className="news-empty-card">
      <span className="news-empty-icon" aria-hidden="true"><CalendarDays size={23} /></span>
      <div className="news-empty-copy">
        <p className="eyebrow">{t('news.archiveEyebrow')}</p>
        <h3>{t('news.emptyTitle')}</h3>
        <p>{t('news.emptyText')}</p>
        <a href={schoolData.socialLinks[0].url} target="_blank" rel="noreferrer">
          {t('news.socialLink')} {schoolData.socialLinks[0].handle} <ArrowRight size={15} />
        </a>
      </div>
    </article>
  )
}
