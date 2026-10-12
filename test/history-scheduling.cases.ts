import type { NodeData } from '../src/stores/nodes'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { createServer } from 'vite'

test.describe('history scheduling', () => {
  let server: Awaited<ReturnType<typeof createServer>>
  let history: typeof import('../src/services/history.service')
  let traffic: typeof import('../src/services/traffic.service')
  let requestConfig: { timeout: { default: number }, retry: { attempts: number } }
  let requestManager: typeof import('../src/services/request.service')['requestManager']
  let getSharedApi: typeof import('../src/utils/api')['getSharedApi']
  let getSharedRpc: typeof import('../src/utils/rpc')['getSharedRpc']

  // Use Vite's module environment for transport constructors using import.meta.env.
  test.beforeAll(async () => {
    server = await createServer({
      configFile: false,
      server: { middlewareMode: true, hmr: false, watch: null },
      optimizeDeps: { noDiscovery: true, include: [] },
      resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    })
    history = await server.ssrLoadModule('/src/services/history.service.ts') as typeof history
    traffic = await server.ssrLoadModule('/src/services/traffic.service.ts') as typeof traffic
    requestConfig = (await server.ssrLoadModule('/src/constants/request.ts')).REQUEST_CONFIG
    ;({ requestManager } = await server.ssrLoadModule('/src/services/request.service.ts'))
    ;({ getSharedApi } = await server.ssrLoadModule('/src/utils/api.ts'))
    ;({ getSharedRpc } = await server.ssrLoadModule('/src/utils/rpc.ts'))
  })

  test.afterAll(async () => {
    requestManager?.abortAll()
    await server?.close()
  })

  const start = new Date('2026-10-01T00:00:00Z')
  const end = new Date('2026-10-12T00:00:00Z')

  test('eight history compatibility chains reach HTTP without nested pool acquisition', async () => {
    const rpc = getSharedRpc()
    const api = getSharedApi()
    const originalRecords = rpc.getRecords
    const originalLoad = rpc.getLoadRecords
    const originalHttp = api.getLoadRecords
    const calls: string[] = []
    rpc.getRecords = async () => {
      throw new Error('range unavailable')
    }
    rpc.getLoadRecords = async (_uuid, _hours, type) => {
      calls.push(`rpc:${type ?? 'all'}`)
      throw new Error('legacy RPC unavailable')
    }
    api.getLoadRecords = async () => {
      calls.push('http')
      return { records: [], count: 0 }
    }
    const jobs = Array.from({ length: 8 }, (_, index) => history.loadNodeLoadRecordsByRange(`history-${index}`, start, end).catch(error => error))
    try {
      await expect.poll(() => calls.filter(call => call === 'http').length, { timeout: 800 }).toBe(8)
      expect(await Promise.all(jobs)).toEqual(Array.from({ length: 8 }).fill([]))
      expect(calls.filter(call => call === 'rpc:network')).toHaveLength(8)
      expect(calls.filter(call => call === 'rpc:all')).toHaveLength(8)
    }
    finally {
      requestManager.abortAll()
      await Promise.all(jobs)
      rpc.getRecords = originalRecords
      rpc.getLoadRecords = originalLoad
      api.getLoadRecords = originalHttp
    }
  })

  test('cancelling a history range stops the RPC and HTTP fallback chain', async () => {
    const rpc = getSharedRpc()
    const api = getSharedApi()
    const originalRecords = rpc.getRecords
    const originalLoad = rpc.getLoadRecords
    const originalHttp = api.getLoadRecords
    let fallbacks = 0
    rpc.getRecords = async (_params, signal) => new Promise((_resolve, reject) => {
      signal!.addEventListener('abort', () => reject(new Error('transport aborted')), { once: true })
    })
    rpc.getLoadRecords = async () => {
      fallbacks += 1
      throw new Error('unexpected RPC fallback')
    }
    api.getLoadRecords = async () => {
      fallbacks += 1
      throw new Error('unexpected HTTP fallback')
    }
    const job = history.loadNodeLoadRecordsByRange('cancel-history', start, end).catch(error => error)
    try {
      requestManager.abort(history.getNodeLoadRecordsRangeRequestKey('cancel-history', start.toISOString(), end.toISOString()))
      await job
      // Let rejected transport continuations finish before observing fallbacks.
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(fallbacks).toBe(0)
    }
    finally {
      requestManager.abortAll()
      rpc.getRecords = originalRecords
      rpc.getLoadRecords = originalLoad
      api.getLoadRecords = originalHttp
    }
  })

  test('releasing ping history cancels the tasks request key', async () => {
    const rpc = getSharedRpc()
    const original = rpc.getPingRecords
    let aborted = false
    let release!: () => void
    rpc.getPingRecords = async (_task, _hours, _max, signal) => {
      signal!.addEventListener('abort', () => {
        aborted = true
      }, { once: true })
      await new Promise<void>((resolve) => {
        release = resolve
      })
      return { records: [], tasks: [] }
    }
    const job = history.loadPingRecordsWithTasks(1, 150, 'ping-cancel').catch(error => error)
    try {
      history.abortPingRecords(1, 150, 'ping-cancel')
      expect(aborted).toBe(true)
    }
    finally {
      release()
      await job
      requestManager.abortAll()
      rpc.getPingRecords = original
    }
  })

  test('monthly detail fallback shares the two-slot cap with home metrics', async () => {
    const rpc = getSharedRpc()
    const originalQuery = rpc.queryPublicMetrics
    const originalRecords = rpc.getRecords
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let historyStarted = 0
    let homeStarted = 0
    let active = 0
    let peak = 0
    async function hold() {
      active += 1
      peak = Math.max(peak, active)
      await gate
      active -= 1
    }
    rpc.queryPublicMetrics = async (params) => {
      if (params.entity_ids?.includes('home-cap')) {
        homeStarted += 1
        await hold()
      }
      return { series: [], count: 0, start: start.toISOString(), end: end.toISOString() }
    }
    rpc.getRecords = async () => {
      historyStarted += 1
      await hold()
      return { records: [], count: 0 }
    }
    const node = (uuid: string) => ({
      uuid,
      billing_cycle: 30,
      expired_at: '2026-11-01T00:00:00Z',
      traffic_limit: 1_000,
      traffic_limit_type: 'sum',
      net_total_up: 10,
      net_total_down: 20,
    } as NodeData)
    const details = Array.from({ length: 8 }, (_, index) => traffic.loadMonthlyTrafficUsage([node(`detail-cap-${index}`)], end, { allowHistoryFallback: true }))
    let home: ReturnType<typeof traffic.loadMonthlyTrafficUsage> | undefined
    try {
      await expect.poll(() => historyStarted).toBe(2)
      home = traffic.loadMonthlyTrafficUsage([node('home-cap')], end)
      let pingStarted = false
      await requestManager.run('ping-during-detail', async () => {
        pingStarted = true
      }, { priority: 'high' })
      expect(pingStarted).toBe(true)
      expect(homeStarted).toBe(0)
      expect(historyStarted).toBe(2)
      release()
      const results = await Promise.all([...details, home])
      expect(peak).toBe(2)
      expect(historyStarted).toBe(8)
      expect(homeStarted).toBe(1)
      expect(results.at(-1)?.get('home-cap')).toMatchObject({ source: 'legacy', used: 30 })
    }
    finally {
      release()
      await Promise.all([...details, home])
      requestManager.abortAll()
      rpc.queryPublicMetrics = originalQuery
      rpc.getRecords = originalRecords
    }
  })

  test('a timed-out history attempt does not start fallback transports', async () => {
    const rpc = getSharedRpc()
    const originalRecords = rpc.getRecords
    const originalLoad = rpc.getLoadRecords
    const originalTimeout = requestConfig.timeout.default
    const originalAttempts = requestConfig.retry.attempts
    requestConfig.timeout.default = 20
    requestConfig.retry.attempts = 0
    let fallbacks = 0
    rpc.getRecords = async (_params, signal) => new Promise((_resolve, reject) => {
      signal!.addEventListener('abort', () => reject(new Error('transport timeout')), { once: true })
    })
    rpc.getLoadRecords = async () => {
      fallbacks += 1
      return { records: [], count: 0 }
    }
    try {
      await expect(history.loadNodeLoadRecordsByRange('timeout-history', start, end)).rejects.toThrow()
      expect(fallbacks).toBe(0)
    }
    finally {
      requestManager.abortAll()
      requestConfig.timeout.default = originalTimeout
      requestConfig.retry.attempts = originalAttempts
      rpc.getRecords = originalRecords
      rpc.getLoadRecords = originalLoad
    }
  })
})
