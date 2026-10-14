import type { EarthArcData, EarthArcMode } from './earthArcs'

export type Vec3 = readonly [number, number, number]
export interface ProjectedEarthPoint { x: number, y: number, visible: boolean }
export type EarthProjector = (point: Vec3) => ProjectedEarthPoint
export const FLIGHT_MS = 3200
const CYCLE_MS = FLIGHT_MS + 650
const BATCH_MS = 5000

export function adaptEarthFlights(arcs: readonly EarthArcData[]): EarthArcData[] {
  return arcs.map(arc => arc.source === 'upstream' ? { ...arc, from: arc.to, to: arc.from } : { ...arc })
}

export function stableFlightHash(id: string): number {
  let hash = 2166136261
  for (const char of id)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return hash >>> 0
}

export function flightProgress(mode: EarthArcMode, id: string, ids: readonly string[], elapsed: number): number | null {
  if (mode === 'off' || !ids.includes(id))
    return null
  let age: number
  if (mode === 'auto') {
    const ordered = [...ids].sort()
    const index = ordered.indexOf(id)
    const batch = Math.floor(elapsed / BATCH_MS) % Math.ceil(ordered.length / 3)
    if (Math.floor(index / 3) !== batch)
      return null
    age = elapsed % BATCH_MS - index % 3 * 650
  }
  else {
    age = (elapsed + stableFlightHash(id) % CYCLE_MS) % CYCLE_MS
  }
  return age >= 0 && age < FLIGHT_MS ? age / FLIGHT_MS : null
}

function coordinate([lat, lng]: readonly [number, number]): Vec3 {
  const a = lat * Math.PI / 180
  const b = lng * Math.PI / 180
  return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)]
}

/** Globe.gl coordinates, unit globe radius; endpoints sit at the node label altitude. */
export function arcPoint(from: readonly [number, number], to: readonly [number, number], t: number): Vec3 {
  const a = coordinate(from)
  const b = coordinate(to)
  const dot = Math.max(-1, Math.min(1, a.reduce((sum, v, i) => sum + v * b[i]!, 0)))
  const angle = Math.acos(dot)
  let tangent = b.map((v, i) => v - dot * a[i]!)
  let length = Math.hypot(...tangent)
  if (length < 1e-8) {
    const axis = Math.abs(a[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
    const projection = axis.reduce((sum, v, i) => sum + v * a[i]!, 0)
    tangent = axis.map((v, i) => v - projection * a[i]!)
    length = Math.hypot(...tangent)
  }
  const radius = 1.012 + Math.sin(Math.PI * t) * Math.min(0.22, angle * 0.12)
  return a.map((v, i) => radius * (v * Math.cos(angle * t) + tangent[i]! / length * Math.sin(angle * t))) as unknown as Vec3
}

/** Segment from the camera to a point intersects the opaque unit sphere. */
export function isOccludedBySphere(point: Vec3, camera: Vec3): boolean {
  const ray = point.map((v, i) => v - camera[i]!)
  const length2 = ray.reduce((sum, v) => sum + v * v, 0)
  const t = -camera.reduce((sum, v, i) => sum + v * ray[i]!, 0) / length2
  if (t <= 0 || t >= 1)
    return false
  return camera.reduce((sum, v, i) => sum + (v + t * ray[i]!) ** 2, 0) < 1 - 1e-6
}

export function projectTrail(from: EarthArcData['from'], to: EarthArcData['to'], progress: number, project: EarthProjector) {
  const head = progress * 1.35
  const start = Math.max(0, head - 0.35)
  const end = Math.min(1, head)
  const first = project(arcPoint(from, to, start))
  const last = project(arcPoint(from, to, end))
  const commands: string[] = []
  let previous = first
  let previousT = start
  if (first.visible)
    commands.push(`M${first.x.toFixed(2)},${first.y.toFixed(2)}`)
  for (let i = 1; i <= 32; i++) {
    const t = start + (end - start) * i / 32
    const point = project(arcPoint(from, to, t))
    if (point.visible !== previous.visible) {
      // Bisect the limb intersection, so a partly occluded trail is not discarded.
      let low = previousT
      let high = t
      for (let j = 0; j < 8; j++) {
        const mid = (low + high) / 2
        if (project(arcPoint(from, to, mid)).visible === previous.visible)
          low = mid
        else high = mid
      }
      const edge = project(arcPoint(from, to, (low + high) / 2))
      commands.push(`${previous.visible ? 'L' : 'M'}${edge.x.toFixed(2)},${edge.y.toFixed(2)}`)
    }
    if (point.visible)
      commands.push(`L${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    previous = point
    previousT = t
  }
  return { d: commands.join(' '), first, last, headVisible: head <= 1 && last.visible }
}
