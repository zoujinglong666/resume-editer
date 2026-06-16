<template>
  <div class="app-canvas-area" ref="scrollContainer">
    <!-- Dev/Test Toggle (remove after Phase 1) -->
    <div class="no-print flex items-center" style="margin-bottom: var(--tight-gap); gap: var(--tight-gap);" >
      <label class="text-sm">
        <input type="checkbox" v-model="store.useNewModel" @change="onModelToggle" />
        使用新模型 (useNewModel)
      </label>
      <button
        v-if="!store.docRef"
        class="text-sm px-2 py-1 bg-blue-500 text-white rounded"
        @click="store.migrateToNewModel()"
      >迁移到新模型</button>
    </div>

    <div ref="canvasEl" class="a4-canvas relative" id="resume-canvas">
      <!-- Page Break Lines -->
      <div
        v-for="n in pageBreakCount"
        :key="`pb-${n}`"
        class="page-break-line no-print"
        :style="{ top: `${n * 297}mm` }"
      >
        <span class="page-break-label">A4 分页线</span>
      </div>

      <!-- New Document Model Rendering -->
      <template v-if="store.useNewModel && store.docRef">
        <draggable
          :list="elementsList"
          item-key="id"
          handle=".drag-handle"
          animation="200"
          ghost-class="sortable-ghost"
          drag-class="sortable-drag"
          @end="onElementDragEnd"
        >
          <template #item="{ element: el }">
            <div
              class="element-wrapper relative group"
              :class="{ 'is-selected': store.selectedElementId === el.id }"
              :data-element-id="el.id"
              @click.stop="onElementClick(el.id)"
              @contextmenu.prevent="onElementContextMenu($event, el.id)"
            >
              <!-- Selection Indicator -->
              <div
                v-if="store.selectedElementId === el.id"
                class="absolute -inset-1 rounded pointer-events-none"
                style="border: 2px solid var(--accent-color); border-radius: 6px;"
              />

              <!-- Drag Handle -->
              <span class="drag-handle absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20" title="拖拽排序" style="cursor: move;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/></svg>
              </span>

              <!-- Render Node -->
              <RenderNode
                :element="el"
                :is-selected="store.selectedElementId === el.id"
                @select="onElementSelect"
              />
            </div>
          </template>
        </draggable>

        <!-- Element Context Menu -->
        <ContextMenu
          :visible="elementMenuVisible"
          :x="elementMenuX"
          :y="elementMenuY"
          :items="elementMenuItems"
          @update:visible="elementMenuVisible = $event"
          @close="onElementMenuClose"
        />

        <!-- Empty state -->
        <div v-if="store.getElements.length === 0" class="text-center py-20 text-gray-400">
          暂无元素，请添加内容
        </div>
      </template>

      <!-- Old Module-based Rendering (Fallback) -->
      <template v-else>
        <!-- Draggable Module List -->
        <draggable
          :list="store.modules"
          item-key="id"
          handle=".drag-handle"
          animation="200"
          ghost-class="sortable-ghost"
          drag-class="sortable-drag"
          @end="onDragEnd"
        >
          <template #item="{ element: mod }">
            <div
              v-show="mod.visible"
              class="module-section relative group"
              :class="[
                store.selectedModuleId === mod.id ? 'is-selected' : '',
                `title-style-${store.config.titleStyle || 'underline'}`
              ]"
              :data-module-id="mod.id"
              @click.stop="onModuleClick(mod.id)"
              @contextmenu.prevent="onModuleContextMenu($event, mod.id)"
            >
              <!-- Selection outline indicator -->
              <div
                v-if="store.selectedModuleId === mod.id"
                class="absolute -inset-1 rounded pointer-events-none"
                style="border: 2px solid var(--accent-color); border-radius: 6px;"
              />

              <!-- Module Header -->
              <div class="flex items-center relative z-10" style="gap: var(--tight-gap); margin-bottom: var(--space-2);">
                <span class="drag-handle" title="拖拽排序">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/></svg>
                </span>
                <h2
                  v-show="!mod.hideTitle"
                  class="module-title flex-1 cursor-text"
                  contenteditable="true"
                  :data-placeholder="'模块标题'"
                  @blur="updateModuleTitle(mod.id, $event)"
                  @paste="onPaste($event)"
                  @click.stop
                >{{ mod.title }}</h2>
                <span
                  class="title-toggle no-print"
                  :class="{ hidden: mod.hideTitle }"
                  :title="mod.hideTitle ? '显示标题' : '隐藏标题'"
                  @click.stop="store.toggleModuleTitle(mod.id)"
                >
                  <svg v-if="!mod.hideTitle" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16"/><path d="M4 12h16"/></svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h6"/><path d="M14 7h6"/><path d="M4 12h16"/><line x1="4" y1="16" x2="20" y2="8" stroke-width="1.5"/></svg>
                </span>
                <span
                  class="eye-toggle no-print"
                  :class="{ hidden: !mod.visible }"
                  title="显示/隐藏"
                  @click.stop="store.toggleModuleVisibility(mod.id)"
                >
                  <svg v-if="mod.visible" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </span>
              </div>

              <!-- Module Content by Type -->
              <div class="relative z-10">
                <PersonalInfoModule v-if="mod.type === 'personal'" :module="mod" />
                <EducationModule v-else-if="mod.type === 'education'" :module="mod" />
                <ExperienceModule v-else-if="mod.type === 'experience'" :module="mod" />
                <ProjectModule v-else-if="mod.type === 'project'" :module="mod" />
                <SkillModule v-else-if="mod.type === 'skill'" :module="mod" />
                <StrengthModule v-else-if="mod.type === 'strength'" :module="mod" />
                <CustomModule v-else-if="mod.type === 'custom'" :module="mod" />
              </div>

              <!-- Add Item Button -->
              <button
                v-if="mod.type === 'personal'"
                class="add-item-btn no-print"
                style="display: none;"
              >+</button>
              <button
                v-else-if="mod.type === 'skill'"
                class="add-item-btn no-print"
                @click.stop="store.addItem(mod.id)"
              >+ 添加技能</button>
              <button
                v-else-if="mod.type === 'strength'"
                class="add-item-btn no-print"
                @click.stop="store.addItem(mod.id)"
              >+ 添加优势</button>
              <button
                v-else
                class="add-item-btn no-print"
                @click.stop="store.addItem(mod.id)"
              >+ 添加条目</button>
            </div>
          </template>
        </draggable>

        <!-- Module Context Menu -->
        <ContextMenu
          :visible="moduleMenuVisible"
          :x="moduleMenuX"
          :y="moduleMenuY"
          :items="moduleMenuItems"
          @update:visible="moduleMenuVisible = $event"
          @close="onModuleMenuClose"
        />

        <!-- Empty state hint -->
        <div v-if="!store.modules.some(m => m.visible)" class="text-center py-20 text-gray-400">
          所有模块已隐藏，请在左侧面板开启显示
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { useResumeStore } from '../stores/resume'
import RenderNode from './editor/RenderNode.vue'
// ResumeModule type not used directly in template
import PersonalInfoModule from './modules/PersonalInfoModule.vue'
import EducationModule from './modules/EducationModule.vue'
import ExperienceModule from './modules/ExperienceModule.vue'
import ProjectModule from './modules/ProjectModule.vue'
import SkillModule from './modules/SkillModule.vue'
import StrengthModule from './modules/StrengthModule.vue'
import CustomModule from './modules/CustomModule.vue'
import ContextMenu from './ContextMenu.vue'
import type { ContextMenuItem } from './ContextMenu.vue'
import type { ResumeElement } from '../types'

const store = useResumeStore()
const canvasEl = ref<HTMLElement | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)

// ---- Page Break Lines ----
const pageBreakCount = ref(0)

function updatePageBreakCount() {
  if (!canvasEl.value) return
  const pxPerMm = 96 / 25.4
  const heightMm = canvasEl.value.scrollHeight / pxPerMm
  pageBreakCount.value = Math.max(0, Math.floor(heightMm / 297))
}

onMounted(() => {
  updatePageBreakCount()
  const ro = new ResizeObserver(() => updatePageBreakCount())
  if (canvasEl.value) ro.observe(canvasEl.value)
})

// ---- Element Context Menu State (New Model) ----
const elementMenuVisible = ref(false)
const elementMenuX = ref(0)
const elementMenuY = ref(0)
const elementMenuItems = ref<ContextMenuItem[]>([])
const elementMenuTargetId = ref<string | null>(null)

// ---- Module Context Menu State (Old Model) ----
const moduleMenuVisible = ref(false)
const moduleMenuX = ref(0)
const moduleMenuY = ref(0)
const moduleMenuItems = ref<ContextMenuItem[]>([])
const moduleMenuTargetId = ref<string | null>(null)

// ---- Computed ----

// Writable computed for draggable (new model)
const elementsList = computed<ResumeElement[]>({
  get() {
    return store.getElements
  },
  set(newElements: ResumeElement[]) {
    // Update order of elements based on new order from drag
    if (!store.docRef || !store.currentPage) return
    const page = store.currentPage
    newElements.forEach((el, index) => {
      const element = page.elements.find(e => e.id === el.id)
      if (element) {
        element.order = index
      }
    })
  }
})

function onModuleContextMenu(e: MouseEvent, moduleId: string) {
  e.preventDefault()
  store.selectModule(moduleId)
  moduleMenuTargetId.value = moduleId

  const mod = store.modules.find(m => m.id === moduleId)
  if (!mod) return

  const isFirst = store.modules.filter(m => m.visible).findIndex(m => m.id === moduleId) === 0
  const isLast = store.modules.filter(m => m.visible).findIndex(m => m.id === moduleId) === store.modules.filter(m => m.visible).length - 1

  const items: ContextMenuItem[] = []

  // Visibility toggle
  items.push({
    label: mod.visible ? '隐藏模块' : '显示模块',
    icon: mod.visible ? '👁️' : '👁️',
    action: () => store.toggleModuleVisibility(moduleId)
  })

  items.push({ label: '', divider: true })

  // Rename
  items.push({
    label: '重命名模块',
    icon: '📝',
    action: () => {
      nextTick(() => {
        const el = canvasEl.value?.querySelector(`[data-module-id="${moduleId}"] .module-title`) as HTMLElement | null
        el?.focus()
      })
    }
  })

  items.push({ label: '', divider: true })

  // Move up/down
  if (!isFirst) {
    items.push({
      label: '上移模块',
      icon: '⬆️',
      action: () => {
        const visModules = store.modules.filter(m => m.visible)
        const idx = visModules.findIndex(m => m.id === moduleId)
        if (idx > 0) {
          // Swap order with previous visible module
          const prev = visModules[idx - 1]
          const curr = visModules[idx]
          const tmp = prev.order
          prev.order = curr.order
          curr.order = tmp
        }
      }
    })
  }
  if (!isLast) {
    items.push({
      label: '下移模块',
      icon: '⬇️',
      action: () => {
        const visModules = store.modules.filter(m => m.visible)
        const idx = visModules.findIndex(m => m.id === moduleId)
        if (idx < visModules.length - 1) {
          const curr = visModules[idx]
          const next = visModules[idx + 1]
          const tmp = curr.order
          curr.order = next.order
          next.order = tmp
        }
      }
    })
  }

  items.push({ label: '', divider: true })

  // Add item (not for personal)
  if (mod.type !== 'personal') {
    const typeNames: Record<string, string> = {
      education: '教育条目', experience: '工作条目',
      project: '项目条目', skill: '技能', strength: '优势',
      custom: '自定义条目'
    }
    items.push({
      label: `添加${typeNames[mod.type] || '条目'}`,
      icon: '➕',
      action: () => store.addItem(moduleId)
    })
  }

  // Delete module (not for personal)
  if (mod.type !== 'personal') {
    items.push({ label: '', divider: true })
    items.push({
      label: '删除模块',
      icon: '🗑️',
      danger: true,
      action: () => store.removeModule(moduleId)
    })
  }

  moduleMenuItems.value = items
  moduleMenuX.value = e.clientX
  moduleMenuY.value = e.clientY
  moduleMenuVisible.value = true
}

function onModuleMenuClose() {
  moduleMenuVisible.value = false
  moduleMenuTargetId.value = null
}

// ---- New Model: Element Operations ----

function onModelToggle() {
  if (store.useNewModel && !store.docRef) {
    // User is trying to switch to new model but haven't migrated yet
    store.migrateToNewModel()
  }
}

function onElementClick(elementId: string) {
  store.selectElement(elementId)
}

function onElementSelect(elementId: string) {
  store.selectElement(elementId)
}

function onElementContextMenu(e: MouseEvent, elementId: string) {
  e.preventDefault()
  store.selectElement(elementId)
  elementMenuTargetId.value = elementId

  const element = store.selectedElement
  if (!element) return

  const items: ContextMenuItem[] = []

  // Element type display
  const typeNames: Record<string, string> = {
    'text': '文本',
    'heading': '标题',
    'paragraph': '段落',
    'rich-text': '富文本',
    'divider': '分割线',
    'module': '模块',
    'item': '条目',
    'image': '图片',
    'avatar': '头像',
    'shape': '形状',
    'icon': '图标',
    'skill-bar': '技能条'
  }

  items.push({
    label: `元素类型: ${typeNames[element.type] || element.type}`,
    icon: '📄',
    action: () => {}
  })

  items.push({ label: '', divider: true })

  // Edit (for text types)
  if (['text', 'heading', 'paragraph', 'rich-text'].includes(element.type)) {
    items.push({
      label: '编辑内容',
      icon: '✏️',
      action: () => {
        // Focus will be handled by RenderNode's dblclick
      }
    })
    items.push({ label: '', divider: true })
  }

  // Delete element
  items.push({
    label: '删除元素',
    icon: '🗑️',
    danger: true,
    action: () => store.removeElement(elementId)
  })

  elementMenuItems.value = items
  elementMenuX.value = e.clientX
  elementMenuY.value = e.clientY
  elementMenuVisible.value = true
}

function onElementMenuClose() {
  elementMenuVisible.value = false
  elementMenuTargetId.value = null
}

function onElementDragEnd() {
  // Order is updated via the writable computed in elementsList
}

// ---- Expose ----

defineExpose({ canvasEl })

function onDragEnd() {
  // Order is already updated by vuedraggable via the list binding
}

function onModuleClick(moduleId: string) {
  store.selectModule(moduleId)
}

function updateModuleTitle(moduleId: string, e: FocusEvent) {
  const el = e.target as HTMLElement
  store.updateModule(moduleId, { title: el.innerText })
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

// Watch for selection changes — scroll the module into view
watch(() => store.selectedModuleId, (newId) => {
  if (!newId) return
  nextTick(() => {
    const el = canvasEl.value?.querySelector(`[data-module-id="${newId}"]`)
    if (el && scrollContainer.value) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
})

// Watch for element selection changes — scroll the element into view
watch(() => store.selectedElementId, (newId) => {
  if (!newId) return
  nextTick(() => {
    const el = canvasEl.value?.querySelector(`[data-element-id="${newId}"]`)
    if (el && scrollContainer.value) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
})
</script>

<style scoped>
/* Element wrapper styles for new model */
.element-wrapper {
  position: relative;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.element-wrapper:last-child {
  margin-bottom: 0;
}

.element-wrapper:hover {
  background-color: rgba(59, 130, 246, 0.03);
}

.element-wrapper.is-selected {
  z-index: 10;
}

.element-wrapper .drag-handle {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.element-wrapper:hover .drag-handle {
  opacity: 0.6;
}

.element-wrapper.is-selected .drag-handle {
  opacity: 0.8;
}

/* Page break indicator line */
.page-break-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 2px dashed #cbd5e1;
  pointer-events: none;
  z-index: 5;
}
.page-break-label {
  position: absolute;
  right: 8px;
  top: -18px;
  font-size: 10px;
  color: #94a3b8;
  background: var(--surface-color);
  padding: 0 4px;
  border-radius: 2px;
}
</style>
