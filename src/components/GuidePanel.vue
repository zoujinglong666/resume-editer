<template>
  <div class="app-sidebar no-print">
    <!-- Sidebar Tab Bar -->
    <div class="sidebar-tab-bar">
      <button
        v-for="tab in sidebarTabs"
        :key="tab.key"
        class="sidebar-tab-btn"
        :class="{ active: activeSidebarTab === tab.key }"
        :title="tab.label"
        @click="activeSidebarTab = tab.key"
      >
        <span v-html="tab.icon"></span>
        <span class="sidebar-tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- AI Panel Tab -->
    <template v-if="activeSidebarTab === 'ai'">
      <AiPanel />
    </template>

    <!-- Scoring Tab -->
    <template v-if="activeSidebarTab === 'score'">
      <ScoringPanel />
    </template>

    <!-- Templates Tab -->
    <template v-if="activeSidebarTab === 'templates'">
      <TemplateMarket />
    </template>

    <!-- Version History Tab -->
    <template v-if="activeSidebarTab === 'history'">
      <VersionHistory />
    </template>

    <!-- Main Content Tab (Phase-based) -->
    <template v-if="activeSidebarTab === 'main'">
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
          <p>标题带 <span style="color: #f87171;">*</span> 的字段建议必填。</p>
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

      <!-- Recycle Bin (only in new model + fill phase) -->
      <div v-if="store.useNewModel && store.recycleBin.length > 0" class="panel-section" style="border-bottom: none;">
        <div class="panel-section-title" style="display: flex; align-items: center; justify-content: space-between;">
          <span>回收站 ({{ store.recycleBin.length }})</span>
          <button
            class="text-xs"
            style="color: var(--sidebar-muted); background: none; border: none; cursor: pointer; padding: 2px 6px; border-radius: 3px;"
            @click="store.clearRecycleBin()"
          >清空</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: var(--space-1);">
          <div
            v-for="item in store.recycleBin"
            :key="item.element.id"
            class="flex items-center justify-between text-xs rounded"
            style="padding: var(--list-item-padding-y) var(--list-item-padding-x); background: rgba(255,255,255,0.03); border: 1px solid var(--sidebar-border);"
          >
            <span class="truncate flex-1" style="color: var(--sidebar-muted);">
              {{ item.element.content || item.element.html?.replace(/<[^>]*>/g, '').slice(0, 20) || item.element.type }}
            </span>
            <button
              class="shrink-0"
              style="color: var(--primary-400); background: none; border: none; cursor: pointer; padding: 2px 6px; border-radius: 3px; font-size: 11px;"
              @click="store.restoreElement(item.element.id)"
            >恢复</button>
          </div>
        </div>
      </div>
    </template>

    <!-- Phase 2: Style mode -->
    <template v-if="store.currentPhase === 'style'">
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
              <option value="system-ui, -apple-system, sans-serif">系统默认</option>
              <option value="'SimSun', 'Songti SC', serif">宋体</option>
              <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
              <option value="'PingFang SC', sans-serif">苹方</option>
              <option value="Georgia, serif">Georgia</option>
            </select>
            <svg class="sidebar-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </label>

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
          <div
            class="export-option-card"
            :class="{ active: hoverExportCard === 'docx' }"
            @click="$emit('export-docx')"
            @mouseenter="hoverExportCard = 'docx'"
            @mouseleave="hoverExportCard = null"
          >
            <div class="export-option-icon docx">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div class="export-option-body">
              <div class="export-option-title">Word 格式</div>
              <div class="export-option-desc">DOCX 格式，可在 Word 中继续编辑</div>
            </div>
            <svg class="export-option-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div
            class="export-option-card"
            :class="{ active: hoverExportCard === 'md' }"
            @click="$emit('export-md')"
            @mouseenter="hoverExportCard = 'md'"
            @mouseleave="hoverExportCard = null"
          >
            <div class="export-option-icon md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3"/><polyline points="14 2 14 8 20 8"/><line x1="2" y1="13" x2="12" y2="13"/><line x1="7" y1="8" x2="7" y2="18"/></svg>
            </div>
            <div class="export-option-body">
              <div class="export-option-title">Markdown 格式</div>
              <div class="export-option-desc">纯文本格式，适合 GitHub 或博客发布</div>
            </div>
            <svg class="export-option-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div
            class="export-option-card"
            :class="{ active: hoverExportCard === 'html' }"
            @click="$emit('export-html')"
            @mouseenter="hoverExportCard = 'html'"
            @mouseleave="hoverExportCard = null"
          >
            <div class="export-option-icon html">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <div class="export-option-body">
              <div class="export-option-title">HTML 格式</div>
              <div class="export-option-desc">网页格式，可在线分享或浏览器打印</div>
            </div>
            <svg class="export-option-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
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
                  :style="{ color: store.overallCompletion === 100 ? 'var(--color-success)' : '#fbbf24' }">
              {{ store.overallCompletion }}%
            </span>
          </div>
        </div>
      </div>
    </template>
    </template><!-- end main tab -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useResumeStore, THEME_PRESETS } from '../stores/resume'
import AvatarUpload from './AvatarUpload.vue'
import ProgressRing from './ProgressRing.vue'
import AiPanel from './AiPanel.vue'
import ScoringPanel from './ScoringPanel.vue'
import TemplateMarket from './TemplateMarket.vue'
import VersionHistory from './VersionHistory.vue'

const store = useResumeStore()
const themes = THEME_PRESETS
const hoverExportCard = ref<string | null>(null)

// Sidebar tab system
type SidebarTab = 'main' | 'ai' | 'score' | 'templates' | 'history'
const activeSidebarTab = ref<SidebarTab>('main')

const sidebarTabs = [
  { key: 'main' as const, label: '编辑', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' },
  { key: 'ai' as const, label: 'AI', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14h.01"/><path d="M8 14h.01"/><path d="M12 17v4"/></svg>' },
  { key: 'score' as const, label: '评分', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' },
  { key: 'templates' as const, label: '模板', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
  { key: 'history' as const, label: '历史', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
]

// Font size quick presets
const fontSizePresets = [12, 13, 14, 15, 16]

// Live preview style computed from current config
const previewStyle = computed(() => ({
  fontFamily: store.config.fontFamily,
  fontSize: `${store.config.fontSize}px`,
  lineHeight: String(store.config.lineHeight),
}))

const themeNames: Record<string, string> = {
  default: '青瓦', green: '松烟', wine: '朱砂', dark: '墨石', orange: '暮橘',
  indigo: '鸢尾', teal: '竹青', rose: '胭脂', navy: '藏蓝', brown: '檀木'
}

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
]

defineEmits(['export-pdf', 'export-json', 'import-json', 'export-docx', 'export-md', 'export-html'])

function getBadgeClass(modId: string): string {
  const stats = store.completionByModule[modId]
  if (!stats || stats.total === 0) return 'empty'
  if (stats.filled === stats.total) return 'done'
  if (stats.filled === 0) return 'empty'
  return 'partial'
}

function updateFontFamily(val: string) {
  store.config.fontFamily = val
  document.documentElement.style.setProperty('--font-family', val)
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
