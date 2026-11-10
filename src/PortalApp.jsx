import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import PortalLayout from './layouts/PortalLayout'
import HomePage from './pages/home/HomePage'
import './styles/portal.css'
import './styles/features.css'
import { AuthProvider } from './auth/AuthContext'
import RequireAuth from './auth/RequireAuth'
import LoginPage from './pages/auth/LoginPage'
import AccountPage from './pages/auth/AccountPage'
import ChangePasswordPage from './pages/auth/ChangePasswordPage'
import { Link } from 'react-router-dom'
import PageBanner from './components/PageBanner'

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
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage'))
const SchedulePage = lazy(() => import('./pages/students/SchedulePage'))
const SearchPage = lazy(() => import('./pages/search/SearchPage'))
const HistoryPage = lazy(() => import('./pages/about/HistoryPage'))
const FaqPage = lazy(() => import('./pages/faq/FaqPage'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))
const NotFoundPage = lazy(() => import('./pages/not-found/NotFoundPage'))

// Заголовок и описание раздела: title и description меняются вместе с маршрутом.
const pageKeys = {
  '/': { title: 'common.schoolName', desc: 'meta.home' },
  '/mektep': { title: 'about.title', desc: 'meta.about' },
  '/about/history': { title: 'history.title', desc: 'meta.history' },
  '/about/alykul-osmonov': { title: 'alykul.title', desc: 'meta.alykul' },
  '/jetekchilik': { title: 'leadership.title', desc: 'meta.leadership' },
  '/mugalimder': { title: 'teachers.title', desc: 'meta.teachers' },
  '/kabyl-aluu': { title: 'admissions.title', desc: 'meta.admissions' },
  '/admission': { title: 'admission.title', desc: 'meta.admissions' },
  '/parents': { title: 'parents.title', desc: 'meta.parents' },
  '/students': { title: 'students.title', desc: 'meta.students' },
  '/students/schedule': { title: 'schedule.title', desc: 'meta.schedule' },
  '/dariek': { title: 'location.title', desc: 'meta.location' },
  '/baylanysh': { title: 'contact.title', desc: 'meta.contact' },
  '/news': { title: 'news.title', desc: 'meta.news' },
  '/documents': { title: 'documents.title', desc: 'meta.documents' },
  '/search': { title: 'search.title', desc: 'meta.search' },
  '/faq': { title: 'faq.title', desc: 'meta.faq' },
  '/admin': { title: 'admin.title', desc: 'meta.admin' },
}

function setMeta(attr, name, content) {
  if (!content) return
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function Seo() {
  const { t, lang } = useLanguage()
  const { pathname } = useLocation()

  useEffect(() => {
    const page = pageKeys[pathname]
    const suffix = t('common.schoolName')
    const title = page && pathname !== '/' ? `${t(page.title)} — ${suffix}` : suffix
    document.title = title
    document.documentElement.lang = lang

    const desc = page ? t(page.desc) : t('meta.default')
    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', window.location.href)

    // Canonical с учётом базы GitHub Pages.
    let link = document.head.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = window.location.href.split('#')[0]
  }, [pathname, lang, t])

  return null
}

// Прокрутка: вверх на новой странице, к якорю — если элемент с таким id есть.
// Якорь может быть числовым (/faq#3), а '#3' — недопустимый CSS-селектор,
// поэтому сначала пробуем getElementById, затем querySelector.
// Страницы монтируются с задержкой (Suspense + AnimatePresence), поэтому
// якорь ищем несколько раз подряд, а не один.
function findHashTarget(hash) {
  const id = decodeURIComponent(hash.slice(1))
  if (!id) return null
  const byId = document.getElementById(id)
  if (byId) return byId
  try {
    return document.querySelector(hash)
  } catch {
    return null
  }
}

function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!hash) return
    let timer = 0
    let tries = 0
    const look = () => {
      const target = findHashTarget(hash)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
      if (++tries < 20) timer = setTimeout(look, 60)
    }
    timer = setTimeout(look, 60)
    return () => clearTimeout(timer)
  }, [pathname, hash])

  return null
}

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader-spinner" />
    </div>
  )
}

function TeacherMaterialsPage() {
  return <><PageBanner title="Материалы для учителей" eyebrow="ЗАКРЫТЫЙ РАЗДЕЛ"/><section className="content-section"><div className="page-container"><div className="empty-state"><p>Раздел подключён к закрытому хранилищу Supabase. Материалы появятся после настройки проекта и загрузки администрацией.</p><Link to="/account">Вернуться в кабинет</Link></div></div></section></>
}

export default function PortalApp() {
  return (
    <LanguageProvider>
      <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/+$/, '') || '/'}>
        <ScrollManager />
        <Seo />
        <Routes>
          <Route element={<PortalLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/change-password" element={<RequireAuth><ChangePasswordPage /></RequireAuth>} />
            <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
            <Route path="/teacher-materials" element={<RequireAuth roles={['teacher','admin']}><TeacherMaterialsPage /></RequireAuth>} />
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
                    <Route path="/students" element={<RequireAuth roles={['student','teacher','admin']}><StudentsPage /></RequireAuth>} />
                    <Route path="/students/schedule" element={<RequireAuth roles={['student','teacher','admin']}><SchedulePage /></RequireAuth>} />
                    <Route path="/dariek" element={<LocationPage />} />
                    <Route path="/baylanysh" element={<ContactPage />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/news/:slug" element={<NewsDetailPage />} />
                    <Route path="/events" element={<Navigate to="/news#events" replace />} />
                    <Route path="/documents" element={<DocumentsPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/faq" element={<FaqPage />} />
                    <Route path="/admin" element={<RequireAuth roles={['admin']}><AdminPage /></RequireAuth>} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}
