import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import baseline from '../../docs/earth-layout-before.json' with { type: 'json' }
import { installKomariFixture } from './fixtures/komari'

async function preservePixels(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string, options?: any) {
      return original.call(this, type as '2d', type.startsWith('webgl') ? { ...options, preserveDrawingBuffer: true } : options)
    } as typeof original
  })
}

async function pixelCount(page: Page) {
  return page.locator('[data-earth-arc-count] canvas').evaluate((element) => {
    const c = element as HTMLCanvasElement
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    if (!gl)
      return 0
    const pixels = new Uint8Array(c.width * c.height * 4)
    gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    let count = 0
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i]! + pixels[i + 1]! + pixels[i + 2]! > 24)
        count++
    }
    return count
  })
}

for (const renderer of ['realistic', 'cobe'] as const) {
  for (const width of [1280, 390] as const) {
    for (const dark of [false, true]) {
      test(`earth real pixels and existing layout ${renderer} ${width} ${dark}`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 720 })
        await preservePixels(page)
        await page.clock.install({ time: new Date('2026-07-25T12:00:00Z') })
        await installKomariFixture(page, { earthRenderer: renderer, dark, preserveStorage: true, earthArcMode: 'persistent', disablePageAnimation: false, stopEarth: true })
        const errors: string[] = []
        page.on('pageerror', error => errors.push(error.message))
        await page.goto('/')
        const earth = page.locator('[data-earth-arc-count]')
        await expect(earth).toBeVisible()
        await expect.poll(() => pixelCount(page), { timeout: 15000 }).toBeGreaterThan(1000)
        const before = baseline[`${renderer}-${width}`]
        for (const key of ['x', 'y', 'width', 'height'] as const)
          await expect.poll(async () => Math.abs((await earth.boundingBox())![key] - before.box[key])).toBeLessThanOrEqual(3)
        const box = (await earth.boundingBox())!
        if (renderer === 'realistic') {
          const radius = Number(await earth.locator('.earth-globe-host').getAttribute('data-visible-earth-radius'))
          expect(Math.abs(radius * 2 / before.diameterReference - 1)).toBeLessThan(0.05)
          await expect(earth.locator('.earth-globe-host')).toHaveAttribute('data-atmosphere-model', 'solar-dual-tone-gradient')
        }
        else {
          const canvasBox = (await earth.locator('canvas').boundingBox())!
          expect(Math.abs(canvasBox.x + canvasBox.width / 2 - before.center.x)).toBeLessThan(3)
          expect(Math.abs(canvasBox.y + canvasBox.height / 2 - before.center.y)).toBeLessThan(3)
          await expect(earth.locator('.cobe-orbit-layer')).toBeVisible()
          expect(Math.abs(box.width * 0.8 / before.diameterReference - 1)).toBeLessThan(0.05)
        }
        await expect.poll(() => earth.locator('[data-earth-flight]').count()).toBeGreaterThan(0)
        await expect.poll(() => earth.locator('[data-earth-flight] path').evaluateAll(paths => paths.filter(p => p.getAttribute('d')).length)).toBeGreaterThan(0)
        await expect(page.locator('html')).toHaveJSProperty('scrollWidth', width)
        await page.screenshot({ path: `test-results/earth-${renderer}-${width}-${dark}.png` })
        expect(errors).toEqual([])
      })
    }
  }
}

for (const renderer of ['realistic', 'cobe'] as const) {
  test(`earth lifecycle and reduced motion ${renderer}`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-07-25T12:00:00Z') })
    await installKomariFixture(page, { earthRenderer: renderer, preserveStorage: true, earthArcMode: 'persistent', disablePageAnimation: false, stopEarth: true, nodeCount: 30 })
    await page.goto('/')
    const earth = page.locator('[data-earth-arc-count]')
    const trails = earth.locator('[data-earth-trails]')
    await expect.poll(async () => Number(await trails.getAttribute('data-active-flights'))).toBeGreaterThan(0)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(earth).toHaveAttribute('data-earth-reduced', 'true')
    await expect(trails).toHaveAttribute('data-active-flights', '0')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect(earth).toHaveAttribute('data-earth-reduced', 'false')
    await expect.poll(async () => Number(await trails.getAttribute('data-active-flights'))).toBeGreaterThan(0)
    await page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情', exact: true }).click()
    await expect(page).toHaveURL(/instance/)
    await page.goBack()
    await expect(earth).toBeVisible()
    await expect(earth).toHaveAttribute('data-earth-active', 'true')
    await expect(earth.locator('canvas')).toHaveCount(1)
  })
}

test('missing earth texture degrades without blocking home', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-07-25T12:00:00Z') })
  await installKomariFixture(page, { preserveStorage: true, earthRenderer: 'realistic' })
  await page.route('**/images/earth/earth-night.jpg', route => route.abort())
  await page.goto('/')
  await expect(page.getByRole('status').filter({ hasText: '地球暂不可用' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情', exact: true })).toBeVisible()
})
