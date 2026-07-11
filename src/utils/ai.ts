/**
 * AI Service Layer — 统一接入多种 LLM API
 * 支持 OpenAI / Claude / 自定义端点
 */

export interface AiConfig {
  provider: 'openai' | 'claude' | 'custom'
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
export async function chatCompletion(
  config: AiConfig,
  messages: AiMessage[],
  signal?: AbortSignal,
): Promise<AiResponse> {
  if (!config.apiKey) {
    throw new Error('请先配置 AI API Key')
  }

  if (config.provider === 'claude') {
    return claudeCompletion(config, messages, signal)
  }

  // Default: OpenAI-compatible API (works with OpenAI, custom endpoints, etc.)
  return openaiCompletion(config, messages, signal)
}

async function openaiCompletion(
  config: AiConfig,
  messages: AiMessage[],
  signal?: AbortSignal,
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
    }),
    signal,
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`AI API 请求失败 (${res.status}): ${err}`)
  }

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

async function claudeCompletion(
  config: AiConfig,
  messages: AiMessage[],
  signal?: AbortSignal,
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

  const response = await chatCompletion(config, messages)
  return response.content
}

/** AI 润色已有内容 */
export async function aiPolishContent(
  config: AiConfig,
  content: string,
  instruction?: string,
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

  const response = await chatCompletion(config, messages)
  return response.content
}

/** AI 根据职位描述生成工作经历 */
export async function aiGenerateFromJD(
  config: AiConfig,
  jobTitle: string,
  company: string,
  jdText: string,
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

  const response = await chatCompletion(config, messages)
  return response.content
}

/** AI 简历评分（AI-powered） */
export async function aiScoreResume(
  config: AiConfig,
  resumeText: string,
  targetJob?: string,
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

  const response = await chatCompletion(config, messages)
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
