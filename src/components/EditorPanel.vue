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
      <div style="display: flex; flex-direction: column; gap: var(--space-0_5);">
        <div
          v-for="mod in store.modules"
          :key="mod.id"
          class="flex items-center transition-all text-sm cursor-pointer rounded"
          style="gap: var(--tight-gap); padding: var(--list-item-padding-y) var(--list-item-padding-x);"
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
      <label class="block" style="margin-bottom: var(--card-gap);">
        <span class="editor-label">模块标题</span>
        <input
          type="text"
          :value="store.selectedModule.title"
          @input="store.updateModule(store.selectedModule!.id, { title: ($event.target as HTMLInputElement).value })"
          class="editor-input"
        />
      </label>

      <!-- Personal Field Management (only for personal module) -->
      <div v-if="store.selectedModule.type === 'personal'" class="personal-field-manager">
        <div class="editor-label" style="margin-bottom: var(--space-2); display: flex; align-items: center; justify-content: space-between;">
          <span>字段管理 <span style="font-weight:400; color: var(--text-muted); text-transform: none; letter-spacing: 0;">（拖拽排序、显隐、图标）</span></span>
        </div>
        <draggable
          :list="personalFieldsList"
          item-key="id"
          handle=".pf-drag-handle"
          animation="200"
          ghost-class="sortable-ghost"
          class="flex flex-col"
          style="gap: var(--space-1_5);"
          @end="onPersonalFieldsReordered"
        >
          <template #item="{ element: field }">
            <div class="pf-row" :class="{ 'pf-hidden': !field.visible }">
              <span class="pf-drag-handle cursor-move" title="拖拽排序">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/></svg>
              </span>
              <!-- Visibility toggle -->
              <button
                class="pf-eye-btn"
                :title="field.visible ? '隐藏字段' : '显示字段'"
                @click="store.togglePersonalFieldVisibility(field.id)"
              >
                <svg v-if="field.visible" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
              <!-- Label -->
              <input
                type="text"
                :value="field.label"
                @input="store.updatePersonalFieldLabel(field.id, ($event.target as HTMLInputElement).value)"
                class="pf-label-input"
                :readonly="field.key === 'name'"
              />
              <!-- Icon selector -->
              <select
                :value="field.icon || ''"
                @change="store.updatePersonalFieldIcon(field.id, ($event.target as HTMLSelectElement).value)"
                class="pf-icon-select"
                title="选择图标"
              >
                <option v-for="ic in AVAILABLE_ICONS" :key="ic.name" :value="ic.name">{{ ic.label }}</option>
              </select>
              <!-- Delete (only for non-builtin) -->
              <button
                v-if="!field.isBuiltin"
                class="pf-delete-btn"
                title="删除字段"
                @click="store.removePersonalField(field.id)"
              >×</button>
              <span v-else class="pf-builtin-badge" title="内置字段">内置</span>
            </div>
          </template>
        </draggable>

        <!-- Add custom field -->
        <div class="pf-add-row">
          <input
            v-model="newFieldLabel"
            type="text"
            placeholder="新字段名称，如：微信"
            class="editor-input flex-1"
            @keydown.enter="onAddPersonalField"
          />
          <button
            class="pf-add-btn"
            :disabled="!newFieldLabel.trim()"
            @click="onAddPersonalField"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            添加
          </button>
        </div>
      </div>

      <!-- Items Editor -->
      <draggable
        v-if="store.selectedModule.items.length > 0"
        :list="store.selectedModule.items"
        item-key="id"
        handle=".item-drag-handle"
        animation="200"
        ghost-class="sortable-ghost"
        class="flex flex-col"
        style="gap: var(--card-gap);"
      >
        <template #item="{ element: item, index: idx }">
          <div
            class="editor-card relative group/item"
            @contextmenu.prevent="onItemContextMenu($event, item.id)"
          >
            <div class="flex items-center justify-between" style="margin-bottom: var(--normal-gap);">
              <div class="flex items-center" style="gap: var(--tight-gap);">
                <span class="item-drag-handle cursor-move opacity-0 group-hover/item:opacity-100 transition-opacity" title="拖拽排序">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/></svg>
                </span>
                <span class="entry-number">{{ idx + 1 }}</span>
                <span class="text-xs font-semibold" style="color: var(--primary-600);">条目</span>
              </div>
              <button
                class="text-xs font-medium transition-all opacity-0 group-hover/item:opacity-100 px-2 py-1 rounded hover:bg-red-50"
                style="color: var(--color-error);"
                @click="store.removeItem(store.selectedModule!.id, item.id)"
              >删除</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: var(--form-field-gap);">
              <template v-for="(val, key) in item" :key="String(key)">
                <label
                  v-if="String(key) !== 'id' && String(key) !== 'personalFields' && typeof val === 'string'"
                  class="block"
                  :class="{ 'field-required': isRequired(store.selectedModule!.type, String(key)) }"
                >
                  <span class="editor-label">{{ getFieldLabel(store.selectedModule!.type, String(key)) }}</span>

                  <!-- Date Range Picker -->
                  <div v-if="String(key) === 'dateRange'" class="flex items-center" style="gap: var(--tight-gap);">
                    <input
                      type="month"
                      class="editor-input flex-1"
                      :value="dateRangeStart(val)"
                      @change="updateDateRange(String(item.id), 'start', ($event.target as HTMLInputElement).value)"
                    />
                    <span class="text-xs text-gray-400">~</span>
                    <template v-if="dateRangeIsPresent(val)">
                      <label class="flex items-center gap-1 text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          :checked="true"
                          @change="toggleDatePresent(String(item.id), ($event.target as HTMLInputElement).checked)"
                        />
                        至今
                      </label>
                    </template>
                    <input
                      v-else
                      type="month"
                      class="editor-input flex-1"
                      :value="dateRangeEnd(val)"
                      @change="updateDateRange(String(item.id), 'end', ($event.target as HTMLInputElement).value)"
                    />
                  </div>

                  <!-- Rich Text Editor -->
                  <RichTextEditor
                    v-else-if="isLongField(String(key))"
                    :model-value="val"
                    :placeholder="getFieldPlaceholder(store.selectedModule!.type, String(key))"
                    @update:model-value="store.updateItem(store.selectedModule!.id, String(item.id), String(key), $event)"
                  />

                  <!-- Validated Text Input -->
                  <input
                    v-else
                    type="text"
                    :value="val"
                    @input="updateAndValidate(String(item.id), String(key), ($event.target as HTMLInputElement).value)"
                    @blur="validate(String(item.id), String(key), val)"
                    class="editor-input"
                    :class="{
                      'field-input-error': isRequired(store.selectedModule!.type, String(key)) && !val.trim()
                        || validationErrors[errorKey(String(item.id), String(key))]
                    }"
                    :placeholder="getFieldPlaceholder(store.selectedModule!.type, String(key))"
                  />

                  <!-- Validation Error Message -->
                  <span
                    v-if="validationErrors[errorKey(String(item.id), String(key))]"
                    class="text-xs text-red-500 mt-0.5"
                  >{{ validationErrors[errorKey(String(item.id), String(key))] }}</span>
                </label>
              </template>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Add Item Button -->
      <button
        class="editor-add-item-btn"
        @click="onAddItem"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        添加{{ getModuleTypeName(store.selectedModule.type) }}条目
      </button>

      <!-- AI Generate Section (for experience/project modules) -->
      <div
        v-if="store.selectedModule.type === 'experience' || store.selectedModule.type === 'project'"
        class="editor-ai-generate-section"
      >
        <div class="editor-ai-generate-title">✨ AI 智能生成</div>
        <input
          v-model="aiGenerateForm.jobTitle"
          type="text"
          placeholder="目标职位（如：高级前端工程师）"
          class="editor-input"
        />
        <input
          v-model="aiGenerateForm.company"
          type="text"
          placeholder="公司名称（如：字节跳动）"
          class="editor-input"
        />
        <textarea
          v-model="aiGenerateForm.jdText"
          rows="4"
          placeholder="粘贴职位描述（JD）..."
          class="editor-textarea"
        ></textarea>
        <button
          class="editor-ai-generate-btn"
          :disabled="isAiGenerating || !aiGenerateForm.jobTitle || !aiGenerateForm.jdText"
          @click="handleAiGenerate"
        >
          <svg v-if="!isAiGenerating" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14h.01"/><path d="M8 14h.01"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56" class="ai-spinner"/></svg>
          {{ isAiGenerating ? '生成中...' : 'AI 生成工作经历' }}
        </button>
      </div>
    </div>

    <!-- No selection -->
    <div v-else class="panel-section flex-1 flex items-center justify-center" style="color: var(--text-muted);">
      <div class="text-center">
        <div style="font-size: var(--font-size-4xl); margin-bottom: var(--tight-gap); opacity: 0.4;">👆</div>
        <div class="text-sm font-medium">选择一个模块进行编辑</div>
        <div class="text-xs" style="margin-top: var(--space-1); opacity: 0.6;">或在画布中直接点击模块</div>
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
import { ref, computed } from 'vue'
import draggable from 'vuedraggable'
import { useResumeStore } from '../stores/resume'
import type { ModuleType } from '../types'
import ContextMenu from './ContextMenu.vue'
import type { ContextMenuItem } from './ContextMenu.vue'
import RichTextEditor from './RichTextEditor.vue'

// Available icons for personal fields
const AVAILABLE_ICONS = [
  { name: '', label: '无图标' },
  { name: 'Phone', label: '📞 电话' },
  { name: 'Mail', label: '📧 邮件' },
  { name: 'MapPin', label: '📍 定位' },
  { name: 'Globe', label: '🌐 网站' },
  { name: 'Github', label: '🐙 GitHub' },
  { name: 'Linkedin', label: '💼 LinkedIn' },
  { name: 'Link', label: '🔗 链接' },
  { name: 'Briefcase', label: '💼 工作' },
  { name: 'User', label: '👤 用户' },
  { name: 'MessageCircle', label: '💬 消息' },
  { name: 'AtSign', label: '@ 账号' },
  { name: 'Calendar', label: '📅 日历' },
  { name: 'Heart', label: '❤️ 爱好' },
  { name: 'Star', label: '⭐ 星标' },
  { name: 'Award', label: '🏆 奖项' },
  { name: 'BookOpen', label: '📖 博客' },
  { name: 'Code', label: '💻 代码' },
  { name: 'Monitor', label: '🖥️ 电脑' },
  { name: 'Smartphone', label: '📱 手机' },
  { name: 'Send', label: '✈️ 发送' },
  { name: 'Hash', label: '# 编号' },
  { name: 'Rss', label: '📡 RSS' },
  { name: 'ExternalLink', label: '↗️ 外链' },
]

const store = useResumeStore()

// ---- Personal Field Management ----
const newFieldLabel = ref('')

const personalFieldsList = computed({
  get: () => store.getPersonalFields(store.selectedModule),
  set: () => {} // handled by drag end event
})

function onAddPersonalField() {
  if (!newFieldLabel.value.trim()) return
  store.addPersonalField(newFieldLabel.value.trim())
  newFieldLabel.value = ''
}

function onPersonalFieldsReordered() {
  store.reorderPersonalFields(personalFieldsList.value)
}

// ---- Item Context Menu (Editor Panel) ----
const itemMenuVisible = ref(false)
const itemMenuX = ref(0)
const itemMenuY = ref(0)
const itemMenuItems = ref<ContextMenuItem[]>([])
const itemMenuTargetId = ref<string | null>(null)

// ---- Validation ----
const validationErrors = ref<Record<string, string>>({})

const errorKey = (itemId: string, field: string) => `${itemId}__${field}`

function validate(itemId: string, key: string, value: string): boolean {
  const k = errorKey(itemId, key)
  let msg = ''
  const v = value.trim()
  if (key === 'phone' && v) {
    if (!/^1[3-9]\d{9}$/.test(v.replace(/\s|-/g, ''))) msg = '手机号格式不正确'
  }
  if (key === 'email' && v) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = '邮箱格式不正确'
  }
  if (key === 'link' && v) {
    if (!/^https?:\/\/.+/.test(v)) msg = '链接应以 http:// 或 https:// 开头'
  }
  if (msg) validationErrors.value[k] = msg
  else delete validationErrors.value[k]
  return !msg
}

function updateAndValidate(itemId: string, key: string, value: string) {
  store.updateItem(store.selectedModule!.id, itemId, key, value)
  validate(itemId, key, value)
}

// ---- Date Range Helpers ----
function dateRangeStart(dateRange?: string): string {
  if (!dateRange) return ''
  return dateRange.split(' ~ ')[0] || ''
}
function dateRangeEnd(dateRange?: string): string {
  if (!dateRange) return ''
  const parts = dateRange.split(' ~ ')
  if (!parts[1] || parts[1] === '至今') return ''
  return parts[1]
}
function dateRangeIsPresent(dateRange?: string): boolean {
  if (!dateRange) return true
  return dateRange.includes('至今') || !dateRange.includes(' ~ ')
}
function updateDateRange(itemId: string, part: 'start' | 'end', value: string) {
  const item = store.selectedModule!.items.find(i => i.id === itemId)
  if (!item) return
  const parts = item.dateRange ? item.dateRange.split(' ~ ') : ['', '至今']
  if (part === 'start') {
    store.updateItem(store.selectedModule!.id, itemId, 'dateRange', value + ' ~ ' + (parts[1] || '至今'))
  } else {
    store.updateItem(store.selectedModule!.id, itemId, 'dateRange', (parts[0] || '') + ' ~ ' + value)
  }
}
function toggleDatePresent(itemId: string, present: boolean) {
  const item = store.selectedModule!.items.find(i => i.id === itemId)
  if (!item) return
  const start = dateRangeStart(item.dateRange)
  if (present) {
    store.updateItem(store.selectedModule!.id, itemId, 'dateRange', (start || '') + ' ~ 至今')
  } else {
    store.updateItem(store.selectedModule!.id, itemId, 'dateRange', (start || '') + ' ~ ')
  }
}

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

// ---- AI Generate ----
import { loadAiConfig, aiGenerateFromJD } from '../utils/ai'
const isAiGenerating = ref(false)
const aiGenerateForm = ref({
  jobTitle: '',
  company: '',
  jdText: '',
})

async function handleAiGenerate() {
  const config = loadAiConfig()
  if (!config) {
    alert('请先配置 AI API Key')
    return
  }

  const { jobTitle, company, jdText } = aiGenerateForm.value
  if (!jobTitle || !jdText) {
    alert('请填写目标职位和职位描述（JD）')
    return
  }

  isAiGenerating.value = true
  try {
    const result = await aiGenerateFromJD(config, jobTitle, company, jdText)
    // Add a new item with the generated content
    store.addItem(store.selectedModule!.id)
    // Get the last item
    const items = store.selectedModule!.items
    const newItem = items[items.length - 1]
    if (newItem) {
      store.updateItem(store.selectedModule!.id, newItem.id, 'description', result)
    }
  } catch (err: unknown) {
    alert(`AI 生成失败: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    isAiGenerating.value = false
  }
}

function isRequired(type: ModuleType, key: string): boolean {
  const required: Record<string, string[]> = {
    personal: ['name', 'phone'],
    education: ['school', 'degree', 'dateRange'],
    experience: ['company', 'position', 'dateRange'],
    project: ['name', 'dateRange'],
    skill: [],
    strength: [],
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
    skill: { name: '技术类别', content: '关键词（顿号分隔）' },
    strength: { title: '能力标签', content: '量化事实或证据' },
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
    skill: { name: '后端框架', content: 'Spring Boot、Spring Cloud、MyBatis Plus' },
    strength: { title: '全栈能力强', content: '已上线 10+ 个可访问产品' },
    custom: { title: '模块标题', content: '支持富文本内容...' }
  }
  return placeholders[type]?.[key] || ''
}

function getModuleTypeName(type: ModuleType): string {
  const names: Record<ModuleType, string> = {
    personal: '', education: '教育', experience: '工作',
    project: '项目', skill: '技能', strength: '优势', custom: ''
  }
  return names[type] || ''
}

function onAddItem() {
  if (!store.selectedModule) return
  store.addItem(store.selectedModule.id)
}
</script>
