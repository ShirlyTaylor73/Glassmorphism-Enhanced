import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { installKomariFixture } from '../tests/visual/fixtures/komari'

async function checkMode(page: Page, dark: boolean, auto = false) {
  const html = page.locator('html')
  if (dark)
    await expect(html).toHaveClass(/dark/)
  else
    await expect(html).not.toHaveClass(/dark/)
  await expect(html).toHaveCSS('color-scheme', dark ? 'dark' : 'light')
  const label = `切换为${dark ? '浅' : '深'}色主题${auto ? '（当前自动）' : ''}`
  const button = page.getByRole('button', { name: label, exact: true })
  await expect(button).toBeVisible()
  await expect(button.locator('svg')).toHaveClass(dark ? /sun-one/ : /moon/)
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

test('invalid stored mode falls back to automatic and keyboard works on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => localStorage.setItem('themeMode', 'invalid-mode'))
  await installKomariFixture(page, { hideEarth: true, managedThemeMode: 'light', preserveStorage: true })
  await page.goto('/')
  const toggle = await checkMode(page, false, true)
  await toggle.focus()
  await page.keyboard.press('Enter')
  await checkMode(page, true)
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
  await expect(html).not.toHaveClass(/dark/)
  const button = page.getByRole('button', { name: /主题/ }).first()
  for (const dark of [true, false, true, false]) {
    await button.click()
    if (dark)
      await expect(html).toHaveClass(/dark/)
    else
      await expect(html).not.toHaveClass(/dark/)
  }
})
