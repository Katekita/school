import { Suspense, lazy, useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp } from 'lucide-react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import NetworkStatusNotice from '../components/NetworkStatusNotice'
import { useLanguage } from '../i18n/LanguageContext'

const CommandPalette = lazy(() => import('../components/CommandPalette'))

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader-spinner" />
    </div>
  )
}

// Кнопка «наверх» появляется после первого экрана и уезжает, если открыто меню.
function BackToTop() {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          className="back-to-top"
          aria-label={t('common.toTop')}
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export default function PortalLayout() {
  const location = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const isNewsViewer = Boolean(location.state?.newsViewer)
  const isReturningFromViewer = Boolean(location.state?.fromNewsViewer)
  const pageKey = isNewsViewer ? '/news-viewer' : location.pathname

  return (
    <div className="site-shell">
      <NetworkStatusNotice />
      <SiteHeader onOpenPalette={() => setPaletteOpen(true)} />
      <main id="main-content">
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pageKey}
              className="page-transition"
              initial={isNewsViewer || isReturningFromViewer ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: isNewsViewer || isReturningFromViewer ? 0.16 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      <SiteFooter />
      <BackToTop />
      {paletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </Suspense>
      )}
      {/* Ссылки на ключевые разделы для краулеров и медленных сетей */}
      <nav className="sitemap-fallback" aria-hidden="true">
        <Link to="/mektep">Мектеп</Link>
        <Link to="/news">Жаңылыктар</Link>
        <Link to="/students/schedule">Расписание</Link>
        <Link to="/baylanysh">Байланыш</Link>
      </nav>
    </div>
  )
}
