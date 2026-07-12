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
          选择你的目标人群，一键套用专业排版与内容样例。套用会替换当前简历内容。
        </div>

        <!-- Toolbar: search + category filter -->
        <div class="tpl-gallery-toolbar">
          <div class="tpl-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="search" class="tpl-search-input" type="text" placeholder="搜索模板 / 行业 / 关键词" />
            <button v-if="search" class="tpl-search-clear" @click="search = ''" aria-label="清除">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="tpl-cats">
            <button
              v-for="c in categories"
              :key="c"
              class="tpl-cat"
              :class="{ 'is-active': activeCat === c }"
              @click="activeCat = c"
            >{{ c }}</button>
          </div>
        </div>

        <!-- Gallery Grid (outer scroll keeps grid height automatic) -->
        <div class="tpl-gallery-scroll">
          <div class="tpl-gallery-grid">
          <div
            v-for="tpl in filtered"
            :key="tpl.id"
            class="tpl-card"
          >
            <!-- Layout thumbnail -->
            <div class="tpl-card-thumb" :style="{ '--tpl-c': tpl.color }">
              <div class="tpl-thumb-name">{{ tplName(tpl) }}</div>
              <div class="tpl-thumb-role">{{ tplRole(tpl) }}</div>
              <div class="tpl-thumb-sec" :class="thumbClass(tpl.data.config.titleStyle)"><i /><span class="tpl-thumb-title">个人优势</span></div>
              <div class="tpl-thumb-line" style="width:94%" />
              <div class="tpl-thumb-line" style="width:80%" />
              <div class="tpl-thumb-sec" :class="thumbClass(tpl.data.config.titleStyle)"><i /><span class="tpl-thumb-title">工作经历</span></div>
              <div class="tpl-thumb-line" style="width:88%" />
              <div class="tpl-thumb-line" style="width:72%" />
              <div class="tpl-thumb-sec" :class="thumbClass(tpl.data.config.titleStyle)"><i /><span class="tpl-thumb-title">专业技能</span></div>
              <div class="tpl-thumb-line" style="width:90%" />
              <div class="tpl-thumb-line" style="width:68%" />
            </div>

            <div class="tpl-card-body">
              <div class="tpl-card-head">
                <div class="tpl-card-name">{{ tpl.name }}</div>
                <span class="tpl-card-chip" :style="{ color: tpl.color, borderColor: tpl.color }">{{ tpl.industry }}</span>
              </div>
              <div class="tpl-card-desc">{{ tpl.description }}</div>
              <div class="tpl-card-actions">
                <button class="tpl-card-btn tpl-card-btn--ghost" @click="openPreview(tpl)">预览</button>
                <button class="tpl-card-btn tpl-card-btn--primary" :style="{ background: tpl.color }" @click="useTemplate(tpl)">使用模板</button>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div v-if="filtered.length === 0" class="tpl-gallery-empty">
          没有匹配的模板，换个关键词试试。
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
import { ref, computed } from 'vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import type { ResumeTemplate } from '../types'
import { useResumeStore } from '../stores/resume'
import { INDUSTY_TEMPLATES, type BuiltInTemplate } from '../templates/industryTemplates'
import TemplatePreviewDialog from './TemplatePreviewDialog.vue'
import { showConfirm } from '../utils/confirm'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()
const store = useResumeStore()
const templates = INDUSTY_TEMPLATES

// ── 搜索 + 分类筛选 ──
const search = ref('')
const activeCat = ref('全部')
const categories = computed(() => ['全部', ...Array.from(new Set(templates.map(t => t.category)))])
const filtered = computed(() => {
  const kw = search.value.trim().toLowerCase()
  return templates.filter(t => {
    const matchCat = activeCat.value === '全部' || t.category === activeCat.value
    const matchKw = !kw
      || t.name.toLowerCase().includes(kw)
      || t.industry.toLowerCase().includes(kw)
      || t.description.toLowerCase().includes(kw)
      || t.category.toLowerCase().includes(kw)
    return matchCat && matchKw
  })
})

// ── 缩略图辅助 ──
function tplName(t: BuiltInTemplate): string {
  return t.data.modules.find(m => m.type === 'personal')?.items?.[0]?.name || t.name
}
function tplRole(t: BuiltInTemplate): string {
  return t.data.modules.find(m => m.type === 'personal')?.items?.[0]?.position || t.industry
}
// 将模板的标题样式映射到缩略图的小标题样式类
function thumbClass(style?: string): string {
  const s = style || 'underline'
  if (['leftbar', 'thin-leftbar', 'grad-leftbar', 'grad-dual'].includes(s)) return 't-leftbar'
  if (['pill', 'grad-pill', 'grad-shadow'].includes(s)) return 't-pill'
  if (['centerline', 'thin-center'].includes(s)) return 't-center'
  if (['dots', 'grad-fade'].includes(s)) return 't-dots'
  if (['minimal', 'thin-overline', 'thin-double', 'thin-box', 'thin-framed', 'thin-corner', 'thin-bracket'].includes(s)) return 't-minimal'
  return 't-underline' // underline / thin-underline / thin-underline-soft / grad-underline
}

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

async function useTemplate(tpl: BuiltInTemplate) {
  const ok = await showConfirm({
    title: '使用模板',
    description: `使用「${tpl.name}」模板将替换当前简历内容，确定继续？`,
  })
  if (ok) {
    store.importData(tpl.data)
    emit('update:open', false)
  }
}
</script>
