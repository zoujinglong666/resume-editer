<template>
  <div class="progress-ring-container">
    <svg class="progress-ring-svg" width="64" height="64" viewBox="0 0 64 64">
      <circle class="progress-ring-bg" cx="32" cy="32" r="28" />
      <circle
        class="progress-ring-fill"
        cx="32" cy="32" r="28"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
      <text
        class="progress-ring-text"
        x="32" y="32"
      >{{ percentage }}%</text>
    </svg>
    <span class="text-xs" style="color: var(--sidebar-muted);">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  percentage: number
  label?: string
}>()

const circumference = 2 * Math.PI * 28 // ~175.93
const dashOffset = computed(() => {
  return circumference - (props.percentage / 100) * circumference
})
</script>
