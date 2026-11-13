import { UsersRound } from 'lucide-react'
import PageBanner from '../../components/PageBanner'
import EmptyState from '../../components/ui/EmptyState'
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
          <EmptyState
            icon={<UsersRound size={30} />}
            title={t('common.infoPreparing')}
            description={t('common.infoRequest')}
          />
        </div>
      </section>
    </>
  )
}
