<template>
  <div>
    <div v-for="item in module.items" :key="item.id" class="module-item autolayout-item" @contextmenu.prevent="onItemContextMenu($event, item.id)">
      <div class="edit-container">
        <!-- 标题行：项目名称 + 日期 -->
        <div class="header-row">
          <div class="header-fields">
            <span
              class="field field-primary"
              contenteditable="true"
              :data-placeholder="'项目名称'"
              @blur="updateField(item.id, 'name', $event)"
              @keydown="onFieldKeydown($event, item.id, 'name')"
              @paste="onPaste"
            >{{ item.name }}</span>
          </div>

          <div class="date-section">
            <span
              v-if="item.dateRange"
              class="date-text date-clickable"
              @click.stop="toggleDatePicker(item.id)"
              :title="'点击编辑日期'"
            >{{ item.dateRange }}</span>
            <span
              v-else
              class="date-text date-clickable date-placeholder"
              @click.stop="toggleDatePicker(item.id)"
              :title="'点击编辑日期'"
            >点击设置时间</span>

            <Teleport to="body">
              <div
                v-if="datePickerItemId === item.id"
                class="date-picker-popup"
                :style="datePickerStyle"
                @click.stop
              >
                <div class="date-picker-header">
                  <span>选择时间范围</span>
                  <button class="date-picker-close" @click="datePickerItemId = null">×</button>
                </div>
                <div class="date-picker-body">
                  <div class="date-picker-field">
                    <label>开始时间</label>
                    <input
                      type="month"
                      class="date-picker-input"
                      :value="getStartMonth(item.dateRange)"
                      @change="onStartDateChange(item.id, ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                  <span class="date-picker-sep">~</span>
                  <div class="date-picker-field">
                    <label>
                      <span>结束时间</span>
                      <label class="date-picker-present">
                        <input
                          type="checkbox"
                          :checked="isPresent(item.dateRange)"
                          @change="onPresentToggle(item.id, ($event.target as HTMLInputElement).checked)"
                        />
                        <span>至今</span>
                      </label>
                    </label>
                    <input
                      v-if="!isPresent(item.dateRange)"
                      type="month"
                      class="date-picker-input"
                      :value="getEndMonth(item.dateRange)"
                      @change="onEndDateChange(item.id, ($event.target as HTMLInputElement).value)"
                    />
                    <div v-else class="date-picker-present-label">至今</div>
                  </div>
                </div>
              </div>
            </Teleport>
          </div>
        </div>

        <!-- 担任角色行 -->
        <div class="subtitle-row">
          <span
            class="field field-secondary"
            contenteditable="true"
            :data-placeholder="'担任角色'"
            @blur="updateField(item.id, 'role', $event)"
            @keydown="onFieldKeydown($event, item.id, 'role')"
            @paste="onPaste"
          >{{ item.role }}</span>
        </div>

        <!-- 描述内容区域 -->
        <div class="description-section">
          <DescWithToolbar
            :model-value="item.description || ''"
            placeholder="项目简介和技术栈..."
            @update:model-value="store.updateItem(module.id, item.id, 'description', $event)"
            @blur="updateField(item.id, 'description', $event)"
          />
        </div>

        <!-- 项目链接 -->
        <div class="link-section">
          <a
            v-if="item.link"
            :href="String(item.link)"
            target="_blank"
            rel="noopener noreferrer"
            class="item-link"
          >{{ item.link }}</a>
          <span
            v-else
            class="field field-link no-print"
            contenteditable="true"
            :data-placeholder="'项目链接（可选）'"
            @blur="updateField(item.id, 'link', $event)"
            @keydown="onFieldKeydown($event, item.id, 'link')"
            @paste="onPaste"
          ></span>
        </div>
      </div>
    </div>

    <!-- Item Context Menu -->
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useResumeStore } from '../../stores/resume'
import type { ResumeModule } from '../../types'
import ContextMenu from '../ContextMenu.vue'
import type { ContextMenuItem } from '../ContextMenu.vue'
import DescWithToolbar from './DescWithToolbar.vue'

const props = defineProps<{ module: ResumeModule }>()
const store = useResumeStore()

// ---- Item Context Menu ----
const itemMenuVisible = ref(false)
const itemMenuX = ref(0)
const itemMenuY = ref(0)
const itemMenuItems = ref<ContextMenuItem[]>([])
const itemMenuTargetId = ref<string | null>(null)

function onItemContextMenu(e: MouseEvent, itemId: string) {
  e.preventDefault()
  e.stopPropagation()
  itemMenuTargetId.value = itemId

  const idx = props.module.items.findIndex(i => i.id === itemId)
  const isFirst = idx <= 0
  const isLast = idx >= props.module.items.length - 1

  const items: ContextMenuItem[] = []

  items.push({
    label: '复制项目',
    icon: '📋',
    shortcut: 'Ctrl+D',
    action: () => store.duplicateItem(props.module.id, itemId)
  })

  items.push({
    label: '删除项目',
    icon: '🗑️',
    danger: true,
    action: () => store.removeItem(props.module.id, itemId)
  })

  items.push({ label: '', divider: true })

  if (!isFirst) {
    items.push({
      label: '上移项目',
      icon: '⬆️',
      action: () => store.moveItem(props.module.id, itemId, 'up')
    })
  }
  if (!isLast) {
    items.push({
      label: '下移项目',
      icon: '⬇️',
      action: () => store.moveItem(props.module.id, itemId, 'down')
    })
  }

  items.push({ label: '', divider: true })

  items.push({
    label: '清空内容',
    icon: '🧹',
    action: () => {
      const item = props.module.items.find(i => i.id === itemId)
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

// ---- Field Update ----
const RICH_FIELDS = ['description', 'summary', 'content']

function normalizeHtml(html: string): string {
  if (!html || html === '<br>' || html === '<div><br></div>' || html === '<p><br></p>') return ''
  return html
}

function updateField(itemId: string, field: string, e: FocusEvent) {
  const target = e.target as HTMLElement
  const isRich = RICH_FIELDS.includes(field)
  const raw = isRich ? target.innerHTML : target.innerText
  const value = isRich ? normalizeHtml(raw) : raw
  store.updateItem(props.module.id, itemId, field, value)
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

// ---- Field Navigation with Tab ----
function onFieldKeydown(e: KeyboardEvent, _itemId: string, currentField: string) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const fieldOrder = ['name', 'role', 'link']
    const currentIndex = fieldOrder.indexOf(currentField)

    if (e.shiftKey) {
      if (currentIndex > 0) {
        const prevField = fieldOrder[currentIndex - 1]
        const prevEl = document.querySelector(`[data-placeholder="${getFieldPlaceholder(prevField)}"]`) as HTMLElement
        if (prevEl) prevEl.focus()
      }
    } else {
      if (currentIndex < fieldOrder.length - 1) {
        const nextField = fieldOrder[currentIndex + 1]
        const nextEl = document.querySelector(`[data-placeholder="${getFieldPlaceholder(nextField)}"]`) as HTMLElement
        if (nextEl) nextEl.focus()
      } else {
        const descEl = document.querySelector('.description-section .item-desc') as HTMLElement
        if (descEl) descEl.focus()
      }
    }
  } else if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (currentField === 'name') {
      const nextEl = document.querySelector(`[data-placeholder="${getFieldPlaceholder('role')}"]`) as HTMLElement
      if (nextEl) nextEl.focus()
    } else if (currentField === 'role') {
      const descEl = document.querySelector('.description-section .item-desc') as HTMLElement
      if (descEl) descEl.focus()
    }
  }
}

function getFieldPlaceholder(field: string): string {
  const placeholders: Record<string, string> = {
    name: '项目名称',
    role: '担任角色',
    link: '项目链接（可选）'
  }
  return placeholders[field] || ''
}

// ---- Date Picker ----
const datePickerItemId = ref<string | null>(null)
const datePickerStyle = ref<Record<string, string>>({})

function toggleDatePicker(itemId: string) {
  if (datePickerItemId.value === itemId) {
    datePickerItemId.value = null
    return
  }
  const el = document.querySelector(`.date-clickable`) as HTMLElement
  if (el) {
    const rect = el.getBoundingClientRect()
    datePickerStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 6}px`,
      right: `${window.innerWidth - rect.right}px`,
      zIndex: '1000',
    }
  }
  datePickerItemId.value = itemId
}

function getStartMonth(dateRange?: string): string {
  if (!dateRange) return ''
  return dateRange.split(' ~ ')[0] || ''
}
function getEndMonth(dateRange?: string): string {
  if (!dateRange) return ''
  const parts = dateRange.split(' ~ ')
  if (!parts[1] || parts[1] === '至今') return ''
  return parts[1]
}
function isPresent(dateRange?: string): boolean {
  if (!dateRange) return true
  return dateRange.includes('至今') || !dateRange.includes(' ~ ')
}
function onStartDateChange(itemId: string, value: string) {
  const item = props.module.items.find(i => i.id === itemId)
  if (!item) return
  const end = isPresent(item.dateRange) ? '至今' : (getEndMonth(item.dateRange) || '')
  store.updateItem(props.module.id, itemId, 'dateRange', `${value} ~ ${end}`)
}
function onEndDateChange(itemId: string, value: string) {
  const item = props.module.items.find(i => i.id === itemId)
  if (!item) return
  const start = getStartMonth(item.dateRange) || ''
  store.updateItem(props.module.id, itemId, 'dateRange', `${start} ~ ${value}`)
}
function onPresentToggle(itemId: string, checked: boolean) {
  const item = props.module.items.find(i => i.id === itemId)
  if (!item) return
  const start = getStartMonth(item.dateRange) || ''
  store.updateItem(props.module.id, itemId, 'dateRange', checked ? `${start} ~ 至今` : `${start} ~ `)
}

function onDocClick() {
  if (datePickerItemId.value) datePickerItemId.value = null
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
/* ═══════════════════════════════════════════
   间距栅格系统 — 使用 style.css 中的 --editor-* tokens
   ═══════════════════════════════════════════ */

.autolayout-item {
  margin-bottom: var(--editor-card-mb);
  border-radius: var(--editor-card-br);
  transition: all 0.2s ease;
}
.autolayout-item:hover {
  background: var(--surface-hover, rgba(0, 0, 0, 0.02));
}
.autolayout-item:last-child {
  margin-bottom: 0;
}

.edit-container {
  display: flex;
  flex-direction: column;
  gap: var(--editor-card-gap);
  padding: var(--editor-card-py) var(--editor-card-px);
  border: 1px solid transparent;
  border-radius: var(--editor-card-br);
  transition: all 0.2s ease;
}
.edit-container:focus-within {
  border-color: var(--primary-200, #c7d2fe);
  background: var(--surface-active, rgba(99, 102, 241, 0.02));
  box-shadow: 0 0 0 3px var(--primary-50, rgba(99, 102, 241, 0.1));
}

/* 标题行布局 */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--editor-header-gap);
}
.header-fields {
  display: flex;
  align-items: baseline;
  gap: var(--editor-header-field-gap);
  flex: 1;
  min-width: 0;
}

/* 字段样式 */
.field {
  display: inline-block;
  outline: none;
  border-radius: var(--editor-field-br);
  padding: var(--editor-field-py) var(--editor-field-px);
  margin: calc(-1 * var(--editor-field-py)) calc(-1 * var(--editor-field-px));
  transition: all 0.2s ease;
}
.field:focus {
  background: var(--primary-50, #eef2ff);
  box-shadow: 0 0 0 2px var(--primary-200, #c7d2fe);
}
.field:empty::before {
  content: attr(data-placeholder);
  color: var(--text-placeholder, #94a3b8);
  pointer-events: none;
}
.field-primary {
  font-weight: 600;
  font-size: 1em;
  color: var(--text-primary, #1e293b);
}
.field-secondary {
  font-weight: 400;
  font-size: 0.9em;
  color: var(--text-secondary, #64748b);
}

.field-link {
  font-size: 0.85em;
  color: var(--primary-500, #6366f1);
}

/* 副标题行 */
.subtitle-row {
  margin-top: 0;
}

/* 日期部分 */
.date-section {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.date-text {
  font-size: 0.85em;
  color: var(--text-secondary, #64748b);
  white-space: nowrap;
  line-height: 1;
}
.date-clickable {
  cursor: pointer;
  padding: var(--editor-date-py) var(--editor-date-px);
  border-radius: var(--editor-date-br);
  transition: all 0.2s ease;
}
.date-clickable:hover {
  background: var(--surface-hover, rgba(0, 0, 0, 0.05));
  color: var(--text-primary, #1e293b);
}
.date-placeholder {
  color: var(--text-placeholder, #94a3b8);
  font-style: italic;
}

/* 描述内容区域 */
.description-section {
  margin-top: 2px;
}

/* 链接区域 */
.link-section {
  margin-top: 2px;
}
.item-link {
  font-size: 0.85em;
  color: var(--primary-500, #6366f1);
  text-decoration: none;
  word-break: break-all;
}
.item-link:hover {
  text-decoration: underline;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .date-section {
    align-self: flex-end;
  }
}
</style>
