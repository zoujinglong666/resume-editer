<template>
  <ContextMenuRoot>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent class="rk-context-content" :collision-padding="8">
        <template v-for="(item, idx) in items" :key="idx">
          <ContextMenuSeparator v-if="item.divider" class="rk-context-separator" />
          <ContextMenuItem
            v-else
            class="rk-context-item"
            :disabled="item.disabled"
            :data-danger="item.danger ? '' : undefined"
            @select="onSelect(item)"
          >
            <span v-if="item.icon" class="rk-context-icon" v-html="item.icon" />
            <span class="rk-context-label">{{ item.label }}</span>
            <span v-if="item.shortcut" class="rk-context-shortcut">{{ item.shortcut }}</span>
          </ContextMenuItem>
        </template>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>

<script setup lang="ts">
import {
  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from 'reka-ui'

export interface ContextMenuItem {
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  divider?: boolean
  action?: () => void
}

const props = defineProps<{ items: ContextMenuItem[] }>()

function onSelect(item: ContextMenuItem) {
  if (item.disabled || item.divider) return
  item.action?.()
}
</script>
