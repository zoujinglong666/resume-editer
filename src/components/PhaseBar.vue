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
          <Button
            class="phase-step"
            :class="{
              active: store.currentPhase === phase.key,
              completed: phaseOrder.indexOf(store.currentPhase) > idx
            }"
            @click="store.setPhase(phase.key)"
          >
            <span class="phase-step-num">{{ idx + 1 }}</span>
            <span>{{ phase.label }}</span>
          </Button>
          <div v-if="idx < phases.length - 1" class="phase-divider" />
        </template>
      </div>
    </div>

    <!-- Right: Actions + Save Status -->
    <div class="app-header-right">
      <!-- Phase 1: Fill → next -->
      <template v-if="store.currentPhase === 'fill'">
        <Button
          v-if="store.overallCompletion === 100"
          variant="primary"
          @click="store.setPhase('style')"
        >
          完成填写 →
        </Button>
      </template>

      <!-- Phase 2: Style → export -->
      <template v-if="store.currentPhase === 'style'">
        <Button
          variant="primary"
          @click="store.setPhase('export')"
        >
          继续导出 →
        </Button>
      </template>

      <!-- Phase 3: Export actions -->
      <template v-if="store.currentPhase === 'export'">
        <Button variant="ghost" @click="$emit('preview')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          预览
        </Button>
        <Button variant="primary" @click="$emit('export-pdf')">
          导出
        </Button>

        <!-- Secondary actions, tucked into a reka-ui DropdownMenu -->
        <DropdownMenuRoot>
          <DropdownMenuTrigger as-child>
            <Button
              variant="more"
            >
              更多
              <svg class="more-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent class="header-more-menu" :side-offset="6" align="end">
              <DropdownMenuItem class="header-more-item" @select="runAction('quick-export-pdf')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h3"/></svg>
                预览 PDF
              </DropdownMenuItem>
              <DropdownMenuItem class="header-more-item" @select="runAction('export-image')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                导出图片
              </DropdownMenuItem>
              <DropdownMenuSeparator class="header-more-sep" />
              <DropdownMenuItem class="header-more-item" @select="runAction('export-json')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                导出 JSON
              </DropdownMenuItem>
              <DropdownMenuItem class="header-more-item" @select="runAction('import-json')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                导入 JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>

        <Button variant="danger" @click="$emit('reset')">
          重置
        </Button>
      </template>

      <!-- AI 面板开关（内置 AI 助手） -->
      <Button
        variant="ai"
        :active="aiPanelOpen"
        :tip="aiPanelOpen ? '返回编辑' : '打开 AI 助手'"
        @click="$emit('toggle-ai-panel')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14h.01"/><path d="M8 14h.01"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>
        AI 助手
      </Button>

      <!-- AI 优化入口（预留：对接外部 AI Agent） -->
      <Button
        variant="agent"
        tip="对接外部 AI Agent（即将开放）"
        @click="$emit('ai-optimize')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M12 3l1.9 4.6L19 9.2l-4.3 2.4L13.8 16 12 20l-1.8-4-4.3-2.4L13 9.2z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z" transform="translate(-2 -1)"/></svg>
        AI 优化
        <span class="header-btn-badge">外部</span>
      </Button>

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
import Button from './ui/Button.vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'

const store = useResumeStore()

const props = defineProps<{ aiPanelOpen?: boolean }>()

const emit = defineEmits(['export-pdf', 'import-json', 'export-json', 'reset', 'preview', 'quick-export-pdf', 'export-image', 'ai-optimize', 'toggle-ai-panel'])

function runAction(e: 'export-pdf' | 'import-json' | 'export-json' | 'reset' | 'preview' | 'quick-export-pdf' | 'export-image') {
  emit(e)
}

const phases = [
  { key: 'fill' as const, label: '填写信息' },
  { key: 'style' as const, label: '定制外观' },
  { key: 'export' as const, label: '导出分享' },
]
const phaseOrder = phases.map(p => p.key)
</script>
