import type { ChinaCarrierKey } from './carrierPing'

export const DEFAULT_CARRIER_ORDER: readonly ChinaCarrierKey[] = ['unicom', 'telecom', 'mobile']

export function normalizeCarrierOrder(value: unknown): ChinaCarrierKey[] {
  const entries = Array.isArray(value) ? value : []
  return [...new Set([...entries.filter((key): key is ChinaCarrierKey => DEFAULT_CARRIER_ORDER.includes(key)), ...DEFAULT_CARRIER_ORDER])]
}

export function moveCarrier(order: readonly ChinaCarrierKey[], source: ChinaCarrierKey, target: ChinaCarrierKey): ChinaCarrierKey[] {
  const next = normalizeCarrierOrder(order)
  const index = next.indexOf(target)
  next.splice(next.indexOf(source), 1)
  next.splice(index, 0, source)
  return next
}
