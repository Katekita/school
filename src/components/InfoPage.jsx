import { BookOpen, UserRound } from 'lucide-react'
import PageBanner from './PageBanner'
import Reveal from './Reveal'
import { useLanguage } from '../i18n/LanguageContext'

const iconByName = {
  BookOpen,
  BriefcaseBusiness: BookOpen,
  CalendarDays: BookOpen,
  ClipboardList: BookOpen,
  FileCheck2: BookOpen,
  HeartHandshake: BookOpen,
  Landmark: BookOpen,
  ListChecks: BookOpen,
  Mail: BookOpen,
  Phone: BookOpen,
  Target: BookOpen,
  UserRound,
  UsersRound: UserRound,
}

export default function InfoPage({ title, eyebrow, intro, items, profiles = [], asideTitle, asideText, headingEyebrow, headingTitle }) {
  const { t } = useLanguage()
  return (
    <>
      <PageBanner title={title} eyebrow={eyebrow} />
      <section className="content-section">
        <div className="page-container">
          {profiles.length > 0 && (
            <>
              <div className="section-heading-row">
                <div>
                  <p className="eyebrow">{headingEyebrow}</p>
                  <h2 className="section-title">{headingTitle}</h2>
                  <p className="section-intro">{intro}</p>
                </div>
              </div>
              <div className="profile-grid">
                {profiles.map((role, i) => (
                  <Reveal key={role} delay={i * 60}>
                    <article className="profile-placeholder">
                      <UserRound />
                      <strong>{role}</strong>
                      <span>{t('leadership.asideText')}</span>
                    </article>
                  </Reveal>
                ))}
              </div>
            </>
          )}
          <div className={`content-grid${profiles.length ? ' profiles-followup' : ''}`}>
            <div className="content-prose">
              <p>{intro}</p>
              <ul className="placeholder-list">
                {items.map(({ icon, text }) => {
                  const Icon = iconByName[icon] || BookOpen
                  return (
                    <li key={text}>
                      <Icon size={18} />
                      {text}
                    </li>
                  )
                })}
              </ul>
            </div>
            <aside className="placeholder-panel">
              <strong>{asideTitle}</strong>
              <p>{asideText}</p>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
