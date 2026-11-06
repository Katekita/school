import { BookOpen, Search, UsersRound } from 'lucide-react'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'

const icons = [UsersRound, BookOpen, Search]

export default function TeachersPage() {
  const { t, get } = useLanguage()
  const cards = get('teachers.cards') || []
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
          <div className="contact-grid">
            {cards.map(({ title, text }, i) => {
              const Icon = icons[i] || UsersRound
              return (
                <Reveal key={title} delay={i * 60}>
                  <article className="contact-card">
                    <Icon size={22} />
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </article>
                </Reveal>
              )
            })}
          </div>
          <div className="placeholder-panel" style={{ marginTop: 18 }}>
            <strong>{t('teachers.catalogTitle')}</strong>
            <p>{t('teachers.catalogText')}</p>
          </div>
        </div>
      </section>
    </>
  )
}
