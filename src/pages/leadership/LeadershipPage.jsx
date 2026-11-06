import InfoPage from '../../components/InfoPage'
import { useLanguage } from '../../i18n/LanguageContext'

export default function LeadershipPage() {
  const { t, get } = useLanguage()
  const items = get('leadership.items') || []
  const profiles = get('leadership.profiles') || []
  return (
    <InfoPage
      title={t('leadership.title')}
      eyebrow={t('leadership.eyebrow')}
      intro={t('leadership.intro')}
      profiles={profiles}
      items={items}
      asideTitle={t('leadership.asideTitle')}
      asideText={t('leadership.asideText')}
      headingEyebrow={t('leadership.teamEyebrow')}
      headingTitle={t('leadership.teamTitle')}
    />
  )
}
