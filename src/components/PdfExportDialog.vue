<template>
  <div class="export-dialog-overlay" @click.self="$emit('close')">
    <div class="export-dialog">
      <!-- Header -->
      <div class="export-dialog-header">
        <div class="export-dialog-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出简历
        </div>
        <button @click="$emit('close')" class="export-dialog-close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Body -->
      <div class="export-dialog-body">
        <!-- Export Mode Tabs -->
        <div class="export-mode-tabs">
          <button
            v-for="m in exportModes"
            :key="m.value"
            @click="mode = m.value"
            class="export-mode-tab"
            :class="{ active: mode === m.value }"
          >
            <svg v-if="m.value === 'pdf'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h3"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            {{ m.label }}
          </button>
        </div>

        <!-- PDF Options -->
        <template v-if="mode === 'pdf'">
          <div class="export-form-group">
            <label class="export-form-label">纸张尺寸</label>
            <div class="export-select-wrapper">
              <select v-model="pdfConfig.paperSize" class="export-select">
                <option value="a4">A4 (210 × 297 mm)</option>
                <option value="letter">Letter (8.5 × 11 in)</option>
              </select>
              <svg class="export-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div class="export-form-group">
            <div class="export-range-header">
              <label class="export-form-label">页边距</label>
              <span class="export-range-value">{{ pdfConfig.margin }} mm</span>
            </div>
            <input type="range" min="0" max="15" step="1" v-model.number="pdfConfig.margin" class="export-range" />
            <div class="export-range-labels">
              <span>无</span>
              <span>较宽</span>
            </div>
          </div>
        </template>

        <!-- Image Options -->
        <template v-if="mode === 'image'">
          <div class="export-form-group">
            <label class="export-form-label">图片格式</label>
            <div class="export-select-wrapper">
              <select v-model="imgConfig.format" class="export-select">
                <option value="png">PNG — 无损，适合打印</option>
                <option value="jpeg">JPEG — 压缩，文件更小</option>
              </select>
              <svg class="export-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div v-if="imgConfig.format === 'jpeg'" class="export-form-group">
            <div class="export-range-header">
              <label class="export-form-label">图片质量</label>
              <span class="export-range-value">{{ imgConfig.quality }}%</span>
            </div>
            <input type="range" min="60" max="100" step="5" v-model.number="imgConfig.quality" class="export-range" />
            <div class="export-range-labels">
              <span>较小文件</span>
              <span>最佳</span>
            </div>
          </div>

          <div class="export-form-group">
            <label class="export-form-label">分辨率倍率</label>
            <div class="export-select-wrapper">
              <select v-model="imgConfig.scale" class="export-select">
                <option :value="1">1× — 屏幕分辨率，最快</option>
                <option :value="2">2× — 标准，推荐</option>
                <option :value="3">3× — 高清，较慢</option>
                <option :value="4">4× — 超清，很慢</option>
              </select>
              <svg class="export-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div class="export-form-group">
            <div class="export-range-header">
              <label class="export-form-label">图片边距</label>
              <span class="export-range-value">{{ imgConfig.margin }} px</span>
            </div>
            <input type="range" min="0" max="80" step="4" v-model.number="imgConfig.margin" class="export-range" />
            <div class="export-range-labels">
              <span>无边距</span>
              <span>较宽</span>
            </div>
          </div>
        </template>

        <!-- Shared: Quality (PDF only) -->
        <div v-if="mode === 'pdf'" class="export-form-group">
          <label class="export-form-label">导出质量</label>
          <div class="export-select-wrapper">
            <select v-model="pdfConfig.scale" class="export-select">
              <option :value="2">标准 (2×)</option>
              <option :value="3">高清 (3×)</option>
            </select>
            <svg class="export-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        <!-- Shared: Include Background -->
        <label class="export-checkbox">
          <input type="checkbox" v-model="sharedConfig.includeBackground" />
          <span class="export-checkbox-box">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span class="export-checkbox-label">包含背景色（白色）</span>
        </label>

        <!-- Filename -->
        <div class="export-form-group">
          <label class="export-form-label">文件名</label>
          <input type="text" v-model="sharedConfig.filename" class="export-input" />
        </div>

        <!-- Progress -->
        <div v-if="isExporting" class="export-progress">
          <div class="export-progress-header">
            <span class="export-progress-text">{{ progressText }}</span>
            <span class="export-progress-percent">{{ progress }}%</span>
          </div>
          <div class="export-progress-track">
            <div class="export-progress-bar" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="errorMsg" class="export-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ errorMsg }}
        </div>
      </div>

      <!-- Footer -->
      <div class="export-dialog-footer">
        <button @click="$emit('close')" class="export-btn export-btn--secondary">
          取消
        </button>
        <button
          @click="handleExport"
          :disabled="isExporting"
          class="export-btn export-btn--primary"
        >
          <svg v-if="isExporting" class="export-btn-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          {{ isExporting ? '生成中...' : exportBtnLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useResumeStore } from '../stores/resume'

const props = defineProps<{
  canvasRef: any
}>()

const emit = defineEmits(['close'])

// ── Export Mode ────────────────────────────────────────────────
type ExportMode = 'pdf' | 'image'
const mode = ref<ExportMode>('pdf')

const exportModes = [
  { value: 'pdf' as const, label: 'PDF' },
  { value: 'image' as const, label: '图片' },
]

// ── Configs ─────────────────────────────────────────────────────
const pdfConfig = reactive({
  paperSize: 'a4' as 'a4' | 'letter',
  margin: 5,
  scale: 2,
})

const imgConfig = reactive({
  format: 'png' as 'png' | 'jpeg',
  quality: 92,
  scale: 2,
  margin: 0,
})

const sharedConfig = reactive({
  includeBackground: true,
  filename: `简历-${new Date().toISOString().slice(0, 10)}`,
})

// ── State ───────────────────────────────────────────────────────
const isExporting = ref(false)
const progress = ref(0)
const progressText = ref('')
const errorMsg = ref('')

const exportBtnLabel = computed(() => {
  if (mode.value === 'pdf') return '导出 PDF'
  return `导出 ${imgConfig.format.toUpperCase()}`
})

// ── Capture canvas using html2canvas onclone ──
async function captureCanvas(
  originalEl: HTMLElement,
  scale: number,
  marginPx: number = 0,
): Promise<HTMLCanvasElement> {
  const store = useResumeStore()
  const prevSelectedId = store.selectedModuleId

  store.selectedModuleId = null
  await new Promise(resolve => requestAnimationFrame(resolve))
  await new Promise(resolve => setTimeout(resolve, 50))

  await document.fonts.ready

  const canvas = await html2canvas(originalEl, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: sharedConfig.includeBackground ? '#FFFFFF' : null,
    logging: true,
    removeContainer: false,
    imageTimeout: 30000,
    onclone: (clonedDoc) => {
      const clonedCanvas = clonedDoc.getElementById('resume-canvas')
      if (!clonedCanvas) return

      clonedCanvas.classList.add('export-clean')

      clonedCanvas.querySelectorAll<HTMLElement>('.module-section').forEach(section => {
        section.classList.remove('is-selected')
        Array.from(section.children).forEach(child => {
          if (child instanceof HTMLElement) {
            const style = child.getAttribute('style') || ''
            const isAbsoluteOverlay =
              style.includes('position: absolute') ||
              style.includes('position:absolute') ||
              child.classList.contains('absolute') ||
              child.classList.contains('pointer-events-none')
            if (isAbsoluteOverlay && !child.innerText.trim()) {
              child.remove()
            }
          }
        })
      })

      clonedCanvas.querySelectorAll<HTMLElement>('[contenteditable="true"]').forEach(el => {
        el.removeAttribute('contenteditable')
        el.style.background = ''
        el.style.boxShadow = ''
        el.style.outline = ''
        el.style.border = ''
      })
    },
  })

  store.selectedModuleId = prevSelectedId

  if (marginPx > 0) {
    const margin = marginPx * scale
    const newCanvas = document.createElement('canvas')
    newCanvas.width = canvas.width + margin * 2
    newCanvas.height = canvas.height + margin * 2
    const ctx = newCanvas.getContext('2d')!
    if (sharedConfig.includeBackground) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, newCanvas.width, newCanvas.height)
    }
    ctx.drawImage(canvas, margin, margin)
    return newCanvas
  }

  return canvas
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function getPaperDims(paperSize: 'a4' | 'letter'): { w: number; h: number } {
  if (paperSize === 'a4') return { w: 210, h: 297 }
  return { w: 215.9, h: 279.4 }
}

async function handleExport() {
  if (mode.value === 'pdf') {
    await exportPdf()
  } else {
    await exportImage()
  }
}

async function exportImage() {
  isExporting.value = true
  progress.value = 0
  errorMsg.value = ''

  try {
    const originalCanvas = document.getElementById('resume-canvas') as HTMLElement
    if (!originalCanvas) throw new Error('找不到画布元素')

    progress.value = 20
    progressText.value = '正在渲染画布...'

    const canvas = await captureCanvas(originalCanvas, imgConfig.scale, imgConfig.margin)

    progress.value = 80
    progressText.value = '正在生成图片...'

    const mimeType = imgConfig.format === 'jpeg' ? 'image/jpeg' : 'image/png'
    const quality = imgConfig.format === 'jpeg' ? imgConfig.quality / 100 : undefined
    const dataUrl = canvas.toDataURL(mimeType, quality)

    const ext = imgConfig.format === 'jpeg' ? 'jpg' : 'png'
    const fileName = sharedConfig.filename.endsWith(`.${ext}`)
      ? sharedConfig.filename
      : `${sharedConfig.filename}.${ext}`

    downloadDataUrl(dataUrl, fileName)

    progress.value = 100
    progressText.value = '完成！'

    setTimeout(() => emit('close'), 500)

  } catch (err: any) {
    console.error('Image Export error:', err)
    errorMsg.value = err.message || '图片导出失败，请重试'
  } finally {
    isExporting.value = false
  }
}

async function exportPdf() {
  isExporting.value = true
  progress.value = 0
  errorMsg.value = ''

  try {
    const originalCanvas = document.getElementById('resume-canvas') as HTMLElement
    if (!originalCanvas) throw new Error('找不到画布元素')

    progress.value = 10
    progressText.value = '正在准备导出...'

    const canvas = await captureCanvas(originalCanvas, pdfConfig.scale, 0)

    progress.value = 65
    progressText.value = '正在生成 PDF...'

    const imgData = canvas.toDataURL('image/png', 1.0)
    const imgPixelW = canvas.width
    const imgPixelH = canvas.height

    const { w: pageW_mm, h: pageH_mm } = getPaperDims(pdfConfig.paperSize)
    const contentW_mm = pageW_mm - pdfConfig.margin * 2
    const contentH_mm = pageH_mm - pdfConfig.margin * 2

    const imgAspect = imgPixelW / imgPixelH
    const imgW_mm = contentW_mm
    const imgH_mm = imgW_mm / imgAspect

    const orientation = imgAspect < 1 ? 'portrait' : 'landscape'
    const pdf = new jsPDF({ orientation, unit: 'mm', format: pdfConfig.paperSize })

    if (imgH_mm <= contentH_mm) {
      const offsetY = pdfConfig.margin + Math.max(0, (contentH_mm - imgH_mm) / 2)
      pdf.addImage(imgData, 'PNG', pdfConfig.margin, offsetY, imgW_mm, imgH_mm)
    } else {
      const totalPages = Math.ceil(imgH_mm / contentH_mm)

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage([pageW_mm, pageH_mm], orientation)

        const srcPixelY = (i * contentH_mm / imgH_mm) * imgPixelH
        const slicePixelH = Math.min((contentH_mm / imgH_mm) * imgPixelH, imgPixelH - srcPixelY)
        const destH_mm = Math.min(contentH_mm, imgH_mm - i * contentH_mm)

        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = imgPixelW
        pageCanvas.height = Math.ceil(slicePixelH)
        const ctx = pageCanvas.getContext('2d')!
        ctx.drawImage(canvas, 0, srcPixelY, imgPixelW, slicePixelH, 0, 0, imgPixelW, slicePixelH)

        const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
        pdf.addImage(pageImgData, 'PNG', pdfConfig.margin, pdfConfig.margin, imgW_mm, destH_mm)

        progress.value = 65 + Math.round((i / totalPages) * 30)
        progressText.value = `正在处理第 ${i + 1}/${totalPages} 页...`
      }
    }

    progress.value = 100
    progressText.value = '完成！'

    const fileName = sharedConfig.filename.endsWith('.pdf') ? sharedConfig.filename : `${sharedConfig.filename}.pdf`
    pdf.save(fileName)

    setTimeout(() => emit('close'), 500)

  } catch (err: any) {
    console.error('PDF Export error:', err)
    errorMsg.value = err.message || 'PDF 导出失败，请重试'
  } finally {
    isExporting.value = false
  }
}
</script>
