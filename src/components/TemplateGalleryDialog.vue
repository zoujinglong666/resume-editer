<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="tpl-gallery-overlay" />
      <DialogContent class="tpl-gallery-dialog">
        <DialogTitle class="sr-only">模板库</DialogTitle>

        <!-- Header -->
        <div class="tpl-gallery-header">
          <div class="tpl-gallery-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            <span>模板库 · 各行业专业简历</span>
          </div>
          <button class="tpl-gallery-close" @click="emit('update:open', false)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Hint -->
        <div class="tpl-gallery-hint">
          选择你的目标行业，一键套用专业排版与内容样例。套用会替换当前简历内容。
        </div>

        <!-- Gallery Grid -->
        <div class="tpl-gallery-grid">
          <div
            v-for="tpl in templates"
            :key="tpl.id"
            class="tpl-card"
          >
            <div class="tpl-card-top">
              <div class="tpl-card-icon" :style="{ background: tpl.color }">{{ tpl.icon }}</div>
              <div class="tpl-card-head">
                <div class="tpl-card-name">{{ tpl.name }}</div>
                <span class="tpl-card-chip" :style="{ color: tpl.color, borderColor: tpl.color }">{{ tpl.industry }}</span>
              </div>
            </div>
            <div class="tpl-card-desc">{{ tpl.description }}</div>
            <div class="tpl-card-actions">
              <button class="tpl-card-btn tpl-card-btn--ghost" @click="openPreview(tpl)">预览</button>
              <button class="tpl-card-btn tpl-card-btn--primary" :style="{ background: tpl.color }" @click="useTemplate(tpl)">使用模板</button>
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>

  <!-- Preview of a built-in template -->
  <TemplatePreviewDialog
    v-if="previewTpl"
    v-model:open="previewOpen"
    :template="previewTpl"
    @load="applyPreview"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import type { ResumeTemplate } from '../types'
import { useResumeStore } from '../stores/resume'
import { INDUSTY_TEMPLATES, type BuiltInTemplate } from '../templates/industryTemplates'
import TemplatePreviewDialog from './TemplatePreviewDialog.vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()
const store = useResumeStore()
const templates = INDUSTY_TEMPLATES

const previewTpl = ref<ResumeTemplate | null>(null)
const previewOpen = ref(false)
// 当前预览 / 待套用的模板
const pending = ref<BuiltInTemplate | null>(null)

function wrap(tpl: BuiltInTemplate): ResumeTemplate {
  return {
    id: tpl.id,
    name: tpl.name,
    createdAt: tpl.data.meta.lastSaved,
    updatedAt: tpl.data.meta.lastSaved,
    data: tpl.data,
  }
}

function openPreview(tpl: BuiltInTemplate) {
  pending.value = tpl
  previewTpl.value = wrap(tpl)
  previewOpen.value = true
}

// 预览弹窗点「加载此模板」时触发
function applyPreview() {
  if (pending.value) {
    store.importData(pending.value.data)
    previewOpen.value = false
    previewTpl.value = null
    pending.value = null
    emit('update:open', false)
  }
}

function useTemplate(tpl: BuiltInTemplate) {
  if (confirm(`使用「${tpl.name}」模板将替换当前简历内容，确定继续？`)) {
    store.importData(tpl.data)
    emit('update:open', false)
  }
}
</script>
