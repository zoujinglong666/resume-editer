<template>
  <div class="app-editor no-print">
    <!-- Inline Toolbar -->
    <div class="inline-toolbar">
      <button class="inline-toolbar-btn" :disabled="!store.canUndo" title="撤销 (Ctrl+Z)" @click="store.undo()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
        <span>撤销</span>
      </button>
      <button class="inline-toolbar-btn" :disabled="!store.canRedo" title="重做 (Ctrl+Y)" @click="store.redo()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/></svg>
        <span>重做</span>
      </button>
    </div>

    <!-- Module List -->
    <div class="panel-section">
      <div class="panel-section-title">模块列表</div>
      <div class="space-y-0.5">
        <div
          v-for="mod in store.modules"
          :key="mod.id"
          class="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all text-sm"
          :style="store.selectedModuleId === mod.id
            ? 'background: var(--primary-50); color: var(--primary-600);'
            : ''"
          @mouseenter="store.selectedModuleId !== mod.id && (($event.target as HTMLElement).style.background = 'var(--border-light)')"
          @mouseleave="store.selectedModuleId !== mod.id && (($event.target as HTMLElement).style.background = '')"
          @click="store.selectModule(mod.id)"
        >
          <span
            class="eye-toggle shrink-0"
            :class="{ hidden: !mod.visible }"
            @click.stop="store.toggleModuleVisibility(mod.id)"
          >
            <svg v-if="mod.visible" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </span>
          <span class="text-sm flex-1 truncate">{{ mod.title }}</span>
          <!-- Completion badge -->
          <span
            v-if="store.completionByModule[mod.id]"
            class="module-completion-badge"
            :class="getBadgeClass(mod.id)"
          >
            {{ store.completionByModule[mod.id].filled }}/{{ store.completionByModule[mod.id].total }}
          </span>
          <span v-else class="text-xs text-gray-400">#{{ mod.order + 1 }}</span>
        </div>
      </div>
    </div>

    <!-- Selected Module Detail -->
    <div v-if="store.selectedModule" class="panel-section flex-1">
      <div class="panel-section-title">编辑: {{ store.selectedModule.title }}</div>

      <!-- Module Title Edit -->
      <label class="block mb-4">
        <span class="editor-label">模块标题</span>
        <input
          type="text"
          :value="store.selectedModule.title"
          @input="store.updateModule(store.selectedModule!.id, { title: ($event.target as HTMLInputElement).value })"
          class="editor-input"
          style="font-size: 14px; font-weight: 500;"
        />
      </label>

      <!-- Items Editor -->
      <div v-if="store.selectedModule.items.length > 0" class="space-y-4">
        <div
          v-for="(item, idx) in store.selectedModule.items"
          :key="item.id"
          class="editor-card relative group/item"
          @contextmenu.prevent="onItemContextMenu($event, item.id)"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="entry-number">{{ idx + 1 }}</span>
              <span class="text-xs font-semibold" style="color: var(--primary-600);">条目</span>
            </div>
            <button
              v-if="store.selectedModule!.type !== 'personal'"
              class="text-xs font-medium transition-all opacity-0 group-hover/item:opacity-100 px-2 py-1 rounded hover:bg-red-50"
              style="color: var(--color-error);"
              @click="store.removeItem(store.selectedModule!.id, item.id)"
            >删除</button>
          </div>
          <div class="space-y-2">
            <template v-for="(val, key) in item" :key="key">
              <label
                v-if="key !== 'id' && typeof val === 'string'"
                class="block mb-3"
                :class="{ 'field-required': isRequired(store.selectedModule!.type, key) }"
              >
                <span class="editor-label">{{ getFieldLabel(store.selectedModule!.type, key) }}</span>
                <textarea
                  v-if="isLongField(key)"
                  :value="val"
                  rows="3"
                  @input="store.updateItem(store.selectedModule!.id, item.id, key, ($event.target as HTMLTextAreaElement).value)"
                  class="editor-input editor-textarea"
                  :class="{ 'field-input-error': isRequired(store.selectedModule!.type, key) && !val.trim() }"
                  :placeholder="getFieldPlaceholder(store.selectedModule!.type, key)"
                ></textarea>
                <input
                  v-else
                  type="text"
                  :value="val"
                  @input="store.updateItem(store.selectedModule!.id, item.id, key, ($event.target as HTMLInputElement).value)"
                  class="editor-input"
                  :class="{ 'field-input-error': isRequired(store.selectedModule!.type, key) && !val.trim() }"
                  :placeholder="getFieldPlaceholder(store.selectedModule!.type, key)"
                />
              </label>
            </template>
          </div>
        </div>
      </div>

      <!-- Add Item Button -->
      <button
        v-if="store.selectedModule.type !== 'personal'"
        class="editor-add-item-btn"
        @click="onAddItem"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        添加{{ getModuleTypeName(store.selectedModule.type) }}条目
      </button>
    </div>

    <!-- No selection -->
    <div v-else class="panel-section flex-1 flex items-center justify-center" style="color: var(--text-muted);">
      <div class="text-center">
        <div style="font-size: 32px; margin-bottom: 8px; opacity: 0.4;">👆</div>
        <div class="text-sm font-medium">选择一个模块进行编辑</div>
        <div class="text-xs mt-1" style="opacity: 0.6;">或在画布中直接点击模块</div>
      </div>
    </div>

    <!-- Item Context Menu (Editor Panel) -->
    <ContextMenu
      :visible="itemMenuVisible"
      :x="itemMenuX"
      :y="itemMenuY"
      :items="itemMenuItems"
      @update:visible="itemMenuVisible = $event"
      @close="onItemMenuClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useResumeStore } from '../stores/resume'
import type { ModuleType } from '../types'
import ContextMenu from './ContextMenu.vue'
import type { ContextMenuItem } from './ContextMenu.vue'

const store = useResumeStore()

// ---- Item Context Menu (Editor Panel) ----
const itemMenuVisible = ref(false)
const itemMenuX = ref(0)
const itemMenuY = ref(0)
const itemMenuItems = ref<ContextMenuItem[]>([])
const itemMenuTargetId = ref<string | null>(null)

function onItemContextMenu(e: MouseEvent, itemId: string) {
  e.preventDefault()
  e.stopPropagation()
  itemMenuTargetId.value = itemId
  if (!store.selectedModule) return

  const mod = store.selectedModule
  const idx = mod.items.findIndex(i => i.id === itemId)
  const isFirst = idx <= 0
  const isLast = idx >= mod.items.length - 1

  const items: ContextMenuItem[] = []

  items.push({
    label: '复制条目',
    icon: '📋',
    shortcut: 'Ctrl+D',
    action: () => store.duplicateItem(mod.id, itemId)
  })

  items.push({
    label: '删除条目',
    icon: '🗑️',
    danger: true,
    action: () => store.removeItem(mod.id, itemId)
  })

  items.push({ label: '', divider: true })

  if (!isFirst) {
    items.push({
      label: '上移条目',
      icon: '⬆️',
      action: () => store.moveItem(mod.id, itemId, 'up')
    })
  }
  if (!isLast) {
    items.push({
      label: '下移条目',
      icon: '⬇️',
      action: () => store.moveItem(mod.id, itemId, 'down')
    })
  }

  items.push({ label: '', divider: true })

  items.push({
    label: '清空内容',
    icon: '🧹',
    action: () => {
      const item = mod.items.find(i => i.id === itemId)
      if (item) {
        Object.keys(item).forEach(key => {
          if (key !== 'id') (item as any)[key] = ''
        })
      }
    }
  })

  itemMenuItems.value = items
  itemMenuX.value = e.clientX
  itemMenuY.value = e.clientY
  itemMenuVisible.value = true
}

function onItemMenuClose() {
  itemMenuVisible.value = false
  itemMenuTargetId.value = null
}

function getBadgeClass(modId: string): string {
  const stats = store.completionByModule[modId]
  if (!stats || stats.total === 0) return 'empty'
  if (stats.filled === stats.total) return 'done'
  if (stats.filled === 0) return 'empty'
  return 'partial'
}

function isLongField(key: string): boolean {
  return ['description', 'summary', 'content'].includes(key)
}

function isRequired(type: ModuleType, key: string): boolean {
  const required: Record<string, string[]> = {
    personal: ['name', 'phone'],
    education: ['school', 'degree', 'dateRange'],
    experience: ['company', 'position', 'dateRange'],
    project: ['name', 'dateRange'],
    skill: [],
    custom: [],
  }
  return (required[type] || []).includes(key)
}

function getFieldLabel(type: ModuleType, key: string): string {
  const labels: Record<string, Record<string, string>> = {
    personal: { name: '姓名', phone: '电话', email: '邮箱', location: '所在地', position: '职位', summary: '个人简介' },
    education: { school: '学校', degree: '学历', major: '专业', dateRange: '时间', description: '描述' },
    experience: { company: '公司', position: '职位', dateRange: '时间', description: '工作内容' },
    project: { name: '项目名', role: '角色', dateRange: '时间', description: '项目描述', link: '链接' },
    skill: { name: '技能名称', level: '熟练度 (入门/熟悉/精通/专家)' },
    custom: { title: '标题', content: '内容' }
  }
  return labels[type]?.[key] || key
}

function getFieldPlaceholder(type: ModuleType, key: string): string {
  const placeholders: Record<string, Record<string, string>> = {
    personal: { name: '张晓明', phone: '138xxxx0000', email: 'example@mail.com', location: '深圳', position: '前端开发工程师', summary: '简要介绍自己...' },
    education: { school: 'XX大学', degree: '本科/硕士/博士', major: '计算机科学与技术', dateRange: '2020 - 2024', description: '主修课程、成绩等...' },
    experience: { company: 'XX公司', position: '前端工程师', dateRange: '2024 - 至今', description: '负责的工作内容和成果...' },
    project: { name: '项目名称', role: '核心开发者', dateRange: '2025', description: '项目简介和技术栈...', link: 'https://...' },
    skill: { name: 'React / Vue / Python...', level: '精通' },
    custom: { title: '模块标题', content: '支持富文本内容...' }
  }
  return placeholders[type]?.[key] || ''
}

function getModuleTypeName(type: ModuleType): string {
  const names: Record<ModuleType, string> = {
    personal: '', education: '教育', experience: '工作',
    project: '项目', skill: '技能', custom: ''
  }
  return names[type] || ''
}

function onAddItem() {
  if (!store.selectedModule) return
  store.addItem(store.selectedModule.id)
}
</script>
