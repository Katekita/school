import { ArrowRight, CalendarRange, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'
import schoolData from '../../data/school'

export default function HistoryPage() {
  const { t } = useLanguage()
  return (
    <>
      <PageBanner title={t('history.title')} eyebrow={t('history.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <div className="content-grid">
            <div className="content-prose">
              <p>{t('history.p1')}</p>
              <p>{t('history.p2')}</p>
            </div>
            <aside className="placeholder-panel">
              <strong>{t('history.asideTitle')}</strong>
              <p>{t('history.asideText')}</p>
            </aside>
          </div>
          <Reveal>
            <a className="text-link" href={schoolData.socialLinks[0].url} target="_blank" rel="noreferrer">
              {t('history.socialLink')} {schoolData.socialLinks[0].handle} <ExternalLink size={14} />
            </a>
          </Reveal>
        </div>
      </section>
      <section className="home-section soft">
        <div className="page-container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{t('history.materialsEyebrow')}</p>
              <h2 className="section-title">{t('history.materialsTitle')}</h2>
            </div>
          </div>
          <Reveal>
            <div className="cta-box">
              <CalendarRange size={28} />
              <div>
                <strong>{t('history.ctaStrong')}</strong>
                <p>{t('history.ctaText')}</p>
              </div>
              <Link className="button-primary" to="/about/alykul-osmonov">
                {t('history.ctaButton')} <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

