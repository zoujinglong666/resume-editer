<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="tpl-preview-overlay" />
      <DialogContent class="tpl-preview-dialog">
        <DialogTitle class="sr-only">模板预览</DialogTitle>
        <!-- Header -->
        <div class="tpl-preview-header">
          <div class="tpl-preview-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>模板预览: {{ template.name }}</span>
          </div>
          <div class="tpl-preview-actions">
            <button class="tpl-preview-btn tpl-preview-btn--primary" @click="handleLoad">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
              加载此模板
            </button>
            <button class="tpl-preview-close" @click="emit('update:open', false)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Meta Info -->
        <div class="tpl-preview-meta">
          <span>创建: {{ formatDate(template.createdAt) }}</span>
          <span class="tpl-preview-meta-sep">|</span>
          <span>更新: {{ formatDate(template.updatedAt) }}</span>
          <span class="tpl-preview-meta-sep">|</span>
          <span>{{ template.data.modules?.length || 0 }} 个模块</span>
        </div>

        <!-- Content Preview -->
        <div class="tpl-preview-body">
          <div v-for="mod in sortedModules" :key="mod.id" class="tpl-preview-module">
            <div class="tpl-preview-module-header">
              <span class="tpl-preview-module-icon">{{ getModuleIcon(mod.type) }}</span>
              <span class="tpl-preview-module-title">{{ mod.title }}</span>
              <span class="tpl-preview-module-badge">{{ mod.type }}</span>
              <span v-if="!mod.visible" class="tpl-preview-module-hidden">隐藏</span>
            </div>

            <!-- Items -->
            <div v-if="mod.items.length > 0" class="tpl-preview-items">
              <div v-for="(item, idx) in mod.items" :key="item.id" class="tpl-preview-item">
                <!-- Personal Info -->
                <template v-if="mod.type === 'personal'">
                  <div class="tpl-preview-item-title">{{ item.name || '未填写姓名' }}</div>
                  <div class="tpl-preview-item-sub">
                    <span v-if="item.position">{{ item.position }}</span>
                    <span v-if="item.phone">📞 {{ item.phone }}</span>
                    <span v-if="item.email">✉ {{ item.email }}</span>
                    <span v-if="item.location">📍 {{ item.location }}</span>
                    <span v-if="item.link">🔗 {{ item.link }}</span>
                  </div>
                  <div v-if="item.summary" class="tpl-preview-item-desc">{{ truncate(stripHtml(item.summary), 120) }}</div>
                </template>

                <!-- Education -->
                <template v-else-if="mod.type === 'education'">
                  <div class="tpl-preview-item-title">
                    {{ item.school || '未填写学校' }}
                    <span v-if="item.dateRange" class="tpl-preview-date">{{ item.dateRange }}</span>
                  </div>
                  <div class="tpl-preview-item-sub">
                    <span v-if="item.degree">{{ item.degree }}</span>
                    <span v-if="item.major">· {{ item.major }}</span>
                  </div>
                  <div v-if="item.description" class="tpl-preview-item-desc">{{ truncate(stripHtml(item.description), 150) }}</div>
                </template>

                <!-- Experience -->
                <template v-else-if="mod.type === 'experience'">
                  <div class="tpl-preview-item-title">
                    {{ item.company || '未填写公司' }}
                    <span v-if="item.dateRange" class="tpl-preview-date">{{ item.dateRange }}</span>
                  </div>
                  <div class="tpl-preview-item-sub">
                    <span v-if="item.position">{{ item.position }}</span>
                  </div>
                  <div v-if="item.description" class="tpl-preview-item-desc">{{ truncate(stripHtml(item.description), 150) }}</div>
                </template>

                <!-- Project -->
                <template v-else-if="mod.type === 'project'">
                  <div class="tpl-preview-item-title">
                    {{ item.name || '未填写项目名' }}
                    <span v-if="item.dateRange" class="tpl-preview-date">{{ item.dateRange }}</span>
                  </div>
                  <div class="tpl-preview-item-sub">
                    <span v-if="item.role">{{ item.role }}</span>
                    <span v-if="item.link">🔗 {{ item.link }}</span>
                  </div>
                  <div v-if="item.description" class="tpl-preview-item-desc">{{ truncate(stripHtml(item.description), 150) }}</div>
                </template>

                <!-- Skill -->
                <template v-else-if="mod.type === 'skill'">
                  <div class="tpl-preview-item-title">
                    {{ item.name || '未填写技能' }}
                    <span v-if="item.content" class="tpl-preview-item-desc" style="display:inline;margin:0;font-weight:400;">：{{ item.content }}</span>
                  </div>
                  <div class="tpl-preview-item-sub">
                    <span v-if="item.level && !item.content">{{ item.level }}</span>
                  </div>
                </template>

                <!-- Strength / Custom -->
                <template v-else>
                  <div class="tpl-preview-item-title">{{ item.title || item.name || `条目 ${idx + 1}` }}</div>
                  <div v-if="item.content || item.description" class="tpl-preview-item-desc">{{ truncate(stripHtml(item.content || item.description || ''), 150) }}</div>
                </template>
              </div>
            </div>

            <div v-else class="tpl-preview-empty">暂无条目</div>
          </div>

          <!-- Config Summary -->
          <div class="tpl-preview-config">
            <div class="tpl-preview-config-title">⚙️ 样式配置</div>
            <div class="tpl-preview-config-grid">
              <div class="tpl-preview-config-item">
                <span class="tpl-preview-config-label">主题色</span>
                <div class="tpl-preview-color-swatch" :style="{ background: template.data.config.primaryColor }" />
              </div>
              <div class="tpl-preview-config-item">
                <span class="tpl-preview-config-label">字体</span>
                <span class="tpl-preview-config-value">{{ getFontName(template.data.config.fontFamily) }}</span>
              </div>
              <div class="tpl-preview-config-item">
                <span class="tpl-preview-config-label">字号</span>
                <span class="tpl-preview-config-value">{{ template.data.config.fontSize }}px</span>
              </div>
              <div class="tpl-preview-config-item">
                <span class="tpl-preview-config-label">行高</span>
                <span class="tpl-preview-config-value">{{ template.data.config.lineHeight }}</span>
              </div>
              <div class="tpl-preview-config-item">
                <span class="tpl-preview-config-label">边距</span>
                <span class="tpl-preview-config-value">{{ template.data.config.pageMargin }}px</span>
              </div>
              <div class="tpl-preview-config-item">
                <span class="tpl-preview-config-label">标题样式</span>
                <span class="tpl-preview-config-value">{{ template.data.config.titleStyle || 'underline' }}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import type { ResumeTemplate, ModuleType } from '../types'
import { showConfirm } from '../utils/confirm'

const props = defineProps<{ template: ResumeTemplate; open: boolean }>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'load'): void
}>()

const sortedModules = computed(() => {
  return [...(props.template.data.modules || [])].sort((a, b) => a.order - b.order)
})

async function handleLoad() {
  const ok = await showConfirm({
    title: '加载模板',
    description: '加载此模板将覆盖当前内容，确定继续？',
  })
  if (ok) emit('load')
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch { return '' }
}

function getModuleIcon(type: ModuleType): string {
  const icons: Record<ModuleType, string> = {
    personal: '👤', education: '🎓', experience: '💼',
    project: '🚀', skill: '⚡', strength: '💪', custom: '📝'
  }
  return icons[type] || '📄'
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '...' : str
}

function getFontName(fontFamily: string): string {
  if (fontFamily.includes('SimSun') || fontFamily.includes('Songti')) return '宋体'
  if (fontFamily.includes('Microsoft YaHei')) return '微软雅黑'
  if (fontFamily.includes('PingFang')) return '苹方'
  if (fontFamily.includes('Georgia')) return 'Georgia'
  return '系统默认'
}
</script>
