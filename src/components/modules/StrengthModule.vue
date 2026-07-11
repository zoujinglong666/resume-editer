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
        @paste="onPaste"
      >{{ item.title }}</span>
      <span class="strength-sep">：</span>
      <span
        class="strength-fact"
        contenteditable="true"
        :data-placeholder="'量化事实或证据'"
        @blur="updateField(item.id, 'content', $event)"
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
</script>

<style scoped>
.strength-item {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0;
}

.strength-label {
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}

.strength-sep {
  color: var(--text-primary);
  flex-shrink: 0;
}

.strength-fact {
  color: var(--text-secondary);
}
</style>
