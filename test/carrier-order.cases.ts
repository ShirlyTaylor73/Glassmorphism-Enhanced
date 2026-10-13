import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { installKomariFixture } from '../tests/visual/fixtures/komari'

const KEY = 'theme:carrier-order:v1'
const DEFAULT = ['unicom', 'telecom', 'mobile']

async function open(page: Page, mini = false, transit = false) {
  await installKomariFixture(page, { preserveStorage: true, hideEarth: true, nodeCardSize: mini ? 'mini' : 'compact', transit })
  await page.goto('/')
  await expect(page.locator('[data-carrier-ping="unicom-latency"]').first()).toBeVisible()
}

async function allOrders(page: Page, order: string[]) {
  await expect.poll(() => page.locator('[data-node-ping-bars]').evaluateAll(panels => panels.map(panel =>
    Array.from(panel.querySelectorAll('[data-carrier-ping]')).map(row => row.getAttribute('data-carrier-ping')!.split('-')[0]).join(','),
  ))).toEqual(Array(await page.locator('[data-node-ping-bars]').count()).fill(order.join(',')))
}

async function drag(page: Page, metric = 'latency', cancel = false) {
  const from = page.locator(`[data-carrier-ping="mobile-${metric}"]`).first()
  const to = page.locator(`[data-carrier-ping="unicom-${metric}"]`).first()
  await from.scrollIntoViewIfNeeded()
  const a = (await from.boundingBox())!
  const b = (await to.boundingBox())!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 })
  if (cancel)
    await page.keyboard.press('Escape')
  await page.mouse.up()
}

test('drag synchronizes every panel and persists without opening detail', async ({ page }) => {
  await open(page)
  const before = await page.locator('[data-carrier-ping="mobile-latency"]').first().innerText()
  await drag(page)
  await allOrders(page, ['mobile', 'unicom', 'telecom'])
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('[data-carrier-ping="mobile-latency"]').first()).toHaveText(before)
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), KEY)).toEqual(['mobile', 'unicom', 'telecom'])
  await page.reload()
  await allOrders(page, ['mobile', 'unicom', 'telecom'])
})

test('loss panel sorts mini and transit; Escape cancels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, true, true)
  await drag(page, 'loss', true)
  await allOrders(page, DEFAULT)
  await drag(page, 'loss')
  await allOrders(page, ['mobile', 'unicom', 'telecom'])
})

test('keyboard reorders and ordinary click still opens Ping', async ({ page }) => {
  await open(page)
  const row = page.locator('[data-carrier-ping="telecom-loss"]').first()
  await row.focus()
  await page.keyboard.press('Alt+ArrowUp')
  await allOrders(page, ['telecom', 'unicom', 'mobile'])
  await expect(row).toBeFocused()
  await row.click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('stored duplicates and invalid entries are repaired without hiding carriers', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify(['mobile', 'mobile', 'wrong'])), KEY)
  await open(page)
  await allOrders(page, ['mobile', 'unicom', 'telecom'])
})
