import { Languages } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function LanguageSwitcher() {
  const { lang, setLang, languages } = useLanguage()
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <Languages aria-hidden="true" />
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`lang-option${lang === l.code ? ' is-active' : ''}`}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          title={l.label}
        >
          {l.short}
        </button>
      ))}
    </div>
  )
}
