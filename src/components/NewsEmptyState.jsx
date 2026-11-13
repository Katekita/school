import { ArrowRight, CalendarDays } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { getSchoolInfo } from '../services'
import Badge from './ui/Badge'
import EmptyState from './ui/EmptyState'

const schoolData = getSchoolInfo()

export default function NewsEmptyState() {
  const { t } = useLanguage()

  return (
    <EmptyState
      className="news-empty-card"
      icon={<CalendarDays size={23} />}
      eyebrow={t('news.archiveEyebrow')}
      title={<><Badge>{t('news.temporaryBadge')}</Badge>{' '}{t('news.temporaryTitle')}</>}
      description={t('news.temporaryText')}
    >
      <a href={schoolData.socialLinks[0].url} target="_blank" rel="noreferrer">
        {t('news.socialLink')} {schoolData.socialLinks[0].handle} <ArrowRight size={15} />
      </a>
    </EmptyState>
  )
}
