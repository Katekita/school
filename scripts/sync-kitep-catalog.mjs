import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseUrl = 'https://kitep.edu.kg'
const outputPath = resolve(root, 'src/data/textbooks.json')
const languages = ['kg', 'ru']
const concurrency = 6
const maxPagesPerCatalog = 50

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
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

function pageProps(html) {
  const match = html.match(/data-page="([^"]+)"/)
  if (!match) throw new Error('Kitep page has no Inertia data payload')
  return JSON.parse(decodeHtml(match[1])).props
}

async function getPage(url) {
  let currentUrl = new URL(url)
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    if (currentUrl.protocol !== 'https:' || currentUrl.origin !== baseUrl) {
      throw new Error(`Refusing to request non-Kitep URL: ${currentUrl.origin}`)
    }
    const response = await fetch(currentUrl, {
      headers: { 'user-agent': 'School68 textbook catalog sync' },
      redirect: 'manual',
      signal: AbortSignal.timeout(20_000),
    })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location) throw new Error(`Kitep redirect has no location for ${currentUrl}`)
      currentUrl = new URL(location, currentUrl)
      continue
    }
    if (!response.ok) throw new Error(`Kitep returned ${response.status} for ${currentUrl}`)
    if (new URL(response.url).origin !== baseUrl) throw new Error(`Kitep redirected outside the approved origin`)
    return response.text()
  }
  throw new Error(`Kitep exceeded the redirect limit for ${url}`)
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

const grades = await mapLimit(Array.from({ length: 11 }, (_, index) => index + 1), concurrency, async (gradeNumber) => {
  const props = pageProps(await getPage(`${baseUrl}/grade/${gradeNumber}`))
  return props.catalogs.map((catalog) => ({
    grade: gradeNumber,
    catalogId: catalog.id,
    subject: catalog.name,
    subjectKg: catalog.name_kg,
  }))
})

const pairs = grades.flatMap((catalog) => languages.map((language) => ({ ...catalog, language })))
const catalogBooks = await mapLimit(pairs, concurrency, async (catalog) => {
  let url = `${baseUrl}/catalog/${catalog.catalogId}/${catalog.language}`
  const records = []
  const visited = new Set()

  while (url) {
    if (visited.has(url)) throw new Error(`Kitep pagination loop detected at ${url}`)
    if (visited.size >= maxPagesPerCatalog) throw new Error(`Kitep catalog exceeded ${maxPagesPerCatalog} pages`)
    visited.add(url)
    const props = pageProps(await getPage(url))
    for (const book of props.books.data) {
      records.push({
        id: book.id,
        catalogId: catalog.catalogId,
        grade: catalog.grade,
        subject: normalizeText(catalog.subject),
        subjectKg: normalizeText(catalog.subjectKg),
        language: book.language,
        title: normalizeText(book.title),
        titleKg: normalizeText(book.title_kg),
        author: normalizeText(book.author),
        year: book.year || null,
        publisher: normalizeText(book.publisher),
        fileSize: normalizeText(book.file_size_human),
        readUrl: book.url,
      })
    }
    url = props.books.next_page_url || ''
  }

  return records
})

const books = catalogBooks
  .filter((book) => book.readUrl?.startsWith(`${baseUrl}/book/`))
  .sort((a, b) => a.grade - b.grade
    || a.subject.localeCompare(b.subject, 'ru')
    || a.language.localeCompare(b.language)
    || (b.year || 0) - (a.year || 0)
    || a.title.localeCompare(b.title, 'ru'))

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify({
  source: baseUrl,
  generatedAt: new Date().toISOString(),
  note: 'Metadata and official reading links only. Book files remain on the publisher platform.',
  books,
}, null, 2)}\n`, 'utf8')

console.log(`Saved ${books.length} book records from ${grades.length} subject catalogs to ${outputPath}`)
