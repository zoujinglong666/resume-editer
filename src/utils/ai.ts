/**
 * AI Service Layer — 统一接入多种 LLM API
 * 支持 OpenAI / Claude / 自定义端点
 */

import type { ResumeModule } from '../types'

export interface AiConfig {
  provider: 'deepseek' | 'openai' | 'claude' | 'custom'
  apiKey: string
  baseUrl: string
  model: string
  temperature?: number
  maxTokens?: number
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// Default configs per provider
const PROVIDER_DEFAULTS: Record<string, Partial<AiConfig>> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-v4-flash',
    temperature: 0.7,
    maxTokens: 2000,
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2000,
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 2000,
  },
  custom: {
    baseUrl: '',
    model: '',
    temperature: 0.7,
    maxTokens: 2000,
  },
}

// Load/save AI config from localStorage
const AI_CONFIG_KEY = 'resume-editor-ai-config'

export function loadAiConfig(): AiConfig | null {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveAiConfig(config: AiConfig): void {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config))
}

export function getDefaultAiConfig(provider: AiConfig['provider']): AiConfig {
  return {
    provider,
    apiKey: '',
    ...PROVIDER_DEFAULTS[provider],
  } as AiConfig
}

// Core chat completion function
// 传入 onChunk 时启用流式输出（仅 OpenAI 兼容接口生效）
export async function chatCompletion(
  config: AiConfig,
  messages: AiMessage[],
  signal?: AbortSignal,
  onChunk?: (delta: string) => void,
): Promise<AiResponse> {
  if (!config.apiKey) {
    throw new Error('请先配置 AI API Key')
  }

  if (config.provider === 'claude') {
    return claudeCompletion(config, messages, signal, onChunk)
  }

  // Default: OpenAI-compatible API (works with OpenAI, custom endpoints, etc.)
  return openaiCompletion(config, messages, signal, onChunk)
}

async function openaiCompletion(
  config: AiConfig,
  messages: AiMessage[],
  signal?: AbortSignal,
  onChunk?: (delta: string) => void,
): Promise<AiResponse> {
  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 2000,
      stream: !!onChunk,
    }),
    signal,
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`AI API 请求失败 (${res.status}): ${err}`)
  }

  // 非流式：直接返回完整内容
  if (!onChunk) {
    const data = await res.json()
    return {
      content: data.choices?.[0]?.message?.content ?? '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    }
  }

  // 流式：逐块读取 SSE（data: {...}），实时回调 delta
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  let usage: AiResponse['usage']

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const t = line.trim()
      if (!t.startsWith('data:')) continue
      const payload = t.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const json = JSON.parse(payload)
        const delta: string = json.choices?.[0]?.delta?.content ?? ''
        if (delta) {
          full += delta
          onChunk(delta)
        }
        if (json.usage) usage = json.usage
      } catch {
        // 忽略不完整分片
      }
    }
  }

  return {
    content: full,
    usage: usage ? {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
    } : undefined,
  }
}

async function claudeCompletion(
  config: AiConfig,
  messages: AiMessage[],
  signal?: AbortSignal,
  _onChunk?: (delta: string) => void,
): Promise<AiResponse> {
  const url = `${config.baseUrl.replace(/\/+$/, '')}/messages`

  // Extract system message
  const systemMsg = messages.find(m => m.role === 'system')
  const chatMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }))

  const body: Record<string, unknown> = {
    model: config.model,
    messages: chatMessages,
    max_tokens: config.maxTokens ?? 2000,
    temperature: config.temperature ?? 0.7,
  }
  if (systemMsg) body.system = systemMsg.content

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Claude API 请求失败 (${res.status}): ${err}`)
  }

  const data = await res.json()
  return {
    content: data.content?.[0]?.text ?? '',
    usage: data.usage ? {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
    } : undefined,
  }
}

// ===== High-level AI Functions for Resume Editing =====

/** AI 生成简历内容 */
export async function aiGenerateContent(
  config: AiConfig,
  prompt: string,
  context?: string,
  signal?: AbortSignal,
  onChunk?: (delta: string) => void,
): Promise<string> {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content: `你是一位专业的简历顾问和写作专家。你的任务是帮助用户编写高质量的简历内容。
要求：
- 使用专业、简洁的中文
- 突出量化成果和具体数据
- 使用 STAR 法则（情境-任务-行动-结果）
- 适合 ATS（简历筛选系统）的格式
- 每个要点以动词开头
${context ? `\n当前简历上下文：\n${context}` : ''}`,
    },
    { role: 'user', content: prompt },
  ]

  const response = await chatCompletion(config, messages, signal, onChunk)
  return response.content
}

/** AI 润色已有内容 */
export async function aiPolishContent(
  config: AiConfig,
  content: string,
  instruction?: string,
  signal?: AbortSignal,
  onChunk?: (delta: string) => void,
): Promise<string> {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content: `你是简历润色专家。请优化以下简历内容，使其更加专业、有说服力。
规则：
- 保持原始含义不变
- 使用更强有力的动词
- 增加量化数据（如果原文有数据则保留并优化表达）
- 使语言更加精炼
- 适合中文简历的表达习惯
${instruction ? `\n用户特别要求：${instruction}` : ''}`,
    },
    { role: 'user', content: `请润色以下内容：\n\n${content}` },
  ]

  const response = await chatCompletion(config, messages, signal, onChunk)
  return response.content
}

/** AI 根据职位描述生成工作经历 */
export async function aiGenerateFromJD(
  config: AiConfig,
  jobTitle: string,
  company: string,
  jdText: string,
  signal?: AbortSignal,
  onChunk?: (delta: string) => void,
): Promise<string> {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content: `你是简历写作专家。根据用户提供的职位描述（JD），生成匹配的工作经历描述。
规则：
- 生成 5-7 个工作要点
- 每个要点以动词开头
- 包含量化成果（用合理的数据）
- 匹配 JD 中的关键技能和要求
- 使用 STAR 法则
- 输出格式为纯文本，每行一个要点，以数字编号`,
    },
    {
      role: 'user',
      content: `职位：${jobTitle}\n公司：${company}\n\n职位描述：\n${jdText}\n\n请生成工作经历描述。`,
    },
  ]

  const response = await chatCompletion(config, messages, signal, onChunk)
  return response.content
}

/** AI 简历评分（AI-powered） */
export async function aiScoreResume(
  config: AiConfig,
  resumeText: string,
  targetJob?: string,
  signal?: AbortSignal,
): Promise<{ score: number; feedback: string; suggestions: string[] }> {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content: `你是简历评审专家。请对以下简历进行专业评分和分析。
请返回 JSON 格式（不要包含 markdown 代码块标记）：
{
  "score": 0-100的整数,
  "feedback": "总体评价（2-3句话）",
  "suggestions": ["具体改进建议1", "具体改进建议2", ...],
  "strengths": ["亮点1", "亮点2", ...],
  "weaknesses": ["不足1", "不足2", ...]
}
评分维度：内容完整性、专业度、量化成果、关键词匹配、格式规范`,
    },
    {
      role: 'user',
      content: `${targetJob ? `目标职位：${targetJob}\n\n` : ''}简历内容：\n${resumeText}`,
    },
  ]

  const response = await chatCompletion(config, messages, signal)
  try {
    // Try to parse JSON from response
    const jsonStr = response.content.replace(/```json?\s*|\s*```/g, '').trim()
    return JSON.parse(jsonStr)
  } catch {
    return {
      score: 70,
      feedback: response.content.slice(0, 200),
      suggestions: [response.content],
    }
  }
}

// 从简历模块提取纯文本（供 AI 分析 / 优化使用）
export function buildResumeText(
  modules: ResumeModule[],
  withIds = false,
): string {
  return modules
    .filter(m => m.type !== 'personal')
    .map(m => {
      const lines = m.items
        .map((it, idx) => {
          const rec = it as Record<string, unknown>
          const text = (rec.description ?? rec.content ?? rec.title ?? rec.name ?? '') as string
          return `${idx + 1}. ${text}`
        })
        .join('\n')
      return withIds
        ? `[MODULE:${m.id}|${m.title}]\n${lines}`
        : `【${m.title}】\n${lines}`
    })
    .join('\n\n')
}

// 从模型返回中提取 JSON（兼容 ```json 代码块标记）
function extractJson<T>(raw: string): T {
  const s = raw.replace(/```json?\s*|\s*```/g, '').trim()
  return JSON.parse(s) as T
}

/** AI 摘要 / 个人亮点句 */
export async function aiSummarizeResume(
  config: AiConfig,
  resumeText: string,
  targetJob?: string,
  signal?: AbortSignal,
): Promise<{ summary: string; highlight: string }> {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content: `你是资深简历顾问。请根据用户简历内容生成两部分：
1) summary：一段 2-4 句的专业个人简介（professional summary），突出核心竞争力与量化成果，语气专业可信。
2) highlight：一句话亮点（不超过 30 字），高度凝练个人最大优势。
仅返回 JSON（不要包含 markdown 代码块标记）：
{"summary": "...", "highlight": "..."}`,
    },
    {
      role: 'user',
      content: `${targetJob ? `目标职位：${targetJob}\n\n` : ''}简历内容：\n${resumeText}`,
    },
  ]

  const response = await chatCompletion(config, messages, signal)
  try {
    return extractJson<{ summary: string; highlight: string }>(response.content)
  } catch {
    return { summary: response.content.slice(0, 500), highlight: '' }
  }
}

/** AI 简历与 JD 匹配度分析 */
export async function aiAnalyzeJDMatch(
  config: AiConfig,
  resumeText: string,
  jdText: string,
  targetJob?: string,
  signal?: AbortSignal,
): Promise<{ score: number; matched: string[]; missing: string[]; suggestions: string[] }> {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content: `你是资深招聘官与简历优化专家。请对比简历与职位描述（JD），评估匹配度。
仅返回 JSON（不要包含 markdown 代码块标记）：
{
  "score": 0-100 的整数,
  "matched": ["简历已具备且与 JD 相关的关键词/能力1", "..."],
  "missing": ["JD 要求但简历缺失或偏弱的关键词/能力1", "..."],
  "suggestions": ["针对性改进建议1", "..."]
}`,
    },
    {
      role: 'user',
      content: `${targetJob ? `目标职位：${targetJob}\n\n` : ''}【简历】\n${resumeText}\n\n【职位描述 JD】\n${jdText}`,
    },
  ]

  const response = await chatCompletion(config, messages, signal)
  try {
    return extractJson<{ score: number; matched: string[]; missing: string[]; suggestions: string[] }>(response.content)
  } catch {
    return { score: 0, matched: [], missing: [], suggestions: [response.content.slice(0, 300)] }
  }
}

/** AI 一键优化整份简历（逐模块重写，保持条目数量与顺序） */
export async function aiOptimizeResume(
  config: AiConfig,
  resumeText: string,
  targetJob?: string,
  signal?: AbortSignal,
): Promise<{ modules: { id: string; items: string[] }[]; actionPlan: string[] }> {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content: `你是简历优化专家。请通读整份简历，逐模块重写/润色所有描述，使其更专业、量化、有说服力。
要求：
- 输入中每个模块以 [MODULE:<模块id>|<标题>] 标记，请保持模块数量、id、顺序不变。
- 每个模块的 items 数组长度与顺序必须与原模块一致，逐条优化。
- 每条为一段纯文本（可含换行），不要加编号。
- 突出量化成果，动词开头，适合 ATS。
仅返回 JSON（不要包含 markdown 代码块标记）：
{
  "modules": [
    { "id": "模块id（与输入一致）", "items": ["优化后的条目1文本", "优化后的条目2文本"] },
    ...
  ],
  "actionPlan": ["整体改进行动建议1", "..."]
}`,
    },
    {
      role: 'user',
      content: `${targetJob ? `目标职位：${targetJob}\n\n` : ''}简历内容（按模块给出）：\n${resumeText}`,
    },
  ]

  const response = await chatCompletion(config, messages, signal)
  try {
    return extractJson<{ modules: { id: string; items: string[] }[]; actionPlan: string[] }>(response.content)
  } catch {
    return { modules: [], actionPlan: [response.content.slice(0, 300)] }
  }
}
