import { ArrowRight, BookText, CalendarCheck2, FileText, HelpCircle, MapPinned } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'

const icons = [FileText, CalendarCheck2, BookText, HelpCircle, MapPinned]

export default function ParentsPage() {
  const { t, get } = useLanguage()
  const cards = get('parents.cards') || []
  const routes = ['/kabyl-aluu', '/students/schedule', '/documents', '/faq', '/baylanysh']
  return (
    <>
      <PageBanner title={t('parents.title')} eyebrow={t('parents.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <div className="direction-grid">
            {cards.map(({ title, text }, i) => {
              const Icon = icons[i] || FileText
              return (
                <Reveal key={title} delay={i * 60}>
                  <Link className="direction-card" to={routes[i]}>
                    <span className="direction-card-icon">
                      <Icon size={20} />
                    </span>
                    <strong>{title}</strong>
                    <span>
                      {text} <ArrowRight size={14} />
                    </span>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
