import { ExternalLink, ShieldAlert } from 'lucide-react'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'
import schoolData from '../../data/school'

export default function AdminPage() {
  const { t } = useLanguage()
  return (
    <>
      <PageBanner title={t('admin.title')} eyebrow={t('admin.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <Reveal>
            <div className="empty-state">
              <ShieldAlert size={34} />
              <h3>{t('admin.heading')}</h3>
              <p>{t('admin.text')}</p>
              <a className="text-link" href={schoolData.socialLinks[0].url} target="_blank" rel="noreferrer">
                {t('admin.socialLink')} {schoolData.socialLinks[0].handle} <ExternalLink size={14} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

