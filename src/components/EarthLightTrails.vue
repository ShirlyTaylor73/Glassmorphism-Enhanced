<script setup lang="ts">
import type { EarthArcData, EarthArcMode } from '@/utils/earthArcs'
import type { EarthProjector } from '@/utils/earthTrails'
import { computed, ref, useId, watch } from 'vue'
import { getEarthMeteorColors } from '@/utils/earthMeteor'
import { adaptEarthFlights, flightProgress, projectTrail, stableFlightHash } from '@/utils/earthTrails'

const props = defineProps<{
  arcs: EarthArcData[]
  mode: EarthArcMode
  active: boolean
  reducedMotion: boolean
  isDark: boolean
  project: EarthProjector
}>()
const root = ref<SVGSVGElement>()
const prefix = `earth-flight-${useId().replaceAll(':', '')}`
const flights = computed(() => adaptEarthFlights(props.arcs).map(arc => ({
  ...arc,
  gradient: `${prefix}-${stableFlightHash(arc.id)}`,
  colors: getEarthMeteorColors(props.isDark, stableFlightHash(arc.id)),
})))
let lastFrame = -Infinity

/** Driven by the renderer's existing frame loop; never starts a second RAF. */
function renderFrame(now: number): void {
  if (!root.value || now - lastFrame < 1000 / 30)
    return
  lastFrame = now
  const ids = flights.value.map(arc => arc.id)
  let activeCount = 0
  for (const group of root.value.querySelectorAll<SVGGElement>('[data-earth-flight]')) {
    const flight = flights.value.find(arc => arc.id === group.dataset.earthFlight)
    const progress = flight && props.active && !props.reducedMotion
      ? flightProgress(props.mode, flight.id, ids, now)
      : null
    if (!flight || progress === null) {
      group.style.display = 'none'
      continue
    }
    const trail = projectTrail(flight.from, flight.to, progress, props.project)
    group.style.display = trail.d ? '' : 'none'
    group.dataset.progress = progress.toFixed(4)
    const path = group.querySelector('path')!
    path.setAttribute('d', trail.d)
    const gradient = group.querySelector('linearGradient')!
    gradient.setAttribute('x1', String(trail.first.x))
    gradient.setAttribute('y1', String(trail.first.y))
    gradient.setAttribute('x2', String(trail.last.x + 0.001))
    gradient.setAttribute('y2', String(trail.last.y))
    const head = group.querySelector('circle')!
    head.setAttribute('cx', String(trail.last.x))
    head.setAttribute('cy', String(trail.last.y))
    head.style.display = trail.headVisible ? '' : 'none'
    if (trail.d)
      activeCount++
  }
  root.value.dataset.activeFlights = String(activeCount)
}

watch([() => props.active, () => props.reducedMotion, flights], () => {
  lastFrame = -Infinity
  renderFrame(performance.now())
}, { flush: 'post' })
defineExpose({ renderFrame })
</script>

<template>
  <svg ref="root" class="earth-light-trails" :class="{ 'earth-light-trails--light': !isDark }" data-earth-trails aria-hidden="true" :data-flight-mode="mode">
    <g v-for="flight in flights" :key="flight.id" :data-earth-flight="flight.id" :data-flight-from="flight.from.join(',')" :data-flight-to="flight.to.join(',')" style="display: none">
      <defs>
        <linearGradient :id="flight.gradient" gradientUnits="userSpaceOnUse">
          <stop offset="0" :stop-color="flight.colors.tail" />
          <stop offset="0.55" :stop-color="flight.colors.body" />
          <stop offset="1" :stop-color="flight.colors.head" />
        </linearGradient>
      </defs>
      <path fill="none" :stroke="`url(#${flight.gradient})`" stroke-width="1.6" stroke-linecap="round" />
      <circle r="1.1" :fill="flight.colors.head" />
    </g>
  </svg>
</template>

<style scoped>
.earth-light-trails {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 18;
  pointer-events: none;
  overflow: visible;
  filter: drop-shadow(0 0 2px rgb(103 232 249 / 0.6));
}
.earth-light-trails--light {
  filter: drop-shadow(0 0 1px rgb(255 255 255 / 0.85)) drop-shadow(0 1px 1px rgb(15 23 42 / 0.35));
}
.earth-light-trails--light path {
  stroke-width: 2;
}
</style>
