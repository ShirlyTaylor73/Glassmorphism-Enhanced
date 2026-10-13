import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { installKomariFixture } from '../tests/visual/fixtures/komari'

const KEY = 'theme:carrier-order:v1'
const DEFAULT = ['unicom', 'telecom', 'mobile']
const LATENCY = /ms$/
const GRABBING = /cursor-grabbing/
const HOME = /\/$/

async function open(page: Page, mini = false, transit = false) {
  await page.clock.setFixedTime(new Date('2026-07-25T12:00:00Z'))
  await installKomariFixture(page, { preserveStorage: true, hideEarth: true, pingTaskOrdering: !transit, nodeCardSize: mini ? 'mini' : 'compact', transit })
  await page.goto('/')
  await expect(page.locator('[data-carrier-ping="unicom-latency"]').first()).toBeVisible()
}

async function allOrders(page: Page, order: string[]) {
  await expect(page.locator('[data-node-ping-bars]').first()).toBeVisible()
  await expect.poll(() => page.locator('[data-node-ping-bars]').evaluateAll(panels => panels.map(panel =>
    Array.from(panel.querySelectorAll('[data-carrier-ping]')).map(row => row.getAttribute('data-carrier-ping')!.split('-')[0]).join(','),
  ))).toEqual(Array.from({ length: await page.locator('[data-node-ping-bars]').count() }).fill(order.join(',')))
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
  const value = page.locator('[data-carrier-ping="mobile-latency"]').first().locator('.tabular-nums')
  await expect(value).toHaveText(LATENCY)
  const before = await value.textContent()
  await drag(page)
  await allOrders(page, ['mobile', 'unicom', 'telecom'])
  await expect(page).toHaveURL(HOME)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(value).toHaveText(before!)
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
  await page.getByRole('button', { name: '关闭', exact: true }).click()
  await row.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('stored duplicates and invalid entries are repaired without hiding carriers', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify(['mobile', 'mobile', 'wrong'])), KEY)
  await open(page)
  await allOrders(page, ['mobile', 'unicom', 'telecom'])
})

test('malformed storage falls back and outside drop does not save', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), KEY)
  await open(page)
  await allOrders(page, DEFAULT)
  const row = page.locator('[data-carrier-ping="mobile-latency"]').first()
  await row.scrollIntoViewIfNeeded()
  const box = (await row.boundingBox())!
  await page.mouse.move(box.x + 10, box.y + 5)
  await page.mouse.down()
  await page.mouse.move(0, 0, { steps: 5 })
  await page.mouse.up()
  await allOrders(page, DEFAULT)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test.describe('touch carrier sorting', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } })

  test('long press reorders while a normal swipe scrolls without reordering', async ({ page, context }) => {
    await open(page, true)
    const from = page.locator('[data-carrier-ping="mobile-loss"]').first()
    const to = page.locator('[data-carrier-ping="unicom-loss"]').first()
    await from.scrollIntoViewIfNeeded()
    const a = (await from.boundingBox())!
    const b = (await to.boundingBox())!
    const cdp = await context.newCDPSession(page)
    const x = a.x + a.width / 2
    const y = a.y + a.height / 2
    const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', at = y) => cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [{ x, y: at }],
    })
    await send('touchStart')
    await page.waitForTimeout(450)
    await send('touchMove', b.y + b.height / 2)
    await send('touchEnd')
    await allOrders(page, ['mobile', 'unicom', 'telecom'])
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.screenshot({ path: 'test-results/carrier-order-mobile.png' })
    await from.scrollIntoViewIfNeeded()
    const box = (await from.boundingBox())!
    const scrollBefore = await page.evaluate(() => window.scrollY)
    await send('touchStart', box.y + box.height / 2)
    await send('touchMove', box.y - 40)
    await send('touchMove', box.y - 100)
    await send('touchEnd')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore)
    await allOrders(page, ['mobile', 'unicom', 'telecom'])
  })

  test('pointer cancellation leaves order intact and releases gesture', async ({ page }) => {
    await open(page, true)
    const row = page.locator('[data-carrier-ping="mobile-latency"]').first()
    await row.dispatchEvent('pointerdown', { pointerId: 9, pointerType: 'touch', isPrimary: true, button: 0, clientX: 100, clientY: 100 })
    await page.waitForTimeout(400)
    await expect(row).toHaveClass(GRABBING)
    await row.dispatchEvent('pointercancel', { pointerId: 9 })
    await allOrders(page, DEFAULT)
    await expect(row).not.toHaveClass(GRABBING)
    await row.click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
