<template>
  <div class="w-70 bg-white border-l border-[var(--border-color)] overflow-y-auto no-print shrink-0 flex flex-col" style="width: 280px;">
    <!-- Module List -->
    <div class="panel-section">
      <div class="panel-section-title">📋 模块列表</div>
      <div style="display: flex; flex-direction: column; gap: var(--space-1);">
        <div
          v-for="mod in store.modules"
          :key="mod.id"
          class="flex items-center rounded-md cursor-pointer transition-all hover:bg-gray-50"
          style="gap: var(--tight-gap); padding: var(--list-item-padding-y) var(--list-item-padding-x);"
          :class="{ 'bg-[var(--primary-50)]': selectedModuleId === mod.id }"
          @click="selectedModuleId = mod.id"
        >
          <span
            class="eye-toggle shrink-0"
            :class="{ hidden: !mod.visible }"
            @click.stop="store.toggleModuleVisibility(mod.id)"
          >
            <svg v-if="mod.visible" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </span>
          <span class="text-sm flex-1 truncate">{{ mod.title }}</span>
          <span class="text-xs text-[var(--text-muted)]">#{{ mod.order + 1 }}</span>
        </div>
      </div>
    </div>

    <!-- Selected Module Detail -->
    <div v-if="selectedModule" class="panel-section flex-1">
      <div class="panel-section-title">✏️ 编辑: {{ selectedModule.title }}</div>

      <!-- Module Title Edit -->
      <label class="block" style="margin-bottom: var(--normal-gap);">
        <span class="text-xs text-[var(--text-secondary)] block" style="margin-bottom: var(--form-label-gap);">模块标题</span>
        <input
          type="text"
          :value="selectedModule.title"
          @input="store.updateModule(selectedModule.id, { title: ($event.target as HTMLInputElement).value })"
          class="w-full text-sm border border-[var(--border-color)] rounded-md"
          style="padding: var(--space-1_5) var(--space-2);"
        />
      </label>

      <!-- Items Editor -->
      <div v-if="selectedModule.items.length > 0" style="display: flex; flex-direction: column; gap: var(--normal-gap);">
        <div v-for="(item, idx) in selectedModule.items" :key="item.id"
          class="border border-[var(--border-color)] rounded-md relative group/item"
          style="padding: var(--normal-gap);"
          :data-item-id="item.id"
          :data-module-id="selectedModule.id"
          @focusin="store.selectItem(item.id)">
          <div class="flex items-center justify-between" style="margin-bottom: var(--tight-gap);">
            <span class="text-xs font-medium text-[var(--primary-color)]">条目 {{ idx + 1 }}</span>
            <button
              class="text-xs text-[var(--color-error)] hover:opacity-80 opacity-0 group-hover/item:opacity-100 transition-all"
              @click="store.removeItem(selectedModule.id, item.id)"
            >删除</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--tight-gap);">
            <template v-for="(val, key) in item" :key="key">
              <label v-if="key !== 'id' && typeof val === 'string'" class="block">
                <span class="text-xs text-[var(--text-secondary)] block" style="margin-bottom: var(--form-label-gap);">{{ getFieldLabel(selectedModule.type, key) }}</span>
                <textarea
                  v-if="isLongField(key)"
                  :value="val"
                  rows="3"
                  @input="store.updateItem(selectedModule.id, item.id, key, ($event.target as HTMLTextAreaElement).value)"
                  class="w-full text-sm border border-[var(--border-color)] rounded-md resize-y"
                  style="padding: var(--space-1_5) var(--space-2);"
                  :placeholder="getFieldPlaceholder(selectedModule.type, key)"
                ></textarea>
                <input
                  v-else
                  type="text"
                  :value="val"
                  @input="store.updateItem(selectedModule.id, item.id, key, ($event.target as HTMLInputElement).value)"
                  class="w-full text-sm border border-[var(--border-color)] rounded-md"
                  style="padding: var(--space-1_5) var(--space-2);"
                  :placeholder="getFieldPlaceholder(selectedModule.type, key)"
                />
              </label>
            </template>
          </div>
        </div>
      </div>

      <!-- Add Item Button -->
      <button
        v-if="selectedModule.type !== 'personal'"
        class="w-full text-sm border border-dashed border-[var(--border-color)] rounded-md text-[var(--text-secondary)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition-all"
        style="margin-top: var(--normal-gap); padding: var(--tight-gap);"
        @click="store.addItem(selectedModule.id)"
      >
        + 添加{{ getModuleTypeName(selectedModule.type) }}条目
      </button>
    </div>

    <!-- No selection -->
    <div v-else class="panel-section flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
      选择一个模块进行编辑
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useResumeStore } from '../stores/resume'
import type { ModuleType } from '../types'

const store = useResumeStore()
const selectedModuleId = ref(store.modules[0]?.id || '')

const selectedModule = computed(() =>
  store.modules.find(m => m.id === selectedModuleId.value) || null
)

function isLongField(key: string): boolean {
  return ['description', 'summary', 'content'].includes(key)
}

function getFieldLabel(type: ModuleType, key: string): string {
  const labels: Record<string, Record<string, string>> = {
    personal: { name: '姓名', phone: '电话', email: '邮箱', location: '所在地', position: '职位', summary: '个人简介' },
    education: { school: '学校', degree: '学历', major: '专业', dateRange: '时间', description: '描述' },
    experience: { company: '公司', position: '职位', dateRange: '时间', description: '工作内容' },
    project: { name: '项目名', role: '角色', dateRange: '时间', description: '项目描述', link: '链接' },
    skill: { name: '技能名称', level: '熟练度 (入门/熟悉/精通/专家)' },
    custom: { title: '标题', content: '内容' }
  }
  return labels[type]?.[key] || key
}

function getFieldPlaceholder(type: ModuleType, key: string): string {
  const placeholders: Record<string, Record<string, string>> = {
    personal: { name: '张晓明', phone: '138xxxx0000', email: 'example@mail.com', location: '深圳', position: '前端开发工程师', summary: '简要介绍自己...' },
    education: { school: 'XX大学', degree: '本科/硕士/博士', major: '计算机科学与技术', dateRange: '2020 - 2024', description: '主修课程、成绩等...' },
    experience: { company: 'XX公司', position: '前端工程师', dateRange: '2024 - 至今', description: '负责的工作内容和成果...' },
    project: { name: '项目名称', role: '核心开发者', dateRange: '2025', description: '项目简介和技术栈...', link: 'https://...' },
    skill: { name: 'React / Vue / Python...', level: '精通' },
    custom: { title: '模块标题', content: '支持富文本内容...' }
  }
  return placeholders[type]?.[key] || ''
}

function getModuleTypeName(type: ModuleType): string {
  const names: Record<ModuleType, string> = {
    personal: '', education: '教育', experience: '工作',
    project: '项目', skill: '技能', strength: '优势', custom: ''
  }
  return names[type] || ''
}
</script>
