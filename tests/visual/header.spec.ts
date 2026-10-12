import { expect, test } from '@playwright/test'
import { installKomariFixture } from './fixtures/komari'

for (const scenario of [
  { name: 'desktop', width: 1440, height: 900, inset: 0, standalone: false },
  { name: 'mobile browser', width: 390, height: 844, inset: 0, standalone: false },
  { name: 'iPhone standalone safe-area simulation', width: 390, height: 844, inset: 47, standalone: true },
]) {
  test(`header remains clear in ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height })
    await page.addInitScript(({ standalone }) => {
      Object.defineProperty(navigator, 'standalone', { value: standalone })
    }, scenario)
    await installKomariFixture(page, { hideEarth: true })
    await page.goto('/')
    const header = page.locator('.site-header')
    await expect(header).toBeVisible()
    // Chromium cannot provide an iOS status bar. Inject only the environmental
    // inset via the CSS variable; exercise the real sticky header layout.
    if (scenario.inset) {
      await page.evaluate(inset => document.documentElement.style.setProperty('--header-safe-area-top', `${inset}px`), scenario.inset)
    }
    await expect(header).toHaveCSS('padding-top', `${scenario.inset}px`)
    const content = header.locator(':scope > div').first()
    await expect.poll(async () => (await content.boundingBox())!.y).toBe(scenario.inset)
    await expect(content).toHaveCSS('height', '56px')
    await page.evaluate(() => window.scrollTo(0, 400))
    await expect.poll(async () => (await content.boundingBox())!.y).toBe(scenario.inset)
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/)
  })
}

for (const loggedIn of [true, false]) {
  for (const hidden of [true, false, undefined]) {
    test(`admin entry is always visible: login=${loggedIn}, legacyHide=${hidden}`, async ({ page }) => {
      await installKomariFixture(page, { loggedIn, hideEarth: true, hideAdminEntryWhenLoggedOut: hidden })
      const destinations: string[] = []
      page.on('request', request => {
        if (request.isNavigationRequest())
          destinations.push(new URL(request.url()).pathname)
      })
      await page.route('**/admin', route => route.fulfill({ contentType: 'text/html', body: '<h1>Server-owned admin</h1>' }))
      await page.goto('/')
      await page.getByRole('button', { name: '后台管理', exact: true }).click()
      await expect(page).toHaveURL(/\/admin$/)
      expect(destinations).not.toContain('/admin-app/index.html')
    })
  }
}

test('failed identity request does not remove admin entry', async ({ page }) => {
  await installKomariFixture(page, { hideEarth: true, hideAdminEntryWhenLoggedOut: true })
  await page.route('**/api/me', route => route.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  await page.goto('/')
  await expect(page.getByRole('button', { name: '后台管理', exact: true })).toBeVisible()
})

test('guest price masking survives admin navigation and return', async ({ page }) => {
  await installKomariFixture(page, { hideEarth: true, hidePriceWhenLoggedOut: true })
  await page.route('**/admin', route => route.fulfill({ contentType: 'text/html', body: '<h1>Server-owned login</h1>' }))
  await page.goto('/')
  const card = page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情', exact: true })
  await expect(card).not.toContainText('$9.9')
  await card.click()
  await expect(page).toHaveURL(/instance/)
  await expect(page.getByText('***', { exact: false }).first()).toBeVisible()
  await page.getByRole('button', { name: '后台管理', exact: true }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await page.goBack()
  await expect(page).toHaveURL(/instance/)
  await expect(page.getByText('***', { exact: false }).first()).toBeVisible()
})

for (const blockedStorage of [false, true]) {
  test(`legacy entry redirects only to admin: blockedStorage=${blockedStorage}`, async ({ page }) => {
    const requests: string[] = []
    page.on('request', request => requests.push(request.url()))
    await page.addInitScript(({ blockedStorage }) => {
      if (blockedStorage) {
        Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('storage disabled') } })
      }
      else {
        sessionStorage.setItem('komariOfficialAppRoute', '/')
        sessionStorage.setItem('preserve-me', 'yes')
      }
    }, { blockedStorage })
    await page.route('**/admin', route => route.fulfill({ contentType: 'text/html', body: '<h1>Admin</h1>' }))
    await page.goto('/admin-app/index.html?__komari_route=https%3A%2F%2Fexample.invalid%2F')
    await expect(page).toHaveURL(/\/admin$/)
    expect(requests.some(url => url.includes('/admin-app/assets/') || url.includes('/api/'))).toBe(false)
  })
}

test('PWA metadata is independent of the removed official app', async ({ page }) => {
  await installKomariFixture(page, { hideEarth: true })
  await page.goto('/')
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/images/pwa/icon-512.png')
  const response = await page.request.get('/manifest.webmanifest')
  const manifest = await response.json()
  expect(manifest).toMatchObject({ name: 'Glassmorphism Enhanced', start_url: '/', scope: '/', display: 'standalone' })
  for (const icon of manifest.icons) {
    const size = Number(icon.sizes.split('x')[0])
    const actual = await page.evaluate(async ({ src }) => {
      const image = new Image()
      image.src = src
      await image.decode()
      return [image.naturalWidth, image.naturalHeight]
    }, icon)
    expect(actual).toEqual([size, size])
  }
})
