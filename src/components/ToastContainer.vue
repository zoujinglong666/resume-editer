<template>
  <ToastProvider :duration="5000" swipe-direction="right">
    <ToastRoot
      v-for="t in toasts"
      :key="t.id"
      :open="t.open"
      :duration="t.duration"
      :type="t.type === 'error' || t.type === 'warning' ? 'foreground' : 'background'"
      class="toast"
      :class="`toast--${t.type}`"
      @update:open="(v: boolean) => onOpenChange(t.id, v)"
    >
      <span class="toast-icon" aria-hidden="true">
        <svg v-if="t.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        <svg v-else-if="t.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        <svg v-else-if="t.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16v-4M12 8h.01"/><circle cx="12" cy="12" r="9"/></svg>
      </span>

      <div class="toast-body">
        <ToastTitle class="toast-title">{{ t.title }}</ToastTitle>
        <ToastDescription v-if="t.description" class="toast-desc">{{ t.description }}</ToastDescription>
      </div>

      <ToastClose class="toast-close" aria-label="关闭">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </ToastClose>
    </ToastRoot>

    <ToastViewport class="toast-viewport" />
  </ToastProvider>
</template>

<script setup lang="ts">
import {
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
} from 'reka-ui'
import { useToasts } from '../utils/toast'

const { toasts, dismiss } = useToasts()

function onOpenChange(id: number, open: boolean) {
  // reka-ui 在倒计时结束/手动关闭/滑动关闭后会触发 open=false，
  // 此时关闭动画由 CSS [data-state=closed] 播放，动画结束后再从列表移除。
  if (!open) setTimeout(() => dismiss(id), 200)
}
</script>
