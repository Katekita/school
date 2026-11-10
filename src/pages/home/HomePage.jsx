import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import {
  ArrowRight,
  Award,
  BookOpen,
  ExternalLink,
  GraduationCap,
  MapPin,
  School,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import Reveal from '../../components/Reveal'
import useSpotlight from '../../hooks/useSpotlight'
import schoolData from '../../data/school'

const directions = [
  { key: 'school', icon: School, to: '/mektep' },
  { key: 'leadership', icon: Award, to: '/jetekchilik' },
  { key: 'teachers', icon: UsersRound, to: '/mugalimder' },
  { key: 'admission', icon: BookOpen, to: '/kabyl-aluu' },
  { key: 'location', icon: MapPin, to: '/dariek' },
  { key: 'alykul', icon: GraduationCap, to: '/about/alykul-osmonov' },
]

export default function HomePage() {
  const { t } = useLanguage()
  const gridRef = useSpotlight()
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
          srcSet="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=640&q=75 640w, https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1280&q=80 1280w, https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=85 2000w"
          sizes="(max-width: 600px) 100vw, (max-width: 1080px) 50vw, 55vw"
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
