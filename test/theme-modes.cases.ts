import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { installKomariFixture } from '../tests/visual/fixtures/komari'

const DARK = /dark/
const THEME = /主题/
const FIXTURE_LIGHT = /fixture-light/
const FIXTURE_DARK = /fixture-dark/

async function checkMode(page: Page, dark: boolean, auto = false) {
  const html = page.locator('html')
  if (dark)
    await expect(html).toHaveClass(DARK)
  else
    await expect(html).not.toHaveClass(DARK)
  await expect(html).toHaveCSS('color-scheme', dark ? 'dark' : 'light')
  const label = `切换为${dark ? '浅' : '深'}色主题${auto ? '（当前自动）' : ''}`
  const button = page.getByRole('button', { name: label, exact: true })
  await expect(button).toBeVisible()
  await expect(button.locator('svg')).toHaveAttribute('data-icon', dark ? 'icon-park-outline:sun-one' : 'icon-park-outline:moon')
  await expect(page.locator('[data-default-background]')).toHaveCSS('filter', dark ? 'brightness(0.38) saturate(0.82) contrast(1.08)' : 'saturate(1.12) contrast(1.02)')
  return button
}

for (const managed of ['dark', 'light', 'beijing'] as const) {
  test(`target matches four successive clicks and restore: ${managed}`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-13T12:00:00Z') })
    await installKomariFixture(page, { hideEarth: true, managedThemeMode: managed, preserveStorage: true })
    await page.goto('/')
    const managedDark = managed !== 'light'
    let dark = managedDark
    let button = await checkMode(page, dark, true)
    await expect(page.getByRole('button', { name: '恢复自动', exact: true })).toHaveCount(0)
    for (let index = 0; index < 4; index++) {
      await button.click()
      dark = !dark
      button = await checkMode(page, dark)
      await expect.poll(() => page.evaluate(() => localStorage.getItem('themeMode'))).toBe(dark ? 'dark' : 'light')
      await expect(page.getByRole('button', { name: '恢复自动', exact: true })).toBeVisible()
    }
    await page.reload()
    await checkMode(page, dark)
    await page.getByRole('button', { name: '恢复自动', exact: true }).click()
    await checkMode(page, managedDark, true)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('themeMode'))).toBe('auto')
    await page.reload()
    await checkMode(page, managedDark, true)
  })
}

for (const zone of ['Asia/Shanghai', 'America/Los_Angeles']) {
  test.describe(`Beijing boundary independent of browser ${zone}`, () => {
    test.use({ timezoneId: zone })
    for (const [time, dark] of [
      ['2026-10-12T22:59:00Z', true],
      ['2026-10-12T23:00:00Z', false],
      ['2026-10-13T10:59:00Z', false],
      ['2026-10-13T11:00:00Z', true],
      ['2026-10-13T16:00:00Z', true],
    ] as const) {
      test(`${time} resolves to ${dark ? 'dark' : 'light'}`, async ({ page }) => {
        await page.clock.install({ time: new Date(time) })
        await installKomariFixture(page, { hideEarth: true, managedThemeMode: 'beijing', preserveStorage: true })
        await page.goto('/')
        await checkMode(page, dark, true)
      })
    }
  })
}

test('invalid stored mode falls back to automatic and keyboard works on mobile', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => localStorage.setItem('themeMode', 'invalid-mode'))
  await installKomariFixture(page, { hideEarth: true, managedThemeMode: 'light', preserveStorage: true })
  await page.goto('/')
  const toggle = await checkMode(page, false, true)
  await toggle.focus()
  await page.keyboard.press('Enter')
  await checkMode(page, true)
  await page.screenshot({ path: testInfo.outputPath('manual-mobile.png') })
  const restore = page.getByRole('button', { name: '恢复自动', exact: true })
  await restore.focus()
  await page.keyboard.press('Enter')
  await checkMode(page, false, true)
  expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
})

test('actual color alternates even when automatic would resolve dark', async ({ page }) => {
  await installKomariFixture(page, { hideEarth: true, managedThemeMode: 'dark', preserveStorage: true })
  await page.addInitScript(() => localStorage.setItem('themeMode', 'light'))
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).not.toHaveClass(DARK)
  const button = page.getByRole('button', { name: THEME }).first()
  for (const dark of [true, false, true, false]) {
    await button.click()
    if (dark)
      await expect(html).toHaveClass(DARK)
    else
      await expect(html).not.toHaveClass(DARK)
  }
})

test('automatic crosses Beijing day and night boundaries without refresh', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-12T22:59:00Z') })
  await installKomariFixture(page, { hideEarth: true, managedThemeMode: 'beijing', preserveStorage: true })
  await page.goto('/')
  await checkMode(page, true, true)
  await page.clock.runFor(61_000)
  await checkMode(page, false, true)
  await page.clock.setSystemTime(new Date('2026-10-13T11:00:00Z'))
  await page.clock.runFor(61_000)
  await checkMode(page, true, true)
})

for (const dark of [false, true]) {
  test(`default asset decodes and uses mobile position: dark=${dark}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await installKomariFixture(page, { dark, hideEarth: true })
    await page.goto('/')
    const background = page.locator('[data-default-background]')
    await expect(background).toHaveCSS('background-position', '50% 78%')
    const loaded = await page.evaluate(async () => {
      const image = new Image()
      image.src = '/images/default-background-v2.webp'
      await image.decode()
      return image.naturalWidth > 0 && image.naturalHeight > 0
    })
    expect(loaded).toBe(true)
  })
}

test('custom light and dark images retain blur and overlay, failure falls back', async ({ page }) => {
  await installKomariFixture(page, { hideEarth: true, background: {
    backgroundEnabled: true,
    backgroundType: 'image',
    lightBackgroundUrl: '/fixture-light.svg',
    darkBackgroundUrl: '/fixture-dark.svg',
    backgroundBlur: 3,
    backgroundOverlay: 20,
  } })
  await page.route('**/fixture-*.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="blue"/></svg>' }))
  await page.goto('/')
  await expect(page.locator('.background-image')).toHaveCSS('background-image', FIXTURE_LIGHT)
  await expect(page.locator('.background-media')).toHaveCSS('filter', 'blur(3px)')
  await expect(page.locator('.background-overlay')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0.2)')
  await page.getByRole('button', { name: '切换为深色主题（当前自动）', exact: true }).click()
  await expect(page.locator('.background-image')).toHaveCSS('background-image', FIXTURE_DARK)
  await expect(page.locator('[data-default-background]')).toHaveCount(0)
  await page.route('**/fixture-missing.svg', route => route.abort())
  await page.evaluate(() => {
    const root = document.querySelector('#app') as HTMLElement & {
      __vue_app__: { config: { globalProperties: { $pinia: { _s: Map<string, { publicSettings: { theme_settings: Record<string, unknown> } }> } } } }
    }
    root.__vue_app__.config.globalProperties.$pinia._s.get('app')!.publicSettings.theme_settings.lightBackgroundUrl = '/fixture-missing.svg'
  })
  await page.getByRole('button', { name: '切换为浅色主题', exact: true }).click()
  await expect(page.locator('[data-default-background]')).toBeVisible()
  await expect(page.locator('.background-image')).toHaveCount(0)
})

test('video loading and error reveal the mode-matched default background', async ({ page }) => {
  await installKomariFixture(page, { dark: true, hideEarth: true, background: {
    backgroundEnabled: true,
    backgroundType: 'video',
    darkBackgroundUrl: '/fixture-video.webm',
    lightBackgroundUrl: '/fixture-day.webm',
  } })
  // Lifecycle events are deterministic; this tests rendering, not codec decoding.
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, 'src', { set() {}, get() {
      return ''
    } })
  })
  await page.route('**/fixture-*.webm', route => route.fulfill({ status: 200, contentType: 'video/webm', body: '' }))
  await page.goto('/')
  const video = page.locator('video.background-video')
  await expect(video).toBeAttached()
  await expect(page.locator('[data-default-background]')).toBeVisible()
  await expect(page.locator('.background-media')).toHaveCSS('opacity', '0')
  await video.dispatchEvent('canplay')
  await expect(page.locator('[data-default-background]')).toHaveCount(0)
  await expect(page.locator('.background-media')).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: '切换为浅色主题（当前自动）', exact: true }).click()
  await expect(page.locator('[data-default-background]')).toHaveCSS('filter', 'saturate(1.12) contrast(1.02)')
  await video.dispatchEvent('canplay')
  await expect(page.locator('[data-default-background]')).toHaveCount(0)
  await video.dispatchEvent('error')
  await expect(page.locator('[data-default-background]')).toHaveCSS('filter', 'saturate(1.12) contrast(1.02)')
  await expect(page.locator('video')).toHaveCount(0)
})

test('missing default image retains a mode-matched base color', async ({ page }) => {
  await installKomariFixture(page, { hideEarth: true })
  await page.route('**/default-background-v2.webp', route => route.abort())
  await page.goto('/')
  await expect(page.locator('[data-default-background]')).toHaveCSS('background-color', 'rgb(241, 245, 249)')
  await page.getByRole('button', { name: '切换为深色主题（当前自动）', exact: true }).click()
  await expect(page.locator('[data-default-background]')).toHaveCSS('background-color', 'rgb(15, 23, 42)')
})
