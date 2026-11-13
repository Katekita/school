import { useState } from 'react'
import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

const STORAGE_KEY = 'school68_personal_planner'
const plannerTypes = ['homework', 'note', 'test', 'deadline']

function readItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { items: [], error: '' }
    const items = JSON.parse(saved)
    if (!Array.isArray(items)) return { items: [], error: 'readError' }
    const validItems = items.filter((item) =>
        item && typeof item.id === 'string' &&
        plannerTypes.includes(item.type) && typeof item.title === 'string',
      ).map((item) => {
        const due = typeof item.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.due)
          ? item.due
          : ''
        return {
          ...item,
          title: item.title.trim(),
          due,
          details: typeof item.details === 'string' ? item.details : '',
        }
      }).filter((item) => item.title)
    return {
      items: validItems,
      error: '',
    }
  } catch {
    return { items: [], error: 'readError' }
  }
}

export default function SchedulePlanner() {
  const { t, lang } = useLanguage()
  const [planner, setPlanner] = useState(readItems)
  const [type, setType] = useState('homework')

  function persist(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      setPlanner({ items, error: '' })
      return true
    } catch {
      setPlanner((current) => ({ ...current, error: 'saveError' }))
      return false
    }
  }

  function addItem(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const title = String(values.get('title') || '').trim()
    if (!title) return

    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      due: String(values.get('due') || ''),
      details: String(values.get('details') || '').trim(),
    }
    if (persist([item, ...planner.items])) form.reset()
  }

  function removeItem(id) {
    persist(planner.items.filter((item) => item.id !== id))
  }

  const dateFormatter = new Intl.DateTimeFormat(
    { ky: 'ky-KG', ru: 'ru-RU', en: 'en-US' }[lang] || 'ru-RU',
    { dateStyle: 'medium', timeZone: 'Asia/Bishkek' },
  )

  return (
    <section className="schedule-planner" aria-labelledby="schedule-planner-title">
      <header className="schedule-planner-head">
        <div>
          <h2 id="schedule-planner-title">{t('planner.title')}</h2>
          <p>{t('planner.disclaimer')}</p>
        </div>
        <CalendarDays aria-hidden="true" size={22} />
      </header>

      <form className="schedule-planner-form" onSubmit={addItem}>
        <label>
          <span>{t('planner.type')}</span>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            {plannerTypes.map((itemType) => (
              <option key={itemType} value={itemType}>{t(`planner.types.${itemType}`)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('planner.titleLabel')}</span>
          <input name="title" maxLength={160} required />
        </label>
        <label>
          <span>{t('planner.dueDate')}</span>
          <input name="due" type="date" />
        </label>
        <label className="schedule-planner-details">
          <span>{t('planner.details')}</span>
          <textarea name="details" maxLength={1000} rows={2} />
        </label>
        <button className="button-primary schedule-planner-add" type="submit">
          <Plus aria-hidden="true" size={17} /> {t('planner.add')}
        </button>
      </form>

      {planner.error && <p className="schedule-planner-error" role="alert">{t(`planner.${planner.error}`)}</p>}
      {planner.items.length ? (
        <ul className="schedule-planner-list">
          {planner.items.map((item) => (
            <li key={item.id}>
              <div>
                <span className="schedule-planner-kind">{t(`planner.types.${item.type}`)}</span>
                <strong>{item.title}</strong>
                {item.due && <time dateTime={item.due}>{dateFormatter.format(new Date(`${item.due}T12:00:00+06:00`))}</time>}
                {item.details && <p>{item.details}</p>}
              </div>
              <button
                type="button"
                className="schedule-planner-remove"
                aria-label={`${t('planner.remove')} — ${item.title}`}
                onClick={() => removeItem(item.id)}
              >
                <Trash2 aria-hidden="true" size={17} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="schedule-planner-empty">{t('planner.empty')}</p>
      )}
    </section>
  )
}
