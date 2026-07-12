<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="sc-overlay" />
      <DialogContent class="sc-dialog">
        <div class="sc-header">
          <div class="sc-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10v4M10 10v4M14 10v4M18 10v4"/></svg>
            <span>快捷键</span>
          </div>
          <Button class="sc-close" @click="emit('update:open', false)" aria-label="关闭">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
        </div>

        <p class="sc-hint">在编辑区使用以下快捷键，提升简历编辑效率。</p>

        <div class="sc-grid">
          <div v-for="s in shortcuts" :key="s.key" class="sc-row">
            <kbd class="sc-kbd">{{ s.key }}</kbd>
            <span class="sc-desc">{{ s.desc }}</span>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import Button from './ui/Button.vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent } from 'reka-ui'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const shortcuts = [
  { key: 'Ctrl/⌘ + Z', desc: '撤销' },
  { key: 'Ctrl/⌘ + Shift + Z / Ctrl + Y', desc: '重做' },
  { key: 'Ctrl/⌘ + S', desc: '立即保存到本地' },
  { key: 'Ctrl/⌘ + Shift + S', desc: '导出 JSON 备份' },
  { key: 'Ctrl/⌘ + P', desc: '打印 / 导出 PDF' },
  { key: 'Ctrl/⌘ + D', desc: '复制当前条目' },
  { key: 'Ctrl/⌘ + Enter', desc: '在当前条目后新增一条' },
  { key: 'Esc', desc: '取消选中模块 / 条目' },
  { key: '? 或 Ctrl/⌘ + /', desc: '打开本帮助' },
]
</script>
