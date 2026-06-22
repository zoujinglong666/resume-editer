<template>
  <div>
    <!-- Mode: List (类别：关键词) -->
    <template v-if="isListMode">
      <div
        v-for="item in module.items"
        :key="item.id"
        class="skill-list-item"
        @contextmenu.prevent="onItemContextMenu($event, item.id)"
      >
        <span
          class="skill-list-category"
          contenteditable="true"
          :data-placeholder="'技术类别'"
          @blur="updateField(item.id, 'name', $event)"
          @keydown="onFieldKeydown($event, item.id, 'name')"
          @paste="onPaste"
        >{{ item.name }}</span>
        <span class="skill-list-sep">：</span>
        <span
          class="skill-list-keywords"
          contenteditable="true"
          :data-placeholder="'关键词1、关键词2、关键词3'"
          @blur="updateField(item.id, 'content', $event)"
          @keydown="onFieldKeydown($event, item.id, 'content')"
          @paste="onPaste"
        >{{ item.content }}</span>
      </div>
    </template>

    <!-- Mode: Bars (progress bars) -->
    <template v-else>
      <div
        v-for="item in module.items"
        :key="item.id"
        class="skill-bar-container"
        @contextmenu.prevent="onItemContextMenu($event, item.id)"
      >
        <span
          class="skill-bar-label font-medium text-[var(--text-primary)]"
          contenteditable="true"
          :data-placeholder="'技能名称'"
          @blur="updateField(item.id, 'name', $event)"
          @keydown="onFieldKeydown($event, item.id, 'bar-name')"
          @paste="onPaste"
        >{{ item.name }}</span>
        <div>
          <div class="skill-bar-track">
            <div
              class="skill-bar-fill"
              :style="{ width: skillWidth(item.level) }"
            ></div>
          </div>
          <div class="text-right mt-1">
            <span
              class="text-xs text-[var(--text-muted)]"
              contenteditable="true"
              :data-placeholder="'熟练度'"
              @blur="updateField(item.id, 'level', $event)"
              @keydown="onFieldKeydown($event, item.id, 'bar-level')"
              @paste="onPaste"
            >{{ item.level }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <div v-if="module.items.length === 0" class="text-sm text-[var(--text-muted)] py-3 text-center">
      点击 "+ 添加技能" 开始填写
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
import { computed, ref } from 'vue'
import { useResumeStore } from '../../stores/resume'
import type { ResumeModule } from '../../types'
import ContextMenu from '../ContextMenu.vue'
import type { ContextMenuItem } from '../ContextMenu.vue'

const props = defineProps<{ module: ResumeModule }>()
const store = useResumeStore()

const isListMode = computed(() => props.module.displayMode === 'list')

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
    label: '复制技能',
    icon: '📋',
    shortcut: 'Ctrl+D',
    action: () => store.duplicateItem(props.module.id, itemId)
  })

  items.push({
    label: '删除技能',
    icon: '🗑️',
    danger: true,
    action: () => store.removeItem(props.module.id, itemId)
  })

  items.push({ label: '', divider: true })

  if (!isFirst) {
    items.push({
      label: '上移技能',
      icon: '⬆️',
      action: () => store.moveItem(props.module.id, itemId, 'up')
    })
  }
  if (!isLast) {
    items.push({
      label: '下移技能',
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

// ---- Field Navigation ----
function onFieldKeydown(e: KeyboardEvent, _itemId: string, currentField: string) {
  if (e.key === 'Tab') {
    e.preventDefault()
    if (isListMode.value) {
      // List mode: name → content
      if (currentField === 'name' && !e.shiftKey) {
        const nextEl = document.querySelector(`[data-placeholder="'关键词1、关键词2、关键词3'"]`) as HTMLElement
        if (nextEl) nextEl.focus()
      } else if (currentField === 'content' && e.shiftKey) {
        const prevEl = document.querySelector(`[data-placeholder="'技术类别'"]`) as HTMLElement
        if (prevEl) prevEl.focus()
      }
    }
  } else if (e.key === 'Enter' && !e.shiftKey) {
    if (isListMode.value && currentField === 'name') {
      e.preventDefault()
      const nextEl = document.querySelector(`[data-placeholder="'关键词1、关键词2、关键词3'"]`) as HTMLElement
      if (nextEl) nextEl.focus()
    }
  }
}

function skillWidth(level: string | boolean | undefined): string {
  const map: Record<string, string> = {
    '入门': '20%',
    '了解': '30%',
    '熟悉': '50%',
    '掌握': '65%',
    '熟练': '75%',
    '精通': '88%',
    '专家': '96%'
  }
  return map[String(level)] || '50%'
}
</script>

<style scoped>
.skill-list-item {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.skill-list-item:hover {
  background: var(--surface-hover, rgba(0, 0, 0, 0.02));
}

.skill-list-item:focus-within {
  background: var(--surface-active, rgba(99, 102, 241, 0.03));
  box-shadow: 0 0 0 1px var(--primary-200, #c7d2fe);
}

.skill-list-category {
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
  outline: none;
  border-radius: 3px;
  padding: 1px 3px;
  margin: -1px -3px;
  transition: all 0.2s ease;
}

.skill-list-category:focus {
  background: var(--primary-50, #eef2ff);
  box-shadow: 0 0 0 2px var(--primary-200, #c7d2fe);
}

.skill-list-category:empty::before {
  content: attr(data-placeholder);
  color: var(--text-placeholder, #94a3b8);
  pointer-events: none;
}

.skill-list-sep {
  color: var(--text-primary);
  flex-shrink: 0;
}

.skill-list-keywords {
  color: var(--text-secondary);
  white-space: pre-wrap;
  outline: none;
  border-radius: 3px;
  padding: 1px 3px;
  margin: -1px -3px;
  transition: all 0.2s ease;
}

.skill-list-keywords:focus {
  background: var(--primary-50, #eef2ff);
  box-shadow: 0 0 0 2px var(--primary-200, #c7d2fe);
}

.skill-list-keywords:empty::before {
  content: attr(data-placeholder);
  color: var(--text-placeholder, #94a3b8);
  pointer-events: none;
}
</style>
