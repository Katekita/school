import { ArrowRight, Award, BookOpen, ExternalLink, GraduationCap, MapPin, School, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import Reveal from '../../components/Reveal'
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

  return (
    <>
      <section className="home-hero">
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=85"
          alt={t('home.dir.school.title')}
        />
        <div className="hero-content">
          <div className="hero-overline">
            <span /> {t('home.heroTagline')}
          </div>
          <h1>
            {t('common.schoolShort')} {t('home.heroTitleFirst')} <em>{t('home.heroTitleAccent')}</em>
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
        </div>
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
          <span className="fact-icon"><School size={18} /></span>
          <div>
            <strong>{t('common.schoolShort')} {t('home.factSchool')}</strong>
            <span>{t('home.factSchoolSub')}</span>
          </div>
        </Reveal>
        <Reveal className="fact" delay={60}>
          <span className="fact-icon"><MapPin size={18} /></span>
          <div>
            <strong>{t('header.city')}</strong>
            <span>{t('home.factCountry')}</span>
          </div>
        </Reveal>
        <Reveal className="fact" delay={120}>
          <span className="fact-icon"><MapPin size={18} /></span>
          <div>
            <strong>{schoolData.address}</strong>
            <span>{t('home.factAddressSub')}</span>
          </div>
        </Reveal>
        <Reveal className="fact" delay={180}>
          <span className="fact-icon"><UsersRound size={18} /></span>
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
          <div className="direction-grid">
            {directions.map(({ key, icon: Icon, to }, i) => (
              <Reveal key={to} delay={i * 60}>
                <Link className="direction-card" to={to}>
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

      <section className="home-section soft">
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
            <a className="text-link" href={schoolData.socialLinks[0].url} target="_blank" rel="noreferrer">
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
