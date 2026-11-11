import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const sources = [
  ['news', 'SHEET_NEWS_URL', ['slug', 'title', 'date', 'summary', 'body']],
  ['events', 'SHEET_EVENTS_URL', ['title', 'date', 'summary']],
  ['docs', 'SHEET_DOCS_URL', ['title', 'url', 'category']],
]

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"' && quoted && text[i + 1] === '"') { field += '"'; i += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) { row.push(field); field = '' }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(field); field = ''
      if (row.some((cell) => cell.trim())) rows.push(row)
      row = []
    } else field += char
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [headers = [], ...records] = rows
  return {
    headers: headers.map((header) => header.trim()),
    records: records.map((record) => Object.fromEntries(headers.map((header, index) => [header.trim(), (record[index] || '').trim()]))),
  }
}

async function fetchCsv(url, envName, required) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error(`${envName}: HTTP ${response.status}`)
  const { headers, records } = parseCsv(await response.text())
  const fields = new Set(headers)
  const missing = required.filter((key) => !fields.has(key))
  if (missing.length) throw new Error(`${envName}: missing columns: ${missing.join(', ')}`)
  return records
    .filter((record) => required.every((key) => record[key]))
    .map((record) => ({ ...record, published: record.published?.toLowerCase() !== 'false' }))
}

async function fetchSupabaseNews(url, key) {
  const endpoint = new URL('/rest/v1/news', url)
  endpoint.search = new URLSearchParams({
    select: 'slug,title,body,published_at',
    status: 'eq.published',
    published_at: `lte.${new Date().toISOString()}`,
    order: 'published_at.desc',
  })
  const response = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error(`Supabase news request failed: HTTP ${response.status}`)
  const records = await response.json()
  if (!Array.isArray(records)) throw new Error('Supabase news response must be an array')
  return records
    .filter((record) => record.slug && record.title && record.body && record.published_at)
    .map((record) => ({
      slug: record.slug,
      title: record.title,
      date: record.published_at,
      summary: record.body.slice(0, 240),
      body: record.body,
      published: true,
    }))
}

await mkdir(resolve('src/data/generated'), { recursive: true })
for (const [name, envName, required] of sources) {
  let items = []
  const url = process.env[envName]
  const output = resolve(`src/data/generated/${name}.json`)
  if (name === 'news') {
    if (url) {
      items = await fetchCsv(url, envName, required)
    } else if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
      items = await fetchSupabaseNews(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
    } else {
      console.warn(`${envName} and Supabase are not configured; preserving existing news`)
      continue
    }
  } else if (url) {
    try {
      items = await fetchCsv(url, envName, required)
    } catch (error) {
      console.warn(`${envName}: ${error.message}; publishing an empty list`)
    }
  }
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, `${JSON.stringify(items, null, 2)}\n`)
  console.log(`${name}: ${items.length} published row(s)`)
}
