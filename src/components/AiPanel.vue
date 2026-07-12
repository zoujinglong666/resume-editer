<template>
  <div class="ai-panel no-print">
    <!-- AI Config Modal -->
    <div v-if="showConfig" class="ai-config-overlay" @click.self="showConfig = false">
      <div class="ai-config-modal">
        <div class="ai-config-header">
          <h3>AI 设置</h3>
          <Button class="ai-close-btn" @click="showConfig = false">&times;</Button>
        </div>
        <div class="ai-config-body">
          <div class="ai-form-group">
            <label>AI 服务商</label>
            <select v-model="configForm.provider" class="ai-select">
              <option value="deepseek">DeepSeek（推荐）</option>
              <option value="openai">OpenAI (GPT)</option>
              <option value="claude">Anthropic (Claude)</option>
              <option value="custom">自定义端点</option>
            </select>
          </div>
          <div class="ai-form-group">
            <label>API Key</label>
            <div class="ai-input-wrap">
              <input
                v-model="configForm.apiKey"
                :type="showKey ? 'text' : 'password'"
                class="ai-input"
                placeholder="sk-..."
              />
              <Button
                type="button"
                class="ai-key-toggle"
                :tip="showKey ? '隐藏 Key' : '显示 Key'"
                @click="showKey = !showKey"
              >
                <svg v-if="!showKey" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.5 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </Button>
            </div>
          </div>
          <div class="ai-form-group">
            <label>Base URL</label>
            <input
              v-model="configForm.baseUrl"
              type="text"
              class="ai-input"
              :placeholder="configForm.provider === 'openai' ? 'https://api.openai.com/v1' : configForm.provider === 'claude' ? 'https://api.anthropic.com/v1' : configForm.provider === 'deepseek' ? 'https://api.deepseek.com' : 'https://your-api.com/v1'"
            />
          </div>
          <div class="ai-form-group">
            <label>模型</label>
            <select
              v-if="configForm.provider === 'deepseek'"
              v-model="deepseekModelSelect"
              class="ai-input"
            >
              <option value="deepseek-v4-flash">deepseek-v4-flash（快速）</option>
              <option value="deepseek-v4-pro">deepseek-v4-pro（更强）</option>
              <option value="__custom__">自定义…</option>
            </select>
            <input
              v-else
              v-model="configForm.model"
              type="text"
              class="ai-input"
              :placeholder="configForm.provider === 'openai' ? 'gpt-4o-mini' : configForm.provider === 'claude' ? 'claude-3-5-sonnet-20241022' : 'model-name'"
            />
          </div>
          <div
            v-if="configForm.provider === 'deepseek' && deepseekModelSelect === '__custom__'"
            class="ai-form-group"
          >
            <label>自定义模型名</label>
            <input
              v-model="configForm.model"
              type="text"
              class="ai-input"
              placeholder="如 deepseek-chat"
            />
          </div>
          <Button class="ai-save-btn" @click="saveConfig">保存配置</Button>
        </div>
      </div>
    </div>

    <!-- Main Panel -->
    <div class="ai-panel-header">
      <span class="ai-panel-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14h.01"/><path d="M8 14h.01"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>
        AI 助手
      </span>
      <Button v-if="isBusy" class="ai-stop-btn" @click="stopAll" tip="停止生成">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        停止
      </Button>
      <Button class="ai-config-btn" @click="openConfig" tip="AI 设置">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      </Button>
    </div>

    <!-- Feature Tabs -->
    <TabsRoot v-model="activeTab" class="ai-tabs">
      <TabsList class="ai-tabs-list">
        <TabsTrigger
          v-for="tab in tabs"
          :key="tab.key"
          :value="tab.key"
          class="ai-tab"
        >{{ tab.label }}</TabsTrigger>
      </TabsList>
    </TabsRoot>

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
        <Button
          class="ai-action-btn"
          :disabled="isGenerating || !hasAiConfig"
          @click="handleGenerate"
        >
          <svg v-if="isGenerating" class="ai-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          {{ isGenerating ? '生成中...' : 'AI 生成内容' }}
        </Button>
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
        <Button
          class="ai-action-btn"
          :disabled="isPolishing || !hasAiConfig || !polishItemId"
          @click="handlePolish"
        >
          <svg v-if="isPolishing" class="ai-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          {{ isPolishing ? '润色中...' : 'AI 润色' }}
        </Button>
      </template>

      <!-- AI Score Tab -->
      <template v-if="activeTab === 'ai-score'">
        <div class="ai-section">
          <label class="ai-label">目标职位（可选，用于关键词匹配）</label>
          <input v-model="aiScoreJob" class="ai-input" placeholder="如：后端开发工程师" />
        </div>
        <Button
          class="ai-action-btn"
          :disabled="isAiScoring || !hasAiConfig"
          @click="handleAiScore"
        >
          <svg v-if="isAiScoring" class="ai-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          {{ isAiScoring ? '分析中...' : 'AI 深度评分' }}
        </Button>
      </template>

      <!-- Summary Tab -->
      <template v-if="activeTab === 'summary'">
        <div class="ai-section">
          <label class="ai-label">目标职位（可选）</label>
          <input v-model="summaryJob" class="ai-input" placeholder="如：高级前端工程师" />
        </div>
        <Button
          class="ai-action-btn"
          :disabled="isSummarizing || !hasAiConfig"
          @click="handleSummary"
        >
          <svg v-if="isSummarizing" class="ai-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          {{ isSummarizing ? '生成中...' : 'AI 生成摘要 / 亮点' }}
        </Button>
      </template>

      <!-- JD Match Tab -->
      <template v-if="activeTab === 'jd'">
        <div class="ai-section">
          <label class="ai-label">目标职位（可选）</label>
          <input v-model="jdJob" class="ai-input" placeholder="如：后端开发工程师" />
        </div>
        <div class="ai-section">
          <label class="ai-label">职位描述 (JD)</label>
          <textarea v-model="jdText" class="ai-textarea" rows="6" placeholder="粘贴职位描述，AI 将分析匹配度、缺失关键词与针对性建议..." />
        </div>
        <Button
          class="ai-action-btn"
          :disabled="isAnalyzingJd || !hasAiConfig"
          @click="handleJdMatch"
        >
          <svg v-if="isAnalyzingJd" class="ai-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          {{ isAnalyzingJd ? '分析中...' : '分析 JD 匹配度' }}
        </Button>
      </template>

      <!-- Optimize Tab -->
      <template v-if="activeTab === 'optimize'">
        <div class="ai-section">
          <label class="ai-label">目标职位（可选，用于针对性优化）</label>
          <input v-model="optJob" class="ai-input" placeholder="如：AI 应用工程师" />
        </div>
        <p class="ai-hint-text">AI 将通读整份简历，逐模块重写 / 润色所有描述，并给出改进行动清单。</p>
        <Button
          class="ai-action-btn"
          :disabled="isOptimizing || !hasAiConfig"
          @click="handleOptimize"
        >
          <svg v-if="isOptimizing" class="ai-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          {{ isOptimizing ? '优化中...' : '一键优化整份简历' }}
        </Button>
      </template>

      <!-- Result Display -->
      <div v-if="resultText" class="ai-result">
        <div class="ai-result-header">
          <span>AI 结果</span>
          <div class="ai-result-actions">
            <Button class="ai-result-btn" @click="applyResult" :disabled="isGenerating" tip="应用到当前选中">应用</Button>
            <Button class="ai-result-btn" @click="copyResult" :disabled="isGenerating" tip="复制">复制</Button>
          </div>
        </div>
        <div class="ai-result-content" v-html="renderResult(resultText)" />
        <span v-if="isGenerating" class="ai-type-cursor" />
      </div>

      <!-- Error + Retry -->
      <div v-if="errorState" class="ai-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span class="ai-error-msg">{{ errorState.msg }}</span>
        <Button class="ai-error-retry" @click="retry">重试</Button>
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

      <!-- Summary Result -->
      <div v-if="summaryResult" class="ai-result">
        <div class="ai-result-header">
          <span>AI 摘要 / 亮点</span>
          <div class="ai-result-actions">
            <Button class="ai-result-btn" @click="applySummary" tip="应用到个人简介">应用</Button>
            <Button class="ai-result-btn" @click="copyText(summaryResult.summary)" tip="复制">复制</Button>
          </div>
        </div>
        <div class="ai-result-content">
          <div class="ai-score-section"><strong>个人简介</strong><p>{{ summaryResult.summary }}</p></div>
          <div class="ai-score-section"><strong>一句话亮点</strong><p class="ai-highlight">{{ summaryResult.highlight }}</p></div>
        </div>
      </div>

      <!-- JD Match Result -->
      <div v-if="jdResult" class="ai-score-result">
        <div class="ai-score-header">
          <span>JD 匹配度</span>
          <span class="ai-score-total" :style="{ color: jdScoreColor }">{{ jdResult.score }}分</span>
        </div>
        <div v-if="jdResult.matched?.length" class="ai-score-section">
          <strong>已匹配：</strong>
          <ul><li v-for="(s, i) in jdResult.matched" :key="i" class="ai-strength-item">{{ s }}</li></ul>
        </div>
        <div v-if="jdResult.missing?.length" class="ai-score-section">
          <strong>缺失 / 偏弱：</strong>
          <ul><li v-for="(s, i) in jdResult.missing" :key="i" class="ai-weakness-item">{{ s }}</li></ul>
        </div>
        <div v-if="jdResult.suggestions?.length" class="ai-score-section">
          <strong>改进建议：</strong>
          <ul><li v-for="(s, i) in jdResult.suggestions" :key="i">{{ s }}</li></ul>
        </div>
      </div>

      <!-- Optimize Result -->
      <div v-if="optimizeResult" class="ai-result">
        <div class="ai-result-header">
          <span>优化结果</span>
          <div class="ai-result-actions">
            <Button class="ai-result-btn" @click="applyOptimize" tip="应用到全部模块">应用全部</Button>
          </div>
        </div>
        <div class="ai-result-content">
          <div v-for="mod in optimizeResult.modules" :key="mod.id" class="ai-opt-module">
            <strong>{{ moduleTitle(mod.id) }}</strong>
            <p v-for="(it, i) in mod.items" :key="i">{{ it }}</p>
          </div>
          <div v-if="optimizeResult.actionPlan?.length" class="ai-score-section">
            <strong>改进行动清单：</strong>
            <ul><li v-for="(s, i) in optimizeResult.actionPlan" :key="i">{{ s }}</li></ul>
          </div>
        </div>
      </div>

      <!-- No Config Hint -->
      <div v-if="!hasAiConfig" class="ai-hint">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>请先点击右上角 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> 配置 AI API Key</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from './ui/Button.vue'
import { TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { ref, computed, reactive } from 'vue'
import { useResumeStore } from '../stores/resume'
import {
  loadAiConfig, saveAiConfig, getDefaultAiConfig,
  aiGenerateContent, aiPolishContent, aiGenerateFromJD, aiScoreResume,
  aiSummarizeResume, aiAnalyzeJDMatch, aiOptimizeResume, buildResumeText,
  type AiConfig,
} from '../utils/ai'
import { showToast } from '../utils/toast'

const store = useResumeStore()

// ---- State ----
const showConfig = ref(false)
const activeTab = ref<'generate' | 'polish' | 'ai-score' | 'summary' | 'jd' | 'optimize'>('generate')
const isGenerating = ref(false)
const isPolishing = ref(false)
const isAiScoring = ref(false)
const resultText = ref('')
const aiScoreResult = ref<{ score: number; feedback: string; suggestions?: string[]; strengths?: string[]; weaknesses?: string[] } | null>(null)
const abortController = ref<AbortController | null>(null)
const showKey = ref(false)
const errorState = ref<{ msg: string; cancelled?: boolean } | null>(null)
const retryFn = ref<(() => void) | null>(null)
const isBusy = computed(() =>
  isGenerating.value || isPolishing.value || isAiScoring.value ||
  isSummarizing.value || isAnalyzingJd.value || isOptimizing.value,
)

function stopAll() {
  abortController.value?.abort()
}

function handleErr(err: unknown) {
  if (err instanceof DOMException && err.name === 'AbortError') {
    errorState.value = { msg: '已取消生成', cancelled: true }
  } else {
    errorState.value = { msg: `错误：${err instanceof Error ? err.message : String(err)}` }
  }
}

function retry() {
  errorState.value = null
  retryFn.value?.()
}

const tabs = [
  { key: 'generate', label: '生成' },
  { key: 'polish', label: '润色' },
  { key: 'optimize', label: '优化' },
  { key: 'jd', label: 'JD匹配' },
  { key: 'summary', label: '摘要' },
  { key: 'ai-score', label: 'AI评分' },
]

// ---- AI Config ----
const aiConfig = ref<AiConfig | null>(loadAiConfig())
const hasAiConfig = computed(() => !!aiConfig.value?.apiKey)

const configForm = reactive<AiConfig>(
  aiConfig.value || getDefaultAiConfig('deepseek'),
)

// DeepSeek 模型下拉（flash / pro / 自定义）
const KNOWN_DEEPSEEK_MODELS = ['deepseek-v4-flash', 'deepseek-v4-pro']
const deepseekModelSelect = computed<string>({
  get() {
    return KNOWN_DEEPSEEK_MODELS.includes(configForm.model)
      ? configForm.model
      : '__custom__'
  },
  set(v: string) {
    if (v === '__custom__') {
      if (KNOWN_DEEPSEEK_MODELS.includes(configForm.model)) configForm.model = ''
    } else {
      configForm.model = v
    }
  },
})

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
  retryFn.value = handleGenerate
  errorState.value = null
  isGenerating.value = true
  resultText.value = ''
  abortController.value = new AbortController()
  const signal = abortController.value.signal

  try {
    if (genForm.jdText && genForm.jobTitle) {
      // Generate from JD
      resultText.value = await aiGenerateFromJD(
        aiConfig.value,
        genForm.jobTitle,
        genForm.company,
        genForm.jdText,
        signal,
        (d) => { resultText.value += d },
      )
    } else {
      // General generation
      const prompt = genForm.customPrompt || `请为以下职位生成工作经历描述：${genForm.jobTitle} ${genForm.company ? 'at ' + genForm.company : ''}`
      const context = store.modules.map(m => `${m.title}: ${m.items.map(i => Object.values(i).filter(v => typeof v === 'string').join(' ')).join('; ')}`).join('\n')
      resultText.value = await aiGenerateContent(
        aiConfig.value,
        prompt,
        context,
        signal,
        (d) => { resultText.value += d },
      )
    }
    errorState.value = null
  } catch (err: unknown) {
    handleErr(err)
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
  retryFn.value = handlePolish
  errorState.value = null
  isPolishing.value = true
  resultText.value = ''
  abortController.value = new AbortController()
  const signal = abortController.value.signal

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
      signal,
      (d) => { resultText.value += d },
    )
    errorState.value = null
  } catch (err: unknown) {
    handleErr(err)
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
  retryFn.value = handleAiScore
  errorState.value = null
  isAiScoring.value = true
  aiScoreResult.value = null
  abortController.value = new AbortController()
  const signal = abortController.value.signal

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
      signal,
    )
    errorState.value = null
  } catch (err: unknown) {
    handleErr(err)
  } finally {
    isAiScoring.value = false
  }
}

// ---- Summary (摘要 / 个人亮点) ----
const summaryJob = ref('')
const isSummarizing = ref(false)
const summaryResult = ref<{ summary: string; highlight: string } | null>(null)

async function handleSummary() {
  if (!aiConfig.value) return
  retryFn.value = handleSummary
  errorState.value = null
  isSummarizing.value = true
  summaryResult.value = null
  abortController.value = new AbortController()
  const signal = abortController.value.signal
  try {
    summaryResult.value = await aiSummarizeResume(
      aiConfig.value,
      buildResumeText(store.modules, false),
      summaryJob.value || undefined,
      signal,
    )
    errorState.value = null
  } catch (err: unknown) {
    handleErr(err)
  } finally {
    isSummarizing.value = false
  }
}

function applySummary() {
  if (!summaryResult.value?.summary) return
  const personal = store.modules.find(m => m.type === 'personal')
  const item = personal?.items[0]
  if (personal && item) {
    store.updateItem(personal.id, item.id, 'summary', summaryResult.value.summary)
    showToast({ type: 'success', title: '已应用', description: '个人简介已更新' })
  }
}

function copyText(t: string) {
  if (t) navigator.clipboard.writeText(t)
}

// ---- JD Match (JD 匹配度分析) ----
const jdJob = ref('')
const jdText = ref('')
const isAnalyzingJd = ref(false)
const jdResult = ref<{ score: number; matched: string[]; missing: string[]; suggestions: string[] } | null>(null)

const jdScoreColor = computed(() => {
  if (!jdResult.value) return '#6b7280'
  const s = jdResult.value.score
  if (s >= 80) return '#10b981'
  if (s >= 60) return '#3b82f6'
  if (s >= 40) return '#f59e0b'
  return '#ef4444'
})

async function handleJdMatch() {
  if (!aiConfig.value) return
  if (!jdText.value.trim()) {
    showToast({ type: 'warning', title: '请先粘贴职位描述' })
    return
  }
  retryFn.value = handleJdMatch
  errorState.value = null
  isAnalyzingJd.value = true
  jdResult.value = null
  abortController.value = new AbortController()
  const signal = abortController.value.signal
  try {
    jdResult.value = await aiAnalyzeJDMatch(
      aiConfig.value,
      buildResumeText(store.modules, false),
      jdText.value,
      jdJob.value || undefined,
      signal,
    )
    errorState.value = null
  } catch (err: unknown) {
    handleErr(err)
  } finally {
    isAnalyzingJd.value = false
  }
}

// ---- Optimize (一键优化整份简历) ----
const optJob = ref('')
const isOptimizing = ref(false)
const optimizeResult = ref<{ modules: { id: string; items: string[] }[]; actionPlan: string[] } | null>(null)

async function handleOptimize() {
  if (!aiConfig.value) return
  retryFn.value = handleOptimize
  errorState.value = null
  isOptimizing.value = true
  optimizeResult.value = null
  abortController.value = new AbortController()
  const signal = abortController.value.signal
  try {
    const optimizable = store.modules.filter(m => m.visible && m.type !== 'personal')
    optimizeResult.value = await aiOptimizeResume(
      aiConfig.value,
      buildResumeText(optimizable, true),
      optJob.value || undefined,
      signal,
    )
    errorState.value = null
  } catch (err: unknown) {
    handleErr(err)
  } finally {
    isOptimizing.value = false
  }
}

function itemTextField(type: string): string {
  if (type === 'experience' || type === 'project' || type === 'education') return 'description'
  return 'content'
}

function moduleTitle(id: string): string {
  return store.modules.find(m => m.id === id)?.title || id
}

function applyOptimize() {
  if (!optimizeResult.value) return
  let applied = 0
  for (const rm of optimizeResult.value.modules) {
    const mod = store.modules.find(m => m.id === rm.id)
    if (!mod) continue
    const field = itemTextField(mod.type)
    rm.items.forEach((text, idx) => {
      const item = mod.items[idx]
      if (item && text.trim()) {
        store.updateItem(mod.id, item.id, field, text.trim())
        applied++
      }
    })
  }
  if (applied) {
    showToast({ type: 'success', title: '已应用优化', description: `更新了 ${applied} 条内容` })
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
