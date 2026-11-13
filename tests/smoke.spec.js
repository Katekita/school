import { test, expect } from '@playwright/test'

const languages = ['ky', 'ru', 'en']
const themes = ['light', 'dark']
const widths = [375, 1280]

async function stageBox(page) {
  const stage = page.locator('.news-viewer-stage')
  await expect(stage).toBeVisible()
  let box
  await expect.poll(async () => {
    box = await stage.boundingBox()
    return Boolean(box)
  }).toBe(true)
  return box
}

test('news strip and viewer render at requested widths, themes, and languages', async ({ browser }) => {
  for (const language of languages) {
    for (const theme of themes) {
      for (const width of widths) {
        const page = await browser.newPage({ viewport: { width, height: 900 } })
        const errors = []
        const externalRequests = []
        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
        page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1:5190/')) externalRequests.push(request.url()) })
        await page.addInitScript(({ language, theme }) => {
          localStorage.setItem('school68_language', language)
          localStorage.setItem('school68_theme', theme)
          localStorage.setItem('school68_news_seen', '{}')
        }, { language, theme })
        await page.goto('/?demo=1')
        await expect(page.locator('html')).toHaveAttribute('lang', language)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await expect(page.getByRole('link', { name: /Демонстрационная новость 1/ })).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        await page.screenshot({ path: `test-results/news-qa/${language}-${theme}-${width}-home.png`, animations: 'disabled' })
        await page.getByRole('link', { name: /Демонстрационная новость 1/ }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        await page.screenshot({ path: `test-results/news-qa/${language}-${theme}-${width}-viewer.png`, animations: 'disabled' })
        await page.goto('/news?demo=1')
        await expect(page.locator('html')).toHaveAttribute('lang', language)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await expect(page.locator('.news-feed')).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        expect(errors, `${language}/${theme}/${width} console errors`).toEqual([])
        expect(externalRequests, `${language}/${theme}/${width} external requests`).toEqual([])
        await page.close()
      }
    }
  }
})

test('news feed groups stories by day and opens them in the viewer', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('school68_language', 'ru'))
  await page.goto('/news?demo=1')

  const feed = page.locator('.news-feed')
  await expect(feed.locator('.news-feed-day')).toHaveCount(3)
  const secondStory = feed.getByRole('link', { name: /Демонстрационная новость 2/ })
  await expect(secondStory).toBeVisible()

  for (const width of [320, 375, 768, 1280, 1536]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  }

  await secondStory.click()
  await expect(page.getByRole('dialog', { name: /Демонстрационная новость 2/ })).toBeVisible()
})

test('news page shows today strip and grouped feed', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-11T09:00:00+05:00') })
  await page.addInitScript(() => localStorage.setItem('school68_language', 'ru'))
  await page.goto('/news?demo=1')

  const strip = page.locator('.today-strip')
  await expect(strip.getByRole('link', { name: /Демонстрационная новость 1/ })).toBeVisible()
  await expect(page.locator('.news-feed')).toBeVisible()
  await strip.getByRole('link', { name: /Демонстрационная новость 1/ }).click()
  await expect(page.getByRole('dialog', { name: /Демонстрационная новость 1/ })).toBeVisible()
  await expect(page).toHaveURL(/\/news\/demo-test-one\?demo=1$/)
})

test('today strip snaps and responds to keyboard; feed filters stay in the URL', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
  await page.clock.install({ time: new Date('2026-11-11T09:00:00+05:00') })
  await page.addInitScript(() => localStorage.setItem('school68_language', 'ru'))
  await page.goto('/news?demo=1')

  const strip = page.locator('.today-strip')
  await expect(strip.locator('.today-card')).toHaveCount(1)
  await strip.evaluate((element) => {
    const card = element.firstElementChild
    element.append(card.cloneNode(true), card.cloneNode(true))
  })
  await strip.focus()
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => strip.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
  await expect(strip).toHaveCSS('scroll-snap-type', 'x mandatory')

  const category = page.locator('.news-feed-chips button').filter({ hasText: 'ТЕСТ' })
  await category.click()
  await expect(page).toHaveURL((url) => url.searchParams.get('category') === 'ТЕСТ' && url.searchParams.get('demo') === '1')
  await page.locator('.news-feed-chips button').first().click()
  await expect(page).toHaveURL((url) => !url.searchParams.has('category') && url.searchParams.get('demo') === '1')

  const search = page.locator('.news-feed-search input')
  await search.fill('перелистывания')
  await expect(page).toHaveURL((url) => url.searchParams.get('q') === 'перелистывания' && url.searchParams.get('demo') === '1')
  await expect(page.locator('.news-feed .news-archive-card')).toHaveCount(1)
  await page.close()
})

test('empty news states appear on home and archive without a demo query', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('school68_language', 'ru'))

  for (const route of ['/', '/news']) {
    await page.goto(route)
    const emptyState = page.locator('.news-empty-card')
    await expect(emptyState).toBeVisible()
    await expect(emptyState).toContainText('Новости появятся здесь')
    expect(new URL(page.url()).searchParams.has('demo')).toBe(false)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280)
  }
})

test('touch swipes change stories and close the viewer; keyboard changes slides', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
  await page.addInitScript(() => {
    localStorage.setItem('school68_language', 'ru')
    localStorage.setItem('school68_theme', 'light')
    localStorage.setItem('school68_news_seen', '{}')
  })
  await page.goto('/?demo=1')
  await page.getByRole('link', { name: /Демонстрационная новость 1/ }).tap()
  await expect(page.getByRole('dialog', { name: /Демонстрационная новость 1/ })).toBeVisible()
  const dialog = page.getByRole('dialog')
  await page.getByRole('button', { name: 'Перейти к слайду 2' }).click()
  await expect(dialog.locator('[aria-live="polite"]')).toContainText('слайд 2')
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await expect(page.locator('.page-loader')).toHaveCount(0)
  await page.getByRole('button', { name: 'Помощь' }).focus()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('dialog').locator('[aria-live="polite"]')).toContainText('слайд 1')
  await expect(page.getByRole('button', { name: 'Предыдущая новость' })).toBeDisabled()
  await page.getByRole('button', { name: 'Следующая новость' }).click()
  await expect(page).toHaveURL(/demo-test-two/)
  await page.getByRole('button', { name: 'Предыдущая новость' }).click()
  await expect(page).toHaveURL(/demo-test-one/)
  const cdp = await page.context().newCDPSession(page)
  const touchSwipe = async (from, to) => {
    const stage = await stageBox(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: stage.x + from.x, y: stage.y + from.y }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: stage.x + to.x, y: stage.y + to.y }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  const firstStage = await stageBox(page)
  await touchSwipe({ x: firstStage.width - 50, y: firstStage.height / 2 }, { x: 50, y: firstStage.height / 2 })
  await expect(page).toHaveURL(/demo-test-two/)
  await expect(page.getByRole('dialog', { name: /Демонстрационная новость 2/ })).toBeVisible()
  await expect(page.locator('.news-viewer-stage')).toBeVisible()
  await touchSwipe({ x: 120, y: 80 }, { x: 120, y: 200 })
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page).toHaveURL(/\/?demo=1$/)
  await cdp.detach()
  await page.close()
})

test('news viewer fits compact phones, tablets, and wide desktops', async ({ browser }) => {
  for (const width of [320, 375, 768, 1024, 1280, 1536]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.addInitScript(() => {
      localStorage.setItem('school68_language', 'ru')
      localStorage.setItem('school68_theme', 'dark')
      localStorage.setItem('school68_news_seen', '{}')
    })
    await page.goto('/?demo=1')
    await page.getByRole('link', { name: /Демонстрационная новость 1/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await page.screenshot({ path: `test-results/news-qa/responsive-${width}.png`, animations: 'disabled' })
    await page.close()
  }
})

test('viewer has a visible back action, restores scroll, and closes from the backdrop', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('school68_language', 'ru')
    localStorage.setItem('school68_theme', 'light')
    localStorage.setItem('school68_news_seen', '{}')
  })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/?demo=1')
  const card = page.getByRole('link', { name: /Демонстрационная новость 1/ })
  await card.scrollIntoViewIfNeeded()
  const returnScrollY = await page.evaluate(() => window.scrollY)
  await card.click()
  await expect(page.getByRole('dialog', { name: /Демонстрационная новость 1/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Закрыть просмотр' })).toContainText('Назад')
  await page.getByRole('button', { name: 'Закрыть просмотр' }).click()
  await expect(page).toHaveURL(/\/?demo=1$/)
  await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - returnScrollY)).toBeLessThan(3)

  await page.getByRole('link', { name: /Демонстрационная новость 1/ }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.mouse.click(5, 5)
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page).toHaveURL(/\/?demo=1$/)
})

test('a direct news URL remains a regular article page', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('school68_language', 'ru'))
  await page.goto('/news/demo-test-two?demo=1')
  await expect(page.getByRole('heading', { name: /Демонстрационная новость 2/ })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Поделиться' })).toBeVisible()
  await expect(page.locator('.news-detail-meta')).toContainText('Время чтения')
  await expect(page.locator('.news-detail-meta')).not.toContainText('Администрация школы')
  await expect(page.locator('.news-related a')).toHaveCount(2)
  await expect(page.locator('.news-related a').first()).toHaveAttribute('href', '/news/demo-test-one?demo=1')
})
