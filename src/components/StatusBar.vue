<template>
  <div class="app-statusbar no-print shrink-0" style="min-height: 28px;">
    <!-- Left -->
    <div class="flex items-center" style="gap: var(--card-gap);">
      <span>完成度 {{ store.overallCompletion }}%</span>
      <span class="save-status-dot" :class="store.saveStatus" style="display: inline-block;" />
      <Transition name="flash">
        <span v-if="showSavedFlash" class="save-flash">已保存到本地 ✓</span>
      </Transition>
    </div>

    <!-- Center -->
    <div class="flex items-center" style="gap: var(--normal-gap);">
      <template v-for="(phase, idx) in phases" :key="phase.key">
        <span class="flex items-center" style="gap: var(--list-gap);">
          <span
            class="status-dot"
            :class="{
              'is-done': phaseOrder.indexOf(store.currentPhase) > idx,
              'is-active': store.currentPhase === phase.key,
              'is-todo': phaseOrder.indexOf(store.currentPhase) < idx
            }"
          />
          {{ phase.label }}
        </span>
        <span v-if="idx < phases.length - 1" style="color: var(--sidebar-border);">·</span>
      </template>
    </div>

    <!-- Right -->
    <span class="flex items-center" style="gap: var(--normal-gap);">
      <Transition name="flash">
        <span v-if="showUndoToast" class="undo-toast">
          已删除「{{ store.lastDeleted?.label }}」
          <Button class="undo-link" @click="onUndo">撤销</Button>
        </span>
      </Transition>
      <Button
        class="ui-chip"
        :class="{ 'is-active': store.useNewModel }"
        :tip="store.useNewModel ? '当前：新模型（点击切换旧模型）' : '当前：旧模型（点击切换新模型）'"
        @click="store.toggleModel()"
      >
        <span class="status-dot" :class="store.useNewModel ? 'is-active' : 'is-todo'" />
        {{ store.useNewModel ? '新模型' : '旧模型' }}
      </Button>
      <span>
        <template v-if="store.useNewModel && store.docRef">
          元素 {{ store.getElements.length }}
          <template v-if="store.recycleBin.length > 0">
            · <span style="color: var(--accent-500);">回收站 {{ store.recycleBin.length }}</span>
          </template>
          ·
        </template>
        模块 {{ store.modules.length }} · {{ charCount }} 字符
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import Button from './ui/Button.vue'
import { ref, watch } from 'vue'
import { useResumeStore } from '../stores/resume'

defineProps<{ charCount: number }>()
const store = useResumeStore()

const showSavedFlash = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | null = null
watch(() => store.saveFlashAt, (ts) => {
  if (!ts) return
  showSavedFlash.value = true
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { showSavedFlash.value = false }, 2000)
})

const showUndoToast = ref(false)
let undoTimer: ReturnType<typeof setTimeout> | null = null
watch(() => store.undoToastAt, (ts) => {
  if (!ts) return
  showUndoToast.value = true
  if (undoTimer) clearTimeout(undoTimer)
  undoTimer = setTimeout(() => { showUndoToast.value = false }, 5000)
})
function onUndo() {
  store.undoLastDelete()
  showUndoToast.value = false
}

const phases = [
  { key: 'fill' as const, label: '填写' },
  { key: 'style' as const, label: '定制' },
  { key: 'export' as const, label: '导出' },
]
const phaseOrder = phases.map(p => p.key)
</script>
