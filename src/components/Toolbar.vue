<template>
  <div class="h-12 flex items-center justify-between px-4 bg-white border-b border-[var(--border-color)] no-print shrink-0">
    <!-- Left: Logo + Undo/Redo -->
    <div class="flex items-center" style="gap: var(--normal-gap);">
      <span class="text-lg font-bold" style="color: var(--primary-color)">📄 简历编辑器</span>
      <div class="flex items-center border-l border-[var(--border-color)]" style="gap: var(--space-1); padding-left: var(--normal-gap);">
        <button
          @click="store.undo()"
          :disabled="!store.canUndo"
          class="rounded-md text-sm hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style="padding: var(--space-1_5);"
          title="撤销 (Ctrl+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
        </button>
        <button
          @click="store.redo()"
          :disabled="!store.canRedo"
          class="rounded-md text-sm hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style="padding: var(--space-1_5);"
          title="重做 (Ctrl+Y)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/></svg>
        </button>
      </div>
    </div>

    <!-- Center: Actions -->
    <div class="flex items-center" style="gap: var(--tight-gap);">
      <button @click="$emit('export-pdf')" class="rounded-md text-sm font-medium text-white transition-all hover:opacity-90" style="padding: var(--space-1_5) var(--normal-gap); background: var(--primary-color)">
        导出
      </button>
      <button @click="$emit('export-json')" class="rounded-md text-sm border border-[var(--border-color)] hover:bg-gray-50 transition-all" style="padding: var(--space-1_5) var(--normal-gap);">
        导出 JSON
      </button>
      <button @click="$emit('import-json')" class="rounded-md text-sm border border-[var(--border-color)] hover:bg-gray-50 transition-all" style="padding: var(--space-1_5) var(--normal-gap);">
        导入 JSON
      </button>
      <button @click="$emit('reset')" class="rounded-md text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-all" style="padding: var(--space-1_5) var(--normal-gap);">
        重置
      </button>
    </div>

    <!-- Right: spacer -->
    <div class="w-32 text-right text-xs text-gray-400">
      <span v-if="store.lastSaved">自动保存 {{ formatTime(store.lastSaved) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResumeStore } from '../stores/resume'

const store = useResumeStore()

defineEmits(['export-pdf', 'import-json', 'export-json', 'reset'])

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  } catch { return '' }
}
</script>
