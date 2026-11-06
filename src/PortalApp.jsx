import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import PortalLayout from './layouts/PortalLayout'
import HomePage from './pages/home/HomePage'
import './styles/portal.css'

// Лениво грузим остальные страницы — уменьшает стартовый бандл.
const AboutPage = lazy(() => import('./pages/about/AboutPage'))
const AlykulPage = lazy(() => import('./pages/about/AlykulPage'))
const LeadershipPage = lazy(() => import('./pages/leadership/LeadershipPage'))
const TeachersPage = lazy(() => import('./pages/teachers/TeachersPage'))
const AdmissionsPage = lazy(() => import('./pages/admissions/AdmissionsPage'))
const AdmissionPage = lazy(() => import('./pages/admissions/AdmissionPage'))
const ParentsPage = lazy(() => import('./pages/parents/ParentsPage'))
const StudentsPage = lazy(() => import('./pages/students/StudentsPage'))
const LocationPage = lazy(() => import('./pages/location/LocationPage'))
const ContactPage = lazy(() => import('./pages/contact/ContactPage'))
const NewsPage = lazy(() => import('./pages/news/NewsPage'))
const NewsDetailPage = lazy(() => import('./pages/news/NewsDetailPage'))
const EventsPage = lazy(() => import('./pages/events/EventsPage'))
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage'))
const SchedulePage = lazy(() => import('./pages/students/SchedulePage'))
const SearchPage = lazy(() => import('./pages/search/SearchPage'))
const HistoryPage = lazy(() => import('./pages/about/HistoryPage'))
const FaqPage = lazy(() => import('./pages/faq/FaqPage'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))
const NotFoundPage = lazy(() => import('./pages/not-found/NotFoundPage'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Динамический SEO-title под текущий язык и маршрут.
function SeoTitle() {
  const { t, lang } = useLanguage()
  const { pathname } = useLocation()
  useEffect(() => {
    const map = {
      '/': 'home.title',
      '/mektep': 'about.title',
      '/about/history': 'history.title',
      '/about/alykul-osmonov': 'alykul.title',
      '/jetekchilik': 'leadership.title',
      '/mugalimder': 'teachers.title',
      '/kabyl-aluu': 'admissions.title',
      '/admission': 'admission.title',
      '/parents': 'parents.title',
      '/students': 'students.title',
      '/students/schedule': 'schedule.title',
      '/dariek': 'location.title',
      '/baylanysh': 'contact.title',
      '/news': 'news.title',
      '/events': 'events.title',
      '/documents': 'documents.title',
      '/search': 'search.title',
      '/faq': 'faq.title',
      '/admin': 'admin.title',
    }
    const key = map[pathname]
    const suffix = t('common.schoolName')
    document.title = key ? `${t(key)} — ${suffix}` : suffix
    document.documentElement.lang = lang
  }, [pathname, lang, t])
  return null
}

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader-spinner" />
    </div>
  )
}

export default function PortalApp() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <ScrollToTop />
        <SeoTitle />
        <Routes>
          <Route element={<PortalLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route
              path="*"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/mektep" element={<AboutPage />} />
                    <Route path="/about/history" element={<HistoryPage />} />
                    <Route path="/about/alykul-osmonov" element={<AlykulPage />} />
                    <Route path="/jetekchilik" element={<LeadershipPage />} />
                    <Route path="/mugalimder" element={<TeachersPage />} />
                    <Route path="/kabyl-aluu" element={<AdmissionsPage />} />
                    <Route path="/admission" element={<AdmissionPage />} />
                    <Route path="/parents" element={<ParentsPage />} />
                    <Route path="/students" element={<StudentsPage />} />
                    <Route path="/students/schedule" element={<SchedulePage />} />
                    <Route path="/dariek" element={<LocationPage />} />
                    <Route path="/baylanysh" element={<ContactPage />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/news/:slug" element={<NewsDetailPage />} />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/documents" element={<DocumentsPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/faq" element={<FaqPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}
