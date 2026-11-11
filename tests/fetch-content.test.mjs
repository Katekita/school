import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const scriptPath = join(projectRoot, 'scripts', 'fetch-content.mjs')

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), 'school-news-'))
  await mkdir(join(root, 'scripts'), { recursive: true })
  await mkdir(join(root, 'src', 'data', 'generated'), { recursive: true })
  await copyFile(scriptPath, join(root, 'scripts', 'fetch-content.mjs'))
  const newsPath = join(root, 'src', 'data', 'generated', 'news.json')
  await writeFile(newsPath, '[{"slug":"existing"}]\n')
  return { root, newsPath }
}

function runFetcher(root, overrides = {}) {
  const env = { ...process.env, ...overrides }
  delete env.SHEET_NEWS_URL
  delete env.SHEET_EVENTS_URL
  delete env.SHEET_DOCS_URL
  delete env.VITE_SUPABASE_URL
  delete env.VITE_SUPABASE_ANON_KEY
  Object.assign(env, overrides)
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, 'scripts', 'fetch-content.mjs')], { cwd: root, env })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk })
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk })
    child.on('error', reject)
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

async function startServer(handler) {
  const server = createServer(handler)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  return { server, url: `http://127.0.0.1:${server.address().port}` }
}

test('build fetches only published Supabase news and maps it for the site', async () => {
  const { root, newsPath } = await createFixture()
  let request
  const { server, url } = await startServer((req, res) => {
    request = req
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify([{
      slug: 'school-event',
      title: 'School event',
      body: 'A real published event.',
      published_at: '2026-11-11T08:00:00Z',
    }]))
  })
  try {
    const result = await runFetcher(root, {
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_ANON_KEY: 'test-public-key',
    })
    assert.equal(result.code, 0, result.stderr)
    assert.equal(request.url.startsWith('/rest/v1/news?'), true)
    assert.equal(request.headers.apikey, 'test-public-key')
    assert.equal(request.headers.authorization, 'Bearer test-public-key')
    const params = new URL(request.url, url).searchParams
    assert.equal(params.get('status'), 'eq.published')
    assert.match(params.get('published_at'), /^lte\./)
    assert.deepEqual(JSON.parse(await readFile(newsPath, 'utf8')), [{
      slug: 'school-event',
      title: 'School event',
      date: '2026-11-11T08:00:00Z',
      summary: 'A real published event.',
      body: 'A real published event.',
      published: true,
    }])
  } finally {
    server.close()
    await once(server, 'close')
    await rm(root, { recursive: true, force: true })
  }
})

test('build preserves the existing news when no source is configured', async () => {
  const { root, newsPath } = await createFixture()
  try {
    const result = await runFetcher(root)
    assert.equal(result.code, 0, result.stderr)
    assert.match(result.stderr, /preserving existing news/)
    assert.equal(await readFile(newsPath, 'utf8'), '[{"slug":"existing"}]\n')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('build fails and preserves news when the configured source is unavailable', async () => {
  const { root, newsPath } = await createFixture()
  const { server, url } = await startServer((_req, res) => {
    res.writeHead(503)
    res.end()
  })
  try {
    const result = await runFetcher(root, {
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_ANON_KEY: 'test-public-key',
    })
    assert.notEqual(result.code, 0)
    assert.equal(await readFile(newsPath, 'utf8'), '[{"slug":"existing"}]\n')
  } finally {
    server.close()
    await once(server, 'close')
    await rm(root, { recursive: true, force: true })
  }
})
