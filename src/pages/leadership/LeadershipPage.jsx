import InfoPage from '../../components/InfoPage'
import { useLanguage } from '../../i18n/LanguageContext'

export default function LeadershipPage() {
  const { t } = useLanguage()
  return (
    <InfoPage
      title={t('leadership.title')}
      eyebrow={t('leadership.eyebrow')}
      intro={t('leadership.intro')}
      profiles={[]}
      items={[]}
      asideTitle={t('leadership.asideTitle')}
      asideText={t('common.infoRequest')}
      headingEyebrow={t('leadership.teamEyebrow')}
      headingTitle={t('leadership.teamTitle')}
    />
  )
}
