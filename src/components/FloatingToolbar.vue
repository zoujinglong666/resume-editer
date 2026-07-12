<template>
  <div
    v-show="visible"
    class="floating-toolbar no-print"
    :style="{ left: x + 'px', top: y + 'px' }"
    @mousedown.prevent
    @mouseup.stop
  >
    <Tip text="加粗 (Ctrl+B)">
      <Button type="button" class="ft-btn" :class="{ active: states.bold }" @click="cmd('bold')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
      </Button>
    </Tip>
    <Tip text="斜体 (Ctrl+I)">
      <Button type="button" class="ft-btn" :class="{ active: states.italic }" @click="cmd('italic')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
      </Button>
    </Tip>
    <Tip text="下划线 (Ctrl+U)">
      <Button type="button" class="ft-btn" :class="{ active: states.underline }" @click="cmd('underline')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
      </Button>
    </Tip>
    <Tip text="删除线">
      <Button type="button" class="ft-btn" :class="{ active: states.strikeThrough }" @click="cmd('strikeThrough')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.3 19c.58-.87.97-1.9.97-3 0-1.56-.6-2.97-1.58-4.05"/><path d="M4.7 19c.58-.87.97-1.9.97-3 0-1.56-.6-2.97-1.58-4.05"/><path d="M2 12h20"/><path d="M6.5 5c1.3-1.3 3.1-2 5-2 3.87 0 7 3.13 7 7 0 1.9-.7 3.7-2 5"/></svg>
      </Button>
    </Tip>

    <span class="ft-divider"></span>

    <Tip text="无序列表">
      <Button type="button" class="ft-btn" :class="{ active: states.insertUnorderedList }" @click="cmd('insertUnorderedList')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      </Button>
    </Tip>
    <Tip text="有序列表">
      <Button type="button" class="ft-btn" :class="{ active: states.insertOrderedList }" @click="cmd('insertOrderedList')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
      </Button>
    </Tip>

    <span class="ft-divider"></span>

    <Tip text="文字颜色">
      <Button type="button" class="ft-btn ft-color-btn" @click="openColor('foreColor')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3L5 14h12l-4-11z"/><path d="M7 14l-1.5 4h11L15 14"/><path d="M5 21h13"/></svg>
        <span class="ft-color-bar" :style="{ background: foreDisplay }"></span>
        <input ref="foreRef" type="color" class="ft-color-input" @input="onColor($event, 'foreColor')" @change="onColor($event, 'foreColor')" />
      </Button>
    </Tip>
    <Tip text="背景高亮">
      <Button type="button" class="ft-btn ft-color-btn" @click="openColor('hiliteColor')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/><path d="M15 3h6v6"/><path d="M16 2 22 8"/></svg>
        <span class="ft-color-bar" :style="{ background: hiliteDisplay }"></span>
        <input ref="hiliteRef" type="color" class="ft-color-input" @input="onColor($event, 'hiliteColor')" @change="onColor($event, 'hiliteColor')" />
      </Button>
    </Tip>

    <span class="ft-divider"></span>

    <Tip text="插入链接">
      <Button type="button" class="ft-btn" @click="insertLink">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      </Button>
    </Tip>
    <Tip text="清除格式">
      <Button type="button" class="ft-btn ft-btn-danger" @click="cmd('removeFormat')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
      </Button>
    </Tip>
  </div>
</template>

<script setup lang="ts">
import Button from './ui/Button.vue'
import Tip from './ui/Tip.vue'
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import {
  getRichEditableRoot,
  saveSelection,
  restoreSelection,
  applyRichCommand,
  queryRichState,
  type RichState,
} from '../utils/richText'

const visible = ref(false)
const x = ref(0)
const y = ref(0)
const foreRef = ref<HTMLInputElement>()
const hiliteRef = ref<HTMLInputElement>()

const states = reactive<RichState>({
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  insertUnorderedList: false,
  insertOrderedList: false,
  justifyLeft: false,
  justifyCenter: false,
  justifyRight: false,
  foreColor: '',
  hiliteColor: '',
  formatBlock: '',
})

const foreDisplay = ref('#000000')
const hiliteDisplay = ref('#ffeb3b')

function refresh() {
  const root = getRichEditableRoot()
  const sel = window.getSelection()
  if (!root || !sel || sel.rangeCount === 0) {
    visible.value = false
    return
  }
  const range = sel.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  // 折叠光标时 rect 宽度可能为 0，仍可用 top/left 定位
  const toolbarW = 320
  const toolbarH = 38
  let left = rect.left + rect.width / 2 - toolbarW / 2
  left = Math.max(8, Math.min(left, window.innerWidth - toolbarW - 8))
  let top = rect.top - toolbarH - 8
  if (top < 8) top = rect.bottom + 8 // 上方空间不足则放到下方
  x.value = left
  y.value = top
  visible.value = true

  const s = queryRichState()
  Object.assign(states, s)
  if (s.foreColor) foreDisplay.value = s.foreColor
  if (s.hiliteColor) hiliteDisplay.value = s.hiliteColor
}

function cmd(command: string, value?: string) {
  // 选区已由 @mousedown.prevent 保持在可编辑元素内
  applyRichCommand(command, value)
  refresh()
}

function openColor(type: 'foreColor' | 'hiliteColor') {
  saveSelection()
  const ref = type === 'foreColor' ? foreRef.value : hiliteRef.value
  ref?.click()
}

function onColor(e: Event, type: 'foreColor' | 'hiliteColor') {
  e.stopPropagation()
  restoreSelection()
  const value = (e.target as HTMLInputElement).value
  applyRichCommand(type, value)
  refresh()
}

function insertLink() {
  const url = window.prompt('请输入链接地址:', 'https://')
  if (url && url.trim()) {
    applyRichCommand('createLink', url.trim())
    refresh()
  }
}

function hide() {
  visible.value = false
}

onMounted(() => {
  document.addEventListener('selectionchange', refresh)
  window.addEventListener('scroll', hide, true)
  window.addEventListener('resize', hide)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', refresh)
  window.removeEventListener('scroll', hide, true)
  window.removeEventListener('resize', hide)
})
</script>

<style scoped>
.floating-toolbar {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: #1f2937;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  user-select: none;
}
.ft-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--border-color);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.ft-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
.ft-btn.active {
  background: var(--primary-500);
  color: #fff;
}
.ft-btn-danger:hover {
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
}
.ft-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 3px;
}
.ft-color-btn {
  flex-direction: column;
  gap: 1px;
  padding-bottom: 3px;
}
.ft-color-bar {
  display: block;
  width: 14px;
  height: 3px;
  border-radius: 2px;
}
.ft-color-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  cursor: pointer;
}
</style>
