<template>
  <div>
    <div v-for="item in module.items" :key="item.id" class="module-item autolayout-item" @contextmenu.prevent="onItemContextMenu($event, item.id)">
      <div class="edit-container">
        <!-- Title row -->
        <div class="title-row">
          <span
            class="field field-primary"
            contenteditable="true"
            :data-placeholder="'标题'"
            @blur="updateField(item.id, 'title', $event)"
            @keydown="onFieldKeydown($event, item.id, 'title')"
            @paste="onPaste"
          >{{ item.title }}</span>
        </div>

        <!-- Description -->
        <div class="description-section">
          <DescWithToolbar
            :model-value="item.content || ''"
            placeholder="支持富文本内容..."
            @update:model-value="store.updateItem(module.id, item.id, 'content', $event)"
            @blur="updateField(item.id, 'content', $event)"
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
import { ref } from 'vue'
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

// ---- Field Navigation ----
function onFieldKeydown(e: KeyboardEvent, itemId: string, currentField: string) {
  if (e.key === 'Enter' && !e.shiftKey && currentField === 'title') {
    e.preventDefault()
    const descEl = document.querySelector('.description-section .item-desc') as HTMLElement
    if (descEl) descEl.focus()
  }
}
</script>

<style scoped>
/* Auto Layout 风格通用容器 */
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

/* Title row */
.title-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

/* Field styles */
.field {
  display: inline-block;
  outline: none;
  border-radius: 4px;
  padding: 2px 4px;
  margin: -2px -4px;
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

/* Description section */
.description-section {
  margin-top: 2px;
}
</style>
