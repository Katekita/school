import { useState } from 'react'
import { Check, Moon, Sun, SunMoon, Type } from 'lucide-react'
import PageBanner from '../../components/PageBanner'
import { useLanguage } from '../../i18n/LanguageContext'
import { applyTheme, readTheme } from '../../utils/theme'
import {
  applyAccessibilitySettings,
  readAccessibilitySettings,
} from '../../utils/accessibilitySettings'

const themes = [
  { value: 'auto', key: 'theme.auto', Icon: SunMoon },
  { value: 'light', key: 'theme.light', Icon: Sun },
  { value: 'dark', key: 'theme.dark', Icon: Moon },
]

const textSizes = ['small', 'medium', 'large']

export default function SettingsPage() {
  const { t, lang, setLang } = useLanguage()
  const [theme, setTheme] = useState(readTheme)
  const [settings, setSettings] = useState(readAccessibilitySettings)
  const [saveError, setSaveError] = useState(false)

  function updateSettings(next) {
    setSettings(next)
    setSaveError(!applyAccessibilitySettings(next))
  }

  function chooseTheme(value) {
    setTheme(value)
    applyTheme(value)
  }

  return (
    <>
      <PageBanner title={t('settings.title')} eyebrow={t('settings.eyebrow')} />
      <section className="content-section">
        <div className="page-container settings-page">
          <section className="settings-card" aria-labelledby="settings-appearance-title">
            <h2 id="settings-appearance-title">{t('settings.appearance')}</h2>
            <fieldset className="settings-control">
              <legend>{t('theme.label')}</legend>
              <div className="settings-options">
                {themes.map(({ value, key, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    className="settings-option"
                    aria-pressed={theme === value}
                    onClick={() => chooseTheme(value)}
                  >
                    <Icon aria-hidden="true" size={18} />
                    {t(key)}
                    {theme === value && <Check aria-hidden="true" size={16} />}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="settings-control">
              <legend>{t('lang.label')}</legend>
              <div className="settings-options">
                {['ky', 'ru', 'en'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="settings-option"
                    aria-pressed={lang === value}
                    onClick={() => setLang(value)}
                  >
                    {value.toUpperCase()}
                    {lang === value && <Check aria-hidden="true" size={16} />}
                  </button>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="settings-card" aria-labelledby="settings-accessibility-title">
            <h2 id="settings-accessibility-title">{t('settings.accessibility')}</h2>
            <fieldset className="settings-control">
              <legend><Type aria-hidden="true" size={16} /> {t('settings.textSize')}</legend>
              <div className="settings-options">
                {textSizes.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="settings-option"
                    aria-pressed={settings.textSize === value}
                    onClick={() => updateSettings({ ...settings, textSize: value })}
                  >
                    {t(`settings.sizes.${value}`)}
                    {settings.textSize === value && <Check aria-hidden="true" size={16} />}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="settings-toggle">
              <span>
                <strong>{t('settings.reduceMotion')}</strong>
                <small>{t('settings.reduceMotionHint')}</small>
              </span>
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(event) => updateSettings({ ...settings, reduceMotion: event.target.checked })}
              />
            </label>

            <label className="settings-toggle">
              <span>
                <strong>{t('settings.visibleFocus')}</strong>
                <small>{t('settings.visibleFocusHint')}</small>
              </span>
              <input
                type="checkbox"
                checked={settings.visibleFocus}
                onChange={(event) => updateSettings({ ...settings, visibleFocus: event.target.checked })}
              />
            </label>
            {saveError && <p className="settings-error" role="alert">{t('settings.saveError')}</p>}
          </section>
        </div>
      </section>
    </>
  )
}
