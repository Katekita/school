import { ArrowRight, BadgeCheck, BookCheck, FileText, MapPinned, NotebookPen } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'

const stepIcons = [BadgeCheck, NotebookPen, FileText, MapPinned]

export default function AdmissionPage() {
  const { t, get } = useLanguage()
  const steps = get('admission.steps') || []
  return (
    <>
      <PageBanner title={t('admission.title')} eyebrow={t('admission.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <div className="direction-grid">
            {steps.map(({ title, text }, i) => {
              const Icon = stepIcons[i] || BadgeCheck
              return (
                <Reveal key={title} delay={i * 60}>
                  <article className="direction-card">
                    <span className="direction-card-icon">
                      <Icon size={20} />
                    </span>
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </article>
                </Reveal>
              )
            })}
          </div>
          <Reveal>
            <div className="cta-box">
              <BookCheck size={28} />
              <div>
                <strong>{t('admission.ctaStrong')}</strong>
                <p>{t('admission.ctaText')}</p>
              </div>
              <Link className="button-primary" to="/baylanysh">
                {t('common.contactSchool')} <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
