import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  ResumeData, ResumeModule, ResumeConfig, AvatarConfig, ThemePreset, ModuleItem, ModuleType,
  ResumeDocument, ResumePage, ResumeElement, ElementType, ResumeTemplate, ResumeVersion, PersonalFieldConfig,
} from '../types'
import { migrateResumeDataToDocument } from '../types'
import { showConfirm } from '../utils/confirm'

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
export function generateColorScale(baseColor: string): Record<string, string> {
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

// ===== Content Version for Migration =====
// Bump this when updating default template content format
const CURRENT_CONTENT_VERSION = 2

// ===== Shared Default Resume Data =====
// Single source of truth for default template content
// Organized following the "codefather" resume structure:
// 个人信息 → 教育经历 → 专业技能 → 工作经历 → 项目经历 → 个人优势
const DEFAULT_RESUME_CONTENT = {
  name: '李鱼皮',
  position: 'Java 后端 + AI 应用开发｜3 年工作经验',
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

  // 专业技能：「类别 + 分点列表」格式
  skills: [
    { name: '开发技术', content: '1. Java8~26 新特性、集合框架、反射、动态代理\n2. Spring Boot3 + MyBatis-Plus、Spring Cloud 微服务\n3. MySQL 数据库设计 / SQL 调优 / 分库分表 / 索引优化 / Druid 监控\n4. Redis 缓存中间件、Caffeine 多级缓存、分布式锁、缓存雪崩/穿透解决方案\n5. Docker 容器化 + Nginx 反向代理部署、Dockerfile 打包、Serverless 上线\n6. Prometheus + Grafana + 阿里云 ARMS 监控告警、JVM 诊断大盘\n7. SEO / 搜索引擎优化 / GEO 生成式引擎优化 / TDK 优化 / AI 推荐排名' },
    { name: 'AI 应用开发', content: '1. Spring AI、LangChain4j、RAG、MCP、多 Agent 协作\n2. Prompt 工程、PGvector 向量数据库、ETL、文档检索增强\n3. Cursor / Claude Code / GitHub Copilot / MCP Server / Agent Skills\n4. Vibe Coding / SDD / Harness Engineering / Spec-Kit / OpenSpec' },
    { name: '前端工程化', content: '1. React 18+：Hooks、Context、Suspense、Error Boundaries、并发特性\n2. Next.js：SSR/SSG/ISR，API Routes，中间件，国际化，Image 优化\n3. 构建工具：Webpack 配置优化、Vite 插件开发、ESBuild 接入\n4. 性能优化：首屏加载时间优化、LCP/FID/CLS 指标监控与治理、虚拟滚动\n5. 跨端与兼容：Taro 小程序开发，响应式设计，多浏览器兼容' },
  ],

  experience: [
    {
      company: '老鱼公司', position: 'Java 后端 + AI 应用开发',
      dateRange: '2023-04 ~ 至今',
      description: '负责产品：编程导航 codefather.cn（日活 20K 的程序员学习社区）、面试鸭 mianshiya.com（日活 15K 的面试刷题平台）\n\n主要工作：\n1. 独立完成从需求分析、技术选型、后端开发到部署上线的全流程，支撑共计日均 PV 35K+ 产品的稳定运行\n2. 基于 Spring Cloud 微服务架构搭建统一支付中心，封装支付宝、微信支付、Apple Pay 等多渠道接口，2 小时内完成接入四端支付\n3. 主导统一搜索服务，基于 ElasticSearch + IK 分词 + 热度权重 + 时间衰减因子，搜索结果点击率提升 35%\n4. 构建知识库体系，支持文字 + 视频教程结构化阅读、学习进度追踪、AI 互动式学习；集成 RAG 知识库问答功能\n5. 搭建三层内容风控审核系统（AI 模型 + 规则引擎 + 人工复审），违规内容拦截率提升至 98%\n6. 搭建 Prometheus + Grafana + 阿里云 ARMS 监控体系，实现分布式链路追踪（TraceID），系统故障发现时间从小时级缩短至分钟级\n7. 使用 ElasticSearch + IK 分词 + 热度权重 + 时间衰减因子构建搜索服务；基于 Redis + Caffeine 多级缓存提升接口响应速度\n8. 主导 AI 方向技术选型和落地，基于 Spring AI + LangChain4j 实现 RAG 知识库问答、AI 互动式学习等功能'
    },
  ],

  // 项目经历：编号列表分点展示，清晰有重点
  projects: [
    {
      name: 'AI 超级智能体（AI Agent 项目）',
      role: '技术负责人 / 核心开发者',
      dateRange: '',
      description: '线上访问：codefather.cn｜GitHub 开源：github.com/liyupi/yu-ai-agent\n\n基于 Spring Boot3 + Spring AI + RAG + MCP 的企业级 AI 智能体，支持多轮对话、记忆持久化、RAG 知识库检索、ReAct 模式自主推理与工具调用，能完成联网搜索、资源下载、PDF 生成、自定义规划等任务。\n\n主要工作：\n1. 基于 Spring AI 框架集成通义、Ollama 等 5 种大模型，统一 API 接口实现灵活切换；Ollama 本地部署处理简单对话，API 调用成本降低 60%\n2. 实现多轮对话记忆功能，基于 Spring AI 的 ChatMemory + Advisor 机制，采用 MySQL + Redis + Kryo 高性能序列化存储，重启后对话恢复率 >99%\n3. 基于 Spring AI 构建完整 RAG 知识库，支持 ETL 处理、PGvector 向量存储、元数据自动打标、多路查询扩展和查询重写，问答准确率比纯模型提升 45%\n4. 通过 @Tool 注解实现联网搜索、页面爬取、PDF 生成、资源下载等 6 种工具，单模型部署即可完成复杂任务；ToolContext 参数校验防止工具链无效执行\n5. 开发基于 Stdio + SSE 传输的图搜 MCP 服务，无服务器部署，支持被其他 AI 项目灵活集成\n6. 参考 OpenManus 设计 Human-in-the-Loop 分层架构，包含步数限制、状态管理和死锁检测机制，保障系统稳定运行\n7. 使用 SseEmitter + CompletableFuture 实现异步 SSE 流式接口，实时输出智能思考和执行过程，用户等待时间缩短 80%；自定义 SSE 数据格式避免编码和字符丢失问题',
      link: 'github.com/liyupi/yu-ai-agent'
    },
    {
      name: 'AI 热点监控工具（AI 应用开发项目）',
      role: '全栈开发 / 独立项目',
      dateRange: '',
      description: '线上访问：codefather.cn｜GitHub 开源：github.com/liyupi/yupi-hot-monitor\n\n基于 Express5 + React19 + OpenRouter + Socket.io 的 AI 热点监控工具，支持多源数据聚合、AI 内容审核、WebSocket 实时推送，可复用于 Cursor / GitHub Copilot 等 AI 编程工具。\n\n主要工作：\n1. 使用 GitHub Copilot + MCP + Agent Skills 进行 AI 辅助开发，遵循企业级 AI 工程化开发流程；90%+ 代码由 AI 生成，显著提升开发效率\n2. 实现 Bing、HackerNews、百度等多源爬虫，基于 Axios + Cheerio；接入第三方 API 实现 Twitter 高级搜索；人工标注样本，数据覆盖度提升 5 倍\n3. 集成 OpenRouter 接入 AI 模型，设计结构化分析 Prompt，进行时效性验证、相关性评分、重要性分类和智能摘要；人工标注测试数据，过滤准确率 >90%\n4. 利用 AI 模型扩展关键词（5~15 个语义变体），召回率提升 300%+；本地缓存避免冗余调用，节省 AI API 费用\n5. 基于 Socket.io 实现事件驱动的关键词订阅，新热点采集后毫秒级推送到订阅客户端\n6. 使用 Skill Creator 将热点监控能力封装为标准化 Agent Skills，集成 10+ 主流 AI 工具，无需后端服务即可开放使用',
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
  },
  {
    name: '黛蓝', id: 'slate',
    primaryColor: '#334155', accentColor: '#64748B',
    bgColor: '#F6F8FA', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#64748B', borderColor: '#D6DEE7'
  },
  {
    name: '石墨', id: 'graphite',
    primaryColor: '#2B2B2B', accentColor: '#555555',
    bgColor: '#F6F6F6', surfaceColor: '#FFFFFF',
    textPrimary: '#2B2B2B', textSecondary: '#6B6B6B', borderColor: '#DBDBDB'
  },
  {
    name: '深海', id: 'ocean',
    primaryColor: '#155E75', accentColor: '#0891B2',
    bgColor: '#F1F9FB', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#5F8896', borderColor: '#C7E1E8'
  },
  {
    name: '钴蓝', id: 'cobalt',
    primaryColor: '#1E4FA3', accentColor: '#2563EB',
    bgColor: '#F2F6FD', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#6178A0', borderColor: '#CBD9F0'
  },
  {
    name: '天青', id: 'sky',
    primaryColor: '#0369A1', accentColor: '#0EA5E9',
    bgColor: '#F0F8FE', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#5C86A0', borderColor: '#C6E0F2'
  },
  {
    name: '松柏', id: 'pine',
    primaryColor: '#1F5D46', accentColor: '#10B981',
    bgColor: '#F1F9F5', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#5F8676', borderColor: '#C7E3D6'
  },
  {
    name: '橄榄', id: 'olive',
    primaryColor: '#5A6B2D', accentColor: '#7B8C3A',
    bgColor: '#F8F9F1', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#77805F', borderColor: '#DDE2CC'
  },
  {
    name: '琥珀', id: 'amber',
    primaryColor: '#A16207', accentColor: '#D97706',
    bgColor: '#FDFAF0', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#867758', borderColor: '#ECE0C4'
  },
  {
    name: '赤陶', id: 'terracotta',
    primaryColor: '#9A3412', accentColor: '#C2410C',
    bgColor: '#FDF6F2', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#8A6A5E', borderColor: '#EED7CB'
  },
  {
    name: '绛紫', id: 'plum',
    primaryColor: '#6D28D9', accentColor: '#8B5CF6',
    bgColor: '#F8F5FE', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#7A6E96', borderColor: '#DFD5F2'
  },
  {
    name: '梅红', id: 'magenta',
    primaryColor: '#A21A73', accentColor: '#DB2777',
    bgColor: '#FDF4FA', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#8A6480', borderColor: '#EFD3E6'
  },
  {
    name: '青碧', id: 'cyan',
    primaryColor: '#0E7490', accentColor: '#06B6D4',
    bgColor: '#F0FAFC', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#5F8A93', borderColor: '#C6E5EB'
  },
  {
    name: '青灰', id: 'steel',
    primaryColor: '#3F5261', accentColor: '#607789',
    bgColor: '#F5F7F9', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#66788A', borderColor: '#D5DDE4'
  },
  {
    name: '枫叶', id: 'maple',
    primaryColor: '#B91C1C', accentColor: '#DC2626',
    bgColor: '#FEF4F4', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#8A6666', borderColor: '#F0D2D2'
  },
  {
    name: '黄栌', id: 'gold',
    primaryColor: '#8A6D0E', accentColor: '#CA8A04',
    bgColor: '#FCFAF0', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#847653', borderColor: '#EAE0C2'
  },
  {
    name: '靛青', id: 'denim',
    primaryColor: '#3730A3', accentColor: '#4F46E5',
    bgColor: '#F4F4FD', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#6E6E9E', borderColor: '#D5D4EF'
  },
  {
    name: '碧螺', id: 'emerald',
    primaryColor: '#047857', accentColor: '#059669',
    bgColor: '#F0FAF5', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#5F8776', borderColor: '#C6E4D5'
  },
  {
    name: '沙褐', id: 'sand',
    primaryColor: '#7C5E3B', accentColor: '#A87C4F',
    bgColor: '#FAF7F2', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#7E7160', borderColor: '#E4DBCC'
  },
  {
    name: '莓紫', id: 'mulberry',
    primaryColor: '#86198F', accentColor: '#A21CAF',
    bgColor: '#FBF4FC', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#82688A', borderColor: '#EAD3EE'
  },
  {
    name: '墨绿', id: 'forest',
    primaryColor: '#14532D', accentColor: '#15803D',
    bgColor: '#F1F8F3', surfaceColor: '#FFFFFF',
    textPrimary: '#333333', textSecondary: '#5D7A66', borderColor: '#C9E2D0'
  }
]

// ===== Font Presets (字体预设) =====
// 集中管理可选字体，简历编辑器与「字体测试」对比对话框共用。
export interface FontPreset {
  name: string   // 显示名
  value: string  // 应用到 --font-family 的 CSS 值
}
export const FONT_PRESETS: FontPreset[] = [
  { name: '系统默认', value: 'system-ui, -apple-system, sans-serif' },
  { name: '微软雅黑', value: "'Microsoft YaHei', 'PingFang SC', sans-serif" },
  { name: '苹方', value: "'PingFang SC', sans-serif" },
  { name: '思源黑体', value: "'Source Han Sans SC', 'Noto Sans SC', sans-serif" },
  { name: '宋体', value: "'Songti SC', 'SimSun', serif" },
  { name: '思源宋体', value: "'Source Han Serif SC', 'Noto Serif SC', serif" },
  { name: '黑体', value: "'SimHei', 'Heiti SC', sans-serif" },
  { name: '楷体', value: "'Kaiti SC', 'KaiTi', serif" },
  { name: '仿宋', value: "'FangSong', 'STFangsong', serif" },
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { name: 'Helvetica', value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { name: 'Garamond', value: "'EB Garamond', Garamond, serif" },
  { name: 'Calibri', value: "Calibri, 'Segoe UI', sans-serif" },
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
  const contentVersion = ref<number>(CURRENT_CONTENT_VERSION)
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

  // ---- Resume Versions (multi-resume per job) ----
  const versions = ref<ResumeVersion[]>([])
  const activeVersionId = ref<string | null>(null)

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

  function setFontFamily(font: string) {
    config.value.fontFamily = font
    document.documentElement.style.setProperty('--font-family', font)
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

  async function removeModule(moduleId: string) {
    const ok = await showConfirm({
      title: '删除模块',
      description: '确定要删除整个模块吗？此操作不可撤销。',
    })
    if (!ok) return
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
    config.value = { ...config.value }
    avatar.value = { ...avatar.value }
    modules.value = createDefaultModules()
    contentVersion.value = CURRENT_CONTENT_VERSION
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

  // ---- Resume Version Actions (multi-resume per job) ----
  function saveVersion(name: string): string {
    const id = `ver_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const now = new Date().toISOString()
    versions.value.push({
      id,
      name: name.trim() || `版本 ${versions.value.length + 1}`,
      data: exportData(),
      createdAt: now,
      updatedAt: now,
    })
    activeVersionId.value = id
    return id
  }

  function updateActiveVersion() {
    const id = activeVersionId.value
    if (!id) return
    const v = versions.value.find(x => x.id === id)
    if (v) {
      v.data = exportData()
      v.updatedAt = new Date().toISOString()
    }
  }

  function loadVersion(id: string) {
    const v = versions.value.find(x => x.id === id)
    if (!v) return
    importData(v.data)
    activeVersionId.value = id
    applyCssVarsFromConfig()
  }

  function deleteVersion(id: string) {
    versions.value = versions.value.filter(x => x.id !== id)
    if (activeVersionId.value === id) activeVersionId.value = null
  }

  function renameVersion(id: string, name: string) {
    const v = versions.value.find(x => x.id === id)
    if (v) v.name = name.trim() || v.name
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
    applyTheme, applyCssVars, applyCssVarsFromConfig, setPrimaryColor, setTitleStyle, setFontFamily,
    updateModule, updateItem, addItem, removeItem,
    duplicateItem, moveItem, removeModule, addModule,
    toggleModuleVisibility, toggleModuleTitle, reorderModules, setAvatar,
    undo, redo,
    exportData, importData, resetToDefault,
    // Phase 1 新 actions
    initDocument, migrateToNewModel, addElement, updateElement, removeElement, selectElement,
    // Template actions
    templates, saveAsTemplate, deleteTemplate, loadTemplate, loadDefaultTemplate,
    // Resume version actions
    versions, activeVersionId, saveVersion, updateActiveVersion, loadVersion, deleteVersion, renameVersion,
    // Personal field management
    getPersonalItem, getPersonalFields,
    addPersonalField, removePersonalField, reorderPersonalFields,
    togglePersonalFieldVisibility, updatePersonalFieldIcon, updatePersonalFieldLabel,
  }
}, {
  persist: {
    key: 'resume-editor-data',
    storage: localStorage,
    pick: ['config', 'avatar', 'modules', 'lastSaved', 'selectedModuleId', 'currentPhase', 'docRef', 'useNewModel', 'selectedElementId', 'templates', 'contentVersion', 'versions', 'activeVersionId'],
    afterHydrate: (ctx: any) => {
      // Migrate old persisted data to new content format
      const version = ctx.store.contentVersion ?? 0
      if (version < CURRENT_CONTENT_VERSION) {
        const freshModules = createDefaultModules()
        ctx.store.modules = freshModules
        ctx.store.contentVersion = CURRENT_CONTENT_VERSION
      }
    }
  }
})
