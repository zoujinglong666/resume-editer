<template>
  <div class="w-60 bg-white border-r border-[var(--border-color)] overflow-y-auto no-print shrink-0 flex flex-col">
    <!-- Theme Section -->
    <div class="panel-section">
      <div class="panel-section-title">🎨 主题</div>
      <div class="flex gap-2 flex-wrap">
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
      <div class="mt-3 flex items-center gap-2">
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
      <label class="block mb-2">
        <span class="text-xs text-gray-500 block mb-1">字体族</span>
        <select
          :value="store.config.fontFamily"
          @change="updateConfig('fontFamily', ($event.target as HTMLSelectElement).value)"
          class="w-full px-2 py-1.5 text-sm border border-[var(--border-color)] rounded-md bg-white"
        >
          <option value="system-ui, -apple-system, sans-serif">系统默认</option>
          <option value="'SimSun', 'Songti SC', serif">宋体</option>
          <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
          <option value="'PingFang SC', sans-serif">苹方</option>
          <option value="Georgia, serif">Georgia</option>
        </select>
      </label>
      <label class="block mb-2">
        <span class="text-xs text-gray-500 block mb-1">字号: {{ store.config.fontSize }}px</span>
        <input
          type="range" min="10" max="20" step="1" :value="store.config.fontSize"
          @input="updateFontSize(Number(($event.target as HTMLInputElement).value))"
          class="w-full accent-[var(--primary-color)]"
        />
      </label>
      <label class="block">
        <span class="text-xs text-gray-500 block mb-1">行高: {{ store.config.lineHeight }}</span>
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
        <span class="text-xs text-gray-500 block mb-1">页边距: {{ store.config.pageMargin }}px</span>
        <input
          type="range" min="8" max="40" step="2" :value="store.config.pageMargin"
          @input="updatePageMargin(Number(($event.target as HTMLInputElement).value))"
          class="w-full accent-[var(--primary-color)]"
        />
      </label>
    </div>

    <!-- Avatar -->
    <div class="panel-section">
      <div class="panel-section-title">🖼️ 头像</div>
      <AvatarUpload />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResumeStore, THEME_PRESETS } from '../stores/resume'
import AvatarUpload from './AvatarUpload.vue'

const store = useResumeStore()
const themes = THEME_PRESETS

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
</script>
