<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="resume-preview-overlay" />
      <DialogContent class="resume-preview-content">
        <DialogTitle class="sr-only">导出预览</DialogTitle>
        <div class="resume-preview-container">
          <!-- Toolbar -->
          <div class="resume-preview-toolbar no-print">
            <div class="resume-preview-toolbar-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>导出预览</span>
            </div>
            <div class="resume-preview-toolbar-center">
              <Button
                class="resume-preview-zoom-btn"
                @click="zoom = Math.max(0.5, zoom - 0.1)"
                :disabled="zoom <= 0.5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </Button>
              <span class="resume-preview-zoom-label">{{ Math.round(zoom * 100) }}%</span>
              <Button
                class="resume-preview-zoom-btn"
                @click="zoom = Math.min(2, zoom + 0.1)"
                :disabled="zoom >= 2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </Button>
              <Button class="resume-preview-zoom-btn" @click="zoom = 1" tip="重置缩放">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </Button>
            </div>
            <div class="resume-preview-toolbar-right">
              <Button class="resume-preview-pdf-btn" @click="exportPdfVector">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h3"/></svg>
                导出 PDF
              </Button>
              <Button class="resume-preview-close-btn" @click="emit('update:open', false)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </Button>
            </div>
          </div>

          <!-- Preview Area -->
          <div class="resume-preview-scroll" ref="scrollArea">
            <div class="resume-preview-page-wrapper" :style="{ transform: `scale(${zoom})`, transformOrigin: 'top center' }">
              <div class="resume-preview-page">
                <!-- 简洁预览版式（与导出完全一致） -->
                <div
                  class="resume-canvas-preview"
                  :style="canvasStyle"
                  v-html="renderedHtml"
                />
              </div>
            </div>
          </div>

          <!-- Bottom Hint -->
          <div class="resume-preview-hint no-print">
            此为预览版式，导出 PDF 与此完全一致
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import Button from './ui/Button.vue'
import { ref, computed, onMounted } from 'vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import { useResumeStore } from '../stores/resume'
import { generatePreviewHtml } from '../utils/previewPdf'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const store = useResumeStore()
const zoom = ref(0.85)
const scrollArea = ref<HTMLElement | null>(null)

const canvasStyle = computed(() => ({
  fontFamily: store.config.fontFamily,
  fontSize: `${store.config.fontSize}px`,
  lineHeight: String(store.config.lineHeight),
  padding: `${store.config.pageMargin}px`,
  color: 'var(--text-primary)',
}))

// Generate clean preview HTML from the current resume data
const renderedHtml = computed(() => {
  return generatePreviewHtml(store.modules, store.avatar)
})

// 矢量导出：使用浏览器原生打印（另存为 PDF），文字为矢量、放大不模糊，
// 长内容自动分页。实际打印内容由 App.vue 中的 .resume-print-root 提供。
function exportPdfVector() {
  window.print()
}

onMounted(() => {
  // Auto-scroll to top
  if (scrollArea.value) {
    scrollArea.value.scrollTop = 0
  }
})
</script>
