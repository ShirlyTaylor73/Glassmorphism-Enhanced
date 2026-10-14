import type { ChinaCarrierKey } from '@/utils/carrierPing'
import { computed, nextTick, onScopeDispose, ref } from 'vue'
import { useAppStore } from '@/stores/app'

/** A gesture previews locally, then commits one shared reorder on a valid drop. */
export function useCarrierDrag(reduceMotion: () => boolean = () => false) {
  const app = useAppStore()
  const dragging = ref<ChinaCarrierKey | null>(null)
  const target = ref<ChinaCarrierKey | null>(null)
  const floating = ref<{ left: number, top: number, width: number, height: number } | null>(null)
  const offsets = ref<Partial<Record<ChinaCarrierKey, number>>>({})
  const settling = ref(false)
  const floatingStyle = computed(() => floating.value
    ? {
        left: `${floating.value.left}px`,
        top: `${floating.value.top}px`,
        width: `${floating.value.width}px`,
        height: `${floating.value.height}px`,
      }
    : {})
  let settleTimer: ReturnType<typeof setTimeout> | undefined
  let restore: (() => void) | undefined
  let cleanup: (() => void) | undefined

  function clearClickGuard(): void {
    window.removeEventListener('click', blockDragClick, true)
    window.removeEventListener('pointerdown', clearClickGuard, true)
  }

  function blockDragClick(event: MouseEvent): void {
    if (event.detail === 0)
      return
    event.preventDefault()
    event.stopImmediatePropagation()
    clearClickGuard()
  }

  function cancel(): void {
    cleanup?.()
    cleanup = undefined
    clearTimeout(settleTimer)
    floating.value = null
    offsets.value = {}
    settling.value = false
    restore = undefined
    dragging.value = null
    target.value = null
  }

  function start(event: PointerEvent, key: ChinaCarrierKey): void {
    if (!event.isPrimary || event.button !== 0 || cleanup || settling.value)
      return
    clearClickGuard()
    const row = event.currentTarget as HTMLElement
    const panel = row.closest('[data-node-ping-bars]') as HTMLElement
    const rows = Array.from(panel.querySelectorAll<HTMLElement>('[data-carrier-key]'))
    const keys = rows.map(element => element.dataset.carrierKey as ChinaCarrierKey)
    const boxes = rows.map(element => element.getBoundingClientRect())
    const sourceIndex = keys.indexOf(key)
    const origin = boxes[sourceIndex]!
    const panelBox = panel.getBoundingClientRect()
    const noMotion = reduceMotion() || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let destination = sourceIndex
    const land = (commit: boolean) => {
      if (!dragging.value) {
        cancel()
        return
      }
      cleanup?.()
      cleanup = undefined
      const index = commit ? destination : sourceIndex
      if (!commit)
        offsets.value = {}
      settling.value = true
      floating.value = { left: origin.left, top: boxes[index]!.top, width: origin.width, height: origin.height }
      const complete = () => {
        if (commit)
          app.reorderCarrier(key, keys[index]!)
        cancel()
      }
      if (noMotion)
        complete()
      else settleTimer = setTimeout(complete, 160)
    }
    restore = () => land(false)
    const x = event.clientX
    const y = event.clientY
    const touch = event.pointerType !== 'mouse'
    let timer: ReturnType<typeof setTimeout> | undefined
    const activate = () => {
      dragging.value = key
      target.value = key
      floating.value = { left: origin.left, top: origin.top, width: origin.width, height: origin.height }
      // The release can land outside this panel, including on the enclosing node card.
      window.addEventListener('click', blockDragClick, true)
      window.addEventListener('pointerdown', clearClickGuard, true)
    }
    const update = (next: PointerEvent) => {
      if (next.pointerId !== event.pointerId)
        return
      const distance = Math.hypot(next.clientX - x, next.clientY - y)
      if (!dragging.value) {
        if (touch && distance > 8) {
          cancel()
          return
        }
        if (!touch && distance >= 6)
          activate()
      }
      if (!dragging.value)
        return
      floating.value = { left: origin.left + next.clientX - x, top: origin.top + next.clientY - y, width: origin.width, height: origin.height }
      const inside = next.clientX >= panelBox.left && next.clientX <= panelBox.right && next.clientY >= boxes[0]!.top && next.clientY <= boxes.at(-1)!.bottom
      if (inside) {
        destination = boxes.filter((box, index) => index !== sourceIndex && next.clientY > box.top + box.height / 2).length
        target.value = keys[destination]!
      }
      else {
        destination = sourceIndex
        target.value = null
      }
      const preview = [...keys]
      preview.splice(sourceIndex, 1)
      preview.splice(destination, 0, key)
      offsets.value = Object.fromEntries(keys.map((item, index) => [item, boxes[preview.indexOf(item)]!.top - boxes[index]!.top]))
    }
    const finish = (next: PointerEvent) => {
      if (next.pointerId !== event.pointerId)
        return
      update(next)
      land(!!target.value)
    }
    const abort = (next: PointerEvent) => {
      if (next.pointerId === event.pointerId)
        land(false)
    }
    const keydown = (next: KeyboardEvent) => {
      if (next.key === 'Escape') {
        next.preventDefault()
        next.stopPropagation()
        land(false)
      }
    }
    const preventScroll = (next: TouchEvent) => {
      if (dragging.value && next.cancelable)
        next.preventDefault()
    }
    window.addEventListener('pointermove', update)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', abort)
    window.addEventListener('keydown', keydown, true)
    window.addEventListener('touchmove', preventScroll, { passive: false })
    window.addEventListener('blur', onBlur)
    window.addEventListener('scroll', onBlur, true)
    window.addEventListener('resize', onBlur)
    cleanup = () => {
      clearTimeout(timer)
      window.removeEventListener('pointermove', update)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', abort)
      window.removeEventListener('keydown', keydown, true)
      window.removeEventListener('touchmove', preventScroll)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('scroll', onBlur, true)
      window.removeEventListener('resize', onBlur)
    }
    if (touch)
      timer = setTimeout(activate, 350)
  }

  function onBlur(): void {
    restore?.()
  }

  function keyboard(event: KeyboardEvent, key: ChinaCarrierKey): void {
    if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key))
      return
    event.preventDefault()
    const index = app.carrierOrder.indexOf(key) + (event.key === 'ArrowUp' ? -1 : 1)
    const adjacent = app.carrierOrder[index]
    if (adjacent) {
      const row = event.currentTarget as HTMLElement
      app.reorderCarrier(key, adjacent)
      void nextTick(() => row.focus({ preventScroll: true }))
    }
  }

  onScopeDispose(() => {
    cancel()
    clearClickGuard()
  })
  return { dragging, target, floating, floatingStyle, offsets, settling, start, keyboard }
}
