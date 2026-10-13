import { expect, test } from '@playwright/test'
import { installKomariFixture } from './fixtures/komari'

for (const size of ['mini', 'compact', 'comfortable', 'large'] as const) {
  test(`card identity and cores remain contained: ${size}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await installKomariFixture(page, { hideEarth: true, nodeCardSize: size, transit: true })
    await page.goto('/')
    const card = page.getByRole('button', { name: '查看节点 TargetNode 详情', exact: true })
    await expect(card.getByLabel('支持 IPv4', { exact: true })).toBeVisible()
    await expect(card.getByLabel('支持 IPv6', { exact: true })).toBeVisible()
    await expect(card.locator('[data-node-online-status]')).toContainText('在线')
    await expect(card.locator('[data-node-cores]')).toHaveText('1 Core')
    await card.getByRole('button', { name: '收藏 TargetNode', exact: true }).click()
    await expect(page).toHaveURL('/')
    await expect(card.getByRole('button', { name: '取消收藏 TargetNode', exact: true })).toBeVisible()
    await expect(card.locator('[data-carrier-ping="unicom-latency"]')).toContainText('≈95 ms')
    expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
    expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  })
}

test('protocols reflect fields and unknown cores never become zero', async ({ page }) => {
  await installKomariFixture(page, { hideEarth: true, hidePriceWhenLoggedOut: true })
  await page.goto('/')
  const card = page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情', exact: true })
  for (const [ipv4, ipv6, cores, expected] of [
    ['192.*.*.*', '', 2, '2 Core'],
    ['', '2001:*:*:*:*:*:*:*', 4, '4 Core'],
    [' ', '', 0, '—'],
  ] as const) {
    await page.evaluate(({ ipv4, ipv6, cores }) => {
      const root = document.querySelector('#app') as HTMLElement & { __vue_app__: { config: { globalProperties: { $pinia: { _s: Map<string, { nodes: Array<{ ipv4: string, ipv6: string, cpu_cores: number }> }> } } } } }
      const node = root.__vue_app__.config.globalProperties.$pinia._s.get('nodes')!.nodes[0]!
      Object.assign(node, { ipv4, ipv6, cpu_cores: cores })
    }, { ipv4, ipv6, cores })
    await expect(card.locator('[data-node-cores]')).toHaveText(expected)
    await expect(card.getByLabel('支持 IPv4', { exact: true })).toHaveCount(ipv4.trim() ? 1 : 0)
    await expect(card.getByLabel('支持 IPv6', { exact: true })).toHaveCount(ipv6.trim() ? 1 : 0)
    await expect(card).not.toContainText('$9.9')
    await expect(card).not.toContainText('192.*.*.*')
  }
})

for (const dark of [false, true]) {
  test(`semantic metric colors and long headers: dark=${dark}`, async ({ page }, testInfo) => {
    await installKomariFixture(page, { dark, hideEarth: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const card = page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情', exact: true })
    await expect(card.locator('[data-node-percentage="cpu"]')).toHaveClass(/text-violet-700/)
    await expect(card.locator('[data-node-percentage="memory"]')).toHaveCSS('color', 'rgb(214, 75, 145)')
    await expect(card.locator('[data-node-upload]')).toHaveCSS('color', 'rgb(214, 75, 145)')
    await expect(card.locator('[data-node-percentage="disk"]')).toHaveClass(/text-amber-700/)
    await expect(card.locator('[data-node-percentage="traffic"]')).toHaveClass(/text-sky-700/)
    const header = card.locator('.node-card-header-grid')
    await expect(header).toContainText('Ubuntu')
    await expect(header).not.toContainText('aarch64')
    await expect(header).not.toContainText('·')
    await page.screenshot({ path: testInfo.outputPath('card-mobile.png') })
    await page.evaluate(() => {
      const root = document.querySelector('#app') as HTMLElement & { __vue_app__: { config: { globalProperties: { $pinia: { _s: Map<string, { nodes: Array<Record<string, unknown>> }> } } } } }
      Object.assign(root.__vue_app__.config.globalProperties.$pinia._s.get('nodes')!.nodes[0]!, { name: '超长节点名称-'.repeat(12), os: 'Unknown operating system with a very long description', region: '', cpu: 99, ram: 999999999999 })
    })
    const longCard = page.locator('.node-card').first()
    await expect(longCard.locator('[data-node-percentage="cpu"]')).toHaveClass(/text-destructive/)
    await expect(longCard.locator('[data-node-percentage="memory"]')).toHaveClass(/text-destructive/)
    await expect(longCard.locator('[data-node-percentage="memory"]')).not.toHaveCSS('color', 'rgb(214, 75, 145)')
    expect(await longCard.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
    await expect(longCard.locator('.node-card-flag')).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('long-card-mobile.png') })
  })
}


test('expiry warning includes day fifteen but not day sixteen', async ({ page }) => {
  await installKomariFixture(page, { hideEarth: true, expiryThresholds: true })
  await page.goto('/')
  const card = page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情', exact: true })
  const expiry = card.getByText('剩余', { exact: true }).locator('..')
  for (const days of [5, 6, 13, 15, 16]) {
    await page.evaluate((days) => {
      const root = document.querySelector('#app') as HTMLElement & { __vue_app__: { config: { globalProperties: { $pinia: { _s: Map<string, { nodes: Array<{ expired_at: string }> }> } } } } }
      root.__vue_app__.config.globalProperties.$pinia._s.get('nodes')!.nodes[0]!.expired_at = new Date(Date.now() + days * 86400000).toISOString()
    }, days)
    await expect(expiry).toContainText(`剩余${days}天`)
    await expect(expiry).toHaveClass(days <= 5 ? /text-destructive/ : days <= 15 ? /text-warning/ : /text-muted-foreground/)
  }
})

test('mini keeps all metric labels and purple Unicom dots', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await installKomariFixture(page, { hideEarth: true, nodeCardSize: 'mini', transit: true })
  await page.goto('/')
  const card = page.getByRole('button', { name: '查看节点 TargetNode 详情', exact: true })
  for (const label of ['CPU', '内存', '流量'])
    await expect(card.getByText(label, { exact: true })).toBeVisible()
  for (const metric of ['latency', 'loss'])
    await expect(card.locator(`[data-carrier-ping="unicom-${metric}"] .bg-violet-500`)).toBeVisible()
  expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('mini-labels.png') })
})
