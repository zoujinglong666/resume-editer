<template>
  <div>
    <!-- Strength List -->
    <ItemContextMenu
      v-for="item in module.items"
      :key="item.id"
      :items="menuItemsFor(item.id)"
    >
      <div class="strength-item">
      <span
        class="strength-label"
        contenteditable="true"
        :data-placeholder="'能力标签'"
        @blur="updateField(item.id, 'title', $event)"
        @keydown="onFieldKeydown($event, item.id, 'title')"
        @paste="onPaste"
      >{{ item.title }}</span>
      <span class="strength-sep">：</span>
      <span
        class="strength-fact"
        contenteditable="true"
        :data-placeholder="'量化事实或证据'"
        @blur="updateField(item.id, 'content', $event)"
        @keydown="onFieldKeydown($event, item.id, 'content')"
        @paste="onPaste"
      >{{ item.content }}</span>
    </div>

    <!-- Empty state -->
    <div v-if="module.items.length === 0" class="text-sm text-[var(--text-muted)] py-3 text-center">
      点击 "+ 添加优势" 开始填写
    </div>
  </ItemContextMenu>
  </div>
</template>

<script setup lang="ts">
import { useResumeStore } from '../../stores/resume'
import type { ResumeModule } from '../../types'
import ItemContextMenu, { type ContextMenuItem } from '../ItemContextMenu.vue'

const props = defineProps<{ module: ResumeModule }>()
const store = useResumeStore()

// ---- Item Context Menu ---
function menuItemsFor(itemId: string): ContextMenuItem[] {
  const idx = props.module.items.findIndex(i => i.id === itemId)
  const isFirst = idx <= 0
  const isLast = idx >= props.module.items.length - 1

  const items: ContextMenuItem[] = []

  items.push({
    label: '复制优势',
    icon: '📋',
    shortcut: 'Ctrl+D',
    action: () => store.duplicateItem(props.module.id, itemId)
  })

  items.push({
    label: '删除优势',
    icon: '🗑️',
    danger: true,
    action: () => store.removeItem(props.module.id, itemId)
  })

  items.push({ label: '', divider: true })

  if (!isFirst) {
    items.push({
      label: '上移优势',
      icon: '⬆️',
      action: () => store.moveItem(props.module.id, itemId, 'up')
    })
  }
  if (!isLast) {
    items.push({
      label: '下移优势',
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
function updateField(itemId: string, field: string, e: FocusEvent) {
  const value = (e.target as HTMLElement).innerText
  store.updateItem(props.module.id, itemId, field, value)
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

// ---- Field Navigation ----
function onFieldKeydown(e: KeyboardEvent, _itemId: string, currentField: string) {
  if (e.key === 'Tab') {
    e.preventDefault()
    // title → content
    if (currentField === 'title' && !e.shiftKey) {
      const nextEl = document.querySelector(`[data-placeholder="'量化事实或证据'"]`) as HTMLElement
      if (nextEl) nextEl.focus()
    } else if (currentField === 'content' && e.shiftKey) {
      const prevEl = document.querySelector(`[data-placeholder="'能力标签'"]`) as HTMLElement
      if (prevEl) prevEl.focus()
    }
  } else if (e.key === 'Enter' && !e.shiftKey) {
    if (currentField === 'title') {
      e.preventDefault()
      const nextEl = document.querySelector(`[data-placeholder="'量化事实或证据'"]`) as HTMLElement
      if (nextEl) nextEl.focus()
    }
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════
   间距栅格系统 — 使用 style.css 中的 --editor-* tokens
   ═══════════════════════════════════════════ */

.strength-item {
  margin-bottom: var(--editor-list-item-mb);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0;
  padding: var(--editor-list-item-py) var(--editor-list-item-px);
  border-radius: var(--editor-list-item-br);
  transition: all 0.2s ease;
  border: 1px solid transparent;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--text-secondary);
}
.strength-item:hover {
  background: var(--surface-hover, rgba(0, 0, 0, 0.02));
}
.strength-item:focus-within {
  border-color: var(--primary-200, #c7d2fe);
  background: var(--surface-active, rgba(99, 102, 241, 0.03));
  box-shadow: 0 0 0 3px var(--primary-50, rgba(99, 102, 241, 0.1));
}
.strength-item:last-child {
  margin-bottom: 0;
}

.strength-label {
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
  outline: none;
  border-radius: 3px;
  padding: 1px 3px;
  margin: -1px -3px;
  transition: all 0.2s ease;
}

.strength-label:focus {
  background: var(--primary-50, #eef2ff);
  box-shadow: 0 0 0 2px var(--primary-200, #c7d2fe);
}

.strength-label:empty::before {
  content: attr(data-placeholder);
  color: var(--text-placeholder, #94a3b8);
  pointer-events: none;
}

.strength-sep {
  color: var(--text-primary);
  flex-shrink: 0;
}

.strength-fact {
  color: var(--text-secondary);
  outline: none;
  border-radius: 3px;
  padding: 1px 3px;
  margin: -1px -3px;
  transition: all 0.2s ease;
}

.strength-fact:focus {
  background: var(--primary-50, #eef2ff);
  box-shadow: 0 0 0 2px var(--primary-200, #c7d2fe);
}

.strength-fact:empty::before {
  content: attr(data-placeholder);
  color: var(--text-placeholder, #94a3b8);
  pointer-events: none;
}
</style>
