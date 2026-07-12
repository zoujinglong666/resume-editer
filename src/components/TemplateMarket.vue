<template>
  <div class="tpl-market no-print">
    <div class="tpl-market-header">
      <span class="tpl-market-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        模板市场
      </span>
    </div>

    <!-- Category Filter -->
    <div class="tpl-categories">
      <Button
        v-for="cat in categories"
        :key="cat.key"
        class="tpl-cat-btn"
        :class="{ active: activeCategory === cat.key }"
        @click="activeCategory = cat.key"
      >{{ cat.label }}</Button>
    </div>

    <!-- Template Grid -->
    <div class="tpl-grid">
      <div
        v-for="tpl in filteredTemplates"
        :key="tpl.id"
        class="tpl-card"
        @click="previewTemplate(tpl)"
      >
        <div class="tpl-card-preview" :style="{ background: tpl.previewColor }">
          <div class="tpl-card-icon">{{ tpl.icon }}</div>
        </div>
        <div class="tpl-card-info">
          <div class="tpl-card-name">{{ tpl.name }}</div>
          <div class="tpl-card-desc">{{ tpl.description }}</div>
          <div class="tpl-card-tags">
            <span v-for="tag in tpl.tags" :key="tag" class="tpl-tag">{{ tag }}</span>
          </div>
        </div>
        <Button class="tpl-card-btn" @click.stop="loadBuiltInTemplate(tpl)">使用</Button>
      </div>
    </div>

    <!-- User Templates -->
    <div class="tpl-section">
      <div class="tpl-section-header">
        <span>我的模板</span>
        <Button class="tpl-save-btn" @click="showSaveDialog = true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          保存为模板
        </Button>
      </div>

      <div v-if="store.templates.length === 0" class="tpl-empty">
        <p>暂无自定义模板</p>
        <p class="tpl-empty-hint">编辑好简历后，点击「保存为模板」创建</p>
      </div>

      <div v-else class="tpl-user-list">
        <div
          v-for="tpl in store.templates"
          :key="tpl.id"
          class="tpl-user-item"
        >
          <div class="tpl-user-info">
            <span class="tpl-user-name">{{ tpl.name }}</span>
            <span class="tpl-user-time">{{ formatTime(tpl.updatedAt) }}</span>
          </div>
          <div class="tpl-user-actions">
            <Button class="tpl-action-btn" @click="store.loadTemplate(tpl.id)">加载</Button>
            <Button class="tpl-action-btn tpl-action-del" @click="store.deleteTemplate(tpl.id)">删除</Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Dialog -->
    <div v-if="showSaveDialog" class="tpl-dialog-overlay" @click.self="showSaveDialog = false">
      <div class="tpl-dialog">
        <h3>保存为模板</h3>
        <input
          v-model="newTemplateName"
          class="ai-input"
          placeholder="输入模板名称"
          @keyup.enter="handleSaveTemplate"
        />
        <div class="tpl-dialog-actions">
          <Button class="tpl-dialog-cancel" @click="showSaveDialog = false">取消</Button>
          <Button class="tpl-dialog-confirm" @click="handleSaveTemplate">保存</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from './ui/Button.vue'
import { ref, computed } from 'vue'
import { useResumeStore } from '../stores/resume'
import { showToast } from '../utils/toast'

const store = useResumeStore()

const activeCategory = ref('all')
const showSaveDialog = ref(false)
const newTemplateName = ref('')

interface BuiltInTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: string
  tags: string[]
  previewColor: string
  file: string
}

const categories = [
  { key: 'all', label: '全部' },
  { key: 'tech', label: '技术' },
  { key: 'product', label: '产品' },
  { key: 'design', label: '设计' },
  { key: 'business', label: '商业' },
  { key: 'student', label: '应届' },
]

const builtInTemplates: BuiltInTemplate[] = [
  {
    id: 'ai-agent-engineer',
    name: 'AI Agent 工程师',
    description: '适合 AI/大模型应用开发方向，突出 Agent、RAG 等前沿技术',
    icon: '🤖',
    category: 'tech',
    tags: ['AI', 'Agent', '后端'],
    previewColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    file: 'ai-agent-engineer.json',
  },
  {
    id: 'frontend-engineer',
    name: '高级前端工程师',
    description: '适合前端方向，突出 React/Vue 生态、性能优化、工程化',
    icon: '⚛️',
    category: 'tech',
    tags: ['前端', 'React', 'Vue'],
    previewColor: 'linear-gradient(135deg, #4B48A0 0%, #6366F1 100%)',
    file: 'frontend-engineer.json',
  },
  {
    id: 'product-manager',
    name: '高级产品经理',
    description: '适合 B2B SaaS 产品经理，突出数据驱动和跨部门协作',
    icon: '📋',
    category: 'product',
    tags: ['产品', 'SaaS', 'B2B'],
    previewColor: 'linear-gradient(135deg, #9B3A4A 0%, #C25A6A 100%)',
    file: 'product-manager.json',
  },
  {
    id: 'designer',
    name: '高级 UI/UX 设计师',
    description: '适合移动端/Web 端设计师，突出设计系统和用户体验',
    icon: '🎨',
    category: 'design',
    tags: ['设计', 'UI', 'UX'],
    previewColor: 'linear-gradient(135deg, #B03A5A 0%, #E11D48 100%)',
    file: 'designer.json',
  },
  {
    id: 'data-analyst',
    name: '数据分析师',
    description: '适合电商/金融数据分析方向，突出数据驱动业务增长',
    icon: '📊',
    category: 'business',
    tags: ['数据分析', 'Python', 'SQL'],
    previewColor: 'linear-gradient(135deg, #2A5090 0%, #3B82F6 100%)',
    file: 'data-analyst.json',
  },
  {
    id: 'fresh-graduate',
    name: '2026届应届生',
    description: '适合应届毕业生，突出实习经历、竞赛获奖和项目经验',
    icon: '🎓',
    category: 'student',
    tags: ['应届', '实习', '竞赛'],
    previewColor: 'linear-gradient(135deg, #2D7D72 0%, #14B8A6 100%)',
    file: 'fresh-graduate.json',
  },
]

const filteredTemplates = computed(() => {
  if (activeCategory.value === 'all') return builtInTemplates
  return builtInTemplates.filter(t => t.category === activeCategory.value)
})

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  } catch {
    return ''
  }
}

async function loadBuiltInTemplate(tpl: BuiltInTemplate) {
  try {
    const res = await fetch(`/templates/${tpl.file}`)
    if (!res.ok) throw new Error('加载失败')
    const data = await res.json()
    store.importData(data)
  } catch {
    showToast({ type: 'error', title: '模板加载失败', description: '请检查网络连接' })
  }
}

function previewTemplate(tpl: BuiltInTemplate) {
  // For now, just load directly
  loadBuiltInTemplate(tpl)
}

function handleSaveTemplate() {
  if (!newTemplateName.value.trim()) return
  store.saveAsTemplate(newTemplateName.value)
  newTemplateName.value = ''
  showSaveDialog.value = false
}
</script>
