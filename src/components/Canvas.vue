<template>
  <div class="app-canvas-area" ref="scrollContainer">
    <div ref="canvasEl" class="a4-canvas relative" id="resume-canvas">
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
            <div class="flex items-center gap-2 mb-3 relative z-10">
              <span class="drag-handle" title="拖拽排序">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/></svg>
              </span>
              <h2
                class="module-title flex-1 cursor-text"
                contenteditable="true"
                :data-placeholder="'模块标题'"
                @blur="updateModuleTitle(mod.id, $event)"
                @paste="onPaste($event)"
                @click.stop
              >{{ mod.title }}</h2>
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
              <CustomModule v-else-if="mod.type === 'custom'" :module="mod" />
            </div>

            <!-- Add Item Button - Now with proper styling -->
            <button
              v-if="mod.type !== 'personal' && mod.type !== 'skill'"
              class="add-item-btn no-print"
              @click.stop="store.addItem(mod.id)"
            >+ 添加条目</button>
            <button
              v-if="mod.type === 'skill'"
              class="add-item-btn no-print"
              @click.stop="store.addItem(mod.id)"
            >+ 添加技能</button>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import draggable from 'vuedraggable'
import { useResumeStore } from '../stores/resume'
import type { ResumeModule } from '../types'
import PersonalInfoModule from './modules/PersonalInfoModule.vue'
import EducationModule from './modules/EducationModule.vue'
import ExperienceModule from './modules/ExperienceModule.vue'
import ProjectModule from './modules/ProjectModule.vue'
import SkillModule from './modules/SkillModule.vue'
import CustomModule from './modules/CustomModule.vue'
import ContextMenu from './ContextMenu.vue'
import type { ContextMenuItem } from './ContextMenu.vue'

const store = useResumeStore()
const canvasEl = ref<HTMLElement | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)

// ---- Module Context Menu State ----
const moduleMenuVisible = ref(false)
const moduleMenuX = ref(0)
const moduleMenuY = ref(0)
const moduleMenuItems = ref<ContextMenuItem[]>([])
const moduleMenuTargetId = ref<string | null>(null)

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

  // Add item (not for personal or skill)
  if (mod.type !== 'personal' && mod.type !== 'skill') {
    const typeNames: Record<string, string> = {
      education: '教育条目', experience: '工作条目',
      project: '项目条目', custom: '自定义条目'
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
</script>
