import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  ResumeData, ResumeModule, ResumeConfig, AvatarConfig, ThemePreset, ModuleItem, ModuleType,
  ResumeDocument, ResumePage, ResumeElement, ElementType, ResumeTemplate, PersonalFieldConfig,
} from '../types'
import { migrateResumeDataToDocument } from '../types'

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

// ===== Default Personal Fields Config =====
function createDefaultPersonalFields(): PersonalFieldConfig[] {
  return [
    { id: 'pf_name',     key: 'name',     label: '姓名',   icon: '',            visible: true,  order: 0, isBuiltin: true },
    { id: 'pf_position', key: 'position', label: '职位',   icon: 'Briefcase',   visible: true,  order: 1, isBuiltin: true },
    { id: 'pf_phone',    key: 'phone',    label: '电话',   icon: 'Phone',       visible: true,  order: 2, isBuiltin: true },
    { id: 'pf_email',    key: 'email',    label: '邮箱',   icon: 'Mail',        visible: true,  order: 3, isBuiltin: true },
    { id: 'pf_location', key: 'location', label: '所在地', icon: 'MapPin',      visible: true,  order: 4, isBuiltin: false },
    { id: 'pf_link',     key: 'link',     label: '个人网站', icon: 'Globe',     visible: true,  order: 5, isBuiltin: false },
    { id: 'pf_summary',  key: 'summary',  label: '个人简介', icon: '',          visible: true,  order: 6, isBuiltin: true },
  ]
}

// ===== Shared Default Resume Data =====
// Single source of truth for default template content
// Organized following the "codefather" resume structure:
// 个人信息 → 教育经历 → 专业技能 → 工作经历 → 项目经历 → 个人优势
const DEFAULT_RESUME_CONTENT = {
  name: '李鱼皮',
  position: '前端开发（AI Agent 应用方向）｜3 年工作经验',
  phone: '138xxxx8888',
  email: 'yupi@codefather.cn',
  location: '',
  portfolio: 'dogyupi.com',
  github: 'github.com/liyupi',
  summary: '男｜24岁｜微信：xxxxxx｜个人博客（作品集）：dogyupi.com｜GitHub：github.com/liyupi',

  education: [
    {
      school: 'XX大学', degree: '本科', major: '软件工程',
      dateRange: '2019-09 ~ 2023-06',
      description: '• 排名：前5%，通过 CET-6\n• 上海市挑战杯特等奖\n• 上海市优秀毕业生\n• 国家级创新创业项目负责人\n• 蓝桥杯 Java 组省一等奖\n• 软件设计师认证'
    },
  ],

  // 专业技能：「类别：关键词」列表格式（skill list mode）
  skills: [
    { name: '前端工程化与框架', content: 'React 18+：Hooks、Context、Suspense、Error Boundaries、并发特性，独立设计过中大型项目的前端架构；Next.js：SSR/SSG/ISR，API Routes，中间件，国际化，Image 优化，落地过 2 个日活 10k+ 的 Next.js 项目；构建工具：Webpack 配置优化（splitChunks、externals、Tree Shaking）、Vite 插件开发、ESBuild 接入经验；性能优化：首屏加载时间优化（从 2.1s → 0.9s）、LCP/FID/CLS 指标监控与治理、虚拟滚动处理 5w+ 列表数据；跨端与兼容：Taro 小程序开发，响应式设计（移动端 + PC），多浏览器兼容（Chrome、Safari、微信内置浏览器）' },
    { name: 'AI 应用前端', content: 'AI 交互模式：流式对话（SSE/WebSocket）、工具调用可视化、多 Agent 协同界面、推理过程展示；AI SDK 封装：设计前端 AI 调用层，支持多模型切换、请求队列、超时重试、本地缓存降级；RAG 前端：文档检索结果高亮、引用溯源、相似度打分可视化、Prompt 调试面板；AI 辅助开发：Cursor / Copilot / Claude Code 深度使用，建立过团队 AI 编程规范，显著提升开发效率（+40%）' },
    { name: '后端协作与全栈', content: 'Node.js：Express / Fastify 开发 BFF 层，实现接口聚合、SSR 降级、鉴权中间件；数据库：MySQL 基础查询优化、Redis 缓存设计、ElasticSearch 查询 DSL（配合前端搜索）；部署与运维：Docker + Nginx + Serverless（阿里云 FC / Vercel），独立完成前端 CI/CD 流水线（GitHub Actions）' },
  ],

  experience: [
    {
      company: '老鱼公司', position: '前端 + AI 应用开发',
      dateRange: '2023-04 ~ 至今',
      description: '• **负责产品**：编程导航 codefather.cn (日活 20K 的程序员学习社区)、面试鸭 mianshiya.com (日活 15K 的面试刷题平台)\n\n• **前端架构与工程化**：负责两个高日活产品的前端技术选型与架构设计，基于 Next.js + React + TailwindCSS 搭建组件库和脚手架，制定代码规范（ESLint + Prettier + Husky），落地 Git Flow + PR Review 流程，支撑 6 人前端团队协作。\n\n• **性能优化**：针对知识库目录树渲染性能瓶颈，将递归渲染改为扁平化数据结构 + 虚拟滚动，节点数量从 2000+ 优化到 10000+ 无卡顿；通过 Next.js ISR 实现知识库内容增量更新，首屏加载时间降低 43%。\n\n• **AI 对话组件系统**：设计可复用的 AI 交互 SDK，支持 SSE 流式数据解析、Markdown 实时渲染、代码高亮、工具调用可视化（展示参数、执行状态、返回结果），封装后接入 3 条业务线，开发周期缩短 60%。\n\n• **内容风控管理后台**：基于 WebSocket 实现审核任务实时推送，支持人工复审和自动化违规拦截（98% 拦截率），设计可视化报表展示 AI 审核置信度分布，帮助运营团队效率提升 50%。\n\n• **监控与质量**：接入阿里云 ARMS 前端监控 + Sentry，自定义性能埋点和错误上报，建立 核心 Web 指标告警 和 错误阈值熔断 机制，线上 Bug 发现到修复时长从 2 小时缩短到 20 分钟。\n\n• **AI 接口聚合层（BFF）**：使用 Node.js + Express 搭建 AI 服务网关，统一处理多模型调用、降级和缓存，减少前端对 4 个 AI 后端的直接调用，接口可用性从 97.5% 提升到 99.9%。'
    },
  ],

  // 项目经历：重点项目详细展开 + 其他作品紧凑排列
  projects: [
    {
      name: 'AI 超级智能体',
      role: '前端 + 复杂 AI 交互',
      dateRange: '',
      description: '开源：github.com/liyupi/yu-ai-agent｜线上：codefather.cn\n\n• 独立完成 零迟滞感 AI 对话界面：基于 EventSource + 自定义缓冲区解决 SSE 分片丢包和换行符问题，实现逐字流式输出，用户感知首字时间 < 200ms。\n\n• 工具调用可视化设计：动态渲染 Agent 调用的工具链（搜索、PDF 生成、计算器等），支持展开 / 折叠参数详情、错误重试入口，用户对 AI 决策理解度提升 70%。\n\n• 前端记忆管理：封装 对话历史压缩算法（按 token 数自动裁剪 + 保留关键上下文），支持多会话本地缓存（IndexedDB），刷新页面或关闭浏览器后秒级恢复上下文。\n\n• RAG 检索展示：对接 PGvector 向量检索，高亮展示引用文档片段和相似度分数，并提供原文跳转链接，用户对答案可信度评分提升 45%。',
      link: 'github.com/liyupi/yu-ai-agent'
    },
    {
      name: 'AI 热点监控工具',
      role: '全栈 + Agent Skills 发布',
      dateRange: '',
      description: '开源：github.com/liyupi/yupi-hot-monitor｜线上：codefather.cn\n\n• 全栈独立开发：React + Socket.io + Express + Cheerio，实现 8 个数据源实时采集、AI 过滤和毫秒级 WebSocket 推送。\n\n• 热点订阅与推送：设计关键词订阅引擎，前端维护本地订阅映射表，支持多标签页同步（BroadcastChannel），消息推送到达率 99.97%。\n\n• AI 能力 Skills 化：将热点查询功能封装为 Agent Skills 并发布到 npm，支持 Cursor、Copilot 等 AI 编辑器直接调用，已有 200+ 开发者使用。\n\n• AI 辅助开发实践：项目中 90% 代码由 Cursor + Claude Code 生成，建立 AI 代码 Review 清单，确保生成代码符合团队规范，迭代效率提升 3 倍。',
      link: 'github.com/liyupi/yupi-hot-monitor'
    }
  ],

  // 其他作品（紧凑列表）
  otherWorks: [
    { name: 'AI 万能视频下载总结器', content: 'Next.js + Stripe + DeepSeek，实现支付 → 下载 → 总结全流程，月活 3000+ 独立用户，支付转化率 5.2%' },
    { name: 'AI 零代码应用生成平台', content: 'React Flow + LangGraph.js，可视化编排多 Agent 工作流，自动生成前后端代码，已生成 200+ 应用' },
    { name: '手写 RPC 框架可视化面板', content: '展示调用链、负载均衡状态、SPI 加载过程，作为技术教程 Demo 被多个高校课程引用' },
  ],

  // 个人优势：「能力标签：量化事实」格式
  strengths: [
    { title: '大厂匹配度', content: '具备高日活产品（20K+ DAU）的前端架构和性能优化经验，熟悉监控、工程化、跨端、CI/CD 等大厂必备能力' },
    { title: 'AI 应用落地', content: '不只是 demo，而是将 AI 对话、RAG、工具调用、Agent Skills 真正融入业务，产生可量化的业务价值（拦截率 98%、效率提升 50% 等）' },
    { title: '开源影响力', content: 'GitHub 2 万+ Followers，ai-guide 仓库 1 万+ Star，多次上榜 GitHub Trending，具备技术社区认可' },
    { title: '快速学习与输出', content: '持续跟进 Vercel AI SDK、LangChain.js、Copilot Kit 等前沿技术，撰写过 15+ 篇 AI 前端技术文章，累计阅读 30w+' },
  ]
}

// ===== Default Module Items (codefather-style resume) =====
function createDefaultModules(): ResumeModule[] {
  const d = DEFAULT_RESUME_CONTENT
  return [
    {
      id: `mod_personal_001`, type: 'personal', title: '个人信息',
      visible: true, order: 0,
      items: [{ id: `item_p_001`, name: d.name, phone: d.phone, email: d.email, location: d.location, position: d.position, link: d.portfolio, summary: d.summary, personalFields: createDefaultPersonalFields() }]
    },
    {
      id: `mod_edu_001`, type: 'education', title: '教育经历',
      visible: true, order: 1,
      items: d.education.map((edu, i) => ({ id: `item_e_00${i + 1}`, ...edu }))
    },
    {
      id: `mod_skill_001`, type: 'skill', title: '专业技能',
      visible: true, order: 2,
      displayMode: 'list',
      items: d.skills.map((sk, i) => ({ id: `item_sk_00${i + 1}`, name: sk.name, content: sk.content }))
    },
    {
      id: `mod_exp_001`, type: 'experience', title: '工作经历',
      visible: true, order: 3,
      items: d.experience.map((exp, i) => ({ id: `item_xp_00${i + 1}`, ...exp }))
    },
    {
      id: `mod_proj_001`, type: 'project', title: '项目经历',
      visible: true, order: 4,
      items: d.projects.map((prj, i) => ({ id: `item_prj_00${i + 1}`, ...prj }))
    },
    {
      id: `mod_work_001`, type: 'custom', title: '其他个人作品',
      visible: true, order: 5,
      items: d.otherWorks.map((w, i) => ({ id: `item_ow_00${i + 1}`, title: w.name, content: w.content }))
    },
    {
      id: `mod_str_001`, type: 'strength', title: '个人优势',
      visible: true, order: 6,
      items: d.strengths.map((s, i) => ({ id: `item_str_00${i + 1}`, title: s.title, content: s.content }))
    },
  ]
}

// ===== Default Document for New Model (AI Agent Engineer Template) =====
// Uses DEFAULT_RESUME_CONTENT as single source of truth
function createDefaultDocument(): ResumeDocument {
  const now = Date.now()
  let order = 0
  const d = DEFAULT_RESUME_CONTENT

  // Helper to create an element
  function el(type: ElementType, opts: Partial<ResumeElement> = {}): ResumeElement {
    return {
      id: `el_${now}_${order.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      parentId: null,
      order: order++,
      visible: true,
      layout: { mode: 'flow' },
      style: {},
      ...opts,
    }
  }

  // Helper to create a module with child items
  function mod(title: string, moduleType: ModuleType, children: ResumeElement[]): ResumeElement[] {
    const moduleId = `mod_${now}_${Math.random().toString(36).slice(2, 6)}`
    const moduleEl = el('module', {
      id: moduleId,
      content: title,
      title: title,
      moduleType,
    })
    // Assign parentId for children
    children.forEach(c => { c.parentId = moduleId })
    return [moduleEl, ...children]
  }

  // Helper: item with HTML content
  function itemHtml(html: string): ResumeElement {
    return el('item', { html })
  }

  // Helper: skill bar (single call, no duplication)
  function skillBar(name: string, _level: number): ResumeElement {
    return el('skill-bar', { content: name, style: { fontSize: 13 } })
  }

  // ════════════════════════════════════════════════
  // Build the full AI Agent Engineer resume
  // ════════════════════════════════════════════════

  const elements: ResumeElement[] = [
    // ── Name & Position (Heading) ──
    el('heading', {
      content: d.name,
      style: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 0 },
    }),
    el('text', {
      content: d.position,
      style: { fontSize: 16, color: '#6366f1', marginTop: 4, marginBottom: 12 },
    }),

    // ── Contact Info ──
    el('text', {
      content: `📱 ${d.phone}  |  ✉️ ${d.email}  |  📍 ${d.location}`,
      style: { fontSize: 12, color: '#666', marginBottom: 16 },
    }),

    // ── Divider ──
    el('divider'),

    // ── Personal Summary ──
    ...mod('个人总结', 'custom', [
      itemHtml(`<div style="font-size:14px;line-height:1.7;color:#444">${d.summary}</div>`),
    ]),

    // ── Education ──
    ...mod('教育经历', 'education', d.education.map(edu => itemHtml(
      `<div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <strong style="font-size:15px;color:#1a1a2e">${edu.school}</strong>
          <span style="font-size:12px;color:#888">${edu.dateRange}</span>
        </div>
        <div style="font-size:13px;color:#555;margin:2px 0">${edu.degree} · ${edu.major}</div>
        <ul style="font-size:13px;color:#555;line-height:1.7;margin-top:6px;padding-left:18px">
          ${edu.description.split('\n').map(line => `<li>${line.replace(/^•\s*/, '')}</li>`).join('')}
        </ul>
      </div>`
    ))),

    // ── Work Experience ──
    ...mod('工作经历', 'experience', d.experience.map(exp => itemHtml(
      `<div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <div><strong style="font-size:15px;color:#1a1a2e">${exp.company}</strong><span style="font-size:13px;color:#666;margin-left:8px">${exp.position}</span></div>
          <span style="font-size:12px;color:#888">${exp.dateRange}</span>
        </div>
        <ul style="font-size:13px;color:#444;line-height:1.75;margin-top:8px;padding-left:18px">
          ${exp.description.split('\n\n').map(block => `<li>${block.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`).join('')}
        </ul>
      </div>`
    ))),

    // ── Projects ──
    ...mod('项目经历', 'project', d.projects.map(prj => itemHtml(
      `<div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <strong style="font-size:15px;color:#1a1a2e">${prj.name}</strong>
          <span style="font-size:12px;color:#888">${prj.dateRange}</span>
        </div>
        <div style="font-size:12px;color:#6366f1;margin:2px 0">${prj.role}</div>
        <ul style="font-size:13px;color:#444;line-height:1.7;margin-top:6px;padding-left:18px">
          ${prj.description.split('\n\n').pop()?.split('\n').map(line => line.startsWith('•') ? `<li>${line.slice(1).trim()}</li>` : '').filter(Boolean).join('') || ''}
        </ul>
      </div>`
    ))),

    // ── Skills (list mode: 类别：关键词) ──
    ...mod('专业技能', 'skill', d.skills.map(sk => itemHtml(
      `<div style="font-size:13px;line-height:1.7;color:#444;margin-bottom:4px">
        <strong style="color:#1a1a2e">${sk.name}：</strong>${sk.content}
      </div>`
    ))),

    // ── Other Works (compact list) ──
    ...mod('其他个人作品', 'custom', d.otherWorks.map(w => itemHtml(
      `<div style="font-size:13px;line-height:1.7;color:#444;margin-bottom:3px">
        <strong style="color:#1a1a2e">${w.name}</strong> · ${w.content}
      </div>`
    ))),

    // ── Strengths (能力标签：量化事实) ──
    ...mod('个人优势', 'strength', d.strengths.map(s => itemHtml(
      `<div style="font-size:13px;line-height:1.7;color:#444;margin-bottom:4px">
        <strong style="color:#1a1a2e">${s.title}：</strong>${s.content}
      </div>`
    ))),
  ]

  return {
    meta: { version: '2.0', lastSaved: new Date().toISOString() },
    pages: [{
      id: 'page-1',
      elements,
      config: {
        width: 210, height: 297,
        marginTop: 12, marginRight: 12, marginBottom: 12, marginLeft: 12,
        background: '#ffffff',
      },
    }],
    theme: { id: 'indigo', name: 'Indigo', primaryColor: '#312E81', accentColor: '#6366F1' },
    globals: { elementDefaults: {} },
    schemaVersion: 2,
  }
}
export const THEME_PRESETS: ThemePreset[] = [
  {
    name: '青瓦', id: 'default',
    primaryColor: '#2D5F7C', accentColor: '#4A90B8',
    bgColor: '#F5F8FA', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#6B7B8D', borderColor: '#D8E2EA'
  },
  {
    name: '松烟', id: 'green',
    primaryColor: '#3A6B52', accentColor: '#5A9A78',
    bgColor: '#F4F8F5', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#6A7F72', borderColor: '#CDD9D2'
  },
  {
    name: '朱砂', id: 'wine',
    primaryColor: '#9B3A4A', accentColor: '#C25A6A',
    bgColor: '#FAF5F6', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#7D6B70', borderColor: '#E5D4D8'
  },
  {
    name: '墨石', id: 'dark',
    primaryColor: '#3D3D4E', accentColor: '#6366F1',
    bgColor: '#F5F5F8', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#6E6E80', borderColor: '#D8D8E2'
  },
  {
    name: '暮橘', id: 'orange',
    primaryColor: '#B45A1E', accentColor: '#D97706',
    bgColor: '#FFF9F0', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#7A6B5E', borderColor: '#F0DFC8'
  },
  {
    name: '鸢尾', id: 'indigo',
    primaryColor: '#4B48A0', accentColor: '#6366F1',
    bgColor: '#F6F5FF', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#7070A8', borderColor: '#DCDBF0'
  },
  {
    name: '竹青', id: 'teal',
    primaryColor: '#2D7D72', accentColor: '#14B8A6',
    bgColor: '#F2FAF8', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#6A8A85', borderColor: '#C8E0DC'
  },
  {
    name: '胭脂', id: 'rose',
    primaryColor: '#B03A5A', accentColor: '#E11D48',
    bgColor: '#FFF5F7', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#8A6B75', borderColor: '#F0D4DA'
  },
  {
    name: '藏蓝', id: 'navy',
    primaryColor: '#2A5090', accentColor: '#3B82F6',
    bgColor: '#F3F6FC', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#6A7FA0', borderColor: '#CCD8EC'
  },
  {
    name: '檀木', id: 'brown',
    primaryColor: '#6B4E3D', accentColor: '#A1887F',
    bgColor: '#F9F6F4', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#7A6E68', borderColor: '#E0D8D2'
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
    theme: 'default', primaryColor: '#2D5F7C', fontFamily: 'system-ui, -apple-system, sans-serif',
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

  // ---- New: Document Model (Phase 1 Refactor) ----
  const docRef = ref<ResumeDocument | null>(null)
  const useNewModel = ref(false)
  const selectedElementId = ref<string | null>(null)

  // ---- Templates ----
  const templates = ref<ResumeTemplate[]>([])

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

  // ---- New: Document Model Computed (Phase 1) ----
  const currentPage = computed<ResumePage | null>(() => {
    if (!docRef.value || docRef.value.pages.length === 0) return null
    return docRef.value.pages[0]
  })

  const getElements = computed<ResumeElement[]>(() => {
    if (!currentPage.value) return []
    // Only return top-level elements (children rendered inside their parent module)
    return [...currentPage.value.elements]
      .filter(el => el.parentId === null)
      .sort((a, b) => a.order - b.order)
  })

  const selectedElement = computed<ResumeElement | null>(() => {
    if (!selectedElementId.value || !docRef.value) return null
    for (const page of docRef.value.pages) {
      const found = page.elements.find(el => el.id === selectedElementId.value)
      if (found) return found
    }
    return null
  })

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
      personal: '{"name":"","phone":"","email":"","location":"","position":"","summary":""}',
      education: '{"school":"","degree":"","major":"","dateRange":"","description":""}',
      experience: '{"company":"","position":"","dateRange":"","description":""}',
      project: '{"name":"","role":"","dateRange":"","description":"","link":""}',
      skill: '{"name":"","content":""}',
      strength: '{"title":"","content":""}',
      custom: '{"title":"","content":""}',
    }
    const newItem: ModuleItem = { id: `item_${uuid()}`, ...JSON.parse(defaults[mod.type] || '{}') }
    if (mod.type === 'personal') {
      newItem.personalFields = createDefaultPersonalFields()
    }
    mod.items.push(newItem)
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
      project: '项目经历', skill: '技能特长', strength: '个人优势', custom: '自定义模块'
    }
    const defaultItems: Record<ModuleType, string> = {
      personal: '{"name":"","phone":"","email":"","location":"","position":"","summary":""}',
      education: '{"school":"","degree":"","major":"","dateRange":"","description":""}',
      experience: '{"company":"","position":"","dateRange":"","description":""}',
      project: '{"name":"","role":"","dateRange":"","description":"","link":""}',
      skill: '{"name":"","level":""}',
      strength: '{"title":"","content":""}',
      custom: '{"title":"","content":""}',
    }
    const newMod: ResumeModule = {
      id: `mod_${uuid()}`,
      type,
      title: title || typeNames[type],
      visible: true,
      order: modules.value.length,
      items: [{
        id: `item_${uuid()}`,
        ...JSON.parse(defaultItems[type]),
        ...(type === 'personal' ? { personalFields: createDefaultPersonalFields() } : {})
      }]
    }
    modules.value.push(newMod)
    return newMod.id
  }

  function toggleModuleVisibility(moduleId: string) {
    const mod = modules.value.find(m => m.id === moduleId)
    if (mod) mod.visible = !mod.visible
  }

  function toggleModuleTitle(moduleId: string) {
    const mod = modules.value.find(m => m.id === moduleId)
    if (mod) mod.hideTitle = !mod.hideTitle
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
      theme: 'default', primaryColor: '#2D5F7C', fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 14, lineHeight: 1.6, pageMargin: 20, titleStyle: 'underline'
    }
    avatar.value = { url: '', shape: 'circle' }
    modules.value = createDefaultModules()
    applyTheme('default')
  }

  // ---- New: Document Model Actions (Phase 1) ----

  function initDocument() {
    docRef.value = createDefaultDocument()
    useNewModel.value = true
  }

  function migrateToNewModel() {
    // Always rebuild from current modules to ensure latest data is migrated
    const oldData: ResumeData = {
      meta: { version: '1.0', lastSaved: lastSaved.value || new Date().toISOString() },
      config: config.value,
      avatar: avatar.value,
      modules: modules.value,
    }
    docRef.value = migrateResumeDataToDocument(oldData, THEME_PRESETS)
    useNewModel.value = true
  }

  function addElement(type: ElementType, parentId?: string | null, props?: Partial<ResumeElement>) {
    if (!docRef.value) return
    const page = docRef.value.pages[0]
    if (!page) return
    const ts = Date.now().toString(36)
    const rand = Math.random().toString(36).slice(2, 6)
    const newEl: ResumeElement = {
      id: `el_${ts}_${rand}`,
      type,
      parentId: parentId ?? null,
      order: page.elements.length,
      visible: true,
      layout: { mode: 'flow' as const },
      style: {},
      ...props,
    }
    page.elements.push(newEl)
    selectedElementId.value = newEl.id
  }

  function updateElement(id: string, updates: Partial<ResumeElement>) {
    if (!docRef.value) return
    for (const page of docRef.value.pages) {
      const el = page.elements.find(e => e.id === id)
      if (el) { Object.assign(el, updates); break }
    }
  }

  function removeElement(id: string) {
    if (!docRef.value) return
    for (const page of docRef.value.pages) {
      const idx = page.elements.findIndex(e => e.id === id)
      if (idx !== -1) {
        page.elements.splice(idx, 1)
        if (selectedElementId.value === id) selectedElementId.value = null
        break
      }
    }
  }

  function selectElement(id: string | null) {
    selectedElementId.value = id
  }

  // ---- Template Actions ----
  function saveAsTemplate(name: string) {
    const now = new Date().toISOString()
    const tpl: ResumeTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim() || `模板 ${templates.value.length + 1}`,
      createdAt: now,
      updatedAt: now,
      data: exportData(),
    }
    templates.value.push(tpl)
  }

  function deleteTemplate(id: string) {
    templates.value = templates.value.filter(t => t.id !== id)
  }

  function loadTemplate(id: string) {
    const tpl = templates.value.find(t => t.id === id)
    if (!tpl) return
    importData(tpl.data)
    lastSaved.value = tpl.updatedAt
  }

  function loadDefaultTemplate() {
    resetToDefault()
  }

  // ---- Personal Field Management ----
  function getPersonalItem(mod?: ResumeModule | null): ModuleItem | null {
    const m = mod || modules.value.find(x => x.type === 'personal')
    if (!m || !m.items.length) return null
    const item = m.items[0]
    // Ensure personalFields exists
    if (!item.personalFields || !Array.isArray(item.personalFields)) {
      item.personalFields = createDefaultPersonalFields()
    }
    return item
  }

  function getPersonalFields(mod?: ResumeModule | null): PersonalFieldConfig[] {
    const item = getPersonalItem(mod)
    if (!item || !item.personalFields) return []
    return [...item.personalFields].sort((a, b) => a.order - b.order)
  }

  function addPersonalField(label: string, icon?: string) {
    const personalMod = modules.value.find(x => x.type === 'personal')
    if (!personalMod) return
    const item = getPersonalItem(personalMod)
    if (!item) return
    const fields = item.personalFields as PersonalFieldConfig[]
    const key = `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`
    const newField: PersonalFieldConfig = {
      id: `pf_${key}`,
      key,
      label: label.trim() || '自定义字段',
      icon: icon || '',
      visible: true,
      order: fields.length,
      isBuiltin: false,
    }
    fields.push(newField)
    // Also add the key to the item data
    item[key] = ''
  }

  function removePersonalField(fieldId: string) {
    const personalMod = modules.value.find(x => x.type === 'personal')
    if (!personalMod) return
    const item = getPersonalItem(personalMod)
    if (!item) return
    const fields = item.personalFields as PersonalFieldConfig[]
    const idx = fields.findIndex(f => f.id === fieldId)
    if (idx < 0) return
    const field = fields[idx]
    // Don't allow removing builtin fields
    if (field.isBuiltin) return
    fields.splice(idx, 1)
    // Remove data key from item
    delete item[field.key]
  }

  function reorderPersonalFields(newOrder: PersonalFieldConfig[]) {
    const personalMod = modules.value.find(x => x.type === 'personal')
    if (!personalMod) return
    const item = getPersonalItem(personalMod)
    if (!item) return
    const fields = item.personalFields as PersonalFieldConfig[]
    newOrder.forEach((f, idx) => {
      const original = fields.find(o => o.id === f.id)
      if (original) original.order = idx
    })
  }

  function togglePersonalFieldVisibility(fieldId: string) {
    const personalMod = modules.value.find(x => x.type === 'personal')
    if (!personalMod) return
    const item = getPersonalItem(personalMod)
    if (!item) return
    const fields = item.personalFields as PersonalFieldConfig[]
    const field = fields.find(f => f.id === fieldId)
    if (field) field.visible = !field.visible
  }

  function updatePersonalFieldIcon(fieldId: string, icon: string) {
    const personalMod = modules.value.find(x => x.type === 'personal')
    if (!personalMod) return
    const item = getPersonalItem(personalMod)
    if (!item) return
    const fields = item.personalFields as PersonalFieldConfig[]
    const field = fields.find(f => f.id === fieldId)
    if (field) field.icon = icon
  }

  function updatePersonalFieldLabel(fieldId: string, label: string) {
    const personalMod = modules.value.find(x => x.type === 'personal')
    if (!personalMod) return
    const item = getPersonalItem(personalMod)
    if (!item) return
    const fields = item.personalFields as PersonalFieldConfig[]
    const field = fields.find(f => f.id === fieldId)
    if (field) field.label = label
  }

  return {
    // Phase 1 新文档模型状态
    config, avatar, modules, lastSaved,
    docRef, useNewModel, selectedElementId,
    selectedModuleId, currentPhase, saveStatus,
    selectedModule,
    // Phase 1 新 computed
    currentPage, getElements, selectedElement,
    visibleModules, charCount,
    completionByModule, overallCompletion, emptyModuleCount,
    canUndo, canRedo,
    selectModule, setPhase, markSaving,
    applyTheme, applyCssVars, applyCssVarsFromConfig, setPrimaryColor, setTitleStyle,
    updateModule, updateItem, addItem, removeItem,
    duplicateItem, moveItem, removeModule, addModule,
    toggleModuleVisibility, toggleModuleTitle, reorderModules, setAvatar,
    undo, redo,
    exportData, importData, resetToDefault,
    // Phase 1 新 actions
    initDocument, migrateToNewModel, addElement, updateElement, removeElement, selectElement,
    // Template actions
    templates, saveAsTemplate, deleteTemplate, loadTemplate, loadDefaultTemplate,
    // Personal field management
    getPersonalItem, getPersonalFields,
    addPersonalField, removePersonalField, reorderPersonalFields,
    togglePersonalFieldVisibility, updatePersonalFieldIcon, updatePersonalFieldLabel,
  }
}, {
  persist: {
    key: 'resume-editor-data',
    storage: localStorage,
    pick: ['config', 'avatar', 'modules', 'lastSaved', 'selectedModuleId', 'currentPhase', 'docRef', 'useNewModel', 'selectedElementId', 'templates']
  }
})
