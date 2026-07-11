<template>
  <div>
    <!-- Mode: List (类别：关键词) -->
    <template v-if="isListMode">
      <ItemContextMenu
        v-for="item in module.items"
        :key="item.id"
        :items="menuItemsFor(item.id)"
      >
        <div class="skill-list-item">
        <span
          class="skill-list-category"
          contenteditable="true"
          :data-placeholder="'技术类别'"
          @blur="updateField(item.id, 'name', $event)"
          @paste="onPaste"
        >{{ item.name }}</span>
        <span class="skill-list-sep">：</span>
        <span
          class="skill-list-keywords"
          contenteditable="true"
          :data-placeholder="'关键词1、关键词2、关键词3'"
          @blur="updateField(item.id, 'content', $event)"
          @paste="onPaste"
        >{{ item.content }}</span>
      </div>
    </ItemContextMenu>
    </template>

    <!-- Mode: Bars (progress bars) -->
    <template v-else>
      <ItemContextMenu
        v-for="item in module.items"
        :key="item.id"
        :items="menuItemsFor(item.id)"
      >
        <div class="skill-bar-container">
        <span
          class="skill-bar-label font-medium text-[var(--text-primary)]"
          contenteditable="true"
          :data-placeholder="'技能名称'"
          @blur="updateField(item.id, 'name', $event)"
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
              @paste="onPaste"
            >{{ item.level }}</span>
          </div>
        </div>
      </div>
      </ItemContextMenu>
    </template>

    <!-- Empty state -->
    <div v-if="module.items.length === 0" class="text-sm text-[var(--text-muted)] py-3 text-center">
      点击 "+ 添加{{ isListMode ? '技能' : '技能' }}" 开始填写
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '../../stores/resume'
import type { ResumeModule } from '../../types'
import ItemContextMenu, { type ContextMenuItem } from '../ItemContextMenu.vue'

const props = defineProps<{ module: ResumeModule }>()
const store = useResumeStore()

const isListMode = computed(() => props.module.displayMode === 'list')

// ---- Item Context Menu ---
function menuItemsFor(itemId: string): ContextMenuItem[] {
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
}

.skill-list-category {
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}

.skill-list-sep {
  color: var(--text-primary);
  flex-shrink: 0;
}

.skill-list-keywords {
  color: var(--text-secondary);
  white-space: pre-wrap;
}
</style>
