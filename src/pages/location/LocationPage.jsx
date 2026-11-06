import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import SchoolMap from '../../components/SchoolMap'
import { useLanguage } from '../../i18n/LanguageContext'

export default function LocationPage() {
  const { t } = useLanguage()
  return (
    <>
      <PageBanner title={t('location.title')} eyebrow={t('location.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{t('location.routeEyebrow')}</p>
              <h2 className="section-title">{t('location.routeTitle')}</h2>
              <p className="section-intro">{t('location.routeIntro')}</p>
            </div>
          </div>
          <Reveal>
            <SchoolMap />
          </Reveal>
        </div>
      </section>
    </>
  )
}
