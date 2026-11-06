import { ArrowRight, BookOpenText, Quote, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import Reveal from '../../components/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'

const cardIcons = [Sparkles, Quote, BookOpenText]

export default function AlykulPage() {
  const { t, get } = useLanguage()
  const highlights = get('alykul.highlights') || []
  const cards = get('alykul.cards') || []

  return (
    <>
      <section className="page-banner">
        <div className="page-container">
          <p className="eyebrow">{t('alykul.eyebrow')}</p>
          <h1>{t('alykul.title')}</h1>
          <p className="section-intro">{t('alykul.lead')}</p>
        </div>
      </section>

      <section className="content-section">
        <div className="page-container profile-grid">
          <div className="profile-placeholder large">
            <span>{t('alykul.portrait')}</span>
          </div>
          <div className="content-prose">
            <p>{t('alykul.p1')}</p>
            <p>{t('alykul.p2')}</p>
            <Link className="text-link" to="/mektep">
              {t('alykul.toSchool')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section soft">
        <div className="page-container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{t('alykul.platformEyebrow')}</p>
              <h2 className="section-title">{t('alykul.platformTitle')}</h2>
            </div>
          </div>

          <div className="direction-grid">
            {highlights.map(({ title, text }, i) => (
              <Reveal key={title} delay={i * 60}>
                <div className="direction-card">
                  <span className="direction-card-icon">
                    <BookOpenText size={20} />
                  </span>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="page-container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{t('alykul.eventsEyebrow')}</p>
              <h2 className="section-title">{t('alykul.eventsTitle')}</h2>
            </div>
          </div>

          <div className="direction-grid">
            {cards.map(({ title, text }, i) => {
              const Icon = cardIcons[i] || BookOpenText
              return (
                <Reveal key={title} delay={i * 60}>
                  <div className="direction-card">
                    <span className="direction-card-icon">
                      <Icon size={20} />
                    </span>
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
