<template>
  <div class="app-sidebar no-print">
    <!-- Template Gallery Entry (persistent) -->
    <button class="template-gallery-trigger" @click="templateGalleryOpen = true">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      模板库 · 各行业专业简历
    </button>

    <!-- Phase 1: Fill mode -->
    <template v-if="store.currentPhase === 'fill'">
      <div class="panel-section">
        <div class="panel-section-title">完成进度</div>
        <ProgressRing
          :percentage="store.overallCompletion"
          :label="`${store.emptyModuleCount} 个模块待填写`"
        />
      </div>

      <div class="panel-section">
        <div class="panel-section-title">填写提示</div>
        <div class="text-xs leading-relaxed" style="color: var(--sidebar-muted); display: flex; flex-direction: column; gap: var(--normal-gap);">
          <p>点击左侧模块列表，或直接在画布上点击要编辑的模块。</p>
          <p>标题带 <span style="color: var(--color-error);">*</span> 的字段建议必填。</p>
          <p class="flex items-center" style="gap: var(--tight-gap);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/></svg>
            拖拽模块可调整顺序
          </p>
          <p>快捷键：<kbd style="padding: var(--space-0_5) var(--space-1); background: rgba(255,255,255,0.08); border-radius: 3px; font-size: 11px; font-family: var(--font-mono);">Ctrl+Z</kbd> 撤销，<kbd style="padding: var(--space-0_5) var(--space-1); background: rgba(255,255,255,0.08); border-radius: 3px; font-size: 11px; font-family: var(--font-mono);">Ctrl+Y</kbd> 重做</p>
        </div>
      </div>

      <div class="panel-section" style="border-bottom: none;">
        <div class="panel-section-title">模块填写状态</div>
        <div style="display: flex; flex-direction: column; gap: var(--space-0_5);">
          <div
            v-for="mod in store.modules"
            :key="mod.id"
            class="flex items-center justify-between text-xs cursor-pointer rounded transition-all"
            style="padding: var(--list-item-padding-y) var(--list-item-padding-x); color: var(--sidebar-text);"
            :style="store.selectedModuleId === mod.id ? 'background: rgba(99,102,241,0.12);' : ''"
            @mouseenter="($event.target as HTMLElement).style.background = store.selectedModuleId === mod.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)'"
            @mouseleave="($event.target as HTMLElement).style.background = store.selectedModuleId === mod.id ? 'rgba(99,102,241,0.12)' : ''"
            @click="store.selectModule(mod.id)"
          >
            <span class="truncate flex-1">{{ mod.title }}</span>
            <span
              v-if="store.completionByModule[mod.id]"
              class="module-completion-badge shrink-0"
              :class="getBadgeClass(mod.id)"
            >
              {{ store.completionByModule[mod.id].filled }}/{{ store.completionByModule[mod.id].total }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Phase 2: Style mode -->
    <template v-if="store.currentPhase === 'style'">
      <div class="panel-section" style="border-bottom: none;">
        <button class="reset-appearance-btn" @click="store.resetAppearance()" title="将主题、字体、间距等外观恢复为默认设置">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
          恢复默认设置
        </button>
      </div>

      <!-- Theme -->
      <div class="panel-section">
        <div class="panel-section-title">主题</div>
        <div class="flex flex-wrap" style="gap: var(--normal-gap);">
          <button
            v-for="theme in themes" :key="theme.id"
            class="theme-dot"
            :class="{ active: store.config.theme === theme.id }"
            :style="{ background: theme.primaryColor }"
            :title="theme.name"
            @click="store.applyTheme(theme.id)"
          />
        </div>
        <div class="theme-preview-bar">
          <span class="theme-preview-name">{{ themeNames[store.config.theme] || '自定义' }}</span>
          <span class="theme-preview-hint">实时预览中</span>
        </div>
        <div class="theme-custom-row">
          <span class="sidebar-label" style="margin-bottom: 0;">自定义</span>
          <div class="color-picker-wrapper">
            <input type="color" :value="store.config.primaryColor" @input="store.setPrimaryColor(($event.target as HTMLInputElement).value)" />
          </div>
          <span class="theme-custom-hex">{{ store.config.primaryColor }}</span>
        </div>
      </div>

      <!-- Title Style -->
      <div class="panel-section">
        <div class="panel-section-title">标题样式</div>
        <div class="title-style-grid">
          <button
            v-for="s in titleStyles" :key="s.id"
            class="title-style-btn"
            :class="{ active: store.config.titleStyle === s.id }"
            :title="s.name"
            @click="store.setTitleStyle(s.id)"
          >
            <div class="title-style-preview" :class="`preview-${s.id}`">
              <span>{{ s.name }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Typography -->
      <div class="panel-section">
        <div class="panel-section-title">字体排版</div>

        <!-- Live Font Preview -->
        <div class="font-live-preview" :style="previewStyle">
          <div class="font-preview-heading">简历标题示例</div>
          <div class="font-preview-body">
            <span class="font-preview-bold">工作经历</span> 中的正文内容展示。
            负责前端开发，使用 Vue.js 构建用户界面。
          </div>
          <div class="font-preview-contact">138xxxx8888 | yupi@mail.com</div>
        </div>

        <!-- Font Family -->
        <label class="block font-control-group">
          <div class="font-control-header">
            <span class="sidebar-label">字体族</span>
            <span class="font-control-hint">影响全文文字</span>
          </div>
          <div class="sidebar-select-wrapper">
            <select
              :value="store.config.fontFamily"
              @change="updateFontFamily(($event.target as HTMLSelectElement).value)"
              class="sidebar-select"
            >
              <option v-for="f in fonts" :key="f.value" :value="f.value">{{ f.name }}</option>
            </select>
            <svg class="sidebar-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </label>

        <!-- Font Test Entry -->
        <button class="font-test-trigger" @click="fontTestOpen = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
          字体测试对比
        </button>

        <!-- Font Size with Quick Presets -->
        <div class="font-control-group">
          <div class="font-control-header">
            <span class="sidebar-label">字号</span>
            <span class="font-control-hint">正文文字大小</span>
          </div>
          <div class="font-size-presets">
            <button
              v-for="size in fontSizePresets"
              :key="size"
              class="font-preset-btn"
              :class="{ active: store.config.fontSize === size }"
              @click="updateFontSize(size)"
            >{{ size }}</button>
          </div>
          <input type="range" min="10" max="20" step="1" :value="store.config.fontSize"
            @input="updateFontSize(Number(($event.target as HTMLInputElement).value))"
            class="sidebar-slider" />
          <div class="sidebar-slider-hints">
            <span>紧凑 10</span>
            <span class="sidebar-slider-current">{{ store.config.fontSize }}px</span>
            <span>宽松 20</span>
          </div>
        </div>

        <!-- Line Height with Visual Indicator -->
        <div class="font-control-group">
          <div class="font-control-header">
            <span class="sidebar-label">行高</span>
            <span class="font-control-hint">段落行间距</span>
          </div>
          <div class="font-lh-visual">
            <div class="font-lh-visual-lines" :style="{ lineHeight: store.config.lineHeight }">
              <div class="font-lh-line" />
              <div class="font-lh-line" />
              <div class="font-lh-line" />
            </div>
            <span class="font-lh-value">{{ store.config.lineHeight }}</span>
          </div>
          <input type="range" min="1.2" max="2.0" step="0.1" :value="store.config.lineHeight"
            @input="updateLineHeight(Number(($event.target as HTMLInputElement).value))"
            class="sidebar-slider" />
          <div class="sidebar-slider-hints">
            <span>紧凑 1.2</span>
            <span class="sidebar-slider-current">{{ store.config.lineHeight }}</span>
            <span>宽松 2.0</span>
          </div>
        </div>
      </div>

      <!-- Spacing -->
      <div class="panel-section">
        <div class="panel-section-title">间距</div>
        <label class="block">
          <div class="sidebar-slider-label">
            <span class="sidebar-label" style="margin-bottom: 0;">页边距</span>
            <span class="sidebar-slider-value">{{ store.config.pageMargin }} px</span>
          </div>
          <input type="range" min="8" max="40" step="2" :value="store.config.pageMargin"
            @input="updatePageMargin(Number(($event.target as HTMLInputElement).value))"
            class="sidebar-slider" />
          <div class="sidebar-slider-hints">
            <span>8</span>
            <span>40</span>
          </div>
        </label>
      </div>

      <!-- Avatar -->
      <div class="panel-section" style="border-bottom: none;">
        <div class="panel-section-title">头像</div>
        <AvatarUpload />
      </div>
    </template>

    <!-- Phase 3: Export mode -->
    <template v-if="store.currentPhase === 'export'">
      <div class="panel-section">
        <div class="panel-section-title">导出选项</div>
        <div style="display: flex; flex-direction: column; gap: var(--tight-gap);">
          <div
            class="export-option-card"
            :class="{ active: hoverExportCard === 'pdf' }"
            @click="$emit('export-pdf')"
            @mouseenter="hoverExportCard = 'pdf'"
            @mouseleave="hoverExportCard = null"
          >
            <div class="export-option-icon pdf">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h3"/></svg>
            </div>
            <div class="export-option-body">
              <div class="export-option-title">PDF 格式</div>
              <div class="export-option-desc">适合打印和邮件发送，保持排版不变</div>
            </div>
            <svg class="export-option-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div
            class="export-option-card"
            :class="{ active: hoverExportCard === 'html' }"
            @click="onExportHtml"
            @mouseenter="hoverExportCard = 'html'"
            @mouseleave="hoverExportCard = null"
          >
            <div class="export-option-icon html">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <div class="export-option-body">
              <div class="export-option-title">HTML 格式</div>
              <div class="export-option-desc">网页版简历，可二次编辑或发布</div>
            </div>
            <svg class="export-option-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div
            class="export-option-card"
            :class="{ active: hoverExportCard === 'word' }"
            @click="onExportWord"
            @mouseenter="hoverExportCard = 'word'"
            @mouseleave="hoverExportCard = null"
          >
            <div class="export-option-icon word">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
            </div>
            <div class="export-option-body">
              <div class="export-option-title">Word 格式</div>
              <div class="export-option-desc">.docx 文档，适合招聘系统上传</div>
            </div>
            <svg class="export-option-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div
            class="export-option-card"
            :class="{ active: hoverExportCard === 'md' }"
            @click="onExportMarkdown"
            @mouseenter="hoverExportCard = 'md'"
            @mouseleave="hoverExportCard = null"
          >
            <div class="export-option-icon markdown">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M8 13h2l1 3 1-6 1 3h2"/></svg>
            </div>
            <div class="export-option-body">
              <div class="export-option-title">Markdown 格式</div>
              <div class="export-option-desc">纯文本，便于粘贴到各类平台</div>
            </div>
            <svg class="export-option-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div
            class="export-option-card"
            :class="{ active: hoverExportCard === 'json' }"
            @click="$emit('export-json')"
            @mouseenter="hoverExportCard = 'json'"
            @mouseleave="hoverExportCard = null"
          >
            <div class="export-option-icon json">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            </div>
            <div class="export-option-body">
              <div class="export-option-title">JSON 格式</div>
              <div class="export-option-desc">保存数据备份，可随时导入继续编辑</div>
            </div>
            <svg class="export-option-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <div class="panel-section" style="border-bottom: none;">
        <div class="panel-section-title">保存快照</div>
        <div style="display: flex; flex-direction: column; gap: var(--tight-gap);">
          <input
            v-model="snapshotName"
            type="text"
            placeholder="给当前简历起个名，如：字节内推"
            class="ui-input ui-input--dark"
            @keydown.enter="handleSaveSnapshot"
          />
          <button
            class="ui-btn ui-btn--primary ui-btn--block"
            @click="handleSaveSnapshot"
          >保存为快照</button>
        </div>
      </div>

      <div class="panel-section" style="border-bottom: none;">
        <div class="panel-section-title">简历概览</div>
        <div class="text-xs" style="color: var(--sidebar-muted); display: flex; flex-direction: column; gap: var(--list-gap);">
          <div class="flex justify-between">
            <span>总字符数</span>
            <span style="font-family: var(--font-mono); color: var(--sidebar-text);">{{ store.charCount }}</span>
          </div>
          <div class="flex justify-between">
            <span>可见模块</span>
            <span style="font-family: var(--font-mono); color: var(--sidebar-text);">{{ store.modules.filter(m => m.visible).length }}</span>
          </div>
          <div class="flex justify-between">
            <span>完成度</span>
            <span style="font-family: var(--font-mono);"
                  :style="{ color: store.overallCompletion === 100 ? 'var(--color-success)' : 'var(--accent-500)' }">
              {{ store.overallCompletion }}%
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- Font Test Dialog -->
  <FontTestDialog v-model:open="fontTestOpen" />

  <!-- Template Gallery Dialog -->
  <TemplateGalleryDialog v-model:open="templateGalleryOpen" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useResumeStore, THEME_PRESETS, FONT_PRESETS } from '../stores/resume'
import AvatarUpload from './AvatarUpload.vue'
import ProgressRing from './ProgressRing.vue'
import FontTestDialog from './FontTestDialog.vue'
import TemplateGalleryDialog from './TemplateGalleryDialog.vue'
import { exportToMarkdown, exportToHtml, exportToDocx } from '../utils/exportFormats'

const store = useResumeStore()
const themes = THEME_PRESETS
const fonts = FONT_PRESETS
const hoverExportCard = ref<string | null>(null)
const fontTestOpen = ref(false)
const templateGalleryOpen = ref(false)
const snapshotName = ref('')

// 触发浏览器下载
function download(content: string, name: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function fileName(prefix: string): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `${prefix}-${ymd}`
}

function onExportHtml() {
  const html = exportToHtml(store.modules, store.config)
  download(html, `${fileName('简历')}.html`, 'text/html')
}
function onExportWord() {
  exportToDocx(store.modules, store.config).then((blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName('简历')}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })
}
function onExportMarkdown() {
  const md = exportToMarkdown(store.modules)
  download(md, `${fileName('简历')}.md`, 'text/markdown')
}
function handleSaveSnapshot() {
  const name = snapshotName.value.trim()
  if (!name) {
    store.saveVersion(`快照 ${new Date().toLocaleString('zh-CN')}`)
    return
  }
  store.saveVersion(name)
  snapshotName.value = ''
}

// Font size quick presets
const fontSizePresets = [12, 13, 14, 15, 16]

// Live preview style computed from current config
const previewStyle = computed(() => ({
  fontFamily: store.config.fontFamily,
  fontSize: `${store.config.fontSize}px`,
  lineHeight: String(store.config.lineHeight),
}))

// 由 THEME_PRESETS 自动生成，避免新增主题后预览条显示「自定义」
const themeNames: Record<string, string> = Object.fromEntries(
  THEME_PRESETS.map(t => [t.id, t.name])
)

const titleStyles = [
  { id: 'underline', name: '下划线' },
  { id: 'leftbar', name: '侧边条' },
  { id: 'pill', name: '标签' },
  { id: 'centerline', name: '中线' },
  { id: 'dots', name: '圆点' },
  { id: 'minimal', name: '极简' },
  { id: 'grad-underline', name: '渐变线' },
  { id: 'grad-leftbar', name: '渐变条' },
  { id: 'grad-dual', name: '短线' },
  { id: 'grad-pill', name: '渐变胶囊' },
  { id: 'grad-shadow', name: '阴影' },
  { id: 'grad-fade', name: '渐变字' },
  { id: 'thin-underline', name: '细下划线' },
  { id: 'thin-double', name: '细双线' },
  { id: 'thin-leftbar', name: '细左条' },
  { id: 'thin-overline', name: '细顶线' },
  { id: 'thin-box', name: '细框' },
  { id: 'thin-framed', name: '细卡框' },
  { id: 'thin-corner', name: '细直角' },
  { id: 'thin-bracket', name: '细竖框' },
  { id: 'thin-center', name: '居中细线' },
  { id: 'thin-underline-soft', name: '淡细线' },
]

defineEmits(['export-pdf', 'export-json', 'import-json'])

function getBadgeClass(modId: string): string {
  const stats = store.completionByModule[modId]
  if (!stats || stats.total === 0) return 'empty'
  if (stats.filled === stats.total) return 'done'
  if (stats.filled === 0) return 'empty'
  return 'partial'
}

function updateFontFamily(val: string) {
  store.setFontFamily(val)
}
function updateFontSize(val: number) {
  store.config.fontSize = val
  document.documentElement.style.setProperty('--font-size', `${val}px`)
}
function updateLineHeight(val: number) {
  store.config.lineHeight = val
  document.documentElement.style.setProperty('--line-height', String(val))
}
function updatePageMargin(val: number) {
  store.config.pageMargin = val
  document.documentElement.style.setProperty('--page-margin', `${val}px`)
}
</script>
