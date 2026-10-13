import type { ChinaCarrierKey } from '@/utils/carrierPing'
import { nextTick, onScopeDispose, ref } from 'vue'
import { useAppStore } from '@/stores/app'

/** A gesture previews locally, then commits one shared reorder on a valid drop. */
export function useCarrierDrag() {
  const app = useAppStore()
  const dragging = ref<ChinaCarrierKey | null>(null)
  const target = ref<ChinaCarrierKey | null>(null)
  let cleanup: (() => void) | undefined
  let suppressClick = false

  function cancel(): void {
    cleanup?.()
    cleanup = undefined
    dragging.value = null
    target.value = null
  }

  function start(event: PointerEvent, key: ChinaCarrierKey): void {
    if (!event.isPrimary || event.button !== 0 || cleanup)
      return
    suppressClick = false
    const row = event.currentTarget as HTMLElement
    const panel = row.closest('[data-node-ping-bars]') as HTMLElement
    const x = event.clientX
    const y = event.clientY
    const touch = event.pointerType !== 'mouse'
    let timer: ReturnType<typeof setTimeout> | undefined
    const activate = () => {
      dragging.value = key
      target.value = key
      suppressClick = true
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
      const hovered = Array.from(panel.querySelectorAll<HTMLElement>('[data-carrier-key]')).find((element) => {
        const rect = element.getBoundingClientRect()
        return next.clientX >= rect.left && next.clientX <= rect.right && next.clientY >= rect.top && next.clientY <= rect.bottom
      })
      target.value = hovered?.dataset.carrierKey as ChinaCarrierKey | undefined ?? null
    }
    const finish = (next: PointerEvent) => {
      if (next.pointerId !== event.pointerId)
        return
      update(next)
      if (dragging.value && target.value)
        app.reorderCarrier(dragging.value, target.value)
      cancel()
    }
    const abort = (next: PointerEvent) => {
      if (next.pointerId === event.pointerId)
        cancel()
    }
    const keydown = (next: KeyboardEvent) => {
      if (next.key === 'Escape') {
        next.preventDefault()
        next.stopPropagation()
        cancel()
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
    window.addEventListener('blur', cancel)
    cleanup = () => {
      clearTimeout(timer)
      window.removeEventListener('pointermove', update)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', abort)
      window.removeEventListener('keydown', keydown, true)
      window.removeEventListener('touchmove', preventScroll)
      window.removeEventListener('blur', cancel)
    }
    if (touch)
      timer = setTimeout(activate, 350)
  }

  function click(event: MouseEvent): boolean {
    if (suppressClick && event.detail !== 0) {
      event.preventDefault()
      event.stopImmediatePropagation()
      suppressClick = false
      return true
    }
    return false
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

  onScopeDispose(cancel)
  return { dragging, target, start, click, keyboard }
}
