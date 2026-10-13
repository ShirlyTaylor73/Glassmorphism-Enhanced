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
    await expect(card.locator('[data-node-cores]')).toHaveText('1core')
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
    ['192.*.*.*', '', 2, '2core'], ['', '2001:*:*:*:*:*:*:*', 4, '4core'], [' ', '', 0, '—'],
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
