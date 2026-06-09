import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ResumeData, ResumeModule, ResumeConfig, AvatarConfig, ThemePreset, ModuleItem, ModuleType } from '../types'

// ===== Helper: generate UUID =====
function uuid(): string {
  return 'xxxx-xxxx-4xxx'.replace(/[x]/g, () => Math.floor(Math.random() * 16).toString(16))
}

// ===== Helper: hex color manipulation =====
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}
function adjustColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const factor = 1 + amount
  return rgbToHex(
    rgb.r * factor + (amount > 0 ? 255 : 0) * Math.abs(amount) * (amount > 0 ? 1 : 0.3),
    rgb.g * factor + (amount > 0 ? 255 : 0) * Math.abs(amount) * (amount > 0 ? 1 : 0.3),
    rgb.b * factor + (amount > 0 ? 255 : 0) * Math.abs(amount) * (amount > 0 ? 1 : 0.3),
  )
}
function generateColorScale(baseColor: string): Record<string, string> {
  return {
    50: adjustColor(baseColor, 0.92),
    100: adjustColor(baseColor, 0.78),
    200: adjustColor(baseColor, 0.55),
    300: adjustColor(baseColor, 0.35),
    400: adjustColor(baseColor, 0.15),
    500: baseColor,
    600: adjustColor(baseColor, -0.18),
    700: adjustColor(baseColor, -0.32),
  }
}

// ===== Default Module Items (AI Agent Engineer Template) =====
function createDefaultModules(): ResumeModule[] {
  return [
    {
      id: `mod_personal_001`, type: 'personal', title: '个人信息',
      visible: true, order: 0,
      items: [{ id: `item_p_001`, name: '林逸辰', phone: '138-0000-8888', email: 'yichen.lin@example.com', location: '北京市海淀区', position: 'AI Agent 工程师 / 高级算法工程师', summary: '5 年 AI 工程经验，专注大模型应用与智能体（Agent）系统研发。主导过多个从 0 到 1 的 Agent 产品落地，擅长 RAG、Function Calling、多 Agent 协作、Tool Use 等核心技术栈。对 LLM 的工程化落地有深入理解，追求「让 AI 真正可用」的产品体验。' }]
    },
    {
      id: `mod_edu_001`, type: 'education', title: '教育经历',
      visible: true, order: 1,
      items: [
        { id: `item_e_001`, school: '浙江大学', degree: '硕士', major: '计算机科学与技术 · 人工智能方向', dateRange: '2019.09 - 2022.06', description: '• GPA：3.8/4.0，研究方向：知识图谱与大语言模型的结合\n• 发表 CCF-B 论文 1 篇，核心贡献：基于图神经网络的文档级实体关系抽取\n• 主导实验室「智能问答系统」项目，服务校内 20000+ 师生\n• 获得国家奖学金、浙江省优秀毕业生' },
        { id: `item_e_002`, school: '华中科技大学', degree: '本科', major: '软件工程', dateRange: '2015.09 - 2019.06', description: '• GPA：3.7/4.0，专业排名前 10%\n• ACM 校队成员，获区域赛银牌\n• 毕业设计：基于深度学习的代码自动补全系统' }
      ]
    },
    {
      id: `mod_exp_001`, type: 'experience', title: '工作经历',
      visible: true, order: 2,
      items: [
        { id: `item_xp_001`, company: '字节跳动', position: '高级 AI Agent 工程师', dateRange: '2023.07 - 至今', description: '• **AI 助手平台架构**：负责公司内部 AI Agent 开发平台的底层架构设计，支持 50+ 业务线接入，日均调用量超 500 万次。自研 Agent Runtime 引擎，实现 Tool Registration → Planning → Execution → Reflection 全链路闭环。\n\n• **Multi-Agent 协作系统**：设计并实现了基于「角色分工 + 消息总线」的多 Agent 协作框架，支持 Manager-Agent-Worker 三层编排模式。在客服自动化场景中，将复杂问题解决率从 42% 提升至 78%。\n\n• **RAG 体系优化**：重构检索增强生成管线，引入 Hybrid Retrieval（BM25 + Dense）+ Re-ranking + Citation 机制，文档问答准确率提升 35%，幻觉率降低至 <3%。\n\n• **Function Calling 引擎**：从零搭建参数提取与工具调度引擎，支持 200+ 内部 API 自动注册与调用，端到端延迟控制在 800ms 以内（P99）。' },
        { id: `item_xp_002`, company: '阿里巴巴 · 达摩院', position: '算法工程师（大模型方向）', dateRange: '2022.07 - 2023.06', description: '• **通义千问应用落地**：参与通义千问大模型在企业场景的适配与微调工作，负责 Prompt Engineering 规范制定和 Evaluation Framework 搭建。\n\n• **智能客服 Agent**：主导开发基于 LLM 的智能客服系统，集成意图识别、知识库检索、多轮对话管理三大模块。上线后人工转接率下降 45%，客户满意度（CSAT）提升 18 个百分点。\n\n• **SFT 数据工程**：构建高质量指令微调数据流水线，含数据清洗、去重、质量评分、格式标准化全流程，累计处理 50 万+ 高质量 SFT 样本。' }
      ]
    },
    {
      id: `mod_proj_001`, type: 'project', title: '项目经历',
      visible: true, order: 3,
      items: [
        { id: `item_prj_001`, name: 'AutoCode — AI 编程助手 Agent', role: '技术负责人 / 核心开发者', dateRange: '2024.03 - 至今', description: '一款面向企业研发团队的 AI 编程助手，集成了代码理解、生成、审查、重构等能力。\n\n**技术栈**：LangChain + OpenAI API / 自研模型 + AST 解析 + Vector DB (Milvus) + Git 集成\n\n**核心成果**：\n• 设计了 Code Context Engine，通过 AST 分析 + 语义索引实现精准的代码上下文构建，代码生成采纳率达 38%（行业平均 ~20%）\n• 实现了 Multi-file Editing Agent，支持跨文件代码修改的一致性校验与自动修复\n• 接入 15 个研发团队，日均活跃用户 1200+，人均编码效率提升约 30%', link: '' },
        { id: `item_prj_002`, name: 'DocMind — 企业知识库智能问答系统', role: '后端负责人', dateRange: '2023.01 - 2023.10', description: '基于 RAG 架构的企业级文档智能问答平台，支持 PDF/Word/Markdown 等多格式文档 ingestion 与语义检索。\n\n**技术栈**：Python + FastAPI + LangChain + Elasticsearch + PostgreSQL + Redis + Docker/K8s\n\n**核心成果**：\n• 设计了 Chunking Strategy Pipeline（按标题/段落/语义自适应分块），检索召回率相比固定窗口提升 28%\n• 实现了 Query Rewriting + HyDE 双路查询增强，复杂问题回答准确率达到 85%\n• 支持多租户隔离，已部署服务于 5 家企业客户，累计处理文档 10 万+ 份', link: '' },
        { id: `item_prj_003`, name: 'AgentBench — 大模型 Agent 能力评测框架（开源）', role: '核心贡献者', dateRange: '2023.06 - 2023.08', description: '开源的大语言模型 Agent 能力基准测试框架，GitHub Star 3000+。\n\n**技术栈**：Python + Pytest + Docker + React Dashboard\n\n**核心成果**：\n• 设计了涵盖 Tool Use、Code Execution、Web Browsing、Math Reasoning 等 8 个维度的评测体系\n• 实现了可扩展的 Evaluator 插件机制，支持自定义评测指标与权重配置\n• 已被 3 篇学术论文引用作为基线评测工具', link: 'https://github.com/example/agentbench' }
      ]
    },
    {
      id: `mod_skill_001`, type: 'skill', title: '技能特长',
      visible: true, order: 4,
      items: [
        { id: `item_sk_001`, name: '大语言模型 & Agent', level: 'expert' },
        { id: `item_sk_002`, name: 'LangChain / LangGraph / CrewAI', level: 'expert' },
        { id: `item_sk_003`, name: 'RAG（检索增强生成）', level: 'expert' },
        { id: `item_sk_004`, name: 'Prompt Engineering & SFT', level: 'expert' },
        { id: `item_sk_005`, name: 'Python / TypeScript', level: 'advanced' },
        { id: `item_sk_006`, name: 'FastAPI / Node.js', level: 'advanced' },
        { id: `item_sk_007`, name: 'Vector DB（Milvus / Pinecone / ES）', level: 'advanced' },
        { id: `item_sk_008`, name: 'Docker / K8s / CI/CD', level: 'intermediate' },
        { id: `item_sk_009`, name: 'PyTorch / HuggingFace Transformers', level: 'advanced' },
        { id: `item_sk_010`, name: 'System Design & 分布式系统', level: 'intermediate' }
      ]
    },
    {
      id: `mod_custom_001`, type: 'custom', title: '荣誉奖项 & 其他',
      visible: true, order: 5,
      items: [
        { id: `item_cust_001`, title: '🏆 荣誉奖项', content: '• 国家奖学金（硕士研究生）\n• 浙江省优秀毕业生\n• ACM-ICPC 亚洲区域赛银牌\n• 字节跳动 2024 Q1 优秀项目奖（AI 助手平台）\n• 开源项目 AgentBench GitHub Star 3000+' },
        { id: `item_cust_002`, title: '🌐 开源 & 社区', content: '• GitHub：github.com/yichenlin （关注 AI Agent / LLM 应用方向）\n• 技术博客：定期分享 Agent 工程实践与 LLM 落地心得\n• 语言能力：英语 CET-6（550+），可流畅阅读英文论文与技术文档' }
      ]
    },
  ]
}

// ===== Theme Presets =====
export const THEME_PRESETS: ThemePreset[] = [
  {
    name: '经典蓝', id: 'default',
    primaryColor: '#2C3E50', accentColor: '#3498DB',
    bgColor: '#F5F7FA', surfaceColor: '#FFFFFF',
    textPrimary: '#2C3E50', textSecondary: '#7F8C8D', borderColor: '#E1E8ED'
  },
  {
    name: '森林绿', id: 'green',
    primaryColor: '#1B4332', accentColor: '#2D6A4F',
    bgColor: '#F0F4F0', surfaceColor: '#FFFFFF',
    textPrimary: '#1B4332', textSecondary: '#52796F', borderColor: '#C8D5C1'
  },
  {
    name: '酒红', id: 'wine',
    primaryColor: '#6B2737', accentColor: '#A23B52',
    bgColor: '#FDF2F4', surfaceColor: '#FFFFFF',
    textPrimary: '#6B2737', textSecondary: '#9A6B73', borderColor: '#EDCDD3'
  },
  {
    name: '深空灰', id: 'dark',
    primaryColor: '#1A1A2E', accentColor: '#E94560',
    bgColor: '#F0F0F5', surfaceColor: '#FFFFFF',
    textPrimary: '#1A1A2E', textSecondary: '#6B7094', borderColor: '#D5D5E0'
  },
  {
    name: '暖橙', id: 'orange',
    primaryColor: '#7B341E', accentColor: '#D97706',
    bgColor: '#FFFBEB', surfaceColor: '#FFFFFF',
    textPrimary: '#7B341E', textSecondary: '#92400E', borderColor: '#FDE68A'
  },
  {
    name: '靛紫', id: 'indigo',
    primaryColor: '#312E81', accentColor: '#6366F1',
    bgColor: '#F5F3FF', surfaceColor: '#FFFFFF',
    textPrimary: '#312E81', textSecondary: '#7C7DBF', borderColor: '#DDD6FE'
  },
  {
    name: '薄荷青', id: 'teal',
    primaryColor: '#134E4A', accentColor: '#14B8A6',
    bgColor: '#F0FDFA', surfaceColor: '#FFFFFF',
    textPrimary: '#134E4A', textSecondary: '#5EAAA0', borderColor: '#CCFBF1'
  },
  {
    name: '玫瑰粉', id: 'rose',
    primaryColor: '#881337', accentColor: '#E11D48',
    bgColor: '#FFF1F2', surfaceColor: '#FFFFFF',
    textPrimary: '#881337', textSecondary: '#C27A8A', borderColor: '#FECDD3'
  },
  {
    name: '午夜蓝', id: 'navy',
    primaryColor: '#1E3A5F', accentColor: '#3B82F6',
    bgColor: '#F0F5FF', surfaceColor: '#FFFFFF',
    textPrimary: '#1E3A5F', textSecondary: '#6B8DB5', borderColor: '#C7D8F0'
  },
  {
    name: '焦糖棕', id: 'brown',
    primaryColor: '#5D4037', accentColor: '#A1887F',
    bgColor: '#FAF6F3', surfaceColor: '#FFFFFF',
    textPrimary: '#5D4037', textSecondary: '#8D7B74', borderColor: '#E8DCD5'
  }
]

// ===== History State for Undo/Redo =====
interface HistoryState {
  config: ResumeConfig
  avatar: AvatarConfig
  modules: ResumeModule[]
}

export const useResumeStore = defineStore('resume', () => {
  // ---- State ----
  const config = ref<ResumeConfig>({
    theme: 'default', primaryColor: '#2C3E50', fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 14, lineHeight: 1.6, pageMargin: 20, titleStyle: 'underline'
  })
  const avatar = ref<AvatarConfig>({ url: '', shape: 'circle' })
  const modules = ref<ResumeModule[]>(createDefaultModules())
  const lastSaved = ref<string>('')

  // ---- New: Panel Coordination State ----
  const selectedModuleId = ref<string | null>(null)
  const currentPhase = ref<'fill' | 'style' | 'export'>('fill')
  const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  // ---- Undo/Redo State ----
  const history = ref<HistoryState[]>([])
  const historyIndex = ref(-1)
  const maxHistory = 50
  const isUndoRedo = ref(false)

  // ---- Computed ----
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  const visibleModules = computed(() =>
    modules.value.filter(m => m.visible).sort((a, b) => a.order - b.order)
  )

  const charCount = computed(() => {
    let count = 0
    modules.value.forEach(m => m.items.forEach(item => {
      Object.entries(item).forEach(([k, v]) => {
        if (k !== 'id' && typeof v === 'string') count += v.length
      })
    }))
    return count
  })

  // ---- New: Completion Tracking ----
  const completionByModule = computed(() => {
    const result: Record<string, { filled: number; total: number }> = {}
    modules.value.forEach(mod => {
      let filled = 0; let total = 0
      mod.items.forEach(item => {
        Object.entries(item).forEach(([k, v]) => {
          if (k !== 'id' && typeof v === 'string') {
            total++
            if (v.trim().length > 0) filled++
          }
        })
      })
      result[mod.id] = { filled, total }
    })
    return result
  })

  const overallCompletion = computed(() => {
    let filled = 0; let total = 0
    Object.values(completionByModule.value).forEach(m => {
      filled += m.filled
      total += m.total
    })
    return total > 0 ? Math.round((filled / total) * 100) : 0
  })

  const emptyModuleCount = computed(() => {
    return Object.values(completionByModule.value).filter(m => m.filled < m.total).length
  })

  const selectedModule = computed(() =>
    modules.value.find(m => m.id === selectedModuleId.value) || null
  )

  // ---- History Management ----
  function pushHistory() {
    if (isUndoRedo.value) return
    const state: HistoryState = {
      config: JSON.parse(JSON.stringify(config.value)),
      avatar: JSON.parse(JSON.stringify(avatar.value)),
      modules: JSON.parse(JSON.stringify(modules.value))
    }
    // Remove future states if we're in the middle
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    history.value.push(state)
    if (history.value.length > maxHistory) {
      history.value.shift()
    } else {
      historyIndex.value++
    }
  }

  function undo() {
    if (!canUndo.value) return
    isUndoRedo.value = true
    historyIndex.value--
    const state = history.value[historyIndex.value]
    config.value = JSON.parse(JSON.stringify(state.config))
    avatar.value = JSON.parse(JSON.stringify(state.avatar))
    modules.value = JSON.parse(JSON.stringify(state.modules))
    applyCssVarsFromConfig()
    isUndoRedo.value = false
  }

  function redo() {
    if (!canRedo.value) return
    isUndoRedo.value = true
    historyIndex.value++
    const state = history.value[historyIndex.value]
    config.value = JSON.parse(JSON.stringify(state.config))
    avatar.value = JSON.parse(JSON.stringify(state.avatar))
    modules.value = JSON.parse(JSON.stringify(state.modules))
    applyCssVarsFromConfig()
    isUndoRedo.value = false
  }

  function applyCssVarsFromConfig() {
    const preset = THEME_PRESETS.find(t => t.id === config.value.theme)
    if (preset) {
      applyCssVars(preset)
    } else {
      document.documentElement.style.setProperty('--primary-color', config.value.primaryColor)
      const scale = generateColorScale(config.value.primaryColor)
      Object.entries(scale).forEach(([key, val]) => {
        document.documentElement.style.setProperty(`--primary-${key}`, val)
      })
    }
    document.documentElement.style.setProperty('--font-family', config.value.fontFamily)
    document.documentElement.style.setProperty('--font-size', `${config.value.fontSize}px`)
    document.documentElement.style.setProperty('--line-height', String(config.value.lineHeight))
    document.documentElement.style.setProperty('--page-margin', `${config.value.pageMargin}px`)
    document.documentElement.style.setProperty('--title-style', config.value.titleStyle || 'underline')
  }

  // Watch for changes and push to history (debounced)
  let historyTimer: ReturnType<typeof setTimeout> | null = null
  watch([config, avatar, modules], () => {
    if (historyTimer) clearTimeout(historyTimer)
    saveStatus.value = 'unsaved'
    historyTimer = setTimeout(() => {
      pushHistory()
      lastSaved.value = new Date().toISOString()
      saveStatus.value = 'saved'
    }, 500)
  }, { deep: true })

  // Initialize history with default state
  pushHistory()

  // ---- Actions ----

  function applyTheme(presetId: string) {
    const preset = THEME_PRESETS.find(t => t.id === presetId)
    if (!preset) return
    config.value.theme = presetId
    config.value.primaryColor = preset.primaryColor
    applyCssVars(preset)
  }

  function applyCssVars(theme: ThemePreset) {
    const root = document.documentElement
    root.style.setProperty('--primary-color', theme.primaryColor)
    root.style.setProperty('--accent-color', theme.accentColor)
    root.style.setProperty('--bg-color', theme.bgColor)
    root.style.setProperty('--surface-color', theme.surfaceColor)
    root.style.setProperty('--text-primary', theme.textPrimary)
    root.style.setProperty('--text-secondary', theme.textSecondary)
    root.style.setProperty('--border-color', theme.borderColor)

    // Generate and apply primary color scale dynamically
    const primaryScale = generateColorScale(theme.primaryColor)
    Object.entries(primaryScale).forEach(([key, val]) => {
      root.style.setProperty(`--primary-${key}`, val)
    })

    // Generate accent scale
    const accentScale = generateColorScale(theme.accentColor)
    root.style.setProperty('--accent-400', accentScale[400])
    root.style.setProperty('--accent-500', accentScale[500])
    root.style.setProperty('--accent-50', accentScale[50])
  }

  function setPrimaryColor(color: string) {
    config.value.primaryColor = color
    document.documentElement.style.setProperty('--primary-color', color)
    const scale = generateColorScale(color)
    Object.entries(scale).forEach(([key, val]) => {
      document.documentElement.style.setProperty(`--primary-${key}`, val)
    })
  }

  function setTitleStyle(style: string) {
    config.value.titleStyle = style as ResumeConfig['titleStyle']
    document.documentElement.style.setProperty('--title-style', style)
  }

  function updateModule(moduleId: string, patch: Partial<ResumeModule>) {
    const mod = modules.value.find(m => m.id === moduleId)
    if (mod) Object.assign(mod, patch)
  }

  function updateItem(moduleId: string, itemId: string, field: string, value: string) {
    const mod = modules.value.find(m => m.id === moduleId)
    if (!mod) return
    const item = mod.items.find(i => i.id === itemId)
    if (item) item[field] = value
  }

  function addItem(moduleId: string) {
    const mod = modules.value.find(m => m.id === moduleId)
    if (!mod) return
    const defaults: Record<string, string> = {
      personal: '{name:"",phone:"",email:"",location:"",position:"",summary:""}',
      education: '{school:"",degree:"",major:"",dateRange:"",description:""}',
      experience: '{company:"",position:"",dateRange:"",description:""}',
      project: '{name:"",role:"",dateRange:"",description:"",link:""}',
      skill: '{name:"",level:""}',
      custom: '{title:"",content:""}',
    }
    mod.items.push({ id: `item_${uuid()}`, ...JSON.parse(defaults[mod.type] || '{}') })
  }

  function removeItem(moduleId: string, itemId: string) {
    const mod = modules.value.find(m => m.id === moduleId)
    if (mod) mod.items = mod.items.filter(i => i.id !== itemId)
  }

  function duplicateItem(moduleId: string, itemId: string) {
    const mod = modules.value.find(m => m.id === moduleId)
    if (!mod) return
    const source = mod.items.find(i => i.id === itemId)
    if (!source) return
    const copy: ModuleItem = { id: `item_${uuid()}`, ...JSON.parse(JSON.stringify(source)) }
    const idx = mod.items.findIndex(i => i.id === itemId)
    mod.items.splice(idx + 1, 0, copy)
  }

  function moveItem(moduleId: string, itemId: string, direction: 'up' | 'down') {
    const mod = modules.value.find(m => m.id === moduleId)
    if (!mod) return
    const idx = mod.items.findIndex(i => i.id === itemId)
    if (idx < 0) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= mod.items.length) return
    const temp = mod.items[idx]
    mod.items[idx] = mod.items[targetIdx]
    mod.items[targetIdx] = temp
  }

  function removeModule(moduleId: string) {
    if (!confirm('确定要删除整个模块吗？此操作不可撤销。')) return
    modules.value = modules.value.filter(m => m.id !== moduleId)
    if (selectedModuleId.value === moduleId) selectedModuleId.value = null
  }

  function addModule(type: ModuleType, title?: string): string | null {
    const typeNames: Record<ModuleType, string> = {
      personal: '个人信息', education: '教育经历', experience: '工作经历',
      project: '项目经历', skill: '技能特长', custom: '自定义模块'
    }
    const defaultItems: Record<ModuleType, string> = {
      personal: '{"name":"","phone":"","email":"","location":"","position":"","summary":""}',
      education: '{"school":"","degree":"","major":"","dateRange":"","description":""}',
      experience: '{"company":"","position":"","dateRange":"","description":""}',
      project: '{"name":"","role":"","dateRange":"","description":"","link":""}',
      skill: '{"name":"","level":""}',
      custom: '{"title":"","content":""}',
    }
    const newMod: ResumeModule = {
      id: `mod_${uuid()}`,
      type,
      title: title || typeNames[type],
      visible: true,
      order: modules.value.length,
      items: [{ id: `item_${uuid()}`, ...JSON.parse(defaultItems[type]) }]
    }
    modules.value.push(newMod)
    return newMod.id
  }

  function toggleModuleVisibility(moduleId: string) {
    const mod = modules.value.find(m => m.id === moduleId)
    if (mod) mod.visible = !mod.visible
  }

  function reorderModules(newOrder: ResumeModule[]) {
    newOrder.forEach((m, idx) => {
      const original = modules.value.find(o => o.id === m.id)
      if (original) original.order = idx
    })
  }

  function setAvatar(url: string, shape: 'circle' | 'rounded') {
    avatar.value = { url, shape }
  }

  // ---- New: Panel Coordination Actions ----
  function selectModule(moduleId: string | null) {
    selectedModuleId.value = moduleId
  }

  function setPhase(phase: 'fill' | 'style' | 'export') {
    currentPhase.value = phase
  }

  function markSaving() {
    saveStatus.value = 'saving'
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveStatus.value = 'saved'
    }, 800)
  }

  // ---- Data Persistence ----
  function exportData(): ResumeData {
    return {
      meta: { version: '1.0', lastSaved: new Date().toISOString() },
      config: { ...config.value },
      avatar: { ...avatar.value },
      modules: JSON.parse(JSON.stringify(modules.value))
    }
  }

  function importData(data: ResumeData) {
    config.value = data.config
    avatar.value = data.avatar
    modules.value = data.modules
    lastSaved.value = data.meta.lastSaved
    // Apply theme CSS vars
    applyCssVarsFromConfig()
  }

  function resetToDefault() {
    config.value = {
      theme: 'default', primaryColor: '#2C3E50', fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 14, lineHeight: 1.6, pageMargin: 20, titleStyle: 'underline'
    }
    avatar.value = { url: '', shape: 'circle' }
    modules.value = createDefaultModules()
    applyTheme('default')
  }

  return {
    config, avatar, modules, lastSaved,
    selectedModuleId, currentPhase, saveStatus,
    selectedModule,
    visibleModules, charCount,
    completionByModule, overallCompletion, emptyModuleCount,
    canUndo, canRedo,
    selectModule, setPhase, markSaving,
    applyTheme, applyCssVars, applyCssVarsFromConfig, setPrimaryColor, setTitleStyle,
    updateModule, updateItem, addItem, removeItem,
    duplicateItem, moveItem, removeModule, addModule,
    toggleModuleVisibility, reorderModules, setAvatar,
    undo, redo,
    exportData, importData, resetToDefault
  }
}, {
  persist: {
    key: 'resume-editor-data',
    storage: localStorage,
    pick: ['config', 'avatar', 'modules', 'lastSaved', 'selectedModuleId', 'currentPhase']
  }
})
