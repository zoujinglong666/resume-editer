<template>
  <div class="w-60 bg-white border-r border-[var(--border-color)] overflow-y-auto no-print shrink-0 flex flex-col">
    <!-- Theme Section -->
    <div class="panel-section">
      <div class="panel-section-title">🎨 主题</div>
      <div class="flex flex-wrap" style="gap: var(--tight-gap);">
        <template v-for="theme in themes" :key="theme.id">
          <Button
            class="theme-dot"
            :class="{ active: store.config.theme === theme.id }"
            :style="{ background: theme.primaryColor }"
            :tip="theme.name"
            @click="store.applyTheme(theme.id)"
          />
        </template>
      </div>
      <!-- Custom Color -->
      <div class="flex items-center" style="margin-top: var(--normal-gap); gap: var(--tight-gap);">
        <span class="text-xs text-[var(--text-secondary)]">自定义色:</span>
        <div class="color-picker-wrapper">
          <input type="color" :value="store.config.primaryColor" @input="store.setPrimaryColor(($event.target as HTMLInputElement).value)" />
        </div>
        <span class="text-xs font-mono text-[var(--text-muted)]">{{ store.config.primaryColor }}</span>
      </div>
    </div>

    <!-- Font Settings -->
    <div class="panel-section">
      <div class="panel-section-title">🔤 字体</div>
      <label class="block" style="margin-bottom: var(--tight-gap);">
        <span class="text-xs text-[var(--text-secondary)] block" style="margin-bottom: var(--form-label-gap);">字体族</span>
        <select
          :value="store.config.fontFamily"
          @change="updateConfig('fontFamily', ($event.target as HTMLSelectElement).value)"
          class="w-full text-sm border border-[var(--border-color)] rounded-md bg-white"
          style="padding: var(--space-1_5) var(--space-2);"
        >
          <option value="system-ui, -apple-system, sans-serif">系统默认</option>
          <option value="'SimSun', 'Songti SC', serif">宋体</option>
          <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
          <option value="'PingFang SC', sans-serif">苹方</option>
          <option value="Georgia, serif">Georgia</option>
        </select>
      </label>
      <label class="block" style="margin-bottom: var(--tight-gap);">
        <span class="text-xs text-[var(--text-secondary)] block" style="margin-bottom: var(--form-label-gap);">字号: {{ store.config.fontSize }}px</span>
        <Slider
          :model-value="store.config.fontSize"
          :min="10" :max="20" :step="1"
          @update:model-value="updateFontSize"
        />
      </label>
      <label class="block" style="margin-bottom: var(--tight-gap);">
        <span class="text-xs text-[var(--text-secondary)] block" style="margin-bottom: var(--form-label-gap);">行高: {{ store.config.lineHeight }}</span>
        <Slider
          :model-value="store.config.lineHeight"
          :min="1.2" :max="2.0" :step="0.1"
          @update:model-value="updateLineHeight"
        />
      </label>
    </div>

    <!-- Spacing -->
    <div class="panel-section">
      <div class="panel-section-title">📐 间距</div>
      <label class="block">
        <span class="text-xs text-[var(--text-secondary)] block" style="margin-bottom: var(--form-label-gap);">页边距: {{ store.config.pageMargin }}px</span>
        <Slider
          :model-value="store.config.pageMargin"
          :min="8" :max="40" :step="2"
          @update:model-value="updatePageMargin"
        />
      </label>
    </div>

    <!-- Export -->
    <div class="panel-section">
      <div class="panel-section-title">📤 导出</div>
      <div class="flex flex-col" style="gap: var(--tight-gap);">
        <Button
          @click="onExportHtml"
          class="w-full rounded-md text-sm font-medium transition-all hover:opacity-90"
          style="padding: var(--space-1_5) var(--space-2); background: var(--primary-color); color: #fff;"
        >🌐 导出 HTML</Button>
        <Button
          @click="onExportWord"
          class="w-full rounded-md text-sm font-medium transition-all hover:opacity-90"
          style="padding: var(--space-1_5) var(--space-2); background: #2b5797; color: #fff;"
        >📄 导出 Word</Button>
        <Button
          @click="onExportMarkdown"
          class="w-full rounded-md text-sm font-medium border border-[var(--border-color)] hover:bg-gray-50 transition-all"
          style="padding: var(--space-1_5) var(--space-2);"
        >📝 导出 Markdown</Button>
      </div>
    </div>

    <!-- Resume Versions -->
    <div class="panel-section">
      <div class="panel-section-title">📑 简历版本</div>

      <!-- Save current as new version -->
      <div class="flex items-center" style="gap: var(--tight-gap); margin-bottom: var(--normal-gap);">
        <input
          v-model="newVersionName"
          type="text"
          placeholder="如：后端工程师 / 字节内推..."
          class="flex-1 text-sm border border-[var(--border-color)] rounded-md"
          style="padding: var(--space-1_5) var(--space-2);"
          @keydown.enter="handleSaveVersion"
        />
        <Button
          @click="handleSaveVersion"
          class="rounded-md text-sm text-white hover:opacity-90 transition-all shrink-0"
          style="padding: var(--space-1_5) var(--space-2); background: var(--primary-color);"
        >存为新版本</Button>
      </div>

      <!-- Update active version -->
      <Button
        v-if="store.activeVersionId"
        @click="store.updateActiveVersion()"
        class="w-full rounded-md text-sm transition-all"
        style="padding: var(--space-1_5); margin-bottom: var(--space-1); border: 1px solid var(--border-color); color: var(--text-secondary);"
      >💾 更新当前版本「{{ activeVersionName }}」</Button>

      <!-- Version list -->
      <div style="display: flex; flex-direction: column; gap: var(--space-1);">
        <div
          v-for="ver in store.versions"
          :key="ver.id"
          class="flex items-center rounded-md cursor-pointer transition-all hover:bg-gray-50 group/ver"
          :class="{ 'version-active': store.activeVersionId === ver.id }"
          style="gap: var(--tight-gap); padding: var(--list-item-padding-y) var(--list-item-padding-x);"
          @click="store.loadVersion(ver.id)"
        >
          <span class="text-sm flex-1 truncate">{{ ver.name }}</span>
          <span class="text-xs text-[var(--text-muted)] shrink-0">{{ formatDate(ver.updatedAt) }}</span>
          <Button
            class="text-xs opacity-0 group-hover/ver:opacity-100 transition-all shrink-0"
            style="padding: 2px 4px; color: var(--primary-color); background: rgba(99,102,241,0.08); border-radius: 4px;"
            @click.stop="handleRenameVersion(ver)"
          >改名</Button>
          <Button
            class="text-xs text-[var(--color-error)] hover:opacity-80 opacity-0 group-hover/ver:opacity-100 transition-all shrink-0"
            style="padding: 2px 4px;"
            @click.stop="store.deleteVersion(ver.id)"
          >删除</Button>
        </div>

        <div v-if="store.versions.length === 0" class="text-xs text-[var(--text-muted)] text-center" style="padding: var(--space-2);">
          暂无保存的版本，可把当前简历另存为多份（按岗位定制）
        </div>
      </div>
    </div>

    <!-- Templates -->
    <div class="panel-section">
      <div class="flex items-center justify-between" style="margin-bottom: var(--normal-gap);">
        <div class="panel-section-title" style="margin: 0;">📁 模板管理</div>
        <Button
          class="text-xs rounded-md transition-all hover:opacity-90"
          style="padding: 3px 8px; color: #fff; background: var(--primary-color);"
          @click="compareOpen = true"
        >并排对比</Button>
      </div>

      <!-- Save current as template -->
      <div class="flex items-center" style="gap: var(--tight-gap); margin-bottom: var(--normal-gap);">
        <input
          v-model="newTemplateName"
          type="text"
          placeholder="输入模板名称..."
          class="flex-1 text-sm border border-[var(--border-color)] rounded-md"
          style="padding: var(--space-1_5) var(--space-2);"
          @keydown.enter="handleSaveTemplate"
        />
        <Button
          @click="handleSaveTemplate"
          class="rounded-md text-sm text-white hover:opacity-90 transition-all shrink-0"
          style="padding: var(--space-1_5) var(--space-2); background: var(--primary-color);"
        >保存</Button>
      </div>

      <!-- Template list -->
      <div style="display: flex; flex-direction: column; gap: var(--space-1);">
        <!-- Default template -->
        <div
          class="flex items-center rounded-md cursor-pointer transition-all hover:bg-gray-50"
          style="gap: var(--tight-gap); padding: var(--list-item-padding-y) var(--list-item-padding-x);"
          @click="store.loadDefaultTemplate()"
        >
          <span class="text-sm flex-1 truncate">🔄 默认模板</span>
        </div>

        <!-- Saved templates -->
        <div
          v-for="tpl in store.templates"
          :key="tpl.id"
          class="flex items-center rounded-md cursor-pointer transition-all hover:bg-gray-50 group/tpl"
          style="gap: var(--tight-gap); padding: var(--list-item-padding-y) var(--list-item-padding-x);"
          @click="store.loadTemplate(tpl.id)"
        >
          <span class="text-sm flex-1 truncate">{{ tpl.name }}</span>
          <span class="text-xs text-[var(--text-muted)] shrink-0">{{ formatDate(tpl.updatedAt) }}</span>
          <Button
            class="text-xs opacity-0 group-hover/tpl:opacity-100 transition-all shrink-0"
            style="padding: 2px 6px; color: var(--primary-color); background: rgba(99,102,241,0.08); border-radius: 4px;"
            @click.stop="previewTemplate = tpl; previewTemplateOpen = true"
          >查看</Button>
          <Button
            class="text-xs text-[var(--color-error)] hover:opacity-80 opacity-0 group-hover/tpl:opacity-100 transition-all shrink-0"
            style="padding: 2px 4px;"
            @click.stop="store.deleteTemplate(tpl.id)"
          >删除</Button>
        </div>

        <div v-if="store.templates.length === 0" class="text-xs text-[var(--text-muted)] text-center" style="padding: var(--space-2);">
          暂无保存的模板
        </div>
      </div>
    </div>
  </div>

  <!-- Template Preview Dialog -->
  <TemplatePreviewDialog
    v-if="previewTemplate"
    v-model:open="previewTemplateOpen"
    :template="previewTemplate"
    @load="handleLoadFromPreview"
  />

  <!-- Template Compare Dialog -->
  <TemplateCompareDialog v-model:open="compareOpen" />
</template>

<script setup lang="ts">
import Button from './ui/Button.vue'
import Slider from './ui/Slider.vue'
import { ref, computed } from 'vue'
import { useResumeStore, THEME_PRESETS } from '../stores/resume'
import type { ResumeTemplate, ResumeVersion } from '../types'
import TemplatePreviewDialog from './TemplatePreviewDialog.vue'
import TemplateCompareDialog from './TemplateCompareDialog.vue'
import { exportToMarkdown, exportToHtml, exportToDocx } from '../utils/exportFormats'
import { showPrompt } from '../utils/confirm'

const store = useResumeStore()
const themes = THEME_PRESETS
const newTemplateName = ref('')
const newVersionName = ref('')
const previewTemplate = ref<ResumeTemplate | null>(null)
const previewTemplateOpen = ref(false)
const compareOpen = ref(false)

const activeVersionName = computed(() => {
  const v = store.versions.find(x => x.id === store.activeVersionId)
  return v?.name ?? ''
})

function handleSaveTemplate() {
  if (!newTemplateName.value.trim()) return
  store.saveAsTemplate(newTemplateName.value)
  newTemplateName.value = ''
}

function handleSaveVersion() {
  if (!newVersionName.value.trim()) return
  store.saveVersion(newVersionName.value)
  newVersionName.value = ''
}

async function handleRenameVersion(ver: ResumeVersion) {
  const name = await showPrompt({
    title: '重命名版本',
    description: '输入新的版本名称',
    defaultValue: ver.name,
  })
  if (name != null) store.renameVersion(ver.id, name)
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  } catch { return '' }
}

function handleLoadFromPreview() {
  if (previewTemplate.value) {
    store.loadTemplate(previewTemplate.value.id)
    previewTemplate.value = null
    previewTemplateOpen.value = false
  }
}

function updateConfig(key: string, value: string) {
  (store.config as any)[key] = value
  if (key === 'fontFamily') {
    document.documentElement.style.setProperty('--font-family', value)
  }
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
</script>
