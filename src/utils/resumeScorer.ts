/**
 * 简历评分系统 — 本地启发式评分引擎
 * 不依赖外部 API，可离线使用
 */

import type { ResumeModule, ResumeData } from '../types'

export interface ScoreResult {
  total: number // 0-100
  breakdown: {
    completeness: { score: number; max: number; feedback: string }
    professionalism: { score: number; max: number; feedback: string }
    quantification: { score: number; max: number; feedback: string }
    keywords: { score: number; max: number; feedback: string }
    format: { score: number; max: number; feedback: string }
  }
  suggestions: string[]
  strengths: string[]
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
}

// Common high-value keywords for tech resumes
const TECH_KEYWORDS = [
  '架构', '优化', '重构', '性能', '并发', '分布式', '微服务', '缓存',
  '数据库', 'API', 'SDK', 'CI/CD', 'Docker', 'Kubernetes', 'K8s',
  'Redis', 'MySQL', 'MongoDB', 'Elasticsearch', 'Kafka', 'RabbitMQ',
  'Spring', 'React', 'Vue', 'Node.js', 'Python', 'Java', 'Go', 'TypeScript',
  'AWS', 'Azure', 'GCP', 'Serverless', 'GraphQL', 'REST', 'gRPC',
  '机器学习', '深度学习', 'NLP', 'RAG', 'LLM', 'Agent', 'Transformer',
  '前端', '后端', '全栈', 'DevOps', 'SRE', '安全', '监控', '告警',
  '测试', '单元测试', '集成测试', '自动化', '部署', '上线', '发布',
  '需求分析', '技术选型', '方案设计', '代码审查', 'Code Review',
]

// Power verbs for resume writing
const POWER_VERBS = [
  '负责', '主导', '设计', '开发', '实现', '优化', '重构', '搭建',
  '构建', '部署', '维护', '管理', '协调', '推动', '提升', '降低',
  '完成', '解决', '处理', '实现', '集成', '封装', '封装', '扩展',
  '迁移', '升级', '监控', '分析', '评估', '测试', '验证', '上线',
]

/** Extract plain text from all modules */
function extractText(modules: ResumeModule[]): string {
  const parts: string[] = []
  modules.forEach(m => {
    if (!m.visible) return
    parts.push(m.title)
    m.items.forEach(item => {
      Object.entries(item).forEach(([k, v]) => {
        if (k !== 'id' && k !== 'personalFields' && typeof v === 'string' && v.trim()) {
          parts.push(v)
        }
      })
    })
  })
  return parts.join('\n')
}

/** Count numbers/percentages in text */
function countQuantifications(text: string): number {
  const patterns = [
    /\d+[%％]/g,                    // 百分比
    /\d+[KkWw万]\+?/g,             // 数量级
    /\d+(\.\d+)?[倍xX]/g,          // 倍数
    /[从由]\d+.*?[到至].*?\d+/g,    // 范围
    /[Pp]\d+/g,                     // P99 等
    /日[均活]*\s*\d+/g,             // 日均
    /月[活均]*\s*\d+/g,             // 月活
    /\d+\s*[年月天日小时周]/g,       // 时间量
  ]
  let count = 0
  patterns.forEach(p => {
    const matches = text.match(p)
    if (matches) count += matches.length
  })
  return count
}

/** Check if lines start with action verbs */
function checkActionVerbs(text: string): { total: number; withVerb: number } {
  const lines = text.split('\n').filter(l => {
    const t = l.replace(/^[•\-*·\d.、）)]+\s*/, '').trim()
    return t.length > 5
  })

  let withVerb = 0
  lines.forEach(line => {
    const clean = line.replace(/^[•\-*·\d.、）)]+\s*/, '').trim()
    if (POWER_VERBS.some(v => clean.startsWith(v))) {
      withVerb++
    }
  })

  return { total: lines.length, withVerb }
}

/** Score completeness */
function scoreCompleteness(modules: ResumeModule[]): { score: number; max: number; feedback: string } {
  const max = 25
  let score = 0
  const issues: string[] = []

  // Check essential modules exist and have content
  const essentialTypes = ['personal', 'education', 'experience']
  const hasType = (t: string) => modules.some(m => m.type === t && m.visible)

  essentialTypes.forEach(t => {
    if (hasType(t)) {
      score += 3
    } else {
      issues.push(`缺少${t === 'personal' ? '个人信息' : t === 'education' ? '教育经历' : '工作经历'}模块`)
    }
  })

  // Check personal info completeness
  const personal = modules.find(m => m.type === 'personal')
  if (personal?.items[0]) {
    const item = personal.items[0]
    const fields = ['name', 'phone', 'email', 'position']
    const filled = fields.filter(f => (item[f] as string)?.trim())
    score += Math.round((filled.length / fields.length) * 6)
    if (filled.length < fields.length) {
      issues.push('个人信息有必填字段未填写')
    }
  }

  // Check if experience/project has meaningful content
  const expMod = modules.find(m => m.type === 'experience')
  if (expMod?.items.length) {
    const hasDesc = expMod.items.some(i => (i.description?.length || 0) > 50)
    if (hasDesc) score += 5
    else issues.push('工作经历描述过于简短')
  }

  // Check for optional but valuable modules
  const optionalTypes = ['skill', 'project', 'strength']
  const optionalCount = optionalTypes.filter(t => hasType(t)).length
  score += Math.round((optionalCount / optionalTypes.length) * 5)

  if (!hasType('skill')) issues.push('建议添加技能特长模块')
  if (!hasType('project')) issues.push('建议添加项目经历模块')

  return { score: Math.min(score, max), max, feedback: issues.length ? issues.join('；') : '内容完整性良好' }
}

/** Score professionalism */
function scoreProfessionalism(text: string): { score: number; max: number; feedback: string } {
  const max = 20
  let score = 0
  const issues: string[] = []

  // Check for action verbs
  const { total, withVerb } = checkActionVerbs(text)
  if (total > 0) {
    const verbRatio = withVerb / total
    if (verbRatio >= 0.6) {
      score += 8
    } else if (verbRatio >= 0.3) {
      score += 5
      issues.push('建议更多要点以动词开头')
    } else {
      score += 2
      issues.push('大部分要点未以动词开头，建议使用 STAR 法则')
    }
  }

  // Check for common unprofessional patterns
  const unprofessional = [
    /负责.*?工作/,  // "负责XX工作" is weak
    /等等$/,        // ending with "等等" is vague
    /相关/,         // "相关" is vague
  ]
  let unprofCount = 0
  text.split('\n').forEach(line => {
    if (unprofessional.some(p => p.test(line))) unprofCount++
  })
  if (unprofCount === 0) {
    score += 6
  } else if (unprofCount <= 2) {
    score += 3
    issues.push('存在少量模糊表述（如"负责XX工作"），建议更具体')
  } else {
    issues.push('存在多处模糊表述，建议用具体行动和成果替代')
  }

  // Check text length (too short = not detailed enough)
  if (text.length > 500) score += 6
  else if (text.length > 200) {
    score += 3
    issues.push('简历内容偏少，建议丰富工作和项目描述')
  } else {
    issues.push('简历内容过于简短')
  }

  return { score: Math.min(score, max), max, feedback: issues.length ? issues.join('；') : '专业度良好' }
}

/** Score quantification */
function scoreQuantification(text: string): { score: number; max: number; feedback: string } {
  const max = 20
  const quantCount = countQuantifications(text)
  let score = 0
  const issues: string[] = []

  if (quantCount >= 10) {
    score = max
  } else if (quantCount >= 6) {
    score = 15
  } else if (quantCount >= 3) {
    score = 10
    issues.push('量化数据可以更丰富，建议添加更多百分比、倍数等数据')
  } else if (quantCount >= 1) {
    score = 5
    issues.push('量化数据较少，HR 更喜欢看到具体数字和成果')
  } else {
    issues.push('缺少量化数据！建议添加提升百分比、处理数据量、用户规模等具体数字')
  }

  return { score: Math.min(score, max), max, feedback: issues.length ? issues.join('；') : '量化成果充分' }
}

/** Score keyword matching */
function scoreKeywords(text: string): { score: number; max: number; feedback: string } {
  const max = 20
  const textLower = text.toLowerCase()
  const matchedKeywords = TECH_KEYWORDS.filter(kw => textLower.includes(kw.toLowerCase()))

  let score = 0
  const issues: string[] = []

  if (matchedKeywords.length >= 15) {
    score = max
  } else if (matchedKeywords.length >= 10) {
    score = 15
  } else if (matchedKeywords.length >= 5) {
    score = 10
    issues.push(`匹配到 ${matchedKeywords.length} 个技术关键词，建议补充更多行业术语`)
  } else {
    score = 5
    issues.push('技术关键词偏少，ATS 系统可能无法有效识别你的技能')
  }

  return {
    score: Math.min(score, max),
    max,
    feedback: issues.length ? issues.join('；') : `匹配 ${matchedKeywords.length} 个关键词，ATS 友好`,
  }
}

/** Score format */
function scoreFormat(modules: ResumeModule[]): { score: number; max: number; feedback: string } {
  const max = 15
  let score = 0
  const issues: string[] = []

  // Check module ordering
  const visibleModules = modules.filter(m => m.visible)
  const typeOrder = visibleModules.map(m => m.type)
  const idealOrder = ['personal', 'education', 'skill', 'experience', 'project', 'strength', 'custom']

  let orderScore = 0
  for (let i = 0; i < typeOrder.length - 1; i++) {
    const currIdx = idealOrder.indexOf(typeOrder[i])
    const nextIdx = idealOrder.indexOf(typeOrder[i + 1])
    if (currIdx <= nextIdx) orderScore++
  }
  if (typeOrder.length > 1) {
    const orderRatio = orderScore / (typeOrder.length - 1)
    score += Math.round(orderRatio * 5)
    if (orderRatio < 0.5) issues.push('模块顺序不太常规，建议按照：个人信息→教育→技能→工作→项目→优势 排列')
  } else {
    score += 3
  }

  // Check for consistent date formatting
  const datePattern = /\d{4}[-./]\d{2}/
  let dateCount = 0
  let consistentDates = 0
  modules.forEach(m => {
    m.items.forEach(item => {
      if (item.dateRange) {
        dateCount++
        if (datePattern.test(item.dateRange)) consistentDates++
      }
    })
  })
  if (dateCount > 0) {
    if (consistentDates === dateCount) {
      score += 5
    } else {
      score += 2
      issues.push('日期格式不统一，建议统一为 YYYY-MM 格式')
    }
  } else {
    score += 3
  }

  // Check title styles
  const hasTitles = modules.filter(m => m.visible && m.title?.trim())
  if (hasTitles.length === visibleModules.length) {
    score += 5
  } else {
    score += 2
    issues.push('部分模块缺少标题')
  }

  return { score: Math.min(score, max), max, feedback: issues.length ? issues.join('；') : '格式规范' }
}

/** Main scoring function */
export function scoreResume(data: ResumeData | ResumeModule[]): ScoreResult {
  const modules = Array.isArray(data) ? data : data.modules
  const text = extractText(modules)

  const completeness = scoreCompleteness(modules)
  const professionalism = scoreProfessionalism(text)
  const quantification = scoreQuantification(text)
  const keywords = scoreKeywords(text)
  const format = scoreFormat(modules)

  const total = completeness.score + professionalism.score + quantification.score + keywords.score + format.score

  // Determine grade
  let grade: ScoreResult['grade']
  if (total >= 90) grade = 'S'
  else if (total >= 75) grade = 'A'
  else if (total >= 60) grade = 'B'
  else if (total >= 40) grade = 'C'
  else grade = 'D'

  // Collect suggestions
  const suggestions: string[] = []
  const breakdown = { completeness, professionalism, quantification, keywords, format }
  Object.values(breakdown).forEach(dim => {
    if (dim.score < dim.max * 0.7) {
      suggestions.push(dim.feedback)
    }
  })

  // Collect strengths
  const strengths: string[] = []
  if (completeness.score >= completeness.max * 0.8) strengths.push('内容完整度高')
  if (professionalism.score >= professionalism.max * 0.8) strengths.push('表达专业')
  if (quantification.score >= quantification.max * 0.8) strengths.push('量化成果充分')
  if (keywords.score >= keywords.max * 0.8) strengths.push('关键词匹配度高')
  if (format.score >= format.max * 0.8) strengths.push('格式规范')

  return { total, breakdown, suggestions, strengths, grade }
}

/** Get grade color */
export function getGradeColor(grade: ScoreResult['grade']): string {
  const colors: Record<string, string> = {
    S: '#10b981', A: '#3b82f6', B: '#f59e0b', C: '#f97316', D: '#ef4444',
  }
  return colors[grade] || '#6b7280'
}

/** Get grade label */
export function getGradeLabel(grade: ScoreResult['grade']): string {
  const labels: Record<string, string> = {
    S: '卓越', A: '优秀', B: '良好', C: '一般', D: '待改进',
  }
  return labels[grade] || ''
}
