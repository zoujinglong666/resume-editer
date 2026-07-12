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
      @export-image="handleExportImage"
      @ai-optimize="showAiOptimize = true"
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

    <!-- AI 优化入口（预留：对接外部 AI Agent） -->
    <AiOptimizeDialog v-model:open="showAiOptimize" />

    <!-- 快捷键帮助浮层 -->
    <ShortcutHelpDialog v-model:open="showShortcuts" />

    <!-- Hidden file input -->
    <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="onFileSelected" />

    <!-- 画布内浮动富文本工具栏 -->
    <FloatingToolbar />

    <!-- 全局 Toast 通知 -->
    <ToastContainer />
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
import AiOptimizeDialog from './components/AiOptimizeDialog.vue'
import ShortcutHelpDialog from './components/ShortcutHelpDialog.vue'
import ToastContainer from './components/ToastContainer.vue'
import { generatePreviewHtml, exportResumeImage } from './utils/previewPdf'
import { showAlert, showConfirm } from './utils/confirm'

const store = useResumeStore()
const showPreview = ref(false)
const showAiOptimize = ref(false)
const showShortcuts = ref(false)
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
  // Ctrl/Cmd + S: 立即保存到本地 + 状态栏提示
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    store.saveNow()
  }
  // Ctrl/Cmd + Shift + S: 导出 JSON 备份
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
    e.preventDefault()
    handleExport()
  }
  // Ctrl/Cmd + P: 浏览器原生矢量打印导出 PDF
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault()
    exportVectorPdf()
  }
  // Ctrl/Cmd + D: 复制当前条目
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'd') {
    if (store.selectedItemId && store.selectedModuleId) {
      e.preventDefault()
      store.duplicateItem(store.selectedModuleId, store.selectedItemId)
    }
  }
  // Ctrl/Cmd + Enter: 在当前条目后新增一条
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (store.selectedItemId && store.selectedModuleId) {
      e.preventDefault()
      store.addItem(store.selectedModuleId, store.selectedItemId)
    }
  }
  // Esc: 取消当前模块 / 条目选中
  if (e.key === 'Escape') {
    if (store.selectedModuleId || store.selectedItemId) {
      store.selectItem(null)
      store.selectModule(null)
    }
  }
  // ? 或 Ctrl/Cmd + / : 打开快捷键帮助
  if (e.key === '?' || ((e.ctrlKey || e.metaKey) && e.key === '/')) {
    e.preventDefault()
    showShortcuts.value = true
  }
}

function handleImport() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result as string)
      store.importData(data)
      await showAlert({ title: '导入成功', description: '简历数据已成功导入。' })
    } catch {
      await showAlert({ title: '导入失败', description: '文件格式错误，请选择有效的 JSON 文件。' })
    }
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

async function handleReset() {
  const ok = await showConfirm({
    title: '重置内容',
    description: '确定要重置所有内容吗？此操作不可撤销。',
  })
  if (ok) store.resetToDefault()
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

const isExportingImage = ref(false)
async function handleExportImage() {
  if (isExportingImage.value) return
  isExportingImage.value = true
  try {
    await exportResumeImage(store.modules, store.avatar, {
      fontFamily: store.config.fontFamily,
      fontSize: store.config.fontSize,
      lineHeight: store.config.lineHeight,
      pageMargin: store.config.pageMargin,
      primaryColor: store.config.primaryColor,
    })
  } catch (err) {
    console.error('导出图片失败', err)
    await showAlert({ title: '导出失败', description: '导出图片失败，请重试。' })
  } finally {
    isExportingImage.value = false
  }
}
</script>
