<script setup lang="ts">
import type { CarrierPingDisplay } from '@/composables/useNodeCarrierPingDisplay'
import { computed } from 'vue'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { useCarrierDrag } from '@/composables/useCarrierDrag'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  metric: 'latency' | 'loss'
  nodeName: string
  carriers: CarrierPingDisplay[]
  isTransit: boolean
}>()
const emit = defineEmits<{ open: [] }>()
const app = useAppStore()
const { dragging, target, start, click, keyboard } = useCarrierDrag()
const label = computed(() => props.metric === 'latency' ? '延迟' : '丢包')
const instruction = computed(() => app.lang === 'zh-CN'
  ? '拖动排序；手机长按拖动；Alt+上下键调整顺序，回车查看详情'
  : 'Drag to reorder; touch and hold on mobile; Alt+Up/Down to reorder, Enter for details')

function onClick(event: MouseEvent): void {
  event.stopPropagation()
  if (!click(event))
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
        class="carrier-sort-row flex min-h-0 min-w-0 cursor-grab select-none flex-col gap-[2px] rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
        :class="{ 'opacity-50 cursor-grabbing': dragging === carrier.key, 'outline-2 outline-primary': dragging && target === carrier.key }"
        :title="`${metric === 'latency' ? carrier.latencyTooltip : carrier.lossTooltip}\n${instruction}`"
        :aria-label="`${carrier.label} ${label}，${instruction}`"
        @pointerdown="start($event, carrier.key)"
        @dragstart.prevent
        @contextmenu.prevent
        @keydown.stop="onKeydown($event, carrier)"
      >
        <div class="flex min-w-0 items-center justify-between gap-1 text-[10px] leading-none">
          <span class="flex min-w-0 items-center gap-1 text-muted-foreground">
            <span class="size-1.5 shrink-0 rounded-full" :class="carrier.dotClass" />
            <span class="truncate">{{ carrier.label }}</span>
          </span>
          <span class="shrink-0 tabular-nums font-medium">{{ metric === 'latency' ? carrier.latencyDisplay : carrier.lossDisplay }}</span>
        </div>
        <div
          class="grid h-1.5 min-w-0 items-end gap-[1px] opacity-80 group-hover/panel:opacity-100"
          :style="{ gridTemplateColumns: `repeat(${(metric === 'latency' ? carrier.latencyBars : carrier.lossBars).length}, minmax(0, 1fr))` }"
        >
          <DataTooltip
            v-for="bar in (metric === 'latency' ? carrier.latencyBars : carrier.lossBars)" :key="bar.key"
            placement="top" :content="bar.tooltip" class="h-full w-full"
          >
            <span
              class="block h-full w-full rounded-[1px] transition-transform duration-150 group-hover/data-tooltip:scale-y-160 group-hover/panel:opacity-60 group-hover/data-tooltip:!opacity-100"
              :class="bar.className"
            />
          </DataTooltip>
        </div>
      </div>
    </div>
    <span aria-live="polite" class="sr-only">{{ carriers.map(carrier => carrier.label).join('、') }}</span>
  </div>
</template>

<style scoped>
.carrier-sort-row {
  -webkit-touch-callout: none;
}
</style>
