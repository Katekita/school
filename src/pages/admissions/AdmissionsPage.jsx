import InfoPage from '../../components/InfoPage'
import { useLanguage } from '../../i18n/LanguageContext'

export default function AdmissionsPage() {
  const { t, get } = useLanguage()
  const items = get('admissions.items') || []
  return (
    <InfoPage
      title={t('admissions.title')}
      eyebrow={t('admissions.eyebrow')}
      intro={t('admissions.intro')}
      items={items}
      asideTitle={t('admissions.asideTitle')}
      asideText={t('admissions.asideText')}
    />
  )
}
