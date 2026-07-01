<template>
  <Teleport to="body">
    <div
      v-show="visible"
      class="floating-ai"
      :style="positionStyle"
      @mousedown.prevent
    >
      <button
        type="button"
        class="floating-ai-btn"
        @click="handlePolishSelection"
        :disabled="isPolishing"
      >
        <svg v-if="!isPolishing" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14h.01"/><path d="M8 14h.01"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56" class="ai-spinner"/></svg>
        <span>{{ isPolishing ? '润色中...' : 'AI 润色' }}</span>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { loadAiConfig, aiPolishContent, type AiConfig } from '../utils/ai'
const visible = ref(false)
const isPolishing = ref(false)
const positionStyle = ref<Record<string, string>>({})
const selectedText = ref('')

function getAiConfig(): AiConfig | null {
  return loadAiConfig()
}

function handlePolishSelection() {
  if (!selectedText.value || isPolishing.value) return
  isPolishing.value = true

  const config = getAiConfig()
  if (!config) {
    alert('请先配置 AI API Key')
    isPolishing.value = false
    return
  }

  aiPolishContent(config, selectedText.value).then(result => {
    // Replace selected text with polished result
    const selection = window.getSelection()
    if (selection && selection.rangeCount) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(document.createTextNode(result))
      // Collapse to end
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }).catch(err => {
    alert(`AI 润色失败: ${err instanceof Error ? err.message : String(err)}`)
  }).finally(() => {
    isPolishing.value = false
  })
}

function onSelectionChange() {
  setTimeout(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      visible.value = false
      return
    }

    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer

    // Only show when selection is inside contenteditable areas
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
      visible.value = false
      return
    }

    const text = selection.toString().trim()
    if (!text || text.length < 2) {
      visible.value = false
      return
    }

    selectedText.value = text

    // Position button above selection
    const rect = range.getBoundingClientRect()
    const buttonWidth = 100
    const buttonHeight = 32

    let left = rect.left + rect.width / 2 - buttonWidth / 2
    left = Math.max(8, Math.min(left, window.innerWidth - buttonWidth - 8))

    const top = rect.top - buttonHeight - 8

    positionStyle.value = {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: '9998',
    }

    visible.value = true
  }, 10)
}

function onBlur() {
  visible.value = false
}

onMounted(() => {
  document.addEventListener('selectionchange', onSelectionChange)
  document.addEventListener('mousedown', onBlur, true)
  document.addEventListener('scroll', onBlur, true)
})

onUnmounted(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
  document.removeEventListener('mousedown', onBlur, true)
  document.removeEventListener('scroll', onBlur, true)
})
</script>

<style scoped>
.floating-ai {
  animation: ft-in 0.12s ease;
}

@keyframes ft-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.floating-ai-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--border-color, #e4e4ec);
  border-radius: 8px;
  background: var(--surface-color, #fff);
  color: var(--text-secondary, #575a6b);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06);
  white-space: nowrap;
}

.floating-ai-btn:hover {
  background: var(--primary-50, #eef2ff);
  color: var(--primary-600, #4f46e5);
  border-color: var(--primary-200, #c7d2fe);
}

.floating-ai-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
