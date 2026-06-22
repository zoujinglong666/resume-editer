<template>
  <div class="app-header no-print shrink-0">
    <!-- Left: Logo + Phase Stepper -->
    <div class="app-header-left">
      <span class="app-logo">
        <span class="app-logo-dot" />
        闪聘
      </span>

      <div class="phase-stepper" style="border-left: 1px solid var(--sidebar-border); padding-left: var(--space-4);">
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
        <button class="header-btn header-btn--primary" @click="$emit('preview')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          预览
        </button>
        <button class="header-btn header-btn--green" @click="$emit('quick-export-pdf')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h3"/></svg>
          预览PDF
        </button>
        <button class="header-btn header-btn--primary" @click="$emit('export-pdf')">
          导出
        </button>
        <button class="header-btn" @click="$emit('export-json')">
          导出 JSON
        </button>
        <button class="header-btn" @click="$emit('import-json')">
          导入 JSON
        </button>
        <button class="header-btn" style="color: #f87171;" @click="$emit('reset')">
          重置
        </button>
      </template>

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
import { useResumeStore } from '../stores/resume'

const store = useResumeStore()

defineEmits(['export-pdf', 'import-json', 'export-json', 'reset', 'preview', 'quick-export-pdf'])

const phases = [
  { key: 'fill' as const, label: '填写信息' },
  { key: 'style' as const, label: '定制外观' },
  { key: 'export' as const, label: '导出分享' },
]
const phaseOrder = phases.map(p => p.key)
</script>
