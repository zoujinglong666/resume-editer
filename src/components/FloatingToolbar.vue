<template>
  <Teleport to="body">
    <div
      v-show="visible"
      class="floating-toolbar"
      :style="positionStyle"
      @mousedown.prevent
    >
      <!-- Bold -->
      <button type="button" class="ft-btn" :class="{ active: states.bold }" title="加粗 (Ctrl+B)" @click="exec('bold')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
      </button>
      <!-- Italic -->
      <button type="button" class="ft-btn" :class="{ active: states.italic }" title="斜体 (Ctrl+I)" @click="exec('italic')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
      </button>
      <!-- Underline -->
      <button type="button" class="ft-btn" :class="{ active: states.underline }" title="下划线 (Ctrl+U)" @click="exec('underline')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
      </button>
      <!-- Strike -->
      <button type="button" class="ft-btn" :class="{ active: states.strikeThrough }" title="删除线" @click="exec('strikeThrough')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 00-2.83 4M14 12a4 4 0 010 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
      </button>

      <div class="ft-sep"></div>

      <!-- Color picker -->
      <button type="button" class="ft-btn ft-color-btn" title="文字颜色" @click="toggleColorPicker">
        <div class="ft-color-swatch" :style="{ backgroundColor: currentColor }"></div>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      <!-- Unordered list -->
      <button type="button" class="ft-btn" :class="{ active: states.insertUnorderedList }" title="无序列表" @click="exec('insertUnorderedList')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="4" cy="7" r="1.4" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="4" cy="17" r="1.4" fill="currentColor" stroke="none"/><line x1="8" y1="7" x2="21" y2="7"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="17" x2="21" y2="17"/></svg>
      </button>
      <!-- Ordered list -->
      <button type="button" class="ft-btn" :class="{ active: states.insertOrderedList }" title="有序列表" @click="exec('insertOrderedList')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
      </button>

      <div class="ft-sep"></div>

      <!-- AI Polish -->
      <button
        type="button"
        class="ft-btn ft-ai-btn"
        :class="{ loading: isAiPolishing }"
        :disabled="isAiPolishing || !selectedText"
        title="AI 润色"
        @click="handleAiPolish"
      >
        <svg v-if="!isAiPolishing" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14h.01"/><path d="M8 14h.01"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56" class="ft-ai-spinner"/></svg>
      </button>

      <!-- Color picker popup -->
      <div v-if="showColorPicker" class="ft-color-picker" @click.stop>
        <div class="ft-color-grid">
          <button
            v-for="color in colorPalette"
            :key="color"
            type="button"
            class="ft-color-swatch"
            :style="{ backgroundColor: color }"
            @click="applyColor(color)"
          />
        </div>
        <div class="ft-color-input-row">
          <input
            v-model="customColor"
            type="text"
            class="ft-color-input"
            placeholder="#000000"
            @keydown.enter="applyColor(customColor)"
            @blur="applyColor(customColor)"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { loadAiConfig, aiPolishContent } from '../utils/ai'

const visible = ref(false)
const showColorPicker = ref(false)
const currentColor = ref('#000000')
const customColor = ref('')
const positionStyle = ref<Record<string, string>>({})
const selectedText = ref('')
const isAiPolishing = ref(false)
const selectionRange = ref<Range | null>(null)

const states = reactive({
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  insertUnorderedList: false,
  insertOrderedList: false,
})

const colorPalette = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#E53E3E', '#DD6B20', '#D69E2E', '#38A169', '#3182CE', '#805AD5',
  '#D53F8C', '#744210', '#2D3748', '#1A202C', '#718096', '#A0AEC0',
]

// Suppress blur events from toolbar buttons
let suppressBlur = false

function updateStates() {
  const cmds: (keyof typeof states)[] = [
    'bold', 'italic', 'underline', 'strikeThrough',
    'insertUnorderedList', 'insertOrderedList',
  ]
  for (const cmd of cmds) {
    try {
      states[cmd] = document.queryCommandState(cmd as string)
    } catch {
      states[cmd] = false
    }
  }
}

function exec(command: string, value?: string) {
  suppressBlur = true
  document.execCommand(command, false, value)
  updateStates()
  hide()
}

function toggleColorPicker() {
  showColorPicker.value = !showColorPicker.value
  if (showColorPicker.value) {
    try {
      currentColor.value = document.queryCommandValue('foreColor') || '#000000'
    } catch {
      currentColor.value = '#000000'
    }
    customColor.value = currentColor.value
  }
}

function applyColor(color: string) {
  if (!color) return
  // Normalize color
  if (!color.startsWith('#')) color = '#' + color
  if (color.length === 4) {
    color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    suppressBlur = true
    document.execCommand('foreColor', false, color)
    currentColor.value = color
    showColorPicker.value = false
  }
}

function hide() {
  visible.value = false
  showColorPicker.value = false
}

async function handleAiPolish() {
  if (!selectedText.value || isAiPolishing.value || !selectionRange.value) return
  isAiPolishing.value = true

  const config = loadAiConfig()
  if (!config) {
    alert('请先配置 AI API Key')
    isAiPolishing.value = false
    return
  }

  try {
    const result = await aiPolishContent(config, selectedText.value)
    // Replace selected text with polished result
    const range = selectionRange.value
    range.deleteContents()
    range.insertNode(document.createTextNode(result))
    // Collapse to end
    range.collapse(false)
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(range)
    }
  } catch (err: unknown) {
    alert(`AI 润色失败: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    isAiPolishing.value = false
  }
}

function onSelectionChange() {
  // Delay to let the selection settle
  setTimeout(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      hide()
      return
    }

    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer

    // Only show toolbar when selection is inside contenteditable areas
    let node: Node | null = container
    let insideEditable = false
    while (node) {
      if (node instanceof HTMLElement && node.isContentEditable) {
        insideEditable = true
        break
      }
      node = node.parentNode
    }

    if (!insideEditable) {
      hide()
      return
    }

    // Capture selected text and range for AI polish
    const text = selection.toString().trim()
    if (!text || text.length < 2) {
      hide()
      return
    }
    selectedText.value = text
    selectionRange.value = range.cloneRange()

    // Position toolbar above the selection
    const rect = range.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      hide()
      return
    }

    const toolbarWidth = 340 // approximate with AI button
    const toolbarHeight = 36

    let left = rect.left + rect.width / 2 - toolbarWidth / 2
    // Keep within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8))

    const top = rect.top - toolbarHeight - 8

    positionStyle.value = {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: '9999',
      transform: 'translateZ(0)',
    }

    visible.value = true
    updateStates()
  }, 10)
}

function onBlur() {
  if (!suppressBlur) {
    hide()
  }
  suppressBlur = false
}

onMounted(() => {
  document.addEventListener('selectionchange', onSelectionChange)
  document.addEventListener('mousedown', onBlur, true)
  document.addEventListener('scroll', hide, true)
})

onUnmounted(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
  document.removeEventListener('mousedown', onBlur, true)
  document.removeEventListener('scroll', hide, true)
})
</script>

<style scoped>
.floating-toolbar {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 4px 6px;
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e4e4ec);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06);
  animation: ft-in 0.12s ease;
  flex-wrap: nowrap;
}

@keyframes ft-in {
  from { opacity: 0; transform: translateY(4px) translateZ(0); }
  to   { opacity: 1; transform: translateY(0) translateZ(0); }
}

.ft-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary, #575a6b);
  cursor: pointer;
  transition: all 0.1s ease;
  min-width: 26px;
  height: 26px;
}

.ft-btn:hover {
  background: var(--primary-50, #eef2ff);
  color: var(--primary-600, #4f46e5);
}

.ft-btn.active {
  background: var(--primary-100, #e0e7ff);
  color: var(--primary-700, #4338ca);
}

.ft-sep {
  width: 1px;
  height: 18px;
  background: var(--border-light, #f0f0f5);
  margin: 0 2px;
}

.ft-color-btn {
  position: relative;
}

.ft-color-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid var(--border-color, #e4e4ec);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ft-color-picker {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e4e4ec);
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  z-index: 10000;
  animation: ft-in 0.12s ease;
}

.ft-color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.ft-color-grid .ft-color-swatch {
  width: 22px;
  height: 22px;
  padding: 0;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.ft-color-grid .ft-color-swatch:hover {
  transform: scale(1.15);
}

.ft-color-input-row {
  display: flex;
  gap: 4px;
}

.ft-color-input {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid var(--border-color, #e4e4ec);
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  outline: none;
  color: var(--text-primary, #333);
  background: var(--bg-color, #fff);
}

.ft-color-input:focus {
  border-color: var(--primary-400, #818cf8);
}

/* AI Button */
.ft-ai-btn {
  position: relative;
}

.ft-ai-btn:hover {
  background: var(--primary-50, #eef2ff);
  color: var(--primary-600, #4f46e5);
}

.ft-ai-btn.loading {
  color: var(--primary-500, #6366f1);
}

.ft-ai-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ft-ai-spinner {
  animation: ft-spin 1s linear infinite;
}

@keyframes ft-spin {
  to { transform: rotate(360deg); }
}
</style>
