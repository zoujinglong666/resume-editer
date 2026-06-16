<template>
  <div>
    <div v-for="item in module.items" :key="item.id" class="module-item" @contextmenu.prevent="onItemContextMenu($event, item.id)">
      <div class="item-header">
        <span
          class="item-title"
          contenteditable="true"
          :data-placeholder="'学校名称'"
          @blur="updateField(item.id, 'school', $event)"
          @paste="onPaste"
        >{{ item.school }}</span>
        <!-- Clickable Date with Picker -->
        <span class="item-date-picker-wrap">
          <span
            class="item-date item-date-clickable"
            @click.stop="toggleDatePicker(item.id)"
            :title="'点击编辑日期'"
          >{{ item.dateRange || '点击设置时间' }}</span>

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
        </span>
      </div>

      <div class="flex items-center" style="gap: var(--tight-gap);">
        <span
          class="item-subtitle"
          contenteditable="true"
          :data-placeholder="'学历'"
          @blur="updateField(item.id, 'degree', $event)"
          @paste="onPaste"
        >{{ item.degree }}</span>
        <span v-if="item.major" class="text-[var(--text-muted)]">·</span>
        <span
          v-if="item.major"
          class="item-subtitle"
          contenteditable="true"
          :data-placeholder="'专业'"
          @blur="updateField(item.id, 'major', $event)"
          @paste="onPaste"
        >{{ item.major }}</span>
      </div>

      <div
        class="item-desc"
        contenteditable="true"
        :data-placeholder="'主修课程、荣誉奖项、GPA等...'"
        @blur="updateField(item.id, 'description', $event)"
        @paste="onPaste"
        @keydown="onKeydown"
        v-sync-html="item.description"
      ></div>
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
import { smartPasteText, handleListEnter } from '../../utils/smartPaste'

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
  const html = smartPasteText(text)
  if (html) {
    document.execCommand('insertHTML', false, html)
  } else {
    document.execCommand('insertText', false, text)
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    handleListEnter(e)
  }
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
  const el = document.querySelector(`.item-date-clickable`) as HTMLElement
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
