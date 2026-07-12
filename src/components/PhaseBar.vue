<template>
  <div class="app-header no-print shrink-0">
    <!-- Left: Logo + Phase Stepper -->
    <div class="app-header-left">
      <span class="app-logo">
        <span class="app-logo-dot" />
        闪聘
      </span>

      <div class="phase-stepper">
        <template v-for="(phase, idx) in phases" :key="phase.key">
          <button
            class="phase-step"
            :class="{
              active: store.currentPhase === phase.key,
              completed: phaseOrder.indexOf(store.currentPhase) > idx
            }"
            @click="store.setPhase(phase.key)"
          >
            <span class="phase-step-num">{{ idx + 1 }}</span>
            <span>{{ phase.label }}</span>
          </button>
          <div v-if="idx < phases.length - 1" class="phase-divider" />
        </template>
      </div>
    </div>

    <!-- Right: Actions + Save Status -->
    <div class="app-header-right">
      <!-- Phase 1: Fill → next -->
      <template v-if="store.currentPhase === 'fill'">
        <button
          v-if="store.overallCompletion === 100"
          class="header-btn header-btn--primary"
          @click="store.setPhase('style')"
        >
          完成填写 →
        </button>
      </template>

      <!-- Phase 2: Style → export -->
      <template v-if="store.currentPhase === 'style'">
        <button
          class="header-btn header-btn--primary"
          @click="store.setPhase('export')"
        >
          继续导出 →
        </button>
      </template>

      <!-- Phase 3: Export actions -->
      <template v-if="store.currentPhase === 'export'">
        <button class="header-btn header-btn--ghost" @click="$emit('preview')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          预览
        </button>
        <button class="header-btn header-btn--primary" @click="$emit('export-pdf')">
          导出
        </button>

        <!-- Secondary actions, tucked into a menu -->
        <div class="header-more-wrap">
          <button
            class="header-btn header-btn--more"
            :class="{ 'is-open': showMore }"
            @click="showMore = !showMore"
          >
            更多
            <svg class="more-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <template v-if="showMore">
            <div class="header-more-backdrop" @click="showMore = false" />
            <div class="header-more-menu" role="menu">
              <button class="header-more-item" role="menuitem" @click="runAction('quick-export-pdf')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h3"/></svg>
                预览 PDF
              </button>
              <button class="header-more-item" role="menuitem" @click="runAction('export-image')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                导出图片
              </button>
              <div class="header-more-sep" />
              <button class="header-more-item" role="menuitem" @click="runAction('export-json')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                导出 JSON
              </button>
              <button class="header-more-item" role="menuitem" @click="runAction('import-json')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                导入 JSON
              </button>
            </div>
          </template>
        </div>

        <button class="header-btn header-btn--danger" @click="$emit('reset')">
          重置
        </button>
      </template>

      <!-- AI 优化入口（预留：对接外部 AI Agent） -->
      <button class="header-btn header-btn--ai" @click="$emit('ai-optimize')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M12 3l1.9 4.6L19 9.2l-4.3 2.4L13.8 16 12 20l-1.8-4-4.3-2.4L13 9.2z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z" transform="translate(-2 -1)"/></svg>
        AI 优化
      </button>

      <div style="width: 1px; height: 20px; background: var(--sidebar-border); margin: 0 6px;" />

      <div class="save-status">
        <span class="save-status-dot" :class="store.saveStatus" />
        <span>
          {{ store.saveStatus === 'saved' ? '已保存' : store.saveStatus === 'saving' ? '保存中' : '未保存' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useResumeStore } from '../stores/resume'

const store = useResumeStore()

const emit = defineEmits(['export-pdf', 'import-json', 'export-json', 'reset', 'preview', 'quick-export-pdf', 'export-image', 'ai-optimize'])

const showMore = ref(false)
function runAction(e: 'export-pdf' | 'import-json' | 'export-json' | 'reset' | 'preview' | 'quick-export-pdf' | 'export-image') {
  showMore.value = false
  emit(e)
}

const phases = [
  { key: 'fill' as const, label: '填写信息' },
  { key: 'style' as const, label: '定制外观' },
  { key: 'export' as const, label: '导出分享' },
]
const phaseOrder = phases.map(p => p.key)
</script>
