import type { Ref } from 'vue'
import { useDocumentVisibility, useElementVisibility, usePreferredReducedMotion } from '@vueuse/core'
import { computed, onActivated, onDeactivated, ref } from 'vue'
import { useAppStore } from '@/stores/app'

export function useEarthMotion(container: Ref<HTMLElement | undefined>) {
  const app = useAppStore()
  const documentVisibility = useDocumentVisibility()
  const elementVisible = useElementVisibility(container)
  const preferred = usePreferredReducedMotion()
  const activated = ref(true)
  onActivated(() => {
    activated.value = true
  })
  onDeactivated(() => {
    activated.value = false
  })
  const reducedMotion = computed(() => app.disablePageAnimation || preferred.value === 'reduce')
  const shouldRender = computed(() => activated.value && documentVisibility.value === 'visible' && elementVisible.value)
  return { shouldRender, reducedMotion }
}
