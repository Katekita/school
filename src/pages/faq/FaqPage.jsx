import { ChevronDown, HelpCircle } from 'lucide-react'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'

export default function FaqPage() {
  const { t, get } = useLanguage()
  const faqs = get('faq.items') || []
  return (
    <>
      <PageBanner title={t('faq.title')} eyebrow={t('faq.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <div className="faq-list">
            {faqs.map((item, i) => (
              <Reveal key={item.q} delay={i * 50}>
                <details className="faq-item" open={i === 0}>
                  <summary>
                    <HelpCircle size={18} />
                    <span>{item.q}</span>
                    <ChevronDown size={18} />
                  </summary>
                  <p>{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
