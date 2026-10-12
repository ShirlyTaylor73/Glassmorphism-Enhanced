import type { RequestManagerOptions } from '../src/services/request.service'
import { expect, test } from '@playwright/test'
import { RequestManager } from '../src/services/request.service'

// Keep the red phase executable before the optional scheduling fields exist.
const monthly: RequestManagerOptions & { priority: 'low', concurrencyGroup: 'monthly-traffic' } = {
  priority: 'low',
  concurrencyGroup: 'monthly-traffic',
}
const high: RequestManagerOptions & { priority: 'high' } = { priority: 'high' }

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => { resolve = done })
  return { promise, resolve }
}

test('monthly requests cannot occupy the eight-slot pool or block ping', async () => {
  const manager = new RequestManager()
  const gate = deferred()
  let active = 0
  let peak = 0
  const jobs = Array.from({ length: 30 }, (_, index) => manager.run(`monthly:${index}`, async () => {
    active += 1
    peak = Math.max(peak, active)
    await gate.promise
    active -= 1
  }, monthly))
  let pingStarted = false
  const ping = manager.run('ping', async () => { pingStarted = true }, high)
  try {
    await expect.poll(() => pingStarted, { timeout: 500 }).toBe(true)
    expect(peak).toBe(2)
  }
  finally {
    gate.resolve()
    await Promise.all([...jobs, ping])
    manager.abortAll()
  }
})

test('priority, FIFO and queued dedupe promotion preserve task identity', async () => {
  const manager = new RequestManager()
  const gate = deferred()
  const blockers = Array.from({ length: 8 }, (_, index) => manager.run(`block:${index}`, () => gate.promise))
  const order: string[] = []
  const low = manager.run('low', async () => { order.push('low') }, { priority: 'low' } as RequestManagerOptions)
  const normal = manager.run('normal', async () => { order.push('normal') })
  const promoted = manager.run('promoted', async () => { order.push('promoted') })
  const duplicate = manager.run('promoted', async () => { throw new Error('duplicate task executed') }, high)
  const highSecond = manager.run('high-second', async () => { order.push('high-second') }, high)
  expect(duplicate).toBe(promoted)
  gate.resolve()
  await Promise.all([...blockers, low, normal, promoted, highSecond])
  expect(order).toEqual(['promoted', 'high-second', 'normal', 'low'])
})

test('global limit remains eight and promotion does not bypass the monthly limit', async () => {
  const manager = new RequestManager()
  const gate = deferred()
  let monthlyStarted = 0
  let totalStarted = 0
  const jobs = Array.from({ length: 3 }, (_, index) => manager.run(`monthly:${index}`, async () => {
    monthlyStarted += 1
    totalStarted += 1
    await gate.promise
  }, monthly))
  const promoted = manager.run('monthly:2', async () => {}, high)
  jobs.push(...Array.from({ length: 10 }, (_, index) => manager.run(`normal:${index}`, async () => {
    totalStarted += 1
    await gate.promise
  })))
  try {
    expect(promoted).toBe(jobs[2])
    expect(monthlyStarted).toBe(2)
    expect(totalStarted).toBe(8)
  }
  finally {
    gate.resolve()
    await Promise.all(jobs)
  }
})

test('old aborted task cannot remove a replacement with the same key', async () => {
  const manager = new RequestManager()
  const gate = deferred()
  const old = manager.run('same', () => gate.promise).catch(error => error)
  manager.abort('same')
  const replacement = manager.run('same', () => gate.promise)
  await old
  const duplicate = manager.run('same', async () => { throw new Error('replacement lost') })
  // Observe the promise even on the old implementation's failing path.
  const observed = duplicate.catch(error => error)
  gate.resolve()
  await Promise.all([replacement, observed])
  expect(duplicate).toBe(replacement)
})

test('timeouts, retries and queued cancellation release group capacity', async () => {
  const manager = new RequestManager()
  let attempts = 0
  const timeout = manager.run('timeout', async () => {
    attempts += 1
    await new Promise(() => {})
  }, { ...monthly, timeout: 20, retryAttempts: 1 }).catch(error => error)
  const gate = deferred()
  const blocked = manager.run('blocked', () => gate.promise, monthly)
  let cancelledStarted = false
  const cancelled = manager.run('cancelled', async () => { cancelledStarted = true }, monthly).catch(error => error)
  manager.abort('cancelled')
  let nextStarted = false
  const next = manager.run('next', async () => { nextStarted = true }, monthly)
  try {
    await timeout
    await next
    expect(attempts).toBe(2)
    expect(cancelledStarted).toBe(false)
    expect(nextStarted).toBe(true)
    expect((await cancelled).name).toBe('AbortError')
  }
  finally {
    gate.resolve()
    await blocked
    manager.abortAll()
  }
})
