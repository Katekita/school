import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseUrl = 'https://www.okuma.kg'
const outputPath = resolve(root, 'src/data/textbooks.json')
const concurrency = 8
const maxPagesPerCategory = 40
const categoryNames = {
  1: 'Математика, Логика',
  2: 'Физика, Техника',
  3: 'Кыргыз тили жана адабияты',
  4: 'Орус тили жана адабияты',
  5: 'Чет тилдери',
  6: 'Химия, Биология',
  7: 'Педагогика, Психология',
  8: 'Медицина, Анатомия',
  9: 'География, Зоология',
  10: 'Тарых жана коомдук илимдер',
  11: 'Экономика, Финансы',
  12: 'Элдик жана көркөм адабияттар',
  13: 'Илимий макалалар',
  14: 'Информатика',
  15: 'Студенттик бет',
  16: '"Агартуу Ааламы" илимий-усулдук журнал',
}
const categoryNamesRu = {
  1: 'Математика, логика', 2: 'Физика, техника', 3: 'Кыргызский язык и литература',
  4: 'Русский язык и литература', 5: 'Иностранные языки', 6: 'Химия, биология',
  7: 'Педагогика, психология', 8: 'Медицина, анатомия', 9: 'География, зоология',
  10: 'История и общественные науки', 11: 'Экономика, финансы', 12: 'Народная и художественная литература',
  13: 'Научные статьи', 14: 'Информатика', 15: 'Студенческий раздел',
  16: 'Научно-методический журнал «Агартуу Ааламы»',
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function decodeHtml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

function stripTags(value) {
  return normalizeText(decodeHtml(value.replace(/<[^>]*>/g, ' ')))
}

function getSchoolGrades(value) {
  const text = normalizeText(value).toLocaleLowerCase()
  const grades = new Set()
  const markers = /(?:^|\D)(1[01]|[1-9])\s*(?:[-–]\s*(1[01]|[1-9])\s*)?[-–]?\s*(?:класс(?:а|е|ы|ов|ах)?|класста|класстар|klass)(?![\p{L}])/giu
  for (const match of text.matchAll(markers)) {
    const first = Number(match[1])
    const last = Number(match[2] || match[1])
    if (first > last || first < 1 || last > 11) continue
    for (let grade = first; grade <= last; grade += 1) grades.add(grade)
  }
  const reverseMarkers = /(?:класс(?:а|е|ы|ов|ах)?|класста|класстар|klass)\s*[-–:]?\s*(1[01]|[1-9])(?!\d)/giu
  for (const match of text.matchAll(reverseMarkers)) grades.add(Number(match[1]))
  return [...grades].sort((a, b) => a - b)
}

function parseBookLinks(html, categoryId) {
  const books = []
  const expression = /<a\b(?=[^>]*\bid=["']book-hover["'])[^>]*>([\s\S]*?)<\/a>/giu
  for (const match of html.matchAll(expression)) {
    const attributes = match[0].match(/^<a\b([^>]*)>/iu)?.[1] || ''
    const id = attributes.match(/\bhref=["'](?:\.\/)?books\.php\?id=(\d+)/iu)?.[1]
    if (!id) continue
    const title = stripTags(match[1])
    const grades = getSchoolGrades(title)
    if (grades.length) books.push({ id: Number(id), title, grades, categoryId })
  }
  return books
}

function parseReaderUrl(html) {
  const match = html.match(/href=["']((?:\.\/)?read\/web\/viewer\.html\?file=books\/[^"']+\.pdf)["']/iu)
  if (!match) return ''
  const reference = decodeHtml(match[1]).replace(/^\.\//, '')
  const url = new URL(reference, `${baseUrl}/`)
  return url.origin === baseUrl ? url.href : ''
}

async function getPage(url) {
  let currentUrl = new URL(url)
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    if (currentUrl.protocol !== 'https:' || currentUrl.origin !== baseUrl) {
      throw new Error(`Refusing to request non-Okuma URL: ${currentUrl.origin}`)
    }
    const response = await fetch(currentUrl, {
      headers: { 'user-agent': 'School68 textbook catalog sync' },
      redirect: 'manual',
      signal: AbortSignal.timeout(20_000),
    })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location) throw new Error(`Okuma redirect has no location for ${currentUrl}`)
      currentUrl = new URL(location, currentUrl)
      continue
    }
    if (!response.ok) throw new Error(`Okuma returned ${response.status} for ${currentUrl}`)
    if (new URL(response.url).origin !== baseUrl) throw new Error('Okuma redirected outside the approved origin')
    return response.text()
  }
  throw new Error(`Okuma exceeded the redirect limit for ${url}`)
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length)
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await mapper(items[index], index)
    }
  }))
  return results.flat()
}

const categoryPages = await mapLimit(Object.keys(categoryNames).map(Number), concurrency, async (categoryId) => {
  const firstPageUrl = `${baseUrl}/view_books_cat.php?category=${categoryId}`
  const firstHtml = await getPage(firstPageUrl)
  const links = [...firstHtml.matchAll(/href=["']([^"']*view_books_cat\.php\?category=\d+&page=(\d+)[^"']*)["']/giu)]
  const lastPage = Math.max(1, ...links.map((match) => Number(match[2])))
  if (lastPage > maxPagesPerCategory) throw new Error(`Okuma category ${categoryId} exceeded page limit`)

  const pages = [firstHtml]
  for (let page = 2; page <= lastPage; page += 1) {
    pages.push(await getPage(`${baseUrl}/view_books_cat.php?category=${categoryId}&page=${page}`))
  }
  return pages.flatMap((html) => parseBookLinks(html, categoryId))
})

const byId = new Map()
for (const item of categoryPages) {
  const existing = byId.get(item.id)
  if (existing) {
    existing.grades = [...new Set([...existing.grades, ...item.grades])].sort((a, b) => a - b)
    existing.categoryIds.add(item.categoryId)
  } else {
    byId.set(item.id, { ...item, categoryIds: new Set([item.categoryId]) })
  }
}

const candidates = [...byId.values()]
const books = await mapLimit(candidates, concurrency, async (candidate) => {
  const sourcePage = `${baseUrl}/books.php?id=${candidate.id}`
  const html = await getPage(sourcePage)
  const description = decodeHtml(html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/iu)?.[1] || '')
  const title = normalizeText(html.match(/<title>([\s\S]*?)<\/title>/iu)?.[1]?.replace(/\s*-\s*okuma\.kg\s*$/iu, ''))
    || candidate.title
  const author = normalizeText(description.split(/\s+-\s+/u)[0])
  const readerUrl = parseReaderUrl(html)
  if (!readerUrl) return null

  const categoryIds = [...candidate.categoryIds].sort((a, b) => a - b)
  return {
    id: candidate.id,
    title,
    author,
    categoryIds,
    categories: categoryIds.map((id) => categoryNames[id]),
    categoriesRu: categoryIds.map((id) => categoryNamesRu[id]),
    grades: candidate.grades,
    readerUrl,
    sourcePage,
  }
})

const catalog = books
  .filter(Boolean)
  .sort((a, b) => Math.min(...a.grades) - Math.min(...b.grades)
    || a.categories[0].localeCompare(b.categories[0], 'ky')
    || a.title.localeCompare(b.title, 'ky'))

if (!catalog.length) {
  throw new Error('Okuma catalog sync returned no school books; keeping the existing catalog unchanged')
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify({
  source: baseUrl,
  generatedAt: new Date().toISOString(),
  note: 'Metadata and Okuma official viewer links only. Book files are streamed by Okuma and not copied.',
  books: catalog,
}, null, 2)}\n`, 'utf8')

console.log(`Saved ${catalog.length} school textbook records from Okuma.kg`)
