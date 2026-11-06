import InfoPage from '../../components/InfoPage'
import { useLanguage } from '../../i18n/LanguageContext'

export default function AboutPage() {
  const { t, get } = useLanguage()
  const items = get('about.items') || []
  return (
    <InfoPage
      title={t('about.title')}
      eyebrow={t('about.eyebrow')}
      intro={t('about.intro')}
      items={items}
      asideTitle={t('about.asideTitle')}
      asideText={t('about.asideText')}
    />
  )
}
