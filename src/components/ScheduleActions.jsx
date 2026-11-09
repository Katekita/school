import { useState } from 'react'
import { Bell, Check, Printer, Share2 } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { downloadIcs } from '../utils/ics'

// Действия вокруг расписания: скачать в календарь, распечатать, поделиться.
// Всё работает без бэкенда — .ics генерируется на клиенте, share через Web Share API.
export default function ScheduleActions({ classKey, lang }) {
  const { t } = useLanguage()
  const [done, setDone] = useState('')

  function flash(kind) {
    setDone(kind)
    setTimeout(() => setDone(''), 1800)
  }

  async function share() {
    const url = window.location.href
    const text = t('schedule.shareText').replace('{class}', classKey)
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, text, url })
        flash('share')
        return
      } catch {
        /* пользователь закрыл нативный диалог — падаем на копирование */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      flash('copy')
    } catch {
      flash('fail')
    }
  }

  return (
    <div className="schedule-actions">
      <button type="button" className="action-chip" onClick={() => downloadIcs(classKey, lang)}>
        <Bell size={15} /> {t('schedule.ics')}
      </button>
      <button type="button" className="action-chip" onClick={() => window.print()}>
        <Printer size={15} /> {t('schedule.print')}
      </button>
      <button type="button" className="action-chip" onClick={share}>
        {done === 'copy' || done === 'share' ? <Check size={15} /> : <Share2 size={15} />}
        {done === 'copy' ? t('common.copied') : t('common.share')}
      </button>
    </div>
  )
}
