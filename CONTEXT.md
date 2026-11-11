# CONTEXT.md — Школа №68 им. А. Осмонова (информационный портал)

> Этот файл — шпаргалка для новой модели. Прочитайте его первым, чтобы не перечитывать файлы проекта.

---

## 1. Общее

| Параметр | Значение |
|----------|----------|
| Тип | React 19 + Vite 8 SPA-портал школьного портала |
| Репозиторий | `https://github.com/Katekita/school.git` |
| Глобальная база | `base: '/school/'` (только когда `GITHUB_PAGES=true`) |
| Деплой | GitHub Pages via `.github/workflows/deploy.yml` (push → main) |
| Доступ | `https://katekita.github.io/school/` |
| Доступ | `https://katekita.github.io/school/` |
| Локально | `npm run dev` → `http://localhost:5173/` (Vite по умолчанию; в этой сессии сервер поднят на 5188 через `--port 5188 --strictPort`) |

### Цели портала

- Делать расписание, контакты и новости доступными родителям, ученикам и учителям,
  а не быть «статичной брошюрой».
- Работать быстро на любом телефоне, без перезагрузок, без «белых вспышек».
- Быть честным: без фейковых новостей, с пометками `[VERIFY]` на неподтверждённых данных.

---

## 2. Технологии и зависимости

```
React 19.2
React DOM 19.2
React Router 7.18
Vite 8
Leaflet 1.9 + react-leaflet 5
Lucide React 1.49
motion 14 (импорт: motion/react)
```

```json
{
  "devDependencies": {
    "@vitejs/plugin-react": "^6.1.1",
    "oxlint": "^1.81.0"
  }
}
```

### Сборка (`vite.config.js`)

- `manualChunks` разделяет бандл: `vendor-leaflet`, `vendor-motion`, `vendor-router`, `vendor`.
- Leaflet **исключён** из `modulePreload.resolveDependency`, чтобы не занимать очередь загрузки на главной.
- `GITHUB_PAGES='true'` → `base: '/school/'`, иначе `'/'`.

### Деплой (`.github/workflows/deploy.yml`)

- Триггер: push в `main` или `workflow_dispatch`.
- Node 22, `npm ci`, `npm run build`.
- Копирует `dist/index.html → dist/404.html` для SPA-роутинга.
- `touch dist/.nojekyll`.
- Публикует через `actions/upload-pages-artifact@v3`.

---

## 3. Файловая структура

```
src/
├── main.jsx                          # Точка входа, <BrowserRouter>
├── PortalApp.jsx                     # Роутер, SEO, ScrollManager, Suspense
├── components/
│   ├── SiteHeader.jsx                # Шапка: прогресс-бар, скрытие, мобильное меню
│   ├── SiteFooter.jsx                # Подвал
│   ├── PageBanner.jsx                # Баннер страницы (eyebrow, заголовок)
│   ├── Reveal.jsx                    # Обёртка анимации при появлении в viewport
│   ├── CommandPalette.jsx            # Ctrl+K палитра (search, recent, actions)
│   ├── PaletteIcon.jsx               # Иконка ⌘K для хедера
│   ├── ThemeSwitcher.jsx             # Переключатель auto/light/dark
│   ├── LanguageSwitcher.jsx          # Переключатель KY / RU / EN
│   ├── SchoolMap.jsx                 # Leaflet карта + Nominatim-поиск
│   ├── ScheduleActions.jsx           # Кнопки .ics / печать / поделиться
│   ├── LiveScheduleWidget.jsx        # Мини-виджет «следующий урок» (на главной)
│   └── InfoPage.jsx                  # Заглушка для пустых разделов
├── layouts/
│   └── PortalLayout.jsx              # Обёртка: header, footer, scroll-to-top, lazy Palette
├── pages/                            # Все страницы (router path → component)
│   ├── home/
│   │   └── HomePage.jsx              # Hero, статистика, секции
│   ├── about/
│   │   ├── AboutPage.jsx
│   │   ├── HistoryPage.jsx
│   │   └── AlykulPage.jsx
│   ├── faq/
│   │   └── FaqPage.jsx               # Аккордеон FAQ, key={active} для перемонтирования
│   ├── students/
│   │   ├── SchedulePage.jsx          # Расписание, live-индикатор, week-grid
│   │   └── StudentsPage.jsx
│   ├── location/
│   │   └── LocationPage.jsx          # Карта + SchoolMap
│   ├── news/
│   │   ├── NewsPage.jsx
│   │   └── NewsDetailPage.jsx
│   ├── events/
│   │   └── EventsPage.jsx
│   ├── documents/
│   │   └── DocumentsPage.jsx
│   ├── teachers/
│   │   └── TeachersPage.jsx
│   ├── leadership/
│   │   └── LeadershipPage.jsx
│   ├── admissions/
│   │   ├── AdmissionsPage.jsx
│   │   └── AdmissionPage.jsx
│   ├── parents/
│   │   └── ParentsPage.jsx
│   ├── contact/
│   │   └── ContactPage.jsx
│   ├── search/
│   │   └── SearchPage.jsx
│   ├── admin/
│   │   └── AdminPage.jsx             # Пустая страница (ожидание бэкенда)
│   └── not-found/
│       └── NotFoundPage.jsx
├── data/
│   ├── school.js                     # schoolData (адрес, телефон, контакты)
│   ├── schedule.js                   # Расписание 10-х классов, lessonTimes, breaks
│   ├── stats.js                      # scheduleStats() — честные цифры из schedule
│   └── mockData.js                   # newsItems=[], events=[], documents=[]
├── hooks/
│   ├── useNow.js                     # Тик 20-30 с для live-статуса
│   ├── useReveal.js                  # IntersectionObserver для Reveal
│   └── useSpotlight.js               # Spotlight-эффект на карточках (--mouse-x/y)
├── i18n/
│   ├── LanguageContext.jsx           # Provider, t(key), get(key)
│   └── translations.js               # ky / ru / en — все ключи синхронны (325 каждый)
├── styles/
│   ├── portal.css                    # Компонентные стили, адаптив, print
│   └── features.css                  # Стили отдельных секций
├── utils/
│   ├── theme.js                      # readTheme(), applyTheme(), cycleTheme()
│   ├── classStorage.js               # localStorage school68_schedule_class
│   ├── ics.js                        # buildIcs() → download .ics (RFC 5545)
│   ├── scheduleLive.js               # getLiveStatus(), getNextLesson(), weekdayId()
│   └── searchIndex.js                # Командная палитра: поиск по разделам/FAQ/предметам
```

### Откуда страницы берут контент

Два разных источника — не путайте:

- **Из `src/data/mockData.js`** (массивы, сейчас пустые намеренно):
  `newsItems` → `NewsPage`, `events` → `EventsPage`, `documents` → `DocumentsPage`,
  `schedule` (не используется, расписание живёт в `schedule.js`).
- **Из `translations.js`** (текст живёт в словаре, доступ через `get('...')`):
  `faq.items` (5 вопросов), `teachers.cards` (3 заглушки-описания),
  `leadership.items` + `leadership.profiles` (роли без ФИО), `admission.steps`.
- **Из `src/data/schedule.js`**: расписание 10-х классов (единственный источник для
  расписания, статистики, live-статуса и .ics).
```

---

## 4. Маршруты (router)

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/` | `HomePage` | Главная: hero, статистика, секции |
| `/mektep` | `AboutPage` | О школе |
| `/about/history` | `HistoryPage` | История |
| `/about/alykul-osmonov` | `AlykulPage` | Алыкул Осмонов |
| `/jetekchilik` | `LeadershipPage` | Руководство |
| `/mugalimder` | `TeachersPage` | Учителя |
| `/kabyl-aluu` | `AdmissionsPage` | Поступление |
| `/admission` | `AdmissionPage` | (дубль-перенаправление) |
| `/parents` | `ParentsPage` | Родителям |
| `/students` | `StudentsPage` | Ученикам |
| `/students/schedule` | `SchedulePage` | Расписание |
| `/dariek` | `LocationPage` | Карта + адрес |
| `/baylanysh` | `ContactPage` | Контакты |
| `/news` | `NewsPage` | Новости (пусто) |
| `/news/:slug` | `NewsDetailPage` | Детальная новость |
| `/events` | `EventsPage` | События (пусто) |
| `/documents` | `DocumentsPage` | Документы (пусто) |
| `/search` | `SearchPage` | Поиск |
| `/faq` | `FaqPage` | FAQ (аккордеон, `key={active}` для якоря) |
| `/admin` | `AdminPage` | Админ-заглушка |
| `/*` | `NotFoundPage` | 404 |

### SEO metadata (`PortalApp.jsx`)

`pageKeys` маппит pathname → `{ title, desc }`. SEO-компонент подставляет:
- `<title>`, `<meta name="description">`
- OG: `og:title`, `og:description`, `og:type`, `og:image`
- Canonical URL
- `theme-color` media meta

---

## 5. Ключи хранилища (localStorage)

| Ключ | Используется в | Описание |
|------|----------------|----------|
| `school68_theme` | `theme.js` | `'auto'` / `'light'` / `'dark'` |
| `school68_language` | `LanguageContext.jsx` | `'ky'` / `'ru'` / `'en'` |
| `school68_schedule_class` | `classStorage.js` | Выбранный класс (например `'10А'`) |
| `school68_recent` | `CommandPalette.jsx` | Последние 14 действий в палитре |

### Тема (theme.js)

- `readTheme()` → значение из localStorage или `'auto'`
- `applyTheme(value)` → ставит `data-theme` на `<html>`, хранит в localStorage,
  dispatches `school68:theme` event
- `cycleTheme()` → auto → light → dark → auto
- Инлайн-скрипт в `index.html` применяет тему **до рендера React** (no flash)

### Тема (CSS)

- Семантические токены в `:root` и `:root[data-theme='dark']`:
  `--surface`, `--surface-2`, `--surface-inset`, `--bg`, `--line`,
  `--header-bg`, `--chip-bg`, `--shadow-color`, `--gold-*`,
  `--accent-text`, `--accent-deep`, `--ink`, `--body`, `--muted`,
  `--blue-50…900`, `--blue-100`
- **Никогда не пишите literal-цвета в компонентах** — только токены.
- dark-override селекторы (без nesting) в конце `portal.css`:
  `:root[data-theme='dark'] .page-banner`,
  `:root[data-theme='dark'] .utility-bar`,
  `:root[data-theme='dark'] .hero-seal`,
  `:root[data-theme='dark'] .leaflet-tile`,
  `:root[data-theme='dark'] .leaflet-container`

### Языки (translations.js)

- 3 словаря: `ky`, `ru`, `en` — **строго синхронны**, 325 ключей каждый.
- Проверка: `node -e "import('./src/i18n/translations.js')..."`
- `t(key)` возвращает строку; `get(key)` возвращает объект/массив.
- Фолбэк при отсутствии ключа — имя ключа (видно как `open` в UI).

---

## 6. Расписание (schedule.js)

### Структура

- `scheduleYear = '2026–2027'`
- `scheduleClasses = ['10А','10Б','10В','10Г','10Д','10Е']`
- `weekDays` — Пн–Пт
- `lessonTimes` — 6 уроков, 45 мин каждый
- `breaks` — после 1,2,4,5 — 5 мин; после 3 — 10 мин
- `subjectNames` — ключ → { ky, ru, en }
- `schedule10[classKey][day.id]` — массив уроков `{ subject, room }`
- `room`: номер кабинета или `'с/з'` (спортивный зал); `'51/22'` — подгруппы

### Live-статус (scheduleLive.js)

```js
getLiveStatus(classKey, date)  // { kind: 'lesson'|'break'|'before'|'done'|'weekend'|'empty', ... }
getNextLesson(classKey, date)
weekdayId(date)  // 'mon'|'tue'|...
```

### Текущая неделя (scheduleLive.js)

```js
currentWeekStart(date)  // Monday of current school week
```

### Статистика (stats.js)

`scheduleStats()` — считает из расписания:
- `classes`, `lessons`, `subjects`, `rooms` (уникальные кабинеты)
- `lessonMinutes`, `bellRange`

### Экспорт .ics (ics.js)

```js
buildIcs(schedule, year, title)  // RFC 5545 VCALENDAR
downloadIcs(schedule, year, title, classKey)  // blob URL → download
```

---

## 7. Командная палитра (CommandPalette.jsx)

- Открывается по `Ctrl+K` / `⌘K`
- Lazy-импорт: `React.lazy(() => import('./CommandPalette'))` в `PortalLayout.jsx`
- Поиск: нечёткий скоринг по `title`, `subtitle`, `keywords`
- Группы: sections, faq, subjects, actions, recent
- Действия:
  - Копировать ссылку
  - Печать страницы
  - Смена темы (auto → light → dark)
  - Скачивание .ics
  - Смена языка

### Навигация к FAQ-вопросам

Ссылки вида `/faq#faq-N` (id элемента `faq-N`).
`ScrollManager` ждёт монтирование страницы (до 20 попыток × 60мс).

---

## 8. Анимации

### Библиотека

`motion/react` (не `framer-motion`!):

```js
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
```

### Паттерны

| Компонент | Что анимирует |
|-----------|---------------|
| `PortalLayout.jsx` | Переходы страниц (`AnimatePresence mode="wait"`, `key={pathname}`) |
| `Reveal.jsx` | Появление элементов при скролле (`whileInView`, `once: true`) |
| `useSpotlight.js` | Spotlight-эффект на карточках (`--mouse-x`, `--mouse-y`) |
| `HomePage.jsx` | Параллакс hero, счётчики |

### Правила

- Всегда проверяйте `useReducedMotion()` — при `true` отключайте.
- Длительности 0.2–0.7 с, easing `[0.22, 1, 0.36, 1]`.
- `once: true` для appear-анимаций.
- Только `transform` и `opacity` (без layout-движений).

---

## 9. Адаптивность (breakpoints)

```
1150px → 1050px → 900px → 820px → 680px → 600px → 360px
```

### Требования к мобильной версии

- Нет горизонтального скролла
- Таблица расписания перестраивается в колонку
- Бренд в шапке не наезжает на кнопки (≤600px: показывается `schoolNameShort`)
- Кнопки ≥ 36×36px
- Заголовок подзаголовка в шапке обрезается многоточием

---

## 10. Доступность

- Skip-link: `#main-content` (`common.skipToContent`)
- Кнопка «наверх» в `PortalLayout.jsx`
- Мобильное меню: `aria-expanded`, `aria-controls`, блокировка `body.overflow`, Esc
- FAQ: `key={active}` для перемонтирования аккордеона (якорь работает)
- Контраст ≥ 4.5:1

---

## 11. Изображения

| Ресурс | Расположение | Примечание |
|--------|-------------|------------|
| Hero-фон | Unsplash (URL в `HomePage.jsx:85`) | Фейковое фото здания |
| school-photo.jpg | `public/` | Фото стройплощадки, не используется |
| hero.png | `src/assets/` | Декоративный куб, не используется |
| favicon.svg | `public/` | Иконка сайта |
| icons.svg | `public/` | Sprite иконок |

---

## 12. Данные (что заполнено, что пусто)

| Раздел | Файл | Состояние |
|--------|------|-----------|
| Контакты | `src/data/school.js` | Заполнено (адрес/телефон из Яндекс Карт — [VERIFY]) |
| Расписание | `src/data/schedule.js` | Заполнено (10-е классы, 2026–2027) |
| Новости | `src/data/mockData.js` | Пусто `[]` |
| События | `src/data/mockData.js` | Пусто `[]` |
| Документы | `src/data/mockData.js` | Пусто `[]` |
| Учителя | `translations.js` → `teachers.cards` | 3 **заглушки-описания** (не реальные люди) |
| FAQ | `translations.js` → `faq.items` | Заполнено (5 вопросов на 3 языка) |
| Руководство | `translations.js` → `leadership.*` | 3 роли без ФИО (`profiles`), 3 пункта (`items`) |

### schoolData

```js
{
  schoolName: '№68 А. Осмонов атындагы жалпы билим берүү мектеби',
  shortName: '№68',
  city: 'Бишкек',
  address: 'ул. Токтогула, 220',
  phone: '+996 (312) 45-46-15',
  addressSource: 'Яндекс Карты',
  addressSourceUrl: 'https://yandex.com/maps/org/gimnaziya_68_imeni_a_osmonova/24681621618/',
  contactNote: 'Адрес и телефон указаны в стороннем справочнике и требуют подтверждения школой.',
  socialLinks: [{ name: 'Instagram', handle: '@68.school_', url: 'https://www.instagram.com/68.school_/' }],
  verified: false
}
```

---

## 13. CSS-токены (справочник)

### Светлая тема

| Токен | Значение |
|-------|----------|
| `--ink` | `#0b2545` |
| `--body` | `#334155` |
| `--muted` | `#4b5563` |
| `--paper` | `#ffffff` |
| `--surface` | `#ffffff` |
| `--surface-2` | `#f5f8fc` |
| `--surface-inset` | `#f7fafd` |
| `--bg` | `#f5f8fc` |
| `--line` | `#e3eaf3` |
| `--header-bg` | `rgba(255,255,255,0.72)` |
| `--chip-bg` | `rgba(255,255,255,0.6)` |
| `--shadow-color` | `11 37 69` |
| `--accent-text` | `var(--blue-700)` |
| `--accent-deep` | `var(--blue-900)` |
| `--blue-900` | `#0b2545` … `--blue-50` `#eff6ff` |
| `--gold-soft` | `#fff7d6` |
| `--gold-line` | `#ffe58a` |
| `--gold-text` | `#7a5b00` |
| `--gold-head-top` | `#ffe27a` |
| `--gold-head-bottom` | `#ffd43b` |
| `--gold-head-ink` | `#3d3200` |
| `--gold-bell` | `#fff3bf` |
| `--gold-bell-ink` | `#6b5300` |

### Тёмная тема (`:root[data-theme='dark']`)

| Токен | Значение |
|-------|----------|
| `--ink` | `#eaf2fb` |
| `--body` | `#c3d3e6` |
| `--muted` | `#9fb4cc` |
| `--paper` | `#0b1626` |
| `--surface` | `#101d31` |
| `--surface-2` | `#0b1626` |
| `--surface-inset` | `#16263d` |
| `--bg` | `#070d18` |
| `--line` | `#1e354f` |
| `--header-bg` | `rgba(11,22,38,0.78)` |
| `--chip-bg` | `rgba(255,255,255,0.06)` |
| `--shadow-color` | `0 0 0` |
| `--blue-700` | `#1b6ac4` |
| `--blue-600` | `#2172c8` |
| `--blue-500` | `#3f8fdd` |
| `--blue-400` | `#6cb4f2` |
| `--blue-300` | `#a8d1f5` |
| `--gold-text` | `#f0d37a` |
| `--gold-head-ink` | `#f5dd94` |
| `--gold-bell-ink` | `#f0d37a` |

---

## 14. Важные баги и исправления

### FAQ-якоря крашат страницу
**Было:** `document.querySelector('#3')` — невалидный CSS-селектор.
**Стало:** Якоря в палитре `/faq#faq-N` (совпадают с `id="faq-N"`). `ScrollManager` ждёт монтирование страницы (до 20 попыток × 60мс).

### Перевод карты «застывал» на старом языке
**Было:** `useState(t('map.defaultMsg'))` — текст брался один раз при монтировании.
**Стало:** `result` хранит только статус поиска, текст берётся из `t()` при каждом рендере.

### Кнопка палитры называлась «open»
**Было:** Ключ `palette.open` отсутствовал в словарях → `t()` возвращал имя ключа.
**Стало:** Добавлен `open` во все 3 языка.

### Действие «сменить тему» показывало `dark`
**Было:** `readTheme()` возвращал техническое значение.
**Стало:** `${t(`theme.${readTheme()}`)}` — переводится.

### CSS `n-content: center` (обрезан)
**Было:** heredoc-запись повредила `justify-content: center` в `@media 600px .palette-trigger`.
**Стало:** исправлено.

---

## 15. Локальные ассистент-файлы (.koda/)

Каталог `.koda/` в `.gitignore`. Содержит навыки:

- `bug-hunter` — аудит сайта (школы №68)
- `content-manager` — ввод данных школы (новости, события, документы, учителя)
- `ux-designer` — дизайн-система, токены, анимации, доступность

Эти файлы **не попадают** в репозиторий.

---

## 16. Как запустить

```bash
npm install
npm run dev          # http://localhost:5173/  (или другой порт через --port)
npm run build        # проверка сборки
npm run lint         # npx oxlint
```

### Команды для проверки

```bash
# Синхронность ключей перевода
node -e "import('./src/i18n/translations.js').then(m=>{const langs=['ky','ru','en'];const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'&&v!==null&&!Array.isArray(v)?flat(v,p+k+'.'):[p+k]);const sets={};for(const l of langs)sets[l]=new Set(flat(m.translations[l]));for(const a of langs)for(const b of langs){if(a===b)continue;const miss=[...sets[a]].filter(k=>!sets[b].has(k));if(miss.length)console.log(a,'->',b,':',miss.join(', '))}console.log('keys:',langs.map(l=>l+'='+sets[l].size).join(' '))})"

# Проверить консоль браузера: открыть /faq#3, /dariek, /students/schedule
```

---

## 17. Что не сделано

- [ ] Реальные данные школы (пользователь присылает по ходу)
- [ ] Фото школы для hero (сейчас Unsplash заглушка)
- [ ] `public/school-photo.jpg` — фото стройплощадки, не используется
- [ ] Бэкенд / CMS (страница `/admin` — заглушка)
- [ ] Email / форма обратной связи (страница `/baylanysh` — заглушка)

---

## 18. Стиль коммитов

```
Имя (одна строка)

Подробное описание.

- Пункт 1
- Пункт 2
```

Пример: `Add dark theme, command palette and live schedule tools`.

## 19. Проверки Codex (11 ноября 2026)

- Baseline после `npm ci`: lint завершился успешно с двумя предупреждениями Oxlint (AuthContext и AdminPage), build прошёл.
- Проверка переводов baseline: ky=361, ru=361, en=361; расхождений нет.
- `npm ci` сообщил о двух уязвимостях высокого уровня; зависимости автоматически не обновлялись.
- Добавлены `npm run check:i18n`, `npm run check:schedule` и общий `npm run check`.
- `schedule.js` в этой рабочей копии не содержит опубликованных классов или назначений; валидатор сообщает об этом как о намеренно пустом состоянии.
- Контентные CSV-источники: `SHEET_NEWS_URL`, `SHEET_EVENTS_URL`, `SHEET_DOCS_URL`; схема описана в `docs/content-sheet.md`.
- Билд предварительно обновляет `src/data/generated/*.json`; расписание GitHub Actions повторяет публикацию ежечасно.

---

*Последнее обновление: 9 ноября 2026*
