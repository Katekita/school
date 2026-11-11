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

await mkdir(resolve('src/data/generated'), { recursive: true })
for (const [name, envName, required] of sources) {
  let items = []
  const url = process.env[envName]
  if (url) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const { headers, records } = parseCsv(await response.text())
      const fields = new Set(headers)
      const missing = required.filter((key) => !fields.has(key))
      if (missing.length) throw new Error(`missing columns: ${missing.join(', ')}`)
      items = records.filter((record) => required.every((key) => record[key])).map((record) => ({ ...record, published: record.published?.toLowerCase() !== 'false' }))
    } catch (error) {
      console.warn(`${envName}: ${error.message}; publishing an empty list`)
    }
  }
  const output = resolve(`src/data/generated/${name}.json`)
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, `${JSON.stringify(items, null, 2)}\n`)
  console.log(`${name}: ${items.length} published row(s)`)
}
