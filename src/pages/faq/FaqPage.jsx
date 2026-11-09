import { ChevronDown, HelpCircle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import Reveal from '../../components/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'

// Открытый вопрос берётся из ссылки вида /faq#faq-2: так работает переход
// из командной палитры и внешние шаринг-ссылки. key на списке перемонтирует
// аккордеон при смене якоря, поэтому состояние хранит только сам браузер.
function indexFromHash(hash, length) {
  const n = Number(hash.replace(/^#faq-/, ''))
  return Number.isInteger(n) && n >= 0 && n < length ? n : 0
}

export default function FaqPage() {
  const { t, get } = useLanguage()
  const { hash } = useLocation()
  const faqs = get('faq.items') || []
  const active = indexFromHash(hash, faqs.length)

  return (
    <>
      <PageBanner title={t('faq.title')} eyebrow={t('faq.eyebrow')} />
      <section className="content-section">
        <div className="page-container">
          <div className="faq-list" key={active}>
            {faqs.map((item, i) => (
              <Reveal key={item.q} delay={i * 50}>
                <details className="faq-item" id={`faq-${i}`} open={i === active}>
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
