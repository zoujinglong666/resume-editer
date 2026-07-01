<template>
  <div class="w-60 bg-white border-r border-[var(--border-color)] overflow-y-auto no-print shrink-0 flex flex-col">
    <!-- Theme Section -->
    <div class="panel-section">
      <div class="panel-section-title">🎨 主题</div>
      <div class="flex flex-wrap" style="gap: var(--tight-gap);">
        <button
          v-for="theme in themes" :key="theme.id"
          class="theme-dot"
          :class="{ active: store.config.theme === theme.id }"
          :style="{ background: theme.primaryColor }"
          :title="theme.name"
          @click="store.applyTheme(theme.id)"
        />
      </div>
      <!-- Custom Color -->
      <div class="flex items-center" style="margin-top: var(--normal-gap); gap: var(--tight-gap);">
        <span class="text-xs text-gray-500">自定义色:</span>
        <div class="color-picker-wrapper">
          <input type="color" :value="store.config.primaryColor" @input="store.setPrimaryColor(($event.target as HTMLInputElement).value)" />
        </div>
        <span class="text-xs font-mono text-gray-400">{{ store.config.primaryColor }}</span>
      </div>
    </div>

    <!-- Font Settings -->
    <div class="panel-section">
      <div class="panel-section-title">🔤 字体</div>
      <label class="block" style="margin-bottom: var(--tight-gap);">
        <span class="text-xs text-gray-500 block" style="margin-bottom: var(--form-label-gap);">字体族</span>
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
        <span class="text-xs text-gray-500 block" style="margin-bottom: var(--form-label-gap);">字号: {{ store.config.fontSize }}px</span>
        <input
          type="range" min="10" max="20" step="1" :value="store.config.fontSize"
          @input="updateFontSize(Number(($event.target as HTMLInputElement).value))"
          class="w-full accent-[var(--primary-color)]"
        />
      </label>
      <label class="block" style="margin-bottom: var(--tight-gap);">
        <span class="text-xs text-gray-500 block" style="margin-bottom: var(--form-label-gap);">行高: {{ store.config.lineHeight }}</span>
        <input
          type="range" min="1.2" max="2.0" step="0.1" :value="store.config.lineHeight"
          @input="updateLineHeight(Number(($event.target as HTMLInputElement).value))"
          class="w-full accent-[var(--primary-color)]"
        />
      </label>
    </div>

    <!-- Spacing -->
    <div class="panel-section">
      <div class="panel-section-title">📐 间距</div>
      <label class="block">
        <span class="text-xs text-gray-500 block" style="margin-bottom: var(--form-label-gap);">页边距: {{ store.config.pageMargin }}px</span>
        <input
          type="range" min="8" max="40" step="2" :value="store.config.pageMargin"
          @input="updatePageMargin(Number(($event.target as HTMLInputElement).value))"
          class="w-full accent-[var(--primary-color)]"
        />
      </label>
      <label class="block" style="margin-top: var(--form-field-gap);">
        <span class="text-xs text-gray-500 block" style="margin-bottom: var(--form-label-gap);">模块间距: {{ store.config.moduleGap || 12 }}px</span>
        <input
          type="range" min="4" max="32" step="2" :value="store.config.moduleGap || 12"
          @input="updateModuleGap(Number(($event.target as HTMLInputElement).value))"
          class="w-full accent-[var(--primary-color)]"
        />
      </label>
      <label class="block" style="margin-top: var(--form-field-gap);">
        <span class="text-xs text-gray-500 block" style="margin-bottom: var(--form-label-gap);">条目间距: {{ store.config.itemGap || 6 }}px</span>
        <input
          type="range" min="2" max="20" step="1" :value="store.config.itemGap || 6"
          @input="updateItemGap(Number(($event.target as HTMLInputElement).value))"
          class="w-full accent-[var(--primary-color)]"
        />
      </label>
    </div>

    <!-- Templates -->
    <div class="panel-section">
      <div class="panel-section-title">📁 模板管理</div>

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
        <button
          @click="handleSaveTemplate"
          class="rounded-md text-sm text-white hover:opacity-90 transition-all shrink-0"
          style="padding: var(--space-1_5) var(--space-2); background: var(--primary-color);"
        >保存</button>
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
          <span class="text-xs text-gray-400 shrink-0">{{ formatDate(tpl.updatedAt) }}</span>
          <button
            class="text-xs opacity-0 group-hover/tpl:opacity-100 transition-all shrink-0"
            style="padding: 2px 6px; color: var(--primary-color); background: rgba(99,102,241,0.08); border-radius: 4px;"
            @click.stop="previewTemplate = tpl"
          >查看</button>
          <button
            class="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover/tpl:opacity-100 transition-all shrink-0"
            style="padding: 2px 4px;"
            @click.stop="store.deleteTemplate(tpl.id)"
          >删除</button>
        </div>

        <div v-if="store.templates.length === 0" class="text-xs text-gray-400 text-center" style="padding: var(--space-2);">
          暂无保存的模板
        </div>
      </div>
    </div>
  </div>

  <!-- Template Preview Dialog -->
  <TemplatePreviewDialog
    v-if="previewTemplate"
    :template="previewTemplate"
    @close="previewTemplate = null"
    @load="handleLoadFromPreview"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useResumeStore, THEME_PRESETS } from '../stores/resume'
import type { ResumeTemplate } from '../types'
import TemplatePreviewDialog from './TemplatePreviewDialog.vue'

const store = useResumeStore()
const themes = THEME_PRESETS
const newTemplateName = ref('')
const previewTemplate = ref<ResumeTemplate | null>(null)

function handleSaveTemplate() {
  if (!newTemplateName.value.trim()) return
  store.saveAsTemplate(newTemplateName.value)
  newTemplateName.value = ''
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

function updateModuleGap(val: number) {
  store.config.moduleGap = val
  document.documentElement.style.setProperty('--module-gap', `${val}px`)
}

function updateItemGap(val: number) {
  store.config.itemGap = val
  document.documentElement.style.setProperty('--item-gap', `${val}px`)
}
</script>
