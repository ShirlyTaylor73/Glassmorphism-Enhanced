<script setup lang="ts">
import type { CarrierPingDisplay } from '@/composables/useNodeCarrierPingDisplay'
import { DataTooltip } from '@/components/ui/data-tooltip'

defineProps<{ carrier: CarrierPingDisplay, metric: 'latency' | 'loss' }>()
</script>

<template>
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
</template>
