<template>
  <div>
    <div v-for="item in module.items" :key="item.id" class="module-item" @contextmenu.prevent="onItemContextMenu($event, item.id)">
      <div class="item-header">
        <span
          class="item-title"
          contenteditable="true"
          :data-placeholder="'项目名称'"
          @blur="updateField(item.id, 'name', $event)"
          @paste="onPaste"
        >{{ item.name }}</span>
        <span class="item-date">{{ item.dateRange }}</span>
      </div>

      <div class="mb-1">
        <span
          class="item-subtitle"
          contenteditable="true"
          :data-placeholder="'担任角色'"
          @blur="updateField(item.id, 'role', $event)"
          @paste="onPaste"
        >{{ item.role }}</span>
      </div>

      <div class="mb-2">
        <span
          class="item-date"
          contenteditable="true"
          :data-placeholder="'2024 - 至今'"
          @blur="updateField(item.id, 'dateRange', $event)"
          @paste="onPaste"
        >{{ item.dateRange }}</span>
      </div>

      <div
        class="item-desc"
        contenteditable="true"
        :data-placeholder="'项目简介和技术栈...'"
        @blur="updateField(item.id, 'description', $event)"
        @paste="onPaste"
        v-sync-html="item.description"
      ></div>

      <div class="mt-1">
        <a
          v-if="item.link"
          :href="String(item.link)"
          target="_blank"
          rel="noopener noreferrer"
          class="item-link"
        >🔗 {{ item.link }}</a>
        <!-- 编辑态占位符：仅在编辑模式下显示，导出时隐藏 -->
        <span
          v-else
          class="item-date text-sm opacity-50 no-print"
          contenteditable="true"
          :data-placeholder="'项目链接（可选）'"
          @blur="updateField(item.id, 'link', $event)"
          @paste="onPaste"
        ></span>
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
import { ref } from 'vue'
import { useResumeStore } from '../../stores/resume'
import type { ResumeModule } from '../../types'
import ContextMenu from '../ContextMenu.vue'
import type { ContextMenuItem } from '../ContextMenu.vue'

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
</script>
