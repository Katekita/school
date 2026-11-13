import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function NetworkStatusNotice() {
  const { t } = useLanguage()
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online) return null

  return (
    <aside className="network-offline-notice" role="status" aria-live="polite">
      <WifiOff aria-hidden="true" size={17} />
      <span>{t('network.offline')}</span>
    </aside>
  )
}
