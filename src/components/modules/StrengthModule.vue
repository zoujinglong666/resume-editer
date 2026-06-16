<template>
  <div>
    <!-- Strength List -->
    <div
      v-for="item in module.items"
      :key="item.id"
      class="strength-item"
      @contextmenu.prevent="onItemContextMenu($event, item.id)"
    >
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

// ---- Item Context Menu ---
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
