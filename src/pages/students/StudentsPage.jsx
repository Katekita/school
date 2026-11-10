import { ArrowRight, BookOpenText, CalendarHeart, Trophy, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'

const icons = [CalendarHeart, BookOpenText, UsersRound, Trophy]
const routes = ['/students/schedule', '/news', '/news#events', '/mektep']

export default function StudentsPage() {
  const { t, get } = useLanguage()
  const cards = get('students.cards') || []
  return (
    <>
      <PageBanner title={t('students.title')} eyebrow={t('students.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <div className="direction-grid">
            {cards.map(({ title, text }, i) => {
              const Icon = icons[i] || CalendarHeart
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
