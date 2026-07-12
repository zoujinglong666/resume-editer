<template>
  <div>
    <ItemContextMenu v-for="item in module.items" :key="item.id" :items="menuItemsFor(item.id)">
        <div class="module-item">
      <div class="item-header" style="display:flex; justify-content:space-between; align-items:baseline; gap:8px;">
        <span
          class="item-title"
          contenteditable="true"
          :data-placeholder="titlePlaceholder(item)"
          @blur="updateField(item.id, titleKey(item), $event)"
          @paste="onPaste"
        >{{ getTitle(item) }}</span>
        <PopoverRoot>
          <PopoverTrigger as-child>
            <Tip text="点击编辑日期">
              <span
                class="item-date item-date-clickable"
              >{{ item.dateRange || '点击设置时间' }}</span>
            </Tip>
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
                      <Switch
                        :model-value="isPresent(item.dateRange)"
                        @update:model-value="(v: boolean) => onPresentToggle(item.id, v)"
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

      <div>
        <span
          class="item-subtitle"
          contenteditable="true"
          :data-placeholder="subPlaceholder(item)"
          @blur="updateField(item.id, subKey(item), $event)"
          @paste="onPaste"
        >{{ getSub(item) }}</span>
      </div>

      <div
        class="item-desc"
        contenteditable="true"
        :data-placeholder="'负责的工作内容和成果...'"
        @blur="updateField(item.id, 'description', $event)"
        @paste="onPaste"
        @keydown="onKeydown"
        v-sync-html="item.description"
      ></div>
    </div>
  </ItemContextMenu>
  </div>
</template>

<script setup lang="ts">
import { useResumeStore } from '../../stores/resume'
import type { ResumeModule, ModuleItem } from '../../types'
import ItemContextMenu, { type ContextMenuItem } from '../ItemContextMenu.vue'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent, PopoverClose } from 'reka-ui'
import Switch from '../ui/Switch.vue'
import Tip from '../ui/Tip.vue'
import { handleListEnter, handlePaste } from '../../utils/smartPaste'

const props = defineProps<{ module: ResumeModule }>()
const store = useResumeStore()

// ---- Field fallbacks ----
// ExperienceModule 同时兼容「工作经历」(company/position) 与「专业经历」(name/role) 字段，
// 通过判断条目上实际存在的字段来读写，从而用同一套布局渲染两种模块。
function hasField(item: ModuleItem, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(item, key)
}
function titleKey(item: ModuleItem): string {
  return hasField(item, 'company') ? 'company' : 'name'
}
function subKey(item: ModuleItem): string {
  return hasField(item, 'position') ? 'position' : 'role'
}
function getTitle(item: ModuleItem): string {
  return (item.company as string) ?? (item.name as string) ?? ''
}
function getSub(item: ModuleItem): string {
  return (item.position as string) ?? (item.role as string) ?? ''
}
function titlePlaceholder(item: ModuleItem): string {
  return hasField(item, 'company') ? '公司名称' : '项目名称'
}
function subPlaceholder(item: ModuleItem): string {
  return hasField(item, 'position') ? '职位名称' : '担任角色'
}

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
  store.updateItem(props.module.id, itemId, 'dateRange', checked ? `${start} ~ 至今` : `${start} ~ `)
}
</script>
