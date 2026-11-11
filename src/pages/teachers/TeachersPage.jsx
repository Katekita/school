import PageBanner from '../../components/PageBanner'
import { useLanguage } from '../../i18n/LanguageContext'

export default function TeachersPage() {
  const { t } = useLanguage()
  return (
    <>
      <PageBanner title={t('teachers.title')} eyebrow={t('teachers.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{t('teachers.staffEyebrow')}</p>
              <h2 className="section-title">{t('teachers.staffTitle')}</h2>
              <p className="section-intro">{t('teachers.staffIntro')}</p>
            </div>
          </div>
          <div className="placeholder-panel" style={{ marginTop: 18 }}>
            <strong>{t('common.infoPreparing')}</strong>
            <p>{t('common.infoRequest')}</p>
          </div>
        </div>
      </section>
    </>
  )
}
