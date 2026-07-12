<template>
  <div class="education-module">
    <ItemContextMenu v-for="item in module.items" :key="item.id" :items="menuItemsFor(item.id)">
        <div class="module-item">
      <div class="item-header" style="display:flex; justify-content:space-between; align-items:baseline; gap:8px;">
        <span
          class="item-title"
          contenteditable="true"
          :data-placeholder="'学校名称'"
          @blur="updateField(item.id, 'school', $event)"
          @paste="onPaste"
        >{{ item.school }}</span>
        <!-- Clickable Date with Picker (Reka Popover) -->
        <PopoverRoot>
          <PopoverTrigger as-child>
            <span
              class="item-date item-date-clickable"
              :title="'点击编辑日期'"
            >{{ item.dateRange || '点击设置时间' }}</span>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent class="date-picker-popup" align="end" :side-offset="6">
              <div class="date-picker-header">
                <span>选择时间范围</span>
                <PopoverClose class="date-picker-close" aria-label="关闭">×</PopoverClose>
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
            </PopoverContent>
          </PopoverPortal>
        </PopoverRoot>
      </div>

      <!-- 第二行：学历·专业 | 描述，全部合并在同一行（不换行） -->
      <div class="edu-meta">
        <span
          class="item-subtitle edu-field"
          contenteditable="true"
          :data-placeholder="'学历'"
          @blur="updateField(item.id, 'degree', $event)"
          @paste="onPaste"
        >{{ item.degree }}</span>
        <span v-if="item.major" class="edu-sep">·</span>
        <span
          v-if="item.major"
          class="item-subtitle edu-field"
          contenteditable="true"
          :data-placeholder="'专业'"
          @blur="updateField(item.id, 'major', $event)"
          @paste="onPaste"
        >{{ item.major }}</span>
        <span v-if="(item.degree || item.major) && hasDescription(item)" class="edu-sep">|</span>
        <span
          class="item-subtitle item-desc edu-desc"
          contenteditable="true"
          :data-placeholder="'排名、奖项、证书...'"
          @blur="updateField(item.id, 'description', $event)"
          @paste="onPaste"
          @keydown="onKeydown"
          v-sync-html="item.description"
        ></span>
      </div>
    </div>
  </ItemContextMenu>
  </div>
</template>

<script setup lang="ts">
import { useResumeStore } from '../../stores/resume'
import type { ResumeModule } from '../../types'
import ItemContextMenu, { type ContextMenuItem } from '../ItemContextMenu.vue'
import { handleListEnter, handlePaste } from '../../utils/smartPaste'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent, PopoverClose } from 'reka-ui'

const props = defineProps<{ module: ResumeModule }>()
const store = useResumeStore()

// ---- Item Context Menu ----
function menuItemsFor(itemId: string): ContextMenuItem[] {
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

  return items
}

// ---- Field Update ----
const RICH_FIELDS = ['description', 'summary', 'content']

function normalizeHtml(html: string): string {
  if (!html || html === '<br>' || html === '<div><br></div>' || html === '<p><br></p>') return ''
  return html
}

// 描述是否有实际文本内容（用于决定是否显示分隔符 | ）
function hasDescription(item: any): boolean {
  const d = item.description || ''
  return d.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0
}

function updateField(itemId: string, field: string, e: FocusEvent) {
  const target = e.target as HTMLElement
  const isRich = RICH_FIELDS.includes(field)
  const raw = isRich ? target.innerHTML : target.innerText
  const value = isRich ? normalizeHtml(raw) : raw
  store.updateItem(props.module.id, itemId, field, value)
}

function onPaste(e: ClipboardEvent) {
  handlePaste(e)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    handleListEnter(e)
  }
}

// ---- Date Picker (Reka Popover) ----
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

</script>
