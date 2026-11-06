import { Clock3, ExternalLink, MapPin, Phone } from 'lucide-react'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'
import schoolData from '../../data/school'

export default function ContactPage() {
  const { t } = useLanguage()
  const phoneHref = schoolData.phone.replace(/[^+\d]/g, '')
  const schoolSocial = schoolData.socialLinks[0]

  return (
    <>
      <PageBanner title={t('contact.title')} eyebrow={t('contact.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{t('contact.infoEyebrow')}</p>
              <h2 className="section-title">{t('contact.infoTitle')}</h2>
              <p className="section-intro">{t('contact.infoIntro')}</p>
            </div>
          </div>
          <div className="contact-grid">
            <Reveal delay={0}>
              <article className="contact-card">
                <MapPin size={22} />
                <strong>
                  {t('contact.addressLabel')} · {schoolData.addressSource}
                </strong>
                <a href={schoolData.addressSourceUrl} target="_blank" rel="noreferrer">
                  {schoolData.address} <ExternalLink size={14} />
                </a>
              </article>
            </Reveal>
            <Reveal delay={60}>
              <article className="contact-card">
                <Phone size={22} />
                <strong>
                  {t('contact.phoneLabel')} · {schoolData.addressSource}
                </strong>
                <a href={`tel:${phoneHref}`}>{schoolData.phone}</a>
              </article>
            </Reveal>
            <Reveal delay={120}>
              <article className="contact-card">
                <Clock3 size={22} />
                <strong>{t('contact.hoursLabel')}</strong>
                <span>{t('contact.hoursValue')}</span>
              </article>
            </Reveal>
          </div>
          <div className="content-grid" style={{ marginTop: 28 }}>
            <div className="placeholder-panel">
              <strong>{t('contact.sourceTitle')}</strong>
              <p>{schoolData.contactNote}</p>
              <a className="text-link" href={schoolData.addressSourceUrl} target="_blank" rel="noreferrer">
                {schoolData.addressSource} {t('contact.openDirectory')} <ExternalLink size={14} />
              </a>
            </div>
            <div className="placeholder-panel">
              <strong>{t('contact.socialTitle')}</strong>
              <p>
                {t('contact.socialText')}: {schoolSocial.handle}
              </p>
              <a className="text-link" href={schoolSocial.url} target="_blank" rel="noreferrer">
                {t('contact.openSocial')} <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
