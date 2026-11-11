import { translations } from '../src/i18n/translations.js'

const languages = ['ky', 'ru', 'en']
const flatten = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) =>
  child && typeof child === 'object' && !Array.isArray(child)
    ? flatten(child, `${prefix}${key}.`)
    : [`${prefix}${key}`],
)
const keys = Object.fromEntries(languages.map((language) => [language, new Set(flatten(translations[language]))]))
let failed = false

for (const source of languages) {
  for (const target of languages) {
    const missing = [...keys[source]].filter((key) => !keys[target].has(key))
    if (missing.length) {
      failed = true
      console.error(`${source} -> ${target}: missing ${missing.join(', ')}`)
    }
  }
}

if (failed) process.exitCode = 1
else console.log(`Translation keys are synchronized (${languages.map((language) => `${language}: ${keys[language].size}`).join(', ')}).`)
