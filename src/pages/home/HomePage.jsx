import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  MapPin,
  Newspaper,
  School,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import Reveal from '../../components/Reveal'
import useNow from '../../hooks/useNow'
import useSpotlight from '../../hooks/useSpotlight'
import { getEvents, getSchoolInfo } from '../../services'
import DataNotice from '../../components/DataNotice'
import NewsStrip from '../../components/NewsStrip'
import EmptyState from '../../components/ui/EmptyState'
import { scheduleStats } from '../../data/stats'
import { downloadEventIcs } from '../../utils/ics'

const schoolData = getSchoolInfo()

const directions = [
  { key: 'school', icon: School, to: '/mektep' },
  { key: 'leadership', icon: Award, to: '/jetekchilik' },
  { key: 'teachers', icon: UsersRound, to: '/mugalimder' },
  { key: 'admission', icon: BookOpen, to: '/kabyl-aluu' },
  { key: 'location', icon: MapPin, to: '/dariek' },
  { key: 'alykul', icon: GraduationCap, to: '/about/alykul-osmonov' },
]

const shortcuts = [
  { label: 'home.quickSchedule', icon: BookOpen, to: '/students/schedule' },
  { label: 'home.quickAdmission', icon: GraduationCap, to: '/kabyl-aluu' },
  { label: 'home.quickTeachers', icon: UsersRound, to: '/mugalimder' },
  { label: 'home.quickDocuments', icon: FileText, to: '/documents' },
  { label: 'home.quickNews', icon: Newspaper, to: '/news' },
  { label: 'home.quickContacts', icon: MapPin, to: '/baylanysh' },
]

export default function HomePage() {
  const { t, lang } = useLanguage()
  const now = useNow(60_000)
  const gridRef = useSpotlight()
  const heroRef = useRef(null)
  const reduce = useReducedMotion()

  // Лёгкий параллакс: фото уходит чуть медленнее текста при прокрутке.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '-8%'])
  const events = getEvents()
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bishkek' }).format(now)
  const eventDateKey = (value) => {
    const date = new Date(value)
    return Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bishkek' }).format(date)
      : ''
  }
  const upcomingEvents = events
    .filter((event) => eventDateKey(event.date) >= today && eventDateKey(event.date))
    .sort((a, b) => eventDateKey(a.date).localeCompare(eventDateKey(b.date)))
    .slice(0, 3)
  const stats = scheduleStats()
  const eventDateFormatter = new Intl.DateTimeFormat(
    { ky: 'ky-KG', ru: 'ru-RU', en: 'en-US' }[lang] || 'ru-RU',
    { dateStyle: 'long', timeZone: 'Asia/Bishkek' },
  )

  return (
    <>
      <section className="home-hero" ref={heroRef}>
        <div className="hero-image" aria-hidden="true" />
        <motion.div className="hero-content" style={reduce ? undefined : { y: copyY }}>
          <div className="hero-overline">
            <span /> {t('home.heroTagline')}
          </div>
          <h1>
            <em>{t('common.schoolShort')}</em> {t('home.heroTitleFirst')}
          </h1>
          <p className="hero-description">{t('home.heroDesc')}</p>
          <div className="hero-buttons">
            <Link className="button-primary" to="/mektep">
              {t('home.ctaAbout')} <ArrowRight size={16} />
            </Link>
            <Link className="button-outline" to="/dariek">
              <MapPin size={16} /> {t('home.ctaAddress')}
            </Link>
          </div>
        </motion.div>
        <div className="hero-seal">
          <span>
            <strong>{t('common.schoolShort')}</strong>
            {t('home.sealTop')}
            <br />
            {t('home.sealBottom')}
          </span>
        </div>
      </section>
      <div className="page-container"><DataNotice /></div>

      <section className="quick-facts" aria-label={t('home.factsAria')}>
        <Reveal className="fact" delay={0}>
          <span className="fact-icon">
            <School size={18} />
          </span>
          <div>
            <strong>
              {t('common.schoolShort')} {t('home.factSchool')}
            </strong>
            <span>{t('home.factSchoolSub')}</span>
          </div>
        </Reveal>
        <Reveal className="fact" delay={60}>
          <span className="fact-icon">
            <MapPin size={18} />
          </span>
          <div>
            <strong>{t('header.city')}</strong>
            <span>{t('home.factCountry')}</span>
          </div>
        </Reveal>
        <Reveal className="fact" delay={120}>
          <span className="fact-icon">
            <MapPin size={18} />
          </span>
          <div>
            <strong>{schoolData.address}</strong>
            <span>{t('home.factAddressSub')}</span>
          </div>
        </Reveal>
        <Reveal className="fact" delay={180}>
          <span className="fact-icon">
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{schoolData.socialLinks[0].handle}</strong>
            <span>{t('home.factSocialSub')}</span>
          </div>
        </Reveal>
      </section>

      <section className="home-section home-quick-access">
        <div className="page-container">
          <Reveal>
            <h2 className="section-title">{t('home.quickAccessTitle')}</h2>
          </Reveal>
          <div className="home-shortcut-grid">
            {shortcuts.map(({ label, icon: Icon, to }, index) => (
              <Reveal className="home-shortcut" delay={index * 0.04} key={label}>
                <Link className="home-shortcut-link" to={to}>
                  <Icon aria-hidden="true" size={20} />
                  <span>{t(label)}</span>
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="page-container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{t('home.sectionsEyebrow')}</p>
              <h2 className="section-title">{t('home.sectionsTitle')}</h2>
              <p className="section-intro">{t('home.sectionsIntro')}</p>
            </div>
            <Link className="text-link" to="/mektep">
              {t('home.allSections')} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="direction-grid" ref={gridRef}>
            {directions.map(({ key, icon: Icon, to }, i) => (
              <Reveal key={to} delay={i * 60}>
                <Link className="direction-card spotlight" to={to}>
                  <span className="direction-card-icon">
                    <Icon size={20} />
                  </span>
                  <strong>{t(`home.dir.${key}.title`)}</strong>
                  <span>
                    {t(`home.dir.${key}.text`)}
                    <ArrowRight size={14} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="page-container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{t('home.newsEyebrow')}</p>
              <h2 className="section-title">{t('home.newsTitle')}</h2>
              <p className="section-intro">{t('home.newsIntro')}</p>
            </div>
            <Link className="text-link" to="/news">
              {t('home.allNews')} <ArrowRight size={14} />
            </Link>
          </div>
          <NewsStrip />
        </div>
      </section>

      <section className="home-section home-upcoming-events">
        <div className="page-container">
          <Reveal>
            <h2 className="section-title">{t('home.eventsTitle')}</h2>
          </Reveal>
          {upcomingEvents.length ? (
            <div className="home-event-list">
              {upcomingEvents.map((event) => (
                <article className="home-event-card" key={event.id || event.slug || `${event.title}-${event.date}`}>
                  <div>
                    <time dateTime={event.date}>{eventDateFormatter.format(new Date(event.date))}</time>
                    <h3>{event.title}</h3>
                    {event.summary && <p>{event.summary}</p>}
                  </div>
                  <button className="button-secondary home-event-calendar" onClick={() => downloadEventIcs(event)} type="button">
                    <CalendarDays aria-hidden="true" size={17} />
                    {t('home.calendarDownload')}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title={t('events.emptyTitle')} description={t('events.emptyText')} />
          )}
        </div>
      </section>

      {stats.classes > 0 && (
        <section className="home-section home-statistics">
          <div className="page-container">
            <Reveal>
              <p className="eyebrow">{t('home.statsEyebrow')}</p>
              <h2 className="section-title">{t('home.statsTitle')}</h2>
            </Reveal>
            <div className="home-stats-grid">
              {[
                ['classes', 'statClasses'],
                ['lessons', 'statLessons'],
                ['subjects', 'statSubjects'],
                ['rooms', 'statRooms'],
              ].map(([key, label]) => (
                <div className="home-stat-card" key={key}>
                  <strong>{stats[key]}</strong>
                  <span>{t(`home.${label}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="content-section">
        <div className="page-container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{t('home.cultureEyebrow')}</p>
              <h2 className="section-title">{t('home.cultureTitle')}</h2>
            </div>
            <Link className="text-link" to="/about/alykul-osmonov">
              {t('home.moreInfo')} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="content-prose">
            <p>{t('home.cultureText')}</p>
          </div>
        </div>
      </section>
    </>
  )
}
