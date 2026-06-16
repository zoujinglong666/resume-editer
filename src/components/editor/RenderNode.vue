<template>
  <div
    class="render-node"
    :class="[
      `element-type-${element.type}`,
      { 'is-selected': isSelected }
    ]"
    :style="nodeStyle"
    :data-element-id="element.id"
    @click.stop="onSelect"
    @dblclick.stop="onDblClick"
  >
    <!-- Text / Heading / Paragraph -->
    <template v-if="isTextType">
      <div
        v-if="element.type === 'text' || element.type === 'heading' || element.type === 'paragraph'"
        class="node-text-content"
        :class="{ 'editing': isEditing }"
        :contenteditable="isEditing"
        :data-placeholder="placeholder"
        :style="textStyle"
        @blur="onTextBlur"
        @input="onTextInput"
        @paste="onPaste"
        ref="textEl"
      >{{ displayContent }}</div>
    </template>

    <!-- Rich Text -->
    <template v-else-if="element.type === 'rich-text'">
      <div
        class="node-rich-text"
        :class="{ 'editing': isEditing }"
        :contenteditable="isEditing"
        :style="textStyle"
        @blur="onRichTextBlur"
        @input="onRichTextInput"
        @paste="onPaste"
        ref="richTextEl"
        v-html="element.html || element.content || ''"
      ></div>
    </template>

    <!-- Divider -->
    <template v-else-if="element.type === 'divider'">
      <hr class="node-divider" :style="dividerStyle" />
    </template>

    <!-- Module (container for items) -->
    <template v-else-if="element.type === 'module'">
      <div class="node-module" :class="`module-type-${element.moduleType}`">
        <!-- Module Title -->
        <h2
          v-if="element.content"
          class="module-title"
          :contenteditable="isEditing"
          :style="titleStyle"
          @blur="onTitleBlur"
          @paste="onPaste"
          ref="titleEl"
          @click.stop="onTitleClick"
          @dblclick.stop="onTitleDblClick"
        >{{ element.content }}</h2>

        <!-- Pattern A: migrated data uses element.items (ModuleItem[]) -->
        <div v-if="element.items && element.items.length > 0" class="module-items">
          <div
            v-for="(item, idx) in element.items"
            :key="item.id"
            class="module-item-row"
            :class="{ 'item-has-divider': idx < element.items.length - 1 }"
          >
            <!-- Personal Info -->
            <template v-if="element.moduleType === 'personal'">
              <div class="personal-info-compact">
                <div class="personal-name">{{ item.name }}</div>
                <div class="personal-meta">
                  <span v-if="item.position">{{ item.position }}</span>
                  <span v-if="item.phone" class="meta-sep">|</span>
                  <span v-if="item.phone">{{ item.phone }}</span>
                  <span v-if="item.email" class="meta-sep">|</span>
                  <span v-if="item.email">{{ item.email }}</span>
                  <span v-if="item.location" class="meta-sep">|</span>
                  <span v-if="item.location">{{ item.location }}</span>
                </div>
                <div v-if="item.summary" class="personal-summary">{{ item.summary }}</div>
              </div>
            </template>

            <!-- Education -->
            <template v-else-if="element.moduleType === 'education'">
              <div class="education-compact">
                <div class="item-header">
                  <span class="item-title">{{ [item.school, item.degree, item.major].filter(Boolean).join(' · ') }}</span>
                  <span v-if="item.dateRange" class="item-date">{{ item.dateRange }}</span>
                </div>
                <div v-if="item.description" class="item-desc" v-html="formatDesc(item.description)"></div>
              </div>
            </template>

            <!-- Experience -->
            <template v-else-if="element.moduleType === 'experience'">
              <div class="experience-compact">
                <div class="item-header">
                  <span class="item-title">{{ [item.company, item.position].filter(Boolean).join(' · ') }}</span>
                  <span v-if="item.dateRange" class="item-date">{{ item.dateRange }}</span>
                </div>
                <div v-if="item.description" class="item-desc" v-html="formatDesc(item.description)"></div>
              </div>
            </template>

            <!-- Project -->
            <template v-else-if="element.moduleType === 'project'">
              <div class="project-compact">
                <div class="item-header">
                  <span class="item-title">{{ [item.name, item.role].filter(Boolean).join(' · ') }}</span>
                  <span v-if="item.dateRange" class="item-date">{{ item.dateRange }}</span>
                </div>
                <div v-if="item.description" class="item-desc" v-html="formatDesc(item.description)"></div>
                <a v-if="item.link" :href="item.link" target="_blank" class="item-link">{{ item.link }}</a>
              </div>
            </template>

            <!-- Skill -->
            <template v-else-if="element.moduleType === 'skill'">
              <div v-if="item.content" class="skill-list-row">
                <strong>{{ item.name }}</strong>：
                <span v-html="formatDesc(item.content)"></span>
              </div>
              <div v-else class="skill-compact">{{ item.name }}</div>
            </template>

            <!-- Strength -->
            <template v-else-if="element.moduleType === 'strength'">
              <div class="strength-row">
                <strong>{{ item.title }}</strong>：{{ item.content }}
              </div>
            </template>

            <!-- Custom -->
            <template v-else-if="element.moduleType === 'custom'">
              <div class="custom-compact">
                <div v-if="item.title" class="custom-title">{{ item.title }}</div>
                <div v-if="item.content" class="item-desc" v-html="formatDesc(item.content)"></div>
              </div>
            </template>

            <!-- Fallback -->
            <template v-else>
              <div class="item-fallback">{{ item.name || item.title || item.content || '' }}</div>
            </template>
          </div>
        </div>

        <!-- Pattern B: child elements (default document / element-level editing) -->
        <div v-else-if="childElements.length > 0" class="module-items">
          <RenderNode
            v-for="child in childElements"
            :key="child.id"
            :element="child"
            :is-selected="store.selectedElementId === child.id"
            @select="(id: string) => store.selectElement(id)"
          />
        </div>
      </div>
    </template>

    <!-- Item (child element with HTML/text content) -->
    <template v-else-if="element.type === 'item'">
      <div class="node-item" :style="itemStyle">
        <div
          v-if="element.html"
          class="item-html-content"
          :class="{ 'editing': isEditing }"
          :contenteditable="isEditing"
          v-html="element.html"
          @blur="onItemBlur"
          @input="onItemInput"
          @paste="onPaste"
          ref="itemHtmlEl"
          @click.stop="onItemEditClick"
          @dblclick.stop="onItemEditDblClick"
        ></div>
        <div
          v-else-if="element.content"
          class="item-text-content"
          :class="{ 'editing': isEditing }"
          :contenteditable="isEditing"
          @blur="onItemTextBlur"
          @input="onItemInput"
          @paste="onPaste"
          ref="itemTextEl"
          @click.stop="onItemEditClick"
          @dblclick.stop="onItemEditDblClick"
        >{{ element.content }}</div>
      </div>
    </template>

    <!-- Skill Bar -->
    <template v-else-if="element.type === 'skill-bar'">
      <div class="node-skill-bar" @click.stop="onSkillBarClick" @dblclick.stop="onSkillBarDblClick">
        <span
          class="skill-bar-name"
          :class="{ 'editing': isEditing }"
          :contenteditable="isEditing"
          ref="skillBarEl"
          @blur="onSkillBarBlur"
          @input="onSkillBarInput"
          @paste="onPaste"
        >{{ element.content }}</span>
      </div>
    </template>

    <!-- Image -->
    <template v-else-if="element.type === 'image' || element.type === 'avatar'">
      <img
        v-if="element.content"
        :src="element.content"
        :alt="element.type === 'avatar' ? '头像' : '图片'"
        class="node-image"
        :style="imageStyle"
      />
      <div v-else class="node-image-placeholder" :style="placeholderStyle">
        点击添加{{ element.type === 'avatar' ? '头像' : '图片' }}
      </div>
    </template>

    <!-- Shape -->
    <template v-else-if="element.type === 'shape'">
      <div
        class="node-shape"
        :style="shapeStyle"
      ></div>
    </template>

    <!-- Icon -->
    <template v-else-if="element.type === 'icon'">
      <span class="node-icon" :style="iconStyle">{{ element.content || '●' }}</span>
    </template>

    <!-- Fallback -->
    <template v-else>
      <div class="node-fallback" :style="nodeStyle">
        {{ element.content || element.html || '' }}
      </div>
    </template>

    <!-- Selection Indicator -->
    <div v-if="isSelected && !isEditing" class="selection-indicator">
      <div class="selection-handle top-left"></div>
      <div class="selection-handle top-right"></div>
      <div class="selection-handle bottom-left"></div>
      <div class="selection-handle bottom-right"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useResumeStore } from '../../stores/resume'
import type { ResumeElement } from '../../types'

const props = defineProps<{
  element: ResumeElement
  isSelected?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const store = useResumeStore()
const textEl = ref<HTMLElement | null>(null)
const richTextEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const itemHtmlEl = ref<HTMLElement | null>(null)
const itemTextEl = ref<HTMLElement | null>(null)
const skillBarEl = ref<HTMLElement | null>(null)

const isEditing = ref(false)

// ---- Computed ----

const isTextType = computed(() => {
  return ['text', 'heading', 'paragraph'].includes(props.element.type)
})

// Child elements for this module (from page.elements, used by default document pattern)
const childElements = computed<ResumeElement[]>(() => {
  if (!store.currentPage) return []
  return store.currentPage.elements
    .filter(el => el.parentId === props.element.id)
    .sort((a, b) => a.order - b.order)
})

const isSelected = computed(() => {
  return props.isSelected || store.selectedElementId === props.element.id
})

const displayContent = computed(() => {
  return props.element.content || ''
})

const placeholder = computed(() => {
  const typeMap: Record<string, string> = {
    'text': '输入文本...',
    'heading': '输入标题...',
    'paragraph': '输入段落...'
  }
  return typeMap[props.element.type] || '输入内容...'
})

// ---- Styles ----

const nodeStyle = computed(() => {
  const s = props.element.style || {}
  const l = props.element.layout || { mode: 'flow' }
  return {
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    color: s.color || undefined,
    fontWeight: s.fontWeight || undefined,
    fontStyle: s.fontStyle || undefined,
    textAlign: s.textAlign || undefined,
    lineHeight: s.lineHeight || undefined,
    background: s.background || undefined,
    borderRadius: s.borderRadius ? `${s.borderRadius}px` : undefined,
    borderWidth: s.borderWidth ? `${s.borderWidth}px` : undefined,
    borderColor: s.borderColor || undefined,
    borderStyle: s.borderStyle || undefined,
    opacity: s.opacity ?? undefined,
    // Layout
    position: (l.mode === 'absolute' ? 'absolute' : undefined) as any,
    left: l.mode === 'absolute' && l.x != null ? `${l.x}px` : undefined,
    top: l.mode === 'absolute' && l.y != null ? `${l.y}px` : undefined,
    width: l.width && l.width !== 'auto' ? `${l.width}px` : (l.width === 'auto' ? 'auto' : undefined),
    height: l.height && l.height !== 'auto' ? `${l.height}px` : (l.height === 'auto' ? 'auto' : undefined),
    zIndex: l.zIndex || undefined,
  } as any
})

const textStyle = computed(() => {
  return nodeStyle.value
})

const titleStyle = computed(() => {
  const s = props.element.style || {}
  return {
    fontSize: s.fontSize ? `${s.fontSize}px` : '18px',
    fontWeight: s.fontWeight || 'bold',
    color: s.color || undefined,
    marginBottom: '8px',
  }
})

const dividerStyle = computed(() => {
  const s = props.element.style || {}
  return {
    border: 'none',
    borderTop: `1px solid ${s.color || '#e5e7eb'}`,
    margin: (s as any).margin || '8px 0',
  } as any
})

const imageStyle = computed(() => {
  return {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: props.element.type === 'avatar' ? '50%' : undefined,
  }
})

const shapeStyle = computed(() => {
  const s = props.element.style || {}
  const l = props.element.layout || {}
  return {
    background: s.background || '#3b82f6',
    width: `${l.width || 100}px`,
    height: `${l.height || 100}px`,
    borderRadius: s.borderRadius ? `${s.borderRadius}px` : '0',
  } as any
})

const iconStyle = computed(() => {
  const s = props.element.style || {}
  return {
    fontSize: s.fontSize ? `${s.fontSize}px` : '16px',
    color: s.color || undefined,
  }
})

const placeholderStyle = computed(() => {
  return {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center' as const,
    color: '#9ca3af',
  }
})

const itemStyle = computed(() => {
  return nodeStyle.value || {}
})

// ---- Helpers ----

function formatDesc(text: string): string {
  if (!text) return ''
  // If already contains HTML list tags, render as-is (from smart paste)
  if (/<[uo]l[\s>]/i.test(text)) {
    return text
  }
  // Convert markdown bold **text** to <strong>text</strong>
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Split into lines and detect numbered/bulleted sections
  const lines = html.split(/\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length >= 2) {
    const numberedRe = /^\s*[\(（]?\d{1,3}[\)）]?\s*[.、．。\)）]\s*/
    const bulletRe = /^\s*[•\-*·●◦▪▸►]\s*/
    // Find contiguous list item lines (allow 1 non-list gap for section headers like "主要工作：")
    let listStart = -1
    let listEnd = -1
    let isNumberedList = false
    for (let i = 0; i < lines.length; i++) {
      if (numberedRe.test(lines[i])) {
        if (listStart === -1) listStart = i
        listEnd = i
        isNumberedList = true
      } else if (bulletRe.test(lines[i])) {
        if (listStart === -1) listStart = i
        listEnd = i
      }
    }
    // Count list vs non-list lines
    const numCount = lines.filter(l => numberedRe.test(l)).length
    const bulCount = lines.filter(l => bulletRe.test(l)).length
    const listCount = numCount + bulCount
    // If majority of lines are list items, convert all (old behavior)
    if (listCount / lines.length >= 0.5) {
      const strip = (l: string) => l.replace(numberedRe, '').replace(bulletRe, '').trim()
      if (numCount >= bulCount) {
        return `<ol>${lines.map(l => `<li>${strip(l)}</li>`).join('')}</ol>`
      } else {
        return `<ul>${lines.map(l => `<li>${strip(l)}</li>`).join('')}</ul>`
      }
    }
    // Mixed content: intro paragraphs + list section
    if (listStart !== -1 && listCount >= 2) {
      const introLines = lines.slice(0, listStart)
      const listLines = lines.slice(listStart, listEnd + 1)
      const strip = (l: string) => l.replace(numberedRe, '').replace(bulletRe, '').trim()
      let result = ''
      if (introLines.length > 0) {
        result += `<p>${introLines.join('<br/>')}</p>`
      }
      if (isNumberedList && numCount >= bulCount) {
        result += `<ol>${listLines.map(l => `<li>${strip(l)}</li>`).join('')}</ol>`
      } else {
        result += `<ul>${listLines.map(l => `<li>${strip(l)}</li>`).join('')}</ul>`
      }
      // Any trailing lines after list
      const trailing = lines.slice(listEnd + 1)
      if (trailing.length > 0) {
        result += `<p>${trailing.join('<br/>')}</p>`
      }
      return result
    }
  }
  // Fallback: convert newlines to <br/>
  return html.replace(/\n/g, '<br/>')
}

// ---- Methods ----

function onSelect() {
  store.selectElement(props.element.id)
  emit('select', props.element.id)
}

function onDblClick() {
  if (isTextType.value || props.element.type === 'rich-text' || props.element.type === 'heading') {
    startEditing()
  } else if (props.element.type === 'item' || props.element.type === 'skill-bar') {
    startEditing()
  }
}

function onItemEditClick() {
  store.selectElement(props.element.id)
  emit('select', props.element.id)
}

function onItemEditDblClick() {
  if (props.element.type === 'item') {
    startEditing()
  }
}

function onTitleClick() {
  store.selectElement(props.element.id)
  emit('select', props.element.id)
}

function onTitleDblClick() {
  if (props.element.type === 'module') {
    startEditing()
  }
}

function onSkillBarClick() {
  store.selectElement(props.element.id)
  emit('select', props.element.id)
}

function onSkillBarDblClick() {
  if (props.element.type === 'skill-bar') {
    startEditing()
  }
}

function startEditing() {
  isEditing.value = true
  nextTick(() => {
    if (isTextType.value && textEl.value) {
      textEl.value.focus()
      // Select all text
      const range = document.createRange()
      range.selectNodeContents(textEl.value)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    } else if (props.element.type === 'rich-text' && richTextEl.value) {
      richTextEl.value.focus()
    } else if (props.element.type === 'module' && titleEl.value) {
      titleEl.value.focus()
      const range = document.createRange()
      range.selectNodeContents(titleEl.value)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    } else if (props.element.type === 'item' && itemHtmlEl.value) {
      itemHtmlEl.value.focus()
      const range = document.createRange()
      range.selectNodeContents(itemHtmlEl.value)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    } else if (props.element.type === 'item' && itemTextEl.value) {
      itemTextEl.value.focus()
      const range = document.createRange()
      range.selectNodeContents(itemTextEl.value)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    } else if (props.element.type === 'skill-bar' && skillBarEl.value) {
      skillBarEl.value.focus()
      const range = document.createRange()
      range.selectNodeContents(skillBarEl.value)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  })
}

function onTextBlur(e: FocusEvent) {
  const target = e.target as HTMLElement
  store.updateElement(props.element.id, { content: target.innerText })
  isEditing.value = false
}

function onTextInput(_e: InputEvent) {
  // Real-time update could be added here
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

function onRichTextBlur(e: FocusEvent) {
  const target = e.target as HTMLElement
  store.updateElement(props.element.id, { html: target.innerHTML })
  isEditing.value = false
}

function onRichTextInput(_e: InputEvent) {
  // Real-time update
}

function onTitleBlur(e: FocusEvent) {
  const target = e.target as HTMLElement
  store.updateElement(props.element.id, { content: target.innerText })
  isEditing.value = false
}

function onItemTextBlur(e: FocusEvent) {
  const target = e.target as HTMLElement
  store.updateElement(props.element.id, { content: target.innerText })
  isEditing.value = false
}

function onSkillBarBlur(e: FocusEvent) {
  const target = e.target as HTMLElement
  store.updateElement(props.element.id, { content: target.innerText })
  isEditing.value = false
}

function onSkillBarInput(_e: InputEvent) {
  // Real-time update
}

function onItemBlur(e: FocusEvent) {
  const target = e.target as HTMLElement
  store.updateElement(props.element.id, { html: target.innerHTML })
  isEditing.value = false
}

function onItemInput(_e: InputEvent) {
  // Real-time update
}
</script>

<style scoped>
.render-node {
  position: relative;
  transition: all 0.2s ease;
}

.render-node:hover {
  outline: 1px dashed #94a3b8;
  outline-offset: 2px;
}

.render-node.is-selected {
  outline: 2px solid var(--accent-color, #3b82f6);
  outline-offset: 2px;
}

.node-text-content {
  min-height: 1em;
  padding: 2px 4px;
  border-radius: 2px;
}

.node-text-content:empty::before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
}

.node-rich-text {
  min-height: 1em;
  padding: 2px 4px;
}

.node-divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 8px 0;
}

/* Module container - consistent bottom spacing */
.node-module {
  margin-bottom: var(--module-gap);
}

.node-module:last-child {
  margin-bottom: 0;
}

/* Module title styling */
.module-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--primary-color, #333333);
  margin: 0 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 2px solid var(--accent-color, #3498DB);
  min-height: 1em;
}

/* Module items container - consistent gap */
.module-items {
  display: flex;
  flex-direction: column;
  gap: var(--item-gap);
}

/* Each module item row - consistent spacing */
.module-item-row {
  padding: 0;
  line-height: 1.6;
}

/* Item header layout (title + date) */
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-0_5);
  flex-wrap: wrap;
  gap: 4px;
}

.item-title {
  font-weight: 600;
  color: var(--text-primary, #333333);
  font-size: 0.95rem;
}

.item-date {
  color: var(--text-secondary, #7F8C8D);
  font-size: 0.85rem;
  white-space: nowrap;
}

/* Description text */
.item-desc {
  color: var(--text-secondary, #5a6c7d);
  font-size: 0.9rem;
  line-height: 1.7;
}
.item-desc :deep(ul),
.item-desc :deep(ol) {
  margin: 4px 0;
  padding-left: 1.4em;
}
.item-desc :deep(li) {
  margin-bottom: 3px;
  line-height: 1.7;
}
.item-desc :deep(li:last-child) {
  margin-bottom: 0;
}
.item-desc :deep(ul > li)::marker {
  color: var(--primary-color, #4f46e5);
}
.item-desc :deep(ol > li)::marker {
  color: var(--primary-color, #4f46e5);
  font-weight: 600;
}

.item-desc :deep(strong) {
  color: var(--text-primary, #333333);
  font-weight: 600;
}
.item-desc :deep(p) {
  margin: 4px 0 8px;
  line-height: 1.7;
}

/* Link styling */
.item-link {
  color: var(--accent-color, #3498DB);
  font-size: 0.85rem;
  text-decoration: none;
  word-break: break-all;
}

.item-link:hover {
  text-decoration: underline;
}

/* Personal info module */
.personal-info-compact {
  text-align: center;
}

.personal-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color, #333333);
  margin-bottom: var(--space-1);
}

.personal-meta {
  color: var(--text-secondary, #7F8C8D);
  font-size: 0.9rem;
  margin-bottom: var(--space-1);
}

.meta-sep {
  margin: 0 8px;
  color: var(--border-color, #E1E8ED);
}

.personal-summary {
  color: var(--text-secondary, #5a6c7d);
  font-size: 0.9rem;
  line-height: 1.7;
  text-align: left;
  margin-top: var(--space-2);
}

/* Education module */
.education-compact {
  padding: 0;
}

/* Experience module */
.experience-compact {
  padding: 0;
}

/* Project module */
.project-compact {
  padding: 0;
}

/* Skill module - plain text list layout */
.module-type-skill .module-items {
  display: flex;
  flex-direction: column;
}

.skill-compact {
  font-size: 0.9rem;
  color: var(--text-secondary, #5a6c7d);
  padding: 2px 0;
}

/* Skill list mode (类别：关键词) */
.skill-list-row {
  font-size: 0.85rem;
  line-height: 1.7;
  color: var(--text-secondary, #5a6c7d);
  margin-bottom: 3px;
}

.skill-list-row strong {
  color: var(--text-primary, #333333);
  font-weight: 600;
}
.skill-list-row :deep(ol),
.skill-list-row :deep(ul) {
  margin: 2px 0;
  padding-left: 1.4em;
}
.skill-list-row :deep(li) {
  margin-bottom: 2px;
  line-height: 1.7;
}
.skill-list-row :deep(li:last-child) {
  margin-bottom: 0;
}
.skill-list-row :deep(ol > li)::marker {
  color: var(--primary-color, #4f46e5);
  font-weight: 600;
}
.skill-list-row :deep(p) {
  margin: 2px 0;
}

/* Strength module (能力标签：量化事实) */
.strength-row {
  font-size: 0.85rem;
  line-height: 1.7;
  color: var(--text-secondary, #5a6c7d);
  margin-bottom: 3px;
}

.strength-row strong {
  color: var(--text-primary, #333333);
  font-weight: 600;
}

/* Custom module */
.custom-compact {
  padding: 0;
}

.custom-title {
  font-weight: 600;
  color: var(--text-primary, #333333);
  margin-bottom: 4px;
  font-size: 0.95rem;
}

/* Fallback */
.item-fallback {
  color: var(--text-secondary, #5a6c7d);
  font-size: 0.9rem;
}

.node-image {
  max-width: 100%;
  height: auto;
}

.node-image-placeholder {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  color: #9ca3af;
  cursor: pointer;
}

.node-shape {
  display: inline-block;
}

.node-icon {
  display: inline-block;
}

/* Item element (child of module) */
.node-item {
  padding: 2px 0;
  line-height: 1.7;
}

.node-item .item-html-content.editing,
.node-item .item-text-content.editing {
  outline: 2px solid var(--accent-color, #3b82f6);
  outline-offset: 1px;
  border-radius: 2px;
  cursor: text;
}

.item-html-content {
  font-size: 0.9rem;
  color: var(--text-secondary, #5a6c7d);
  line-height: 1.7;
  cursor: pointer;
}

.item-html-content :deep(ul) {
  margin: 6px 0;
  padding-left: 18px;
}

.item-html-content :deep(li) {
  margin-bottom: 4px;
}

.item-html-content :deep(strong) {
  color: var(--text-primary, #333333);
}

.item-text-content {
  font-size: 0.9rem;
  color: var(--text-secondary, #5a6c7d);
}

/* Skill bar element */
.node-skill-bar {
  font-size: 0.9rem;
  color: var(--text-secondary, #5a6c7d);
  padding: 2px 0;
}

.node-skill-bar .skill-bar-name.editing {
  outline: 2px solid var(--accent-color, #3b82f6);
  outline-offset: 1px;
  border-radius: 2px;
  cursor: text;
}

.skill-bar-name {
  display: inline-block;
}

/* Fallback for unhandled types */
.node-fallback {
  font-size: 0.9rem;
  color: var(--text-secondary, #5a6c7d);
  padding: 2px 0;
  min-height: 1em;
}

.selection-indicator {
  position: absolute;
  inset: -4px;
  pointer-events: none;
}

.selection-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: var(--accent-color, #3b82f6);
  border: 1px solid white;
  border-radius: 1px;
}

.selection-handle.top-left { top: 0; left: 0; cursor: nw-resize; }
.selection-handle.top-right { top: 0; right: 0; cursor: ne-resize; }
.selection-handle.bottom-left { bottom: 0; left: 0; cursor: sw-resize; }
.selection-handle.bottom-right { bottom: 0; right: 0; cursor: se-resize; }

</style>
