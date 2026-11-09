import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import {
  ArrowRight,
  Award,
  BellRing,
  BookOpen,
  CalendarDays,
  DoorOpen,
  ExternalLink,
  GraduationCap,
  MapPin,
  School,
  Timer,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import Reveal from '../../components/Reveal'
import LiveScheduleWidget from '../../components/LiveScheduleWidget'
import useSpotlight from '../../hooks/useSpotlight'
import { scheduleStats } from '../../data/stats'
import schoolData from '../../data/school'

const directions = [
  { key: 'school', icon: School, to: '/mektep' },
  { key: 'leadership', icon: Award, to: '/jetekchilik' },
  { key: 'teachers', icon: UsersRound, to: '/mugalimder' },
  { key: 'admission', icon: BookOpen, to: '/kabyl-aluu' },
  { key: 'location', icon: MapPin, to: '/dariek' },
  { key: 'alykul', icon: GraduationCap, to: '/about/alykul-osmonov' },
]

// Плавный счётчик от 0 до target при появлении в зоне видимости.
function CountUp({ value, label, icon: Icon, delay = 0 }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      className="stat-card spotlight"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="stat-icon">
        <Icon size={18} />
      </span>
      <motion.strong
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: reduce ? 0 : 0.25 }}
      >
        {value}
      </motion.strong>
      <span>{label}</span>
    </motion.div>
  )
}

export default function HomePage() {
  const { t } = useLanguage()
  const gridRef = useSpotlight()
  const stats = scheduleStats()
  const heroRef = useRef(null)
  const reduce = useReducedMotion()

  // Лёгкий параллакс: фото уходит чуть медленнее текста при прокрутке.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '14%'])
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '-8%'])

  return (
    <>
      <section className="home-hero" ref={heroRef}>
        <motion.img
          className="hero-image"
          style={reduce ? undefined : { y: imageY }}
          src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=85"
          alt={t('home.dir.school.title')}
          fetchPriority="high"
          decoding="async"
        />
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

      {/* Живое расписание: что идёт прямо сейчас */}
      <section className="home-section live-section">
        <div className="page-container">
          <LiveScheduleWidget />
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

      {/* Числа посчитаны из реального расписания 10-х классов */}
      <section className="home-section soft">
        <div className="page-container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{t('home.statsEyebrow')}</p>
              <h2 className="section-title">{t('home.statsTitle')}</h2>
              <p className="section-intro">{t('home.statsIntro')}</p>
            </div>
          </div>
          <div className="stats-grid">
            <CountUp value={stats.classes} label={t('home.statClasses')} icon={UsersRound} delay={0} />
            <CountUp value={stats.lessons} label={t('home.statLessons')} icon={CalendarDays} delay={70} />
            <CountUp value={stats.subjects} label={t('home.statSubjects')} icon={BookOpen} delay={140} />
            <CountUp value={stats.rooms} label={t('home.statRooms')} icon={DoorOpen} delay={210} />
            <CountUp value={stats.lessonMinutes} label={t('home.statMinutes')} icon={Timer} delay={280} />
            <div className="stat-card stat-card-wide spotlight">
              <span className="stat-icon">
                <BellRing size={18} />
              </span>
              <strong>{stats.bellRange}</strong>
              <span>{t('home.statBells')}</span>
            </div>
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
          <div className="placeholder-panel">
            <strong>{t('home.newsEmpty')}</strong>
            <p>{t('home.newsEmptyText')}</p>
            <a
              className="text-link"
              href={schoolData.socialLinks[0].url}
              target="_blank"
              rel="noreferrer"
            >
              {t('home.socialPage')} {schoolData.socialLinks[0].handle} <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

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
