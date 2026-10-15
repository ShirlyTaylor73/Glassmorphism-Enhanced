<script setup lang="ts">
import type { CarrierPingDisplay } from '@/composables/useNodeCarrierPingDisplay'
import { computed } from 'vue'
import CarrierPingCardContent from '@/components/CarrierPingCardContent.vue'
import { useCarrierDrag } from '@/composables/useCarrierDrag'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  metric: 'latency' | 'loss'
  nodeName: string
  carriers: CarrierPingDisplay[]
  isTransit: boolean
  reduceMotion?: boolean
}>()
const emit = defineEmits<{ open: [] }>()
const app = useAppStore()
const reducedMotion = computed(() => !!props.reduceMotion || app.disablePageAnimation)
const { dragging, floating, floatingStyle, offsets, settling, start, keyboard } = useCarrierDrag(() => reducedMotion.value)
const floatingCarrier = computed(() => props.carriers.find(carrier => carrier.key === dragging.value))
const label = computed(() => props.metric === 'latency' ? '延迟' : '丢包')
const instruction = computed(() => app.lang === 'zh-CN'
  ? '拖动排序；手机长按拖动；Alt+上下键调整顺序，回车查看详情'
  : 'Drag to reorder; touch and hold on mobile; Alt+Up/Down to reorder, Enter for details')

function onClick(event: MouseEvent): void {
  event.stopPropagation()
  emit('open')
}

function onKeydown(event: KeyboardEvent, carrier: CarrierPingDisplay): void {
  keyboard(event, carrier.key)
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('open')
  }
}
</script>

<template>
  <div
    role="group"
    :data-node-ping-bars="metric"
    :class="{ 'carrier-reduce-motion': reducedMotion, 'carrier-dragging': dragging }"
    class="group/panel relative flex flex-col rounded-lg bg-slate-500/5"
    :aria-label="`${nodeName} 三网${label}监测`"
    @click.capture="onClick"
    @keydown.stop
  >
    <button
      type="button"
      class="flex items-center justify-between text-[11px] leading-none"
      :aria-label="`${nodeName} 三网${label}监测`"
    >
      <span class="text-muted-foreground">{{ label }}</span>
      <span class="text-[10px] text-muted-foreground/70">{{ isTransit ? (app.lang === 'zh-CN' ? '中转估算' : 'Transit estimate') : '三网' }}</span>
    </button>
    <div class="grid min-h-0 flex-1 grid-rows-3 gap-1">
      <div
        v-for="carrier in carriers"
        :key="carrier.key"
        :data-carrier-ping="`${carrier.key}-${metric}`"
        :data-carrier-key="carrier.key"
        role="button"
        tabindex="0"
        class="carrier-sort-row flex min-h-0 min-w-0 cursor-grab select-none flex-col gap-[2px] focus-visible:outline-2 focus-visible:outline-ring"
        :class="{ 'carrier-placeholder cursor-grabbing': dragging === carrier.key }"
        :data-drag-placeholder="dragging === carrier.key"
        :style="{ transform: `translateY(${offsets[carrier.key] ?? 0}px)` }"
        :title="`${metric === 'latency' ? carrier.latencyTooltip : carrier.lossTooltip}\n${instruction}`"
        :aria-label="`${carrier.label} ${label}，${instruction}`"
        @pointerdown="start($event, carrier.key)"
        @dragstart.prevent
        @contextmenu.prevent
        @keydown.stop="onKeydown($event, carrier)"
      >
        <CarrierPingCardContent :carrier="carrier" :metric="metric" />
      </div>
    </div>
    <Teleport to="body">
      <div
        v-if="floating && floatingCarrier" data-carrier-drag-overlay aria-hidden="true"
        class="carrier-sort-row carrier-floating flex flex-col gap-[2px] rounded-md"
        :class="{ 'carrier-settling': settling, 'carrier-reduce-motion': reducedMotion }" :style="floatingStyle"
      >
        <CarrierPingCardContent :carrier="floatingCarrier" :metric="metric" />
      </div>
    </Teleport>
    <span aria-live="polite" class="sr-only">{{ carriers.map(carrier => carrier.label).join('、') }}</span>
  </div>
</template>

<style scoped>
.carrier-sort-row {
  -webkit-touch-callout: none;
  padding: 2px 4px;
  border-radius: 0.375rem;
  transition:
    box-shadow 160ms ease,
    background-color 160ms ease;
}
.carrier-sort-row:focus-visible {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--foreground) 35%, transparent);
}
@media (hover: hover) {
  .carrier-sort-row:hover:not(.carrier-placeholder) {
    background: var(--card);
    box-shadow:
      0 3px 10px rgb(0 0 0 / 12%),
      0 1px 3px rgb(0 0 0 / 8%);
  }
}
.carrier-dragging .carrier-sort-row {
  transition:
    transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 160ms ease;
}
.carrier-placeholder {
  background: color-mix(in srgb, var(--primary) 8%, transparent);
}
.carrier-placeholder > :deep(*) {
  visibility: hidden;
}
.carrier-floating {
  position: fixed;
  z-index: 150;
  pointer-events: none;
  background: var(--card);
  color: var(--card-foreground);
  transform: scale(1.035);
  box-shadow:
    0 8px 24px #0003,
    0 2px 6px #0002;
  transition: none;
}
.carrier-settling {
  transform: scale(1);
  transition:
    left 160ms ease-out,
    top 160ms ease-out,
    transform 160ms ease-out;
}
.carrier-reduce-motion .carrier-sort-row {
  transition: none;
}
.carrier-floating.carrier-reduce-motion {
  transition: none;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .carrier-dragging .carrier-sort-row,
  .carrier-floating {
    transition: none;
  }
  .carrier-floating {
    transform: none;
  }
}
</style>
