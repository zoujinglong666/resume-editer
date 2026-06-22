<template>
  <div class="app-statusbar no-print shrink-0">
    <!-- Left -->
    <div class="flex items-center" style="gap: var(--card-gap);">
      <span>完成度 {{ store.overallCompletion }}%</span>
      <span class="save-status-dot" :class="store.saveStatus" style="display: inline-block;" />
    </div>

    <!-- Center -->
    <div class="flex items-center" style="gap: var(--normal-gap);">
      <template v-for="(phase, idx) in phases" :key="phase.key">
        <span class="flex items-center" style="gap: var(--list-gap);">
          <span
            class="inline-block w-2 h-2 rounded-full"
            :class="{
              'bg-green-500': phaseOrder.indexOf(store.currentPhase) > idx,
              'bg-[var(--primary-500)]': store.currentPhase === phase.key,
              'bg-gray-600': phaseOrder.indexOf(store.currentPhase) < idx
            }"
          />
          {{ phase.label }}
        </span>
        <span v-if="idx < phases.length - 1" style="color: var(--sidebar-border);">·</span>
      </template>
    </div>

    <!-- Right -->
    <span class="flex items-center" style="gap: var(--normal-gap);">
      <button
        class="model-toggle-btn"
        :title="store.useNewModel ? '当前：新模型（点击切换旧模型）' : '当前：旧模型（点击切换新模型）'"
        @click="store.toggleModel()"
      >
        {{ store.useNewModel ? '⚡ 新模型' : '📄 旧模型' }}
      </button>
      <span>
        <template v-if="store.useNewModel && store.docRef">
          元素 {{ store.getElements.length }}
          <template v-if="store.recycleBin.length > 0">
            · <span style="color: #fbbf24;">回收站 {{ store.recycleBin.length }}</span>
          </template>
          ·
        </template>
        模块 {{ store.modules.length }} · {{ charCount }} 字符
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { useResumeStore } from '../stores/resume'

defineProps<{ charCount: number }>()
const store = useResumeStore()

const phases = [
  { key: 'fill' as const, label: '填写' },
  { key: 'style' as const, label: '定制' },
  { key: 'export' as const, label: '导出' },
]
const phaseOrder = phases.map(p => p.key)
</script>
