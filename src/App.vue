<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- Header -->
    <PhaseBar
      @export-pdf="showPdfDialog = true"
      @import-json="handleImport"
      @export-json="handleExport"
      @reset="handleReset"
      @preview="showPreview = true"
      @quick-export-pdf="handleQuickExportPdf"
    />

    <!-- Main Content -->
    <div class="app-main">
      <GuidePanel
        @export-pdf="showPdfDialog = true"
        @export-json="handleExport"
        @import-json="handleImport"
        @export-docx="handleExportDocx"
        @export-md="handleExportMd"
        @export-html="handleExportHtml"
      />
      <Canvas ref="canvasRef" />
      <EditorPanel />
    </div>

    <!-- Status Bar -->
    <StatusBar :char-count="store.charCount" />

    <!-- Floating Toolbar -->
    <FloatingToolbar />

    <!-- Floating AI -->
    <FloatingAI />

    <!-- PDF Export Dialog -->
    <PdfExportDialog v-if="showPdfDialog" :canvas-ref="canvasRef" @close="showPdfDialog = false" />

    <!-- Resume Preview Dialog -->
    <ResumePreviewDialog
      v-if="showPreview"
      @close="showPreview = false"
      @export="showPreview = false; showPdfDialog = true"
    />

    <!-- Hidden file input -->
    <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="onFileSelected" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useResumeStore } from './stores/resume'
import PhaseBar from './components/PhaseBar.vue'
import GuidePanel from './components/GuidePanel.vue'
import Canvas from './components/Canvas.vue'
import EditorPanel from './components/EditorPanel.vue'
import StatusBar from './components/StatusBar.vue'
import FloatingToolbar from './components/FloatingToolbar.vue'
import FloatingAI from './components/FloatingAI.vue'
import PdfExportDialog from './components/PdfExportDialog.vue'
import ResumePreviewDialog from './components/ResumePreviewDialog.vue'
import { exportPreviewPdf } from './utils/previewPdf'
import { exportToMarkdown, exportToHtml, exportToDocx } from './utils/exportFormats'

const store = useResumeStore()
const canvasRef = ref<InstanceType<typeof Canvas> | null>(null)
const showPdfDialog = ref(false)
const showPreview = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

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
  // Ctrl/Cmd + P: Export PDF
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault()
    showPdfDialog.value = true
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
async function handleQuickExportPdf() {
  if (isQuickExporting.value) return
  isQuickExporting.value = true
  try {
    await exportPreviewPdf(store.modules, store.avatar, store.config)
  } catch (err) {
    console.error('Quick PDF export failed:', err)
    alert('导出失败，请重试')
  } finally {
    isQuickExporting.value = false
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function handleExportDocx() {
  exportToDocx(store.modules, store.config).then(blob => {
    downloadBlob(blob, `resume-${new Date().toISOString().slice(0, 10)}.docx`)
  }).catch(err => {
    console.error('DOCX export failed:', err)
    alert('DOCX 导出失败，请重试')
  })
}

function handleExportMd() {
  const md = exportToMarkdown(store.modules, store.avatar)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  downloadBlob(blob, `resume-${new Date().toISOString().slice(0, 10)}.md`)
}

function handleExportHtml() {
  const html = exportToHtml(store.modules, store.config)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  downloadBlob(blob, `resume-${new Date().toISOString().slice(0, 10)}.html`)
}
</script>
