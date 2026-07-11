<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="cmp-overlay" />
      <DialogContent class="cmp-dialog">
        <DialogTitle class="sr-only">字体测试对比</DialogTitle>

        <!-- Header -->
        <div class="cmp-header">
          <div class="cmp-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
            <span>字体测试对比</span>
          </div>
          <button class="cmp-close" @click="emit('update:open', false)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Toolbar -->
        <div class="ft-toolbar">
          <span class="cmp-toolbar-label">同一份简历用不同字体并排展示，挑出最合适的一款再「应用」。</span>
          <div class="ft-actions">
            <button v-if="panels.length < 4" class="ft-action" @click="addPanel">+ 加一列</button>
            <button v-if="panels.length > 2" class="ft-action" @click="removePanel">− 减一列</button>
          </div>
        </div>

        <!-- Multi-column compare -->
        <div class="ft-grid" :style="{ gridTemplateColumns: `repeat(${panels.length}, minmax(0, 1fr))` }">
          <div class="cmp-col" v-for="(p, i) in panels" :key="p.id">
            <div class="ft-pane-head">
              <div class="sidebar-select-wrapper ft-select-wrap">
                <select v-model="p.font" class="cmp-select ft-select">
                  <option v-for="f in fonts" :key="f.value" :value="f.value">{{ f.name }}</option>
                </select>
                <svg class="sidebar-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <button
                class="ft-apply"
                :class="{ active: store.config.fontFamily === p.font }"
                @click="applyFont(p.font)"
              >{{ store.config.fontFamily === p.font ? '已应用' : '应用' }}</button>
              <button v-if="panels.length > 2" class="ft-remove" title="移除该列" @click="removePanelAt(i)">×</button>
            </div>
            <div class="cmp-pane" :style="paneVars(p.font)">
              <div class="cmp-preview" v-html="previewHtml" />
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import { useResumeStore, FONT_PRESETS, THEME_PRESETS, generateColorScale } from '../stores/resume'
import { generatePreviewHtml } from '../utils/previewPdf'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()

const store = useResumeStore()
const fonts = FONT_PRESETS

// 每列一个字体选择；默认两列（系统默认 / 微软雅黑）
const panels = ref<{ id: number; font: string }[]>([
  { id: 1, font: 'system-ui, -apple-system, sans-serif' },
  { id: 2, font: "'Microsoft YaHei', 'PingFang SC', sans-serif" },
])
let nextId = 3

function addPanel() {
  if (panels.value.length >= 4) return
  const fallback = fonts[panels.value.length % fonts.length]?.value ?? fonts[0].value
  panels.value.push({ id: nextId++, font: fallback })
}
function removePanel() {
  if (panels.value.length > 2) panels.value.pop()
}
function removePanelAt(i: number) {
  if (panels.value.length > 2) panels.value.splice(i, 1)
}

const previewHtml = computed(() => generatePreviewHtml(store.modules, store.avatar))

/** 为每个面板计算独立的 CSS 变量（主题 + 页面配置 + 该列字体）。 */
function paneVars(font: string): Record<string, string> {
  const cfg = store.config
  const preset = THEME_PRESETS.find(t => t.id === cfg.theme)
  const vars: Record<string, string> = {}
  const primary = cfg.primaryColor
  if (preset) {
    vars['--primary-color'] = preset.primaryColor
    vars['--accent-color'] = preset.accentColor
    vars['--bg-color'] = preset.bgColor
    vars['--surface-color'] = preset.surfaceColor
    vars['--text-primary'] = preset.textPrimary
    vars['--text-secondary'] = preset.textSecondary
    vars['--border-color'] = preset.borderColor
  } else {
    vars['--primary-color'] = primary
  }
  const pScale = generateColorScale(primary)
  Object.entries(pScale).forEach(([k, v]) => { vars[`--primary-${k}`] = v })
  if (preset) {
    const aScale = generateColorScale(preset.accentColor)
    vars['--accent-400'] = aScale[400]
    vars['--accent-500'] = aScale[500]
    vars['--accent-50'] = aScale[50]
  }
  vars['--font-family'] = font
  vars['--font-size'] = `${cfg.fontSize}px`
  vars['--line-height'] = String(cfg.lineHeight)
  vars['--page-margin'] = `${cfg.pageMargin}px`
  vars['--title-style'] = cfg.titleStyle || 'underline'
  return vars
}

function applyFont(font: string) {
  store.setFontFamily(font)
}
</script>
