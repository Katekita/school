import { useLanguage } from '../i18n/LanguageContext'
import { getSchoolInfo } from '../services'

const schoolData = getSchoolInfo()

export default function DataNotice() {
  const { t } = useLanguage()
  if (schoolData.verified) return null
  const social = schoolData.socialLinks.find((item) => item.name === 'Instagram')
  return (
    <aside className="data-notice" role="status">
      <span>{t('common.dataNotice')}</span>
      {social && <a href={social.url} target="_blank" rel="noreferrer">{t('common.reportError')}</a>}
    </aside>
  )
}
