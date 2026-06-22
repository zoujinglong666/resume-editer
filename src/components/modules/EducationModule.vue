<template>
  <div>
    <div v-for="item in module.items" :key="item.id" class="module-item edu-autolayout-item" @contextmenu.prevent="onItemContextMenu($event, item.id)">
      <!-- 整体编辑区域 - Figma Auto Layout 风格 -->
      <div class="edu-edit-container">
        <!-- 标题行：学校 · 学历 · 专业 -->
        <div class="edu-header-row">
          <div class="edu-header-fields">
            <span
              class="edu-field edu-school"
              contenteditable="true"
              :data-placeholder="'学校名称'"
              @blur="updateField(item.id, 'school', $event)"
              @keydown="onFieldKeydown($event, item.id, 'school')"
              @paste="onPaste"
            >{{ item.school }}</span>
            <span v-if="item.degree || item.major" class="edu-separator">·</span>
            <span
              v-if="item.degree || item.major"
              class="edu-field edu-degree"
              contenteditable="true"
              :data-placeholder="'学历'"
              @blur="updateField(item.id, 'degree', $event)"
              @keydown="onFieldKeydown($event, item.id, 'degree')"
              @paste="onPaste"
            >{{ item.degree }}</span>
            <span v-if="item.degree && item.major" class="edu-separator">·</span>
            <span
              v-if="item.major"
              class="edu-field edu-major"
              contenteditable="true"
              :data-placeholder="'专业'"
              @blur="updateField(item.id, 'major', $event)"
              @keydown="onFieldKeydown($event, item.id, 'major')"
              @paste="onPaste"
            >{{ item.major }}</span>
          </div>
          
          <!-- 日期选择器 -->
          <div class="edu-date-section">
            <span
              v-if="item.dateRange"
              class="edu-date edu-date-clickable"
              @click.stop="toggleDatePicker(item.id)"
              :title="'点击编辑日期'"
            >{{ item.dateRange }}</span>
            <span
              v-else
              class="edu-date edu-date-clickable edu-date-placeholder"
              @click.stop="toggleDatePicker(item.id)"
              :title="'点击编辑日期'"
            >点击设置时间</span>

            <!-- Date Picker Popup -->
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

        <!-- 描述内容区域 -->
        <div class="edu-description-section">
          <DescWithToolbar
            :model-value="item.description || ''"
            placeholder="主修课程、荣誉奖项、GPA等..."
            @update:model-value="store.updateItem(module.id, item.id, 'description', $event)"
            @blur="updateField(item.id, 'description', $event)"
          />
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
    label: '复制条目',
    icon: '📋',
    shortcut: 'Ctrl+D',
    action: () => store.duplicateItem(props.module.id, itemId)
  })

  items.push({
    label: '删除条目',
    icon: '🗑️',
    danger: true,
    action: () => store.removeItem(props.module.id, itemId)
  })

  items.push({ label: '', divider: true })

  if (!isFirst) {
    items.push({
      label: '上移条目',
      icon: '⬆️',
      action: () => store.moveItem(props.module.id, itemId, 'up')
    })
  }
  if (!isLast) {
    items.push({
      label: '下移条目',
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
function onFieldKeydown(e: KeyboardEvent, itemId: string, currentField: string) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const fieldOrder = ['school', 'degree', 'major']
    const currentIndex = fieldOrder.indexOf(currentField)
    
    if (e.shiftKey) {
      // Shift+Tab: 移动到上一个字段
      if (currentIndex > 0) {
        const prevField = fieldOrder[currentIndex - 1]
        const prevEl = document.querySelector(`[data-placeholder="${getFieldPlaceholder(prevField)}"]`) as HTMLElement
        if (prevEl) prevEl.focus()
      }
    } else {
      // Tab: 移动到下一个字段
      if (currentIndex < fieldOrder.length - 1) {
        const nextField = fieldOrder[currentIndex + 1]
        const nextEl = document.querySelector(`[data-placeholder="${getFieldPlaceholder(nextField)}"]`) as HTMLElement
        if (nextEl) nextEl.focus()
      } else {
        // 最后一个字段，移动到描述区域
        const descEl = document.querySelector('.edu-description-section .item-desc') as HTMLElement
        if (descEl) descEl.focus()
      }
    }
  } else if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    // Enter 键移动到描述区域
    const descEl = document.querySelector('.edu-description-section .item-desc') as HTMLElement
    if (descEl) descEl.focus()
  }
}

function getFieldPlaceholder(field: string): string {
  const placeholders: Record<string, string> = {
    school: '学校名称',
    degree: '学历',
    major: '专业'
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
  // Position the popup near the clicked element
  const el = document.querySelector(`.edu-date-clickable`) as HTMLElement
  if (el) {
    const rect = el.getBoundingClientRect()
    const top = rect.bottom + 6
    const right = window.innerWidth - rect.right
    datePickerStyle.value = {
      position: 'fixed',
      top: `${top}px`,
      right: `${right}px`,
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
  if (checked) {
    store.updateItem(props.module.id, itemId, 'dateRange', `${start} ~ 至今`)
  } else {
    store.updateItem(props.module.id, itemId, 'dateRange', `${start} ~ `)
  }
}

// Close date picker on outside click
function onDocClick() {
  if (datePickerItemId.value) {
    datePickerItemId.value = null
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
/* Figma Auto Layout 风格的教育经历编辑容器 */
.edu-autolayout-item {
  margin-bottom: 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.edu-autolayout-item:hover {
  background: var(--surface-hover, rgba(0, 0, 0, 0.02));
}

.edu-autolayout-item:last-child {
  margin-bottom: 0;
}

.edu-edit-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.edu-edit-container:focus-within {
  border-color: var(--primary-200, #c7d2fe);
  background: var(--surface-active, rgba(99, 102, 241, 0.02));
  box-shadow: 0 0 0 3px var(--primary-50, rgba(99, 102, 241, 0.1));
}

/* 标题行布局 */
.edu-header-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.edu-header-fields {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

/* 字段样式 */
.edu-field {
  display: inline-block;
  outline: none;
  border-radius: 4px;
  padding: 2px 4px;
  margin: -2px -4px;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edu-field:focus {
  background: var(--primary-50, #eef2ff);
  box-shadow: 0 0 0 2px var(--primary-200, #c7d2fe);
}

.edu-field:empty::before {
  content: attr(data-placeholder);
  color: var(--text-placeholder, #94a3b8);
  pointer-events: none;
}

.edu-school {
  font-weight: 600;
  font-size: 1em;
  color: var(--text-primary, #1e293b);
}

.edu-degree,
.edu-major {
  font-weight: 400;
  font-size: 0.9em;
  color: var(--text-secondary, #64748b);
}

.edu-separator {
  color: var(--text-tertiary, #94a3b8);
  margin: 0 2px;
  user-select: none;
}

/* 日期部分 */
.edu-date-section {
  flex-shrink: 0;
}

.edu-date {
  font-size: 0.85em;
  color: var(--text-secondary, #64748b);
  white-space: nowrap;
}

.edu-date-clickable {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.edu-date-clickable:hover {
  background: var(--surface-hover, rgba(0, 0, 0, 0.05));
  color: var(--text-primary, #1e293b);
}

.edu-date-placeholder {
  color: var(--text-placeholder, #94a3b8);
  font-style: italic;
}

/* 描述内容区域 */
.edu-description-section {
  margin-top: 4px;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .edu-header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .edu-date-section {
    align-self: flex-end;
  }
}
</style>
