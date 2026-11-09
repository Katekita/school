import { useEffect, useState } from 'react'
import { Moon, Sun, SunMoon } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { THEME_EVENT, applyTheme, readTheme } from '../utils/theme'

const themes = [
  { value: 'auto', key: 'theme.auto', icon: SunMoon },
  { value: 'light', key: 'theme.light', icon: Sun },
  { value: 'dark', key: 'theme.dark', icon: Moon },
]

export default function ThemeSwitcher() {
  const { t } = useLanguage()
  const [theme, setTheme] = useState(readTheme)

  // Синхронизация с другими местами переключения (командная палитра, кнопка).
  useEffect(() => {
    const sync = (event) => setTheme(event.detail)
    window.addEventListener(THEME_EVENT, sync)
    return () => window.removeEventListener(THEME_EVENT, sync)
  }, [])

  useEffect(() => {
    if (theme !== 'auto') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => applyTheme('auto')
    sync()
    query.addEventListener?.('change', sync)
    return () => query.removeEventListener?.('change', sync)
  }, [theme])

  return (
    <div className="theme-switch" role="group" aria-label={t('theme.label')}>
      {themes.map(({ value, key, icon: Icon }) => (
        <button
          key={value}
          type="button"
          className={`theme-option${theme === value ? ' is-active' : ''}`}
          aria-pressed={theme === value}
          title={t(key)}
          onClick={() => applyTheme(value)}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  )
}
