import { expect, test } from '@playwright/test'
import { installKomariFixture } from './fixtures/komari'

for (const sharedCycle of [false, true]) {
  test(`30 nodes: ping completes before monthly traffic (${sharedCycle ? 'shared cycles' : 'distinct cycles'})`, async ({ page }) => {
    const renewalDays = Array.from({ length: 30 }, (_, index) => sharedCycle ? index % 15 + 1 : index + 1)
    await page.clock.install({ time: new Date('2026-10-31T12:00:00.000Z') })
    await installKomariFixture(page, {
      nodeCount: 30,
      renewalDays,
      useNativeClock: true,
      hideEarth: true,
      transit: true,
      trafficMetricZeroNode: 0,
      generalCardKeys: ['trafficQuota'],
    })

    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    const traffic: Array<{ start: string, end: string, entity_ids: string[] }> = []
    let active = 0
    let peak = 0
    await page.route('**/rpc2', async (route) => {
      const payload = route.request().postDataJSON()
      if (payload.method === 'public:queryMetrics' && payload.params?.aggregation === 'sum') {
        traffic.push(payload.params)
        active += 1
        peak = Math.max(peak, active)
        await gate
        active -= 1
      }
      await route.fallback()
    })

    try {
      await page.goto('/')
      const target = page.getByRole('button', { name: '查看节点 TargetNode 详情', exact: true })
      await expect(target.locator('[data-carrier-ping="unicom-latency"]')).toContainText('≈95 ms')
      await expect(target.locator('[data-carrier-ping="unicom-loss"]')).toContainText('≈3.0%')
      await expect(target.getByText('0.5%', { exact: true })).toBeVisible()
      expect(traffic).toHaveLength(2)
      expect(peak).toBe(2)

      release()
      await expect(target.getByText('0.0%', { exact: true })).toBeVisible()
      const expectedGroups = sharedCycle ? 15 : 30
      await expect.poll(() => traffic.length).toBe(expectedGroups)
      expect(peak).toBeLessThanOrEqual(2)
      const queriedNodes = traffic.flatMap(request => request.entity_ids)
      expect(queriedNodes).toHaveLength(30)
      expect(new Set(queriedNodes).size).toBe(30)
      for (const request of traffic) {
        expect(request.end).toMatch(/^2026-10-31T/)
        expect(request.entity_ids).toHaveLength(sharedCycle ? 2 : 1)
        for (const uuid of request.entity_ids) {
          const index = Number(uuid.slice(-12)) - 1
          expect(request.start).toBe(`2026-10-${String(renewalDays[index]).padStart(2, '0')}T00:00:00.000Z`)
        }
      }
      const last = page.getByRole('button', { name: '查看节点 伦敦-离线归档-30 详情', exact: true })
      await last.scrollIntoViewIfNeeded()
      await expect(last.getByText('15.7%', { exact: true })).toBeVisible()
    }
    finally {
      release()
    }
  })
}
