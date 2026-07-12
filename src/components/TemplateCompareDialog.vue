<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="cmp-overlay" />
      <DialogContent class="cmp-dialog">
        <DialogTitle class="sr-only">模板并排对比</DialogTitle>

        <!-- Header -->
        <div class="cmp-header">
          <div class="cmp-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/></svg>
            <span>模板并排对比</span>
          </div>
          <Button class="cmp-close" @click="emit('update:open', false)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
        </div>

        <!-- Target selector (right pane) -->
        <div class="cmp-toolbar">
          <span class="cmp-toolbar-label">对比对象（右）：</span>
          <TabsRoot v-model="targetMode" class="cmp-tabs">
            <TabsList class="cmp-tabs-list">
              <TabsTrigger
                value="template"
                :disabled="store.templates.length === 0"
                class="cmp-tab"
              >已存模板</TabsTrigger>
              <TabsTrigger
                value="theme"
                class="cmp-tab"
              >仅换主题样式</TabsTrigger>
            </TabsList>
          </TabsRoot>
          <select v-if="targetMode === 'template'" v-model="targetTemplateId" class="cmp-select">
            <option v-for="t in store.templates" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <select v-else v-model="targetThemeId" class="cmp-select">
            <option v-for="t in themes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>

        <!-- Side by side -->
        <div class="cmp-grid">
          <!-- Left: current resume -->
          <div class="cmp-col">
            <div class="cmp-pane-title">当前简历</div>
            <div class="cmp-pane" :style="leftVars">
              <div class="cmp-preview" v-html="leftHtml" />
            </div>
          </div>

          <!-- Right: target -->
          <div class="cmp-col">
            <div class="cmp-pane-title">{{ rightTitle }}</div>
            <div class="cmp-pane" :style="rightVars">
              <div class="cmp-preview" v-html="rightHtml" />
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import Button from './ui/Button.vue'
import { TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { ref, computed } from 'vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import { useResumeStore, THEME_PRESETS, generateColorScale } from '../stores/resume'
import { generatePreviewHtml } from '../utils/previewPdf'
import type { ResumeConfig } from '../types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()

const store = useResumeStore()
const themes = THEME_PRESETS

const targetMode = ref<'template' | 'theme'>(store.templates.length > 0 ? 'template' : 'theme')
const targetTemplateId = ref<string>(store.templates[0]?.id ?? '')
const targetThemeId = ref<string>(store.config.theme ?? 'default')

/** Build a scoped CSS-variable map for a given config (so each pane is isolated). */
function configToCssVars(config: ResumeConfig): Record<string, string> {
  const preset = themes.find(t => t.id === config.theme)
  const vars: Record<string, string> = {}
  const primary = config.primaryColor
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
  vars['--font-family'] = config.fontFamily
  vars['--font-size'] = `${config.fontSize}px`
  vars['--line-height'] = String(config.lineHeight)
  vars['--page-margin'] = `${config.pageMargin}px`
  vars['--title-style'] = config.titleStyle || 'underline'
  return vars
}

// ---- Left pane: current resume ----
const leftHtml = computed(() => generatePreviewHtml(store.modules, store.avatar))
const leftVars = computed(() => configToCssVars(store.config))

// ---- Right pane: selected target ----
const rightTitle = computed(() => {
  if (targetMode.value === 'template') {
    return store.templates.find(t => t.id === targetTemplateId.value)?.name ?? '对比对象'
  }
  const preset = themes.find(t => t.id === targetThemeId.value)
  return `${preset?.name ?? '主题'}（同内容·仅换样式）`
})

const rightHtml = computed(() => {
  if (targetMode.value === 'template') {
    const tpl = store.templates.find(t => t.id === targetTemplateId.value)
    if (tpl) return generatePreviewHtml(tpl.data.modules, tpl.data.avatar)
  }
  return generatePreviewHtml(store.modules, store.avatar)
})

const rightVars = computed(() => {
  if (targetMode.value === 'template') {
    const tpl = store.templates.find(t => t.id === targetTemplateId.value)
    if (tpl) return configToCssVars(tpl.data.config)
  }
  const preset = themes.find(t => t.id === targetThemeId.value)
  return configToCssVars({
    ...store.config,
    theme: targetThemeId.value,
    primaryColor: preset?.primaryColor ?? store.config.primaryColor,
  })
})
</script>
