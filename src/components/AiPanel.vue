<template>
  <div class="ai-panel no-print">
    <!-- AI Config Modal -->
    <div v-if="showConfig" class="ai-config-overlay" @click.self="showConfig = false">
      <div class="ai-config-modal">
        <div class="ai-config-header">
          <h3>AI 设置</h3>
          <button class="ai-close-btn" @click="showConfig = false">&times;</button>
        </div>
        <div class="ai-config-body">
          <div class="ai-form-group">
            <label>AI 服务商</label>
            <select v-model="configForm.provider" class="ai-select">
              <option value="openai">OpenAI (GPT)</option>
              <option value="claude">Anthropic (Claude)</option>
              <option value="custom">自定义端点</option>
            </select>
          </div>
          <div class="ai-form-group">
            <label>API Key</label>
            <input
              v-model="configForm.apiKey"
              type="password"
              class="ai-input"
              placeholder="sk-..."
            />
          </div>
          <div class="ai-form-group">
            <label>Base URL</label>
            <input
              v-model="configForm.baseUrl"
              type="text"
              class="ai-input"
              :placeholder="configForm.provider === 'openai' ? 'https://api.openai.com/v1' : configForm.provider === 'claude' ? 'https://api.anthropic.com/v1' : 'https://your-api.com/v1'"
            />
          </div>
          <div class="ai-form-group">
            <label>模型</label>
            <input
              v-model="configForm.model"
              type="text"
              class="ai-input"
              :placeholder="configForm.provider === 'openai' ? 'gpt-4o-mini' : configForm.provider === 'claude' ? 'claude-3-5-sonnet-20241022' : 'model-name'"
            />
          </div>
          <button class="ai-save-btn" @click="saveConfig">保存配置</button>
        </div>
      </div>
    </div>

    <!-- Main Panel -->
    <div class="ai-panel-header">
      <span class="ai-panel-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14h.01"/><path d="M8 14h.01"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>
        AI 助手
      </span>
      <button class="ai-config-btn" @click="openConfig" title="AI 设置">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      </button>
    </div>

    <!-- Feature Tabs -->
    <div class="ai-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="ai-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key as typeof activeTab"
      >{{ tab.label }}</button>
    </div>

    <!-- Tab Content -->
    <div class="ai-tab-content">
      <!-- Generate Tab -->
      <template v-if="activeTab === 'generate'">
        <div class="ai-section">
          <label class="ai-label">目标职位</label>
          <input v-model="genForm.jobTitle" class="ai-input" placeholder="如：高级前端工程师" />
        </div>
        <div class="ai-section">
          <label class="ai-label">公司名称</label>
          <input v-model="genForm.company" class="ai-input" placeholder="如：字节跳动" />
        </div>
        <div class="ai-section">
          <label class="ai-label">职位描述 (JD)</label>
          <textarea v-model="genForm.jdText" class="ai-textarea" rows="5" placeholder="粘贴职位描述，AI 将根据 JD 生成匹配的工作经历描述..." />
        </div>
        <div class="ai-section">
          <label class="ai-label">或：自定义提示词</label>
          <textarea v-model="genForm.customPrompt" class="ai-textarea" rows="3" placeholder="描述你想生成的内容，如：帮我写一段关于微服务架构优化的工作描述..." />
        </div>
        <button
          class="ai-action-btn"
          :disabled="isGenerating || !hasAiConfig"
          @click="handleGenerate"
        >
          <svg v-if="isGenerating" class="ai-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          {{ isGenerating ? '生成中...' : 'AI 生成内容' }}
        </button>
      </template>

      <!-- Polish Tab -->
      <template v-if="activeTab === 'polish'">
        <div class="ai-section">
          <label class="ai-label">选择要润色的模块</label>
          <select v-model="polishModuleId" class="ai-select">
            <option value="">请选择模块</option>
            <option v-for="mod in editableModules" :key="mod.id" :value="mod.id">{{ mod.title }}</option>
          </select>
        </div>
        <div v-if="polishModuleId" class="ai-section">
          <label class="ai-label">选择条目</label>
          <select v-model="polishItemId" class="ai-select">
            <option value="">请选择条目</option>
            <option v-for="(item, idx) in polishItems" :key="item.id" :value="item.id">
              条目 {{ idx + 1 }}: {{ getItemPreview(item) }}
            </option>
          </select>
        </div>
        <div class="ai-section">
          <label class="ai-label">润色要求（可选）</label>
          <input v-model="polishInstruction" class="ai-input" placeholder="如：更突出量化成果、更简洁..." />
        </div>
        <button
          class="ai-action-btn"
          :disabled="isPolishing || !hasAiConfig || !polishItemId"
          @click="handlePolish"
        >
          <svg v-if="isPolishing" class="ai-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          {{ isPolishing ? '润色中...' : 'AI 润色' }}
        </button>
      </template>

      <!-- AI Score Tab -->
      <template v-if="activeTab === 'ai-score'">
        <div class="ai-section">
          <label class="ai-label">目标职位（可选，用于关键词匹配）</label>
          <input v-model="aiScoreJob" class="ai-input" placeholder="如：后端开发工程师" />
        </div>
        <button
          class="ai-action-btn"
          :disabled="isAiScoring || !hasAiConfig"
          @click="handleAiScore"
        >
          <svg v-if="isAiScoring" class="ai-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          {{ isAiScoring ? '分析中...' : 'AI 深度评分' }}
        </button>
      </template>

      <!-- Result Display -->
      <div v-if="resultText" class="ai-result">
        <div class="ai-result-header">
          <span>AI 结果</span>
          <div class="ai-result-actions">
            <button class="ai-result-btn" @click="applyResult" title="应用到当前选中">应用</button>
            <button class="ai-result-btn" @click="copyResult" title="复制">复制</button>
          </div>
        </div>
        <div class="ai-result-content" v-html="renderResult(resultText)" />
      </div>

      <!-- AI Score Result -->
      <div v-if="aiScoreResult" class="ai-score-result">
        <div class="ai-score-header">
          <span>AI 评分结果</span>
          <span class="ai-score-total" :style="{ color: aiScoreColor }">{{ aiScoreResult.score }}分</span>
        </div>
        <p class="ai-score-feedback">{{ aiScoreResult.feedback }}</p>
        <div v-if="aiScoreResult.suggestions?.length" class="ai-score-section">
          <strong>改进建议：</strong>
          <ul>
            <li v-for="(s, i) in aiScoreResult.suggestions" :key="i">{{ s }}</li>
          </ul>
        </div>
        <div v-if="aiScoreResult.strengths?.length" class="ai-score-section">
          <strong>亮点：</strong>
          <ul>
            <li v-for="(s, i) in aiScoreResult.strengths" :key="i" class="ai-strength-item">{{ s }}</li>
          </ul>
        </div>
        <div v-if="aiScoreResult.weaknesses?.length" class="ai-score-section">
          <strong>不足：</strong>
          <ul>
            <li v-for="(s, i) in aiScoreResult.weaknesses" :key="i" class="ai-weakness-item">{{ s }}</li>
          </ul>
        </div>
      </div>

      <!-- No Config Hint -->
      <div v-if="!hasAiConfig && activeTab !== 'polish'" class="ai-hint">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>请先点击右上角 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> 配置 AI API Key</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useResumeStore } from '../stores/resume'
import {
  loadAiConfig, saveAiConfig, getDefaultAiConfig,
  aiGenerateContent, aiPolishContent, aiGenerateFromJD, aiScoreResume,
  type AiConfig,
} from '../utils/ai'

const store = useResumeStore()

// ---- State ----
const showConfig = ref(false)
const activeTab = ref<'generate' | 'polish' | 'ai-score'>('generate')
const isGenerating = ref(false)
const isPolishing = ref(false)
const isAiScoring = ref(false)
const resultText = ref('')
const aiScoreResult = ref<{ score: number; feedback: string; suggestions?: string[]; strengths?: string[]; weaknesses?: string[] } | null>(null)
const abortController = ref<AbortController | null>(null)

const tabs = [
  { key: 'generate', label: '生成' },
  { key: 'polish', label: '润色' },
  { key: 'ai-score', label: 'AI评分' },
]

// ---- AI Config ----
const aiConfig = ref<AiConfig | null>(loadAiConfig())
const hasAiConfig = computed(() => !!aiConfig.value?.apiKey)

const configForm = reactive<AiConfig>(
  aiConfig.value || getDefaultAiConfig('openai'),
)

function openConfig() {
  if (aiConfig.value) {
    Object.assign(configForm, aiConfig.value)
  }
  showConfig.value = true
}

function saveConfig() {
  aiConfig.value = { ...configForm }
  saveAiConfig(configForm)
  showConfig.value = false
}

// ---- Generate ----
const genForm = reactive({
  jobTitle: '',
  company: '',
  jdText: '',
  customPrompt: '',
})

async function handleGenerate() {
  if (!aiConfig.value) return
  isGenerating.value = true
  resultText.value = ''
  abortController.value = new AbortController()

  try {
    if (genForm.jdText && genForm.jobTitle) {
      // Generate from JD
      resultText.value = await aiGenerateFromJD(
        aiConfig.value,
        genForm.jobTitle,
        genForm.company,
        genForm.jdText,
      )
    } else {
      // General generation
      const prompt = genForm.customPrompt || `请为以下职位生成工作经历描述：${genForm.jobTitle} ${genForm.company ? 'at ' + genForm.company : ''}`
      const context = store.modules.map(m => `${m.title}: ${m.items.map(i => Object.values(i).filter(v => typeof v === 'string').join(' ')).join('; ')}`).join('\n')
      resultText.value = await aiGenerateContent(aiConfig.value, prompt, context)
    }
  } catch (err: unknown) {
    resultText.value = `错误：${err instanceof Error ? err.message : String(err)}`
  } finally {
    isGenerating.value = false
  }
}

// ---- Polish ----
const polishModuleId = ref('')
const polishItemId = ref('')
const polishInstruction = ref('')

const editableModules = computed(() =>
  store.modules.filter(m => m.visible && m.type !== 'personal'),
)

const polishItems = computed(() => {
  const mod = store.modules.find(m => m.id === polishModuleId.value)
  return mod?.items || []
})

function getItemPreview(item: Record<string, unknown>): string {
  const text = (item.description || item.content || item.name || item.title || '') as string
  return text.slice(0, 30) + (text.length > 30 ? '...' : '')
}

async function handlePolish() {
  if (!aiConfig.value || !polishItemId.value) return
  isPolishing.value = true
  resultText.value = ''
  abortController.value = new AbortController()

  try {
    const mod = store.modules.find(m => m.id === polishModuleId.value)
    const item = mod?.items.find(i => i.id === polishItemId.value)
    if (!item) throw new Error('未找到选中的条目')

    const content = (item.description || item.content || '') as string
    if (!content) throw new Error('该条目没有可润色的内容')

    resultText.value = await aiPolishContent(
      aiConfig.value,
      content,
      polishInstruction.value || undefined,
    )
  } catch (err: unknown) {
    resultText.value = `错误：${err instanceof Error ? err.message : String(err)}`
  } finally {
    isPolishing.value = false
  }
}

// ---- AI Score ----
const aiScoreJob = ref('')
const aiScoreColor = computed(() => {
  if (!aiScoreResult.value) return '#6b7280'
  const s = aiScoreResult.value.score
  if (s >= 80) return '#10b981'
  if (s >= 60) return '#3b82f6'
  if (s >= 40) return '#f59e0b'
  return '#ef4444'
})

async function handleAiScore() {
  if (!aiConfig.value) return
  isAiScoring.value = true
  aiScoreResult.value = null
  abortController.value = new AbortController()

  try {
    const resumeText = store.modules
      .filter(m => m.visible)
      .map(m => {
        const items = m.items.map(i =>
          Object.entries(i)
            .filter(([k, v]) => k !== 'id' && k !== 'personalFields' && typeof v === 'string')
            .map(([, v]) => v)
            .join(' '),
        ).join('\n')
        return `【${m.title}】\n${items}`
      })
      .join('\n\n')

    aiScoreResult.value = await aiScoreResume(
      aiConfig.value,
      resumeText,
      aiScoreJob.value || undefined,
    )
  } catch (err: unknown) {
    aiScoreResult.value = {
      score: 0,
      feedback: `错误：${err instanceof Error ? err.message : String(err)}`,
    }
  } finally {
    isAiScoring.value = false
  }
}

// ---- Result Actions ----
function applyResult() {
  if (!resultText.value) return

  // Apply to the selected module/item
  if (polishItemId.value && polishModuleId.value) {
    const mod = store.modules.find(m => m.id === polishModuleId.value)
    const item = mod?.items.find(i => i.id === polishItemId.value)
    if (item) {
      if (item.description !== undefined) {
        store.updateItem(polishModuleId.value, polishItemId.value, 'description', resultText.value)
      } else if (item.content !== undefined) {
        store.updateItem(polishModuleId.value, polishItemId.value, 'content', resultText.value)
      }
    }
  }
}

function copyResult() {
  if (resultText.value) {
    navigator.clipboard.writeText(resultText.value)
  }
}

function renderResult(text: string): string {
  return text
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}
</script>
