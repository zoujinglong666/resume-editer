<template>
  <div class="rich-editor">
    <!-- Toolbar -->
    <div class="rich-editor-toolbar" @mousedown.prevent>
      <button
        type="button"
        class="rte-btn"
        :class="{ active: states.bold }"
        title="加粗 (Ctrl+B)"
        @click="exec('bold')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
      </button>
      <button
        type="button"
        class="rte-btn"
        :class="{ active: states.italic }"
        title="斜体 (Ctrl+I)"
        @click="exec('italic')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
      </button>
      <button
        type="button"
        class="rte-btn"
        :class="{ active: states.underline }"
        title="下划线 (Ctrl+U)"
        @click="exec('underline')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
      </button>
      <button
        type="button"
        class="rte-btn"
        :class="{ active: states.strikeThrough }"
        title="删除线"
        @click="exec('strikeThrough')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.3 19c.58-.87.97-1.9.97-3 0-1.56-.6-2.97-1.58-4.05"/><path d="M4.7 19c.58-.87.97-1.9.97-3 0-1.56-.6-2.97-1.58-4.05"/><path d="M2 12h20"/><path d="M6.5 5c1.3-1.3 3.1-2 5-2 3.87 0 7 3.13 7 7 0 1.9-.7 3.7-2 5"/></svg>
      </button>

      <div class="rte-divider"></div>

      <button
        type="button"
        class="rte-btn"
        :class="{ active: states.insertUnorderedList }"
        title="无序列表"
        @click="exec('insertUnorderedList')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      </button>
      <button
        type="button"
        class="rte-btn"
        :class="{ active: states.insertOrderedList }"
        title="有序列表"
        @click="exec('insertOrderedList')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
      </button>

      <div class="rte-divider"></div>

      <div class="rte-color-wrap">
        <button type="button" class="rte-btn rte-color-btn" title="文字颜色" @click="openColorPicker('foreColor')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3L5 14h12l-4-11z"/><path d="M7 14l-1.5 4h11L15 14"/><path d="M5 21h13"/></svg>
          <span class="rte-color-bar" :style="{ background: foreColorDisplay }"></span>
        </button>
        <input
          ref="foreColorRef"
          type="color"
          class="rte-color-input"
          @input="exec('foreColor', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="rte-color-wrap">
        <button type="button" class="rte-btn rte-color-btn" title="背景高亮" @click="openColorPicker('hiliteColor')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/><path d="M15 3h6v6"/><path d="M16 2 22 8"/></svg>
          <span class="rte-color-bar" :style="{ background: hiliteColorDisplay }"></span>
        </button>
        <input
          ref="hiliteColorRef"
          type="color"
          class="rte-color-input"
          @input="exec('hiliteColor', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="rte-divider"></div>

      <button
        type="button"
        class="rte-btn"
        :class="{ active: states.justifyLeft }"
        title="左对齐"
        @click="exec('justifyLeft')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
      </button>
      <button
        type="button"
        class="rte-btn"
        :class="{ active: states.justifyCenter }"
        title="居中"
        @click="exec('justifyCenter')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
      </button>

      <div class="rte-divider"></div>

      <button type="button" class="rte-btn" :class="{ active: states.formatBlock === 'blockquote' }" title="引用块" @click="exec('formatBlock', 'blockquote')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3"/></svg>
      </button>

      <div class="rte-divider"></div>

      <button type="button" class="rte-btn" title="插入链接" @click="insertLink">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      </button>

      <button type="button" class="rte-btn rte-btn-danger" title="清除格式" @click="exec('removeFormat')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
      </button>
    </div>

    <!-- Editor Content -->
    <div
      ref="editorRef"
      class="rich-editor-content"
      contenteditable="true"
      :data-placeholder="placeholder || '在此输入内容...'"
      @input="onInput"
      @keydown="onKeydown"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLDivElement>()
const foreColorRef = ref<HTMLInputElement>()
const hiliteColorRef = ref<HTMLInputElement>()

// Toolbar button active states
const states = ref<Record<string, any>>({
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

// Color display helpers (ensure valid CSS color value)
const foreColorDisplay = computed(() => {
  const v = states.value.foreColor
  return (typeof v === 'string' && v) ? v : 'currentColor'
})
const hiliteColorDisplay = computed(() => {
  const v = states.value.hiliteColor
  return (typeof v === 'string' && v) ? v : 'transparent'
})

let isTyping = false
let updateTimer: ReturnType<typeof setTimeout> | null = null

function exec(command: string, value?: string) {
  editorRef.value?.focus()
  document.execCommand(command, false, value ?? undefined)
  updateStates()
  emitUpdate()
}

function insertLink() {
  editorRef.value?.focus()
  const url = window.prompt('请输入链接地址:', 'https://')
  if (url && url.trim()) {
    document.execCommand('createLink', false, url.trim())
    emitUpdate()
  }
}

function openColorPicker(type: 'foreColor' | 'hiliteColor') {
  editorRef.value?.focus()
  const ref = type === 'foreColor' ? foreColorRef.value : hiliteColorRef.value
  if (ref) {
    ref.click()
  }
}

function updateStates() {
  if (!editorRef.value) return
  const cmds = ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList', 'justifyLeft', 'justifyCenter', 'justifyRight']
  const newStates: Record<string, boolean | string> = {}
  for (const cmd of cmds) {
    try {
      newStates[cmd] = document.queryCommandState(cmd)
    } catch {
      newStates[cmd] = false
    }
  }
  // Color values
  try {
    newStates.foreColor = document.queryCommandValue('foreColor')
  } catch {
    newStates.foreColor = ''
  }
  try {
    newStates.hiliteColor = document.queryCommandValue('hiliteColor')
  } catch {
    newStates.hiliteColor = ''
  }
  // Block format
  try {
    const block = document.queryCommandValue('formatBlock')
    newStates.formatBlock = typeof block === 'string' ? block.toLowerCase().replace(/[<>]/g, '') : ''
  } catch {
    newStates.formatBlock = ''
  }
  states.value = newStates
}

function emitUpdate() {
  if (!editorRef.value) return
  let html = editorRef.value.innerHTML
  // Normalize empty content
  if (html === '<br>' || html === '<div><br></div>' || html === '<p><br></p>' || !html.trim()) {
    html = ''
  }
  emit('update:modelValue', html)
}

function onInput() {
  isTyping = true
  if (updateTimer) clearTimeout(updateTimer)
  updateTimer = setTimeout(() => {
    isTyping = false
    emitUpdate()
  }, 200)
}

function onKeydown(e: KeyboardEvent) {
  // Ctrl/Cmd + B/I/U shortcuts
  if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u'].includes(e.key.toLowerCase())) {
    e.preventDefault()
    const map: Record<string, string> = { b: 'bold', i: 'italic', u: 'underline' }
    exec(map[e.key.toLowerCase()])
  }
}

function onSelectionChange() {
  updateStates()
}

onMounted(() => {
  if (!editorRef.value) return
  // Set initial content without triggering reactivity loop
  if (props.modelValue) {
    editorRef.value.innerHTML = props.modelValue
  }
  document.addEventListener('selectionchange', onSelectionChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
  if (updateTimer) clearTimeout(updateTimer)
})

// Watch external value changes (e.g. undo/redo) — only update if different to avoid cursor jump
watch(() => props.modelValue, (newVal) => {
  if (!editorRef.value || isTyping) return
  const current = editorRef.value.innerHTML
  // Normalize for comparison
  const normCurrent = current === '<br>' ? '' : current
  const normNew = newVal === '<br>' || newVal === '<div><br></div>' || newVal === '<p><br></p>' ? '' : newVal
  if (normCurrent !== normNew) {
    editorRef.value.innerHTML = newVal || ''
  }
})
</script>

<style scoped>
.rich-editor {
  border: 1px solid var(--border-light);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-card);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.rich-editor:focus-within {
  border-color: var(--primary-400);
  box-shadow: 0 0 0 3px var(--primary-50);
}

/* Toolbar */
.rich-editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid var(--border-light);
}

.rte-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.rte-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}
.rte-btn.active {
  background: var(--primary-600);
  color: #fff;
}
.rte-btn-danger:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.rte-divider {
  width: 1px;
  height: 20px;
  background: var(--border-light);
  margin: 0 4px;
}

.rte-color-wrap {
  position: relative;
  display: inline-flex;
}
.rte-color-btn {
  position: relative;
  flex-direction: column;
  gap: 1px;
  padding-bottom: 2px;
}
.rte-color-bar {
  display: block;
  width: 14px;
  height: 2px;
  border-radius: 1px;
}
.rte-color-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 28px;
  height: 28px;
  opacity: 0;
  cursor: pointer;
  pointer-events: none;
}

/* Editor Content */
.rich-editor-content {
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
  outline: none;
  background: transparent;
}
.rich-editor-content:empty::before {
  content: attr(data-placeholder);
  color: var(--text-muted);
  pointer-events: none;
}
.rich-editor-content :deep(ul),
.rich-editor-content :deep(ol) {
  margin: 6px 0;
  padding-left: 20px;
}
.rich-editor-content :deep(li) {
  margin: 2px 0;
}
.rich-editor-content :deep(a) {
  color: var(--primary-500);
  text-decoration: underline;
}
.rich-editor-content :deep(b),
.rich-editor-content :deep(strong) {
  font-weight: 600;
}
.rich-editor-content :deep(u) {
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
