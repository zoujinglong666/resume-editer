<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="context-menu"
      :style="menuStyle"
      @contextmenu.prevent
      @click.stop
    >
      <template v-for="(item, idx) in items" :key="idx">
        <div v-if="item.divider" class="context-menu-divider" />
        <button
          v-else
          class="context-menu-item"
          :class="{
            'opacity-40 cursor-not-allowed': item.disabled,
            'text-red-600 hover:bg-red-50': item.danger,
          }"
          :disabled="item.disabled"
          @click="onItemClick(item)"
          @mouseenter="hoveredIdx = idx"
          @mouseleave="hoveredIdx = -1"
        >
          <span v-if="item.icon" class="context-menu-icon" v-html="item.icon" />
          <span class="context-menu-label">{{ item.label }}</span>
          <span v-if="item.shortcut" class="context-menu-shortcut">{{ item.shortcut }}</span>
        </button>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

export interface ContextMenuItem {
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  divider?: boolean
  action?: () => void
}

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

const menuRef = ref<HTMLElement | null>(null)
const hoveredIdx = ref(-1)

const MENU_PADDING = 8
const MENU_ITEM_HEIGHT = 32
const MENU_MAX_HEIGHT = 320

const menuStyle = computed(() => {
  // Calculate ideal position - adjust if goes off screen
  const menuWidth = 200
  let left = props.x
  let top = props.y

  // Adjust if would go off right edge
  if (left + menuWidth > window.innerWidth - MENU_PADDING) {
    left = window.innerWidth - menuWidth - MENU_PADDING
  }
  if (left < MENU_PADDING) left = MENU_PADDING

  // Adjust if would go off bottom edge
  const estimatedHeight = Math.min(
    props.items.filter(i => !i.divider).length * MENU_ITEM_HEIGHT + 16,
    MENU_MAX_HEIGHT
  )
  if (top + estimatedHeight > window.innerHeight - MENU_PADDING) {
    top = window.innerHeight - estimatedHeight - MENU_PADDING
  }
  if (top < MENU_PADDING) top = MENU_PADDING

  return {
    left: `${left}px`,
    top: `${top}px`,
  }
})

function onItemClick(item: ContextMenuItem) {
  if (item.disabled || item.divider) return
  if (item.action) item.action()
  close()
}

function close() {
  emit('update:visible', false)
  emit('close')
}

function onKeyDown(e: KeyboardEvent) {
  if (!props.visible) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

function onScroll() {
  if (props.visible) close()
}

function onClickOutside(e: MouseEvent) {
  if (!props.visible) return
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    close()
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    hoveredIdx.value = -1
    nextTick(() => {
      // Focus first non-disabled item
      const firstBtn = menuRef.value?.querySelector<HTMLElement>('.context-menu-item:not(:disabled)')
      firstBtn?.focus()
    })
  }
})

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('scroll', onScroll, true)
  document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('scroll', onScroll, true)
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 99999;
  min-width: 180px;
  max-width: 240px;
  max-height: 320px;
  overflow-y: auto;
  background: white;
  border: 1px solid var(--border-color, #E5E7EB);
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06);
  padding: 4px;
  font-size: 13px;
  user-select: none;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  color: var(--text-primary, #1F2937);
  transition: background 0.1s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.context-menu-item:hover:not(:disabled) {
  background: var(--primary-color, #3B82F6);
  color: white;
}

.context-menu-item:disabled {
  cursor: not-allowed;
}

.context-menu-item:focus {
  outline: none;
  background: rgba(59, 130, 246, 0.08);
}

.context-menu-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.context-menu-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.context-menu-shortcut {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-muted, #9CA3AF);
  margin-left: 16px;
}

.context-menu-item:hover:not(:disabled) .context-menu-shortcut {
  color: rgba(255,255,255,0.7);
}

.context-menu-divider {
  height: 1px;
  background: var(--border-color, #E5E7EB);
  margin: 4px 8px;
}
</style>
