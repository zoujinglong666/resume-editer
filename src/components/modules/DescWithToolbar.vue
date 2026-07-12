<template>
  <div class="desc-toolbar-wrap" :class="{ focused }">
    <!-- Mini Toolbar — visible only when focused -->
    <div v-show="focused" class="desc-mini-toolbar no-print" @mousedown.prevent>
      <!-- Bold -->
      <Tip text="加粗 (Ctrl+B)">
        <Button type="button" class="desc-mini-btn" :class="{ active: states.bold }" @click="exec('bold')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
      </Button>
      </Tip>
      <!-- Italic -->
      <Tip text="斜体 (Ctrl+I)">
        <Button type="button" class="desc-mini-btn" :class="{ active: states.italic }" @click="exec('italic')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
        </Button>
      </Tip>
      <!-- Underline -->
      <Tip text="下划线 (Ctrl+U)">
        <Button type="button" class="desc-mini-btn" :class="{ active: states.underline }" @click="exec('underline')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
      </Button>
      </Tip>
      <!-- Strike -->
      <Tip text="删除线">
        <Button type="button" class="desc-mini-btn" :class="{ active: states.strikeThrough }" @click="exec('strikeThrough')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 00-2.83 4M14 12a4 4 0 010 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
      </Button>
      </Tip>

      <div class="desc-mini-sep"></div>

      <!-- Unordered list -->
      <Tip text="无序列表">
        <Button type="button" class="desc-mini-btn" :class="{ active: states.insertUnorderedList }" @click="toggleList('ul')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="4" cy="7" r="1.4" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="4" cy="17" r="1.4" fill="currentColor" stroke="none"/><line x1="8" y1="7" x2="21" y2="7"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="17" x2="21" y2="17"/></svg>
        </Button>
      </Tip>
      <!-- Ordered list -->
      <Tip text="有序列表">
        <Button type="button" class="desc-mini-btn" :class="{ active: states.insertOrderedList }" @click="toggleList('ol')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
        </Button>
      </Tip>

      <div class="desc-mini-sep"></div>

      <!-- Align left -->
      <Tip text="左对齐">
        <Button type="button" class="desc-mini-btn" :class="{ active: states.justifyLeft }" @click="exec('justifyLeft')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
        </Button>
      </Tip>
      <!-- Align center -->
      <Tip text="居中">
        <Button type="button" class="desc-mini-btn" :class="{ active: states.justifyCenter }" @click="exec('justifyCenter')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
        </Button>
      </Tip>

      <div class="desc-mini-sep"></div>

      <!-- Clear format -->
      <Tip text="清除格式">
        <Button type="button" class="desc-mini-btn desc-mini-btn-danger" @click="exec('removeFormat')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </Button>
      </Tip>
    </div>

    <!-- Content Editable Area -->
    <div
      ref="editorEl"
      class="item-desc"
      contenteditable="true"
      :data-placeholder="placeholder"
      @focus="onFocus"
      @blur="onBlur"
      @paste="onPaste"
      @keydown="onKeydown"
      @mouseup="updateStates"
      @keyup="updateStates"
      v-sync-html="modelValue"
    ></div>
  </div>
</template>

<script setup lang="ts">
import Button from '../ui/Button.vue'
import Tip from '../ui/Tip.vue'
import { ref, reactive, nextTick } from 'vue'
import { handleListEnter, isCursorInListItem, handlePaste } from '../../utils/smartPaste'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': [e: FocusEvent]
}>()

const editorEl = ref<HTMLElement | null>(null)
const focused = ref(false)

// All button states (kept in sync with selection)
const states = reactive({
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  insertUnorderedList: false,
  insertOrderedList: false,
  justifyLeft: false,
  justifyCenter: false,
  justifyRight: false,
})

// Suppress one blur event when a toolbar button is clicked.
let blurSuppressed = false

function onFocus() {
  focused.value = true
  updateStates()
}

function onBlur(e: FocusEvent) {
  // Defer to let the toolbar button's mousedown complete first.
  // We DO NOT flip blurSuppressed=false here; it's reset by the click handler
  // (or auto-resets after the timeout if no click happened).
  setTimeout(() => {
    if (blurSuppressed) {
      // Suppress this blur: refocus the editor and reapply focus state
      blurSuppressed = false
      editorEl.value?.focus()
      focused.value = true
      return
    }
    focused.value = false
    emit('blur', e)
    if (editorEl.value) {
      let html = editorEl.value.innerHTML
      if (html === '<br>' || html === '<div><br></div>' || html === '<p><br></p>') html = ''
      emit('update:modelValue', html)
    }
  }, 120)
}

function updateStates() {
  const cmds: (keyof typeof states)[] = [
    'bold', 'italic', 'underline', 'strikeThrough',
    'insertUnorderedList', 'insertOrderedList',
    'justifyLeft', 'justifyCenter', 'justifyRight',
  ]
  for (const cmd of cmds) {
    try {
      states[cmd] = document.queryCommandState(cmd as string)
    } catch {
      states[cmd] = false
    }
  }
}

function ensureFocus() {
  if (!editorEl.value) return false
  if (document.activeElement !== editorEl.value) {
    editorEl.value.focus()
  }
  return true
}

function exec(command: string, value?: string) {
  if (!ensureFocus()) return
  blurSuppressed = true
  // Defer to next tick to ensure focus settled
  nextTick(() => {
    document.execCommand(command, false, value)
    updateStates()
    emitValue()
  })
}

function toggleList(type: 'ul' | 'ol') {
  if (!ensureFocus()) return
  blurSuppressed = true
  nextTick(() => {
    const cmd = type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList'
    const oppositeCmd = type === 'ul' ? 'insertOrderedList' : 'insertUnorderedList'
    if (document.queryCommandState(oppositeCmd)) {
      document.execCommand(oppositeCmd, false)
    }
    document.execCommand(cmd, false)
    updateStates()
    emitValue()
  })
}

function emitValue() {
  if (!editorEl.value) return
  let html = editorEl.value.innerHTML
  if (html === '<br>' || html === '<div><br></div>' || html === '<p><br></p>') html = ''
  emit('update:modelValue', html)
}

function onPaste(e: ClipboardEvent) {
  handlePaste(e, emitValue)
}

function onKeydown(e: KeyboardEvent) {
  // Ctrl/Cmd + B/I/U shortcuts
  if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u'].includes(e.key.toLowerCase())) {
    e.preventDefault()
    const map: Record<string, string> = { b: 'bold', i: 'italic', u: 'underline' }
    exec(map[e.key.toLowerCase()])
    return
  }
  if (e.key === 'Enter') {
    if (e.shiftKey) {
      // Shift+Enter: soft line break (<br>) anywhere
      e.preventDefault()
      document.execCommand('insertLineBreak')
      return
    }
    // Enter (no shift): if inside a list, let handleListEnter manage it
    const li = isCursorInListItem()
    if (li) {
      handleListEnter(e)
      return
    }
    // Not in a list → create a new block (div) for clear paragraph separation
    e.preventDefault()
    document.execCommand('insertHTML', false, '<div><br></div>')
  }
}
</script>

<style scoped>
.desc-toolbar-wrap {
  position: relative;
}

.desc-mini-toolbar {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 3px 5px;
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e4e4ec);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 4px;
  width: fit-content;
  flex-wrap: wrap;
  animation: fadeIn 0.12s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.desc-mini-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary, #575a6b);
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
  min-width: 26px;
  height: 26px;
}

.desc-mini-btn:hover {
  background: var(--primary-50, #eef2ff);
  color: var(--primary-600, #4f46e5);
}

.desc-mini-btn.active {
  background: var(--primary-100, #e0e7ff);
  color: var(--primary-700, #4338ca);
}

.desc-mini-btn-danger:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}

.desc-mini-sep {
  width: 1px;
  height: 18px;
  background: var(--border-light, #f0f0f5);
  margin: 0 3px;
  align-self: center;
}

/* Editor content — list styling */
.item-desc {
  min-height: 1.5em;
  outline: none;
  line-height: 1.65;
}
.item-desc :deep(ul),
.item-desc :deep(ol) {
  margin: 4px 0;
  padding-left: 1.4em;
  list-style: revert;
}
.item-desc :deep(li) {
  margin-bottom: 3px;
  line-height: 1.6;
}
.item-desc :deep(ul > li::marker) {
  color: var(--primary-500, #6366f1);
}
.item-desc :deep(ol > li::marker) {
  color: var(--primary-500, #6366f1);
  font-weight: 600;
}
</style>
