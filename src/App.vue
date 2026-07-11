<template>
  <div class="app h-screen flex flex-col overflow-hidden">
    <!-- Header -->
    <PhaseBar
      @export-pdf="exportVectorPdf"
      @import-json="handleImport"
      @export-json="handleExport"
      @reset="handleReset"
      @preview="showPreview = true"
      @quick-export-pdf="handleQuickExportPdf"
    />

    <!-- Main Content -->
    <div class="app-main">
      <GuidePanel
        @export-pdf="exportVectorPdf"
        @export-json="handleExport"
        @import-json="handleImport"
      />
      <Canvas />
      <EditorPanel />
    </div>

    <!-- Status Bar -->
    <StatusBar :char-count="store.charCount" />

    <!-- Resume Preview Dialog -->
    <ResumePreviewDialog v-model:open="showPreview" />

    <!-- Hidden file input -->
    <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="onFileSelected" />

    <!-- 画布内浮动富文本工具栏 -->
    <FloatingToolbar />
  </div>

  <!-- 矢量导出专用根节点：平时隐藏，打印（另存为 PDF）时显示 -->
  <div class="resume-print-root" aria-hidden="true">
    <div class="resume-canvas-preview" :style="printStyle" v-html="printHtml" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useResumeStore } from './stores/resume'
import PhaseBar from './components/PhaseBar.vue'
import GuidePanel from './components/GuidePanel.vue'
import Canvas from './components/Canvas.vue'
import EditorPanel from './components/EditorPanel.vue'
import StatusBar from './components/StatusBar.vue'
import ResumePreviewDialog from './components/ResumePreviewDialog.vue'
import FloatingToolbar from './components/FloatingToolbar.vue'
import { generatePreviewHtml } from './utils/previewPdf'

const store = useResumeStore()
const showPreview = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 矢量导出：把同一份简洁预览 HTML 渲染到打印专用根节点，
// 由浏览器原生打印（另存为 PDF）输出，文字为矢量、放大不模糊。
const printHtml = computed(() => generatePreviewHtml(store.modules, store.avatar))
const printStyle = computed(() => ({
  fontFamily: store.config.fontFamily,
  fontSize: `${store.config.fontSize}px`,
  lineHeight: String(store.config.lineHeight),
  color: 'var(--text-primary)',
}))

function exportVectorPdf() {
  window.print()
}

// Initialize CSS vars from persisted config
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  // Apply theme colors on app load (after pinia-persisted hydration)
  store.applyCssVarsFromConfig()
  // Apply title style class
  document.documentElement.style.setProperty('--title-style', store.config.titleStyle || 'underline')
})
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  // Ctrl/Cmd + Z: Undo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    store.undo()
  }
  // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Redo
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    store.redo()
  }
  // Ctrl/Cmd + S: Export JSON (save)
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handleExport()
  }
  // Ctrl/Cmd + P: 浏览器原生矢量打印导出 PDF
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault()
    exportVectorPdf()
  }
}

function handleImport() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string)
      store.importData(data)
      alert('导入成功！')
    } catch { alert('文件格式错误，请选择有效的 JSON 文件') }
  }
  reader.readAsText(file)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function handleExport() {
  const data = store.exportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `resume-${new Date().toISOString().slice(0,10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleReset() {
  if (confirm('确定要重置所有内容吗？此操作不可撤销。')) {
    store.resetToDefault()
  }
}

const isQuickExporting = ref(false)
function handleQuickExportPdf() {
  if (isQuickExporting.value) return
  isQuickExporting.value = true
  try {
    exportVectorPdf()
  } finally {
    isQuickExporting.value = false
  }
}
</script>
