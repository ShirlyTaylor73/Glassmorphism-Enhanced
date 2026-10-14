import { expect, test } from '@playwright/test'
import { buildAutomaticEarthArcs, buildUpstreamEarthArcs } from '../src/utils/earthArcs'
import { adaptEarthFlights, arcPoint, flightProgress, isOccludedBySphere, projectTrail } from '../src/utils/earthTrails'

test('flight direction only reverses upstream rendering', () => {
  const arcs = [
    { id: 'a', source: 'auto' as const, from: [0, 0] as [number, number], to: [0, 90] as [number, number] },
    { id: 'b', source: 'upstream' as const, from: [0, 0] as [number, number], to: [0, 90] as [number, number] },
  ]
  const copy = JSON.stringify(arcs)
  expect(adaptEarthFlights(arcs)[0]!.from).toEqual([0, 0])
  expect(adaptEarthFlights(arcs)[1]!.from).toEqual([0, 90])
  expect(JSON.stringify(arcs)).toBe(copy)
})

test('spherical arc pins both endpoints and remains finite at antipodes', () => {
  expect(arcPoint([0, 0], [0, 90], 0)).toEqual([0, 0, 1.012])
  expect(arcPoint([0, 0], [0, 90], 1)[0]).toBeCloseTo(1.012)
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const p = arcPoint([0, 0], [0, 180], t)
    expect(p.every(Number.isFinite)).toBe(true)
    expect(Math.hypot(...p)).toBeGreaterThanOrEqual(1)
  }
})

test('auto batches cover every edge with at most three flights; persistent phases are stable', () => {
  const ids = Array.from({ length: 24 }, (_, i) => `edge-${i}`)
  const seen = new Set<string>()
  for (let now = 0; now < 40_000; now += 100) {
    const active = ids.filter(id => flightProgress('auto', id, ids, now) !== null)
    expect(active.length).toBeLessThanOrEqual(3)
    active.forEach(id => seen.add(id))
  }
  expect(seen.size).toBe(24)
  const progress = flightProgress('persistent', ids[0]!, ids, 1000)
  expect(flightProgress('persistent', ids[0]!, [...ids].reverse(), 1000)).toBe(progress)
  expect(flightProgress('persistent', ids[0]!, ids, 4850)).toBe(progress)
  expect(flightProgress('off', ids[0]!, ids, 1000)).toBeNull()
  expect(flightProgress('auto', 'deleted', ids, 1000)).toBeNull()
})

test('sphere occlusion hides rear points while elevated limbs and front points remain visible', () => {
  expect(isOccludedBySphere([0, 0, -1.02], [0, 0, 3])).toBe(true)
  expect(isOccludedBySphere([0, 0, 1.02], [0, 0, 3])).toBe(false)
  expect(isOccludedBySphere([1.5, 0, 0], [0, 0, 3])).toBe(false)
  const project = (point: readonly number[]) => ({ x: point[0]! * 100, y: point[1]! * 100, visible: !isOccludedBySphere(point as [number, number, number], [0, 0, 3]) })
  const path = projectTrail([0, 0], [0, 140], 0.6, project)
  expect(path.d.length).toBeGreaterThan(0)
  expect(path.headVisible).toBe(false)
})

test('topology caps, invalid and coincident coordinates remain filtered', () => {
  const clusters = Array.from({ length: 80 }, (_, i) => ({ id: `${i}`, code: 'US', servers: 1, onlineServers: 1, coord: [i, i] as [number, number] }))
  expect(buildAutomaticEarthArcs(clusters)).toHaveLength(24)
  expect(buildAutomaticEarthArcs([...clusters, { ...clusters[0]!, id: 'bad', coord: [Number.NaN, 0] }])).toHaveLength(24)
  expect(buildAutomaticEarthArcs([clusters[0]!, { ...clusters[0]!, id: 'same' }])).toHaveLength(0)
  expect(buildUpstreamEarthArcs([], new Map())).toEqual([])
})
