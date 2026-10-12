import { onActivated, onScopeDispose, ref } from 'vue'

export function useAdminNavigation() {
  const navigating = ref(false)
  function resetNavigation() {
    navigating.value = false
  }
  onActivated(resetNavigation)
  window.addEventListener('pageshow', resetNavigation)
  onScopeDispose(() => window.removeEventListener('pageshow', resetNavigation))

  function openAdmin() {
    if (navigating.value)
      return
    navigating.value = true
    try {
      window.location.assign('/admin')
    }
    catch (error) {
      resetNavigation()
      throw error
    }
  }
  return { openAdmin, navigating }
}
