import type { ResumeData, ResumeModule, ResumeConfig } from '../types'

/**
 * 分行业专业简历模板
 * 每个模板都是一份完整的 ResumeData，可通过 store.importData() 直接套用。
 * 描述字段使用纯文本格式（与现有导入路径一致）：
 *   • 项目符号列表，数字编号列表，**加粗**，换行 \n。
 *
 * category 用于模板库分类筛选。
 *
 * 内容遵循「程序员简历优化规范」：
 *   • 个人信息去掉「N 年经验」，职位写强标题；
 *   • 新增「个人优势」模块（真实、客观、具体、非人人都具备，量化）；
 *   • 专业技能按维度展开，用「熟练掌握 / 深入理解」；
 *   • 项目经历：技术栈单列 + 4~7 条「动词 + 技术 + 成果」并量化；
 *   • 工作经历：动词 + 技术 + 成果，带量化指标。
 */

export interface BuiltInTemplate {
  id: string
  name: string
  industry: string // 行业标签
  icon: string // emoji 图标
  color: string // 主题色（与 config.primaryColor 一致）
  description: string // 一句话亮点
  category: string // 分类（技术 / 设计 / 产品运营 / 职能 / 通用）
  data: ResumeData
}

// ── id 生成（避免多模板 id 冲突） ──
let _uid = 0
const nid = (p: string) => `${p}_${Date.now().toString(36)}_${(_uid++).toString(36)}`

interface Edu { school: string; degree: string; major: string; dateRange: string; description: string }
interface Exp { company: string; position: string; dateRange: string; description: string }
interface Proj { name: string; role: string; dateRange: string; description: string; link?: string }
interface Skill { name: string; content: string }
interface Strength { title: string; content: string }
interface Custom { title: string; content: string }

interface TplInput {
  name: string
  position: string
  phone: string
  email: string
  location: string
  summary: string
  education: Edu[]
  strengths: Strength[] // 个人优势（量化、具体）
  experience: Exp[]
  projects: Proj[]
  skills: Skill[]
  custom: Custom[]
}

// 模块顺序：个人信息 → 教育 → 个人优势 → 专业技能 → 工作经历 → 项目经历 → 其他
function buildData(input: TplInput, color: string, config: Partial<ResumeConfig> = {}): ResumeData {
  const cfg: ResumeConfig = {
    theme: 'custom',
    primaryColor: color,
    fontFamily: config.fontFamily ?? 'system-ui, -apple-system, sans-serif',
    fontSize: config.fontSize ?? 14,
    lineHeight: config.lineHeight ?? 1.6,
    pageMargin: config.pageMargin ?? 20,
    marginTop: config.marginTop ?? 12,
    marginRight: config.marginRight ?? 12,
    marginBottom: config.marginBottom ?? 12,
    marginLeft: config.marginLeft ?? 12,
    titleStyle: (config.titleStyle ?? 'underline') as ResumeConfig['titleStyle'],
    moduleGap: config.moduleGap ?? 16,
    itemGap: config.itemGap ?? 8,
    underlineWidth: config.underlineWidth ?? 2,
  }
  const modules: ResumeModule[] = [
    {
      id: nid('mod'), type: 'personal', title: '个人信息', visible: true, order: 0,
      items: [{ id: nid('item'), name: input.name, phone: input.phone, email: input.email, location: input.location, position: input.position, summary: input.summary }],
    },
    {
      id: nid('mod'), type: 'education', title: '教育经历', visible: true, order: 1,
      items: input.education.map(e => ({ id: nid('item'), ...e })),
    },
    {
      id: nid('mod'), type: 'strength', title: '个人优势', visible: true, order: 2,
      items: input.strengths.map(s => ({ id: nid('item'), title: s.title, content: s.content })),
    },
    {
      id: nid('mod'), type: 'skill', title: '专业技能', visible: true, order: 3, displayMode: 'list',
      items: input.skills.map(s => ({ id: nid('item'), name: s.name, content: s.content })),
    },
    {
      id: nid('mod'), type: 'experience', title: '工作经历', visible: true, order: 4,
      items: input.experience.map(e => ({ id: nid('item'), ...e })),
    },
    {
      id: nid('mod'), type: 'project', title: '项目经历', visible: true, order: 5,
      items: input.projects.map(p => ({ id: nid('item'), ...p })),
    },
    {
      id: nid('mod'), type: 'custom', title: '荣誉奖项 & 其他', visible: true, order: 6,
      items: input.custom.map(c => ({ id: nid('item'), title: c.title, content: c.content })),
    },
  ]
  return {
    meta: { version: '1.0', lastSaved: new Date().toISOString() },
    config: cfg,
    avatar: { url: '', shape: 'circle' },
    modules,
  }
}

function mk(
  meta: { id: string; name: string; industry: string; icon: string; description: string; category: string },
  color: string,
  input: TplInput,
  config: Partial<ResumeConfig> = {},
): BuiltInTemplate {
  return {
    id: meta.id,
    name: meta.name,
    industry: meta.industry,
    icon: meta.icon,
    color,
    description: meta.description,
    category: meta.category,
    data: buildData(input, color, config),
  }
}

// ══════════════════════════════════════════════════════════════
// 1. 后端开发
// ══════════════════════════════════════════════════════════════
const backend = mk(
  { id: 'tpl_backend', name: '后端开发工程师', industry: '后端 / Backend', icon: '💻', description: '高并发、分布式、微服务架构', category: '互联网技术' },
  '#2563eb',
  {
    name: '陈思源', position: 'Java 后端工程师', phone: '138-0000-8866', email: 'siyuan.chen@example.com', location: '杭州市余杭区',
    summary: '专注高并发、分布式系统与微服务架构，主导过日活百万级系统的性能优化与稳定性建设。',
    education: [
      { school: '浙江大学', degree: '本科', major: '软件工程', dateRange: '2018.09 ~ 2022.06', description: '• GPA 3.7/4.0，专业排名前 10%\n• ACM 校赛金奖\n• 毕业设计：基于 Redis 的分布式锁中间件' },
    ],
    strengths: [
      { title: '高并发架构', content: '主导日活百万级推荐系统后端，P99 延迟从 120ms 降至 45ms' },
      { title: '性能与稳定', content: '设计多级缓存方案，核心接口 QPS 提升 5 倍、数据库压力下降 70%，大促零故障' },
      { title: '工程影响力', content: '自研分布式锁中间件开源 Star 2k+，被 30+ 业务线复用' },
    ],
    skills: [
      { name: '后端框架', content: '熟练掌握 Spring Boot / Spring Cloud，深入理解 Dubbo 服务治理与 SPI 机制' },
      { name: '数据库', content: '深入理解 MySQL 索引与分库分表，熟练掌握 Redis 缓存设计与 MongoDB / ES 检索' },
      { name: '中间件', content: '熟练掌握 RocketMQ / Kafka 削峰填谷，深入理解 Nacos 注册发现与 Sentinel 限流' },
      { name: '工程与运维', content: '熟练掌握 Docker / K8s 部署、JVM 调优与 Jenkins CI/CD' },
      { name: '网络与分布式', content: '深入理解 TCP/IP、HTTP 与分布式事务（Seata / TCC）' },
    ],
    experience: [
      { company: '字节跳动', position: '高级后端工程师', dateRange: '2022.07 ~ 至今', description: '• 使用 Spring Cloud + Dubbo **重构单体架构为微服务**，发布效率提升 3 倍\n• 设计 Redis + Caffeine 多级缓存，核心接口 QPS 提升 5 倍，数据库压力下降 70%\n• 搭建 Prometheus + Grafana 全链路监控，大促期间零故障\n• 主导推荐系统后端，日均处理请求 20 亿+，P99 延迟从 120ms 降至 45ms' },
      { company: '美团', position: '后端开发工程师', dateRange: '2021.07 ~ 2022.06', description: '• 负责外卖商家端服务，使用 Kafka 削峰填谷，峰值吞吐提升 4 倍，支撑日均千万级订单\n• 优化慢 SQL 200+ 条，核心查询耗时从 800ms 降至 80ms' },
    ],
    projects: [
      { name: '分布式秒杀系统', role: '技术负责人', dateRange: '2023.03 ~ 2023.08', description: '技术栈：Redis + Lua + RocketMQ + Spring Boot\n• 使用 Redis + Lua 设计库存预热与令牌桶限流，支撑单场 100 万 QPS，超卖率 0\n• 通过本地缓存 + 异步扣减，下单成功率提升至 99.99%\n• 落地全链路压测，压测效率提升 3 倍，保障大促稳定\n• 输出高并发设计文档，成为团队标准实践', link: 'github.com/example/seckill' },
      { name: '统一鉴权网关', role: '核心开发者', dateRange: '2022.10 ~ 2023.02', description: '技术栈：Spring Cloud Gateway + JWT + OAuth2 + Sentinel\n• 使用 Gateway 集成 JWT + OAuth2，支撑 30+ 微服务统一鉴权，接入成本下降 80%\n• 基于 Sentinel 实现热点参数限流，恶意请求拦截率 99%\n• 沉淀网关 SDK，新服务鉴权接入从 2 天缩短至 2 小时', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 字节跳动 2023 年度技术之星\n• 美团 优秀新人奖' },
      { title: '🌐 其他', content: '• 英语 CET-6，可流畅阅读英文技术文档\n• 技术博客累计阅读 10w+' },
    ],
  },
  { titleStyle: 'underline' },
)

// ══════════════════════════════════════════════════════════════
// 2. 前端开发
// ══════════════════════════════════════════════════════════════
const frontend = mk(
  { id: 'tpl_frontend', name: '前端开发工程师', industry: '前端 / Frontend', icon: '🎨', description: '工程化、性能优化、可视化', category: '互联网技术' },
  '#0891b2',
  {
    name: '林晚', position: '高级前端工程师', phone: '138-0000-5521', email: 'wan.lin@example.com', location: '上海市徐汇区',
    summary: '精通 React / Vue 生态与前端工程化，擅长性能优化、可视化与跨端开发，主导过百万级 Web 应用架构升级。',
    education: [
      { school: '南京大学', degree: '本科', major: '计算机科学与技术', dateRange: '2017.09 ~ 2021.06', description: '• GPA 3.8/4.0\n• 校前端开源社区发起人\n• 毕业设计：基于 WebGL 的数据可视化引擎' },
    ],
    strengths: [
      { title: '性能优化', content: '主导电商中台首屏从 3.2s 优化至 1.1s，LCP 指标行业领先' },
      { title: '工程化体系', content: '建设组件库与 CLI 脚手架，重复开发工作量减少 60%' },
      { title: '架构与体验', content: '主导微前端整合 12 条业务线，发布效率提升 40%，线上故障率下降 50%' },
    ],
    skills: [
      { name: '前端框架', content: '熟练掌握 React 18 / Vue 3 原理，深入理解 Next.js / Nuxt SSR 与 TypeScript 类型系统' },
      { name: '工程化', content: '熟练掌握 Vite / Webpack 构建，深入理解 Monorepo（pnpm/turborepo）与 CI/CD 流水线' },
      { name: '可视化', content: '熟练掌握 ECharts / D3.js，深入理解 WebGL / Three.js 渲染与 Canvas 性能优化' },
      { name: '性能优化', content: '深入理解首屏优化、虚拟列表与骨架屏，熟练治理 LCP / FID / CLS' },
      { name: '跨端与 AI 编程', content: '熟练掌握 Taro / Electron 跨端，日常使用 AI 编程助手提效' },
    ],
    experience: [
      { company: '阿里巴巴', position: '高级前端工程师', dateRange: '2021.07 ~ 至今', description: '• 使用 qiankun 主导微前端架构，整合 12 条业务线，发布效率提升 40%\n• 优化电商中台首屏加载从 3.2s 至 1.1s，保障双十一 50 万 QPS 峰值\n• 建设组件库与 CLI 脚手架，重复开发工作量减少 60%\n• 落地前端监控与灰度发布，线上故障率下降 50%' },
      { company: '小红书', position: '前端开发工程师', dateRange: '2020.07 ~ 2021.06', description: '• 负责社区信息流前端，LCP 指标优化 35%\n• 搭建可视化搭建平台，运营活动页产出效率提升 5 倍' },
    ],
    projects: [
      { name: '数据可视化大屏', role: '技术负责人', dateRange: '2023.01 ~ 2023.06', description: '技术栈：React + ECharts + WebSocket + Canvas\n• 使用 WebSocket 实现万级数据点实时推送，帧率稳定 60fps\n• 设计多主题与自适应布局，覆盖 8 块大屏，运营配置效率提升 70%\n• 封装通用图表 Hook，复用率 90%，开发工时下降一半\n• 支撑双十一实时战报，零卡顿通过流量峰值', link: 'github.com/example/dashboard' },
      { name: '低代码搭建平台', role: '核心开发者', dateRange: '2022.03 ~ 2022.10', description: '技术栈：Vue 3 + Schema 驱动 + Vite\n• 使用 Schema 驱动渲染引擎，沉淀 80+ 业务组件\n• 活动页开发从 3 天缩短至 2 小时，年省 200+ 人天\n• 设计物料市场与权限体系，支撑 20+ 团队自助搭建', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 阿里 2023 前端技术大奖\n• 开源 UI 库 Star 5k+' },
      { title: '🌐 其他', content: '• 英语可胜任英文技术文档与跨团队沟通' },
    ],
  },
  { titleStyle: 'leftbar', fontFamily: "'PingFang SC', sans-serif" },
)

// ══════════════════════════════════════════════════════════════
// 3. AI / Agent
// ══════════════════════════════════════════════════════════════
const agent = mk(
  { id: 'tpl_agent', name: 'AI Agent 工程师', industry: 'AI / Agent', icon: '🤖', description: '大模型应用、RAG、多 Agent 编排', category: '互联网技术' },
  '#7c3aed',
  {
    name: '苏明哲', position: 'AI Agent 应用工程师', phone: '138-0000-3120', email: 'mingzhe.su@example.com', location: '深圳市南山区',
    summary: '专注大模型应用与 Agent 系统落地，擅长 RAG、Tool Use 与多 Agent 编排，追求「让 AI 真正可用」的产品体验。',
    education: [
      { school: '上海交通大学', degree: '硕士', major: '计算机科学与技术（NLP）', dateRange: '2020.09 ~ 2023.06', description: '• 研究方向：检索增强生成（RAG）\n• 发表 ACL 论文 1 篇\n• 国家奖学金' },
    ],
    strengths: [
      { title: 'RAG 工程', content: '自研混合检索 + 重排管线，幻觉率降至 <3%，问答准确率 92%' },
      { title: '多 Agent 编排', content: '设计 Multi-Agent 框架，复杂任务完成率从 45% 提升至 80%' },
      { title: '研发提效', content: '落地 AI 编程助手，团队研发人效提升约 30%' },
    ],
    skills: [
      { name: '大模型 & Agent', content: '熟练掌握 Prompt Engineering、Function Calling，深入理解 RAG 与 Multi-Agent 编排' },
      { name: '框架', content: '熟练掌握 LangChain / LangGraph / LlamaIndex，深入理解 CrewAI / Dify 工作流' },
      { name: '后端', content: '熟练掌握 Python / FastAPI、Node.js、Go 服务开发' },
      { name: '向量与检索', content: '熟练掌握 Milvus / Pinecone，深入理解混合检索与重排序' },
      { name: '工程与微调', content: '熟练掌握 Docker / K8s 部署与 vLLM 推理，深入理解 LoRA / SFT 微调' },
    ],
    experience: [
      { company: '腾讯', position: '高级 AI 工程师', dateRange: '2023.07 ~ 至今', description: '• 主导企业级 AI 知识库问答平台，服务 8 万+ 内部员工，问答准确率 92%\n• 设计 Multi-Agent 协作框架，复杂任务完成率从 45% 提升至 80%\n• 自研 RAG 管线（Hybrid Retrieval + Re-ranking），幻觉率降至 <3%\n• 落地 AI 编程助手，研发人效提升约 30%' },
      { company: '百度', position: '算法工程师', dateRange: '2022.07 ~ 2023.06', description: '• 参与文心大模型应用适配与评测体系搭建\n• 构建 SFT 数据流水线，处理 50 万+ 高质量样本' },
    ],
    projects: [
      { name: '企业知识库问答 DocQA', role: '项目负责人', dateRange: '2024.01 ~ 至今', description: '技术栈：LangChain + Milvus + FastAPI + React\n• 使用自适应分块 + 混合检索，检索召回率提升 28%\n• 设计多租户隔离，已服务 6 家企业，月活 2 万+\n• 落地人工反馈闭环，bad case 周降幅 40%\n• 支撑合同 / 客服等 12 个高频场景', link: 'github.com/example/docqa' },
      { name: 'AgentBench 评测框架', role: '核心贡献者', dateRange: '2023.06 ~ 2023.09', description: '技术栈：Python + LangGraph + pytest\n• 覆盖 Tool Use / Code / Web 等 8 个维度，GitHub Star 3k+\n• 设计可插拔评测器，新 Agent 接入成本下降 60%\n• 成为社区主流基准，被 30+ 团队引用', link: 'github.com/example/agentbench' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 腾讯 2024 优秀项目奖\n• ACL 论文一作' },
      { title: '🌐 其他', content: '• 英语 CET-6（580+），可阅读论文与技术文档' },
    ],
  },
  { titleStyle: 'grad-underline' },
)

// ══════════════════════════════════════════════════════════════
// 4. 采购
// ══════════════════════════════════════════════════════════════
const procurement = mk(
  { id: 'tpl_procurement', name: '采购经理', industry: '采购 / Procurement', icon: '🛒', description: '战略寻源、供应商管理、降本增效', category: '职能支持' },
  '#059669',
  {
    name: '王慧', position: '采购经理', phone: '138-0000-7742', email: 'hui.wang@example.com', location: '北京市海淀区',
    summary: '熟悉战略寻源、供应商管理与成本优化，主导过亿元级品类降本增效，建立标准化供应商准入与风控体系。',
    education: [
      { school: '中央财经大学', degree: '本科', major: '供应链管理', dateRange: '2014.09 ~ 2018.06', description: '• GPA 3.6/4.0\n• 全国供应链大赛二等奖\n• 学生会外联部长' },
    ],
    strengths: [
      { title: '战略降本', content: '主导 12 亿元年采购额综合降本 8.6%，年节约超 1 亿元' },
      { title: '供应保障', content: '主导国产化替代，关键物料断供风险下降 50%' },
      { title: '体系搭建', content: '建立供应商绩效考核模型，淘汰低效供应商 23 家，准入效率提升 30%' },
    ],
    skills: [
      { name: '寻源与谈判', content: '熟练掌握战略寻源（RFX）、商务谈判与招投标，深入理解合同风险条款' },
      { name: '供应商管理', content: '熟练掌握供应商开发 / 准入 / 考核，深入理解 SRM 系统与风险评估' },
      { name: '成本与品类', content: '熟练掌握 TCO 分析与品类管理，深入理解 VA/VE 降本与价格趋势' },
      { name: '系统与工具', content: '熟练掌握 SAP / SRM，深入理解 Excel 高级分析与 Power BI 看板' },
      { name: '合规', content: '深入理解采购合规与反舞弊，熟悉 ISO 9001 / 14001' },
    ],
    experience: [
      { company: '华为', position: '采购经理', dateRange: '2019.07 ~ 至今', description: '• 负责电子元器件品类，年采购额 12 亿元，综合降本 8.6%\n• 建立多级供应商体系，关键物料备货周期缩短 30%\n• 主导国产化替代项目，供应风险下降 50%\n• 搭建供应商绩效考核模型，淘汰低效供应商 23 家' },
      { company: '美的', position: '采购专员', dateRange: '2018.07 ~ 2019.06', description: '• 负责包装与结构件采购，年降本 5%\n• 推动 VA/VE 项目，单品成本下降 12%' },
    ],
    projects: [
      { name: '战略供应商协同平台', role: '项目负责人', dateRange: '2022.03 ~ 2022.12', description: '技术栈：SAP SRM + 低代码审批流 + Power BI\n• 使用 SRM 打通寻源到付款全流程，在线招投标覆盖率提升至 90%\n• 通过供应商画像看板，采购周期缩短 25%\n• 沉淀 6 类品类模板，新品类上线周期减半', link: '' },
      { name: '国产化替代专项', role: '核心成员', dateRange: '2021.01 ~ 2021.12', description: '技术栈：替代选型矩阵 + 小批量验证 + 可靠性测试\n• 引入 6 家合格备选供应商，覆盖 80% 关键芯片\n• 通过阶梯验证规避断供风险，保障交付达成率 100%', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 华为 2023 金牌采购\n• 美的 优秀员工' },
      { title: '📜 证书', content: '• CPSM 认证\n• 供应链管理师（高级）' },
    ],
  },
  { titleStyle: 'pill', fontFamily: "'Microsoft YaHei', sans-serif" },
)

// ══════════════════════════════════════════════════════════════
// 5. 销售
// ══════════════════════════════════════════════════════════════
const sales = mk(
  { id: 'tpl_sales', name: '大客户销售经理', industry: '销售 / Sales', icon: '📈', description: '大客户经营、解决方案式销售', category: '产品运营' },
  '#ea580c',
  {
    name: '赵锐', position: '大客户销售经理', phone: '138-0000-9938', email: 'rui.zhao@example.com', location: '广州市天河区',
    summary: '擅长 B 端大客户从 0 到 1 开拓与存量深耕，累计签单超 1.2 亿元，精通解决方案式销售与复杂客情经营。',
    education: [
      { school: '武汉大学', degree: '本科', major: '市场营销', dateRange: '2016.09 ~ 2020.06', description: '• GPA 3.5/4.0\n• 校园创业大赛冠军\n• 市场营销协会会长' },
    ],
    strengths: [
      { title: '大客户签单', content: '累计签单 1.2 亿元，华南 KA 年签单 6000 万+，连续 3 季度超额 130%' },
      { title: '客情与续约', content: '从 0 开拓 30+ 头部客户，建立年度续约率 95% 的客情体系' },
      { title: '标杆与增购', content: '打造行业标杆案例，驱动老客户增购，NRR 达 140%' },
    ],
    skills: [
      { name: '销售方法', content: '熟练掌握 SPIN 与顾问式销售，深入理解 MEDDIC 与解决方案销售' },
      { name: '客户经营', content: '熟练掌握大客户（KA）管理与招投标，深入理解商务谈判与客情维护' },
      { name: '流程', content: '熟练掌握线索到回款（L2C）与 CRM 运营，深入理解销售预测' },
      { name: '行业', content: '深入理解 SaaS、企业软件、云计算与制造业采购决策链' },
      { name: '工具', content: '熟练掌握 Salesforce / 飞书 CRM、Excel 与 PPT 方案撰写' },
    ],
    experience: [
      { company: '字节跳动', position: '大客户销售经理', dateRange: '2020.07 ~ 至今', description: '• 负责华南区 KA 客户，年签单 6000 万+，连续 3 季度达成率 130%+\n• 从 0 开拓 30+ 头部客户，建立年度续约率 95% 的客情体系\n• 主导标杆案例打造，驱动老客户增购，NRR 达 140%\n• 搭建行业解决方案打法，团队人均产能提升 35%' },
      { company: '用友', position: '销售代表', dateRange: '2019.07 ~ 2020.06', description: '• 负责中小企业市场，年签单 800 万，新客开拓占比 60%\n• 优化回款流程，回款周期缩短 20%' },
    ],
    projects: [
      { name: '某零售集团数字化项目', role: '项目销售负责人', dateRange: '2023.02 ~ 2023.10', description: '技术栈：SaaS 私有化 + 售前方案 + 交付协同\n• 使用顾问式销售梳理痛点，3 个月完成千万级签约与启动\n• 协调售前 / 交付 / 法务三方，成为行业标杆案例\n• 带动同行业 3 家客户跟进转化', link: '' },
      { name: '渠道伙伴共建计划', role: '发起人', dateRange: '2022.01 ~ 2022.12', description: '技术栈：渠道分级 + 联合打单 + 激励政策\n• 发展区域代理 15 家，渠道贡献业绩占比从 10% 提升至 35%\n• 建立伙伴赋能体系，伙伴自主签单率提升至 60%', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 字节 2023 Top Sales\n• 用友 新人王' },
      { title: '🌐 其他', content: '• 英语 CET-6，可商务沟通' },
    ],
  },
  { titleStyle: 'centerline' },
)

// ══════════════════════════════════════════════════════════════
// 6. 业务 / 产品
// ══════════════════════════════════════════════════════════════
const business = mk(
  { id: 'tpl_business', name: '业务负责人 / 产品经理', industry: '业务 / Business', icon: '🧭', description: '业务操盘、增长策略、数据驱动', category: '产品运营' },
  '#0d9488',
  {
    name: '周岚', position: '业务负责人 / 产品经理', phone: '138-0000-6614', email: 'lan.zhou@example.com', location: '成都市高新区',
    summary: '擅长从战略到落地的全链路经营，主导过 0→1 产品与 1→100 业务增长，以数据驱动决策、结果导向。',
    education: [
      { school: '中山大学', degree: '本科', major: '工商管理', dateRange: '2015.09 ~ 2019.06', description: '• GPA 3.7/4.0\n• 创业大赛金奖\n• 校辩论队队长' },
    ],
    strengths: [
      { title: '业务增长', content: '主导业务线 GMV 从 3 亿增长至 11 亿，年复合增长 54%' },
      { title: '用户留存', content: '设计分层运营策略，核心用户留存提升 22 个百分点' },
      { title: '供给侧', content: '主导供给侧改革，商户活跃度提升 40%，决策效率显著提升' },
    ],
    skills: [
      { name: '业务经营', content: '熟练掌握商业模式设计与增长策略，深入理解 ROI 分析与 OKR 管理' },
      { name: '产品', content: '熟练掌握需求分析与 PRD，深入理解数据埋点、A/B 实验与用户研究' },
      { name: '增长', content: '熟练掌握漏斗优化与留存体系，深入理解私域运营与渠道投放' },
      { name: '协作', content: '熟练掌握跨部门项目管理，深入理解研发 / 运营 / 市场协同' },
      { name: '工具', content: '熟练掌握 SQL、Axure、Figma 与神策 / GA 分析' },
    ],
    experience: [
      { company: '美团', position: '业务负责人', dateRange: '2019.07 ~ 至今', description: '• 负责本地生活某业务线，年 GMV 从 3 亿增长至 11 亿，年复合增长 54%\n• 设计分层运营策略，核心用户留存提升 22 个百分点\n• 主导供给侧改革，商户活跃度提升 40%\n• 搭建业务数据看板与预警机制，决策效率显著提升' },
      { company: '滴滴', position: '产品经理', dateRange: '2018.07 ~ 2019.06', description: '• 负责司机端体验优化，完单率提升 8%\n• 设计新手引导，次日留存提升 15%' },
    ],
    projects: [
      { name: '会员增长体系', role: '项目负责人', dateRange: '2022.03 ~ 2022.11', description: '技术栈：积分 + 等级 + 权益 + 精准触达\n• 使用分层权益设计，付费会员渗透率从 6% 提升至 18%\n• 通过生命周期触达，会员年贡献 GMV 占比 35%\n• 搭建自动化运营看板，活动配置效率提升 3 倍', link: '' },
      { name: '新城市拓展模型', role: '主操盘', dateRange: '2021.01 ~ 2021.09', description: '技术栈：开城 SOP + 供给侧招商 + 补贴模型\n• 沉淀标准化开城 SOP，单城盈亏平衡周期缩短 30 天\n• 复制至 12 个城市，新城市首月 GMV 提升 45%', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 美团 2023 业务突破奖\n• 滴滴 最佳产品经理' },
      { title: '🌐 其他', content: '• 英语 CET-6，可全英文汇报' },
    ],
  },
  { titleStyle: 'dots' },
)

// ══════════════════════════════════════════════════════════════
// 7. UI 设计
// ══════════════════════════════════════════════════════════════
const ui = mk(
  { id: 'tpl_ui', name: 'UI / 交互设计师', industry: 'UI / 设计', icon: '✨', description: '设计系统、交互体验、B/C 端', category: '设计创意' },
  '#db2777',
  {
    name: '顾清', position: 'UI / 交互设计师', phone: '138-0000-2257', email: 'qing.gu@example.com', location: '杭州市西湖区',
    summary: '专注 B 端复杂系统与 C 端体验设计，主导过设计系统建设，擅长以用户为中心的设计方法与高保真原型。',
    education: [
      { school: '中国传媒大学', degree: '本科', major: '视觉传达设计', dateRange: '2017.09 ~ 2021.06', description: '• GPA 3.8/4.0\n• 全国大学生设计大赛一等奖\n• 校设计工作室负责人' },
    ],
    strengths: [
      { title: '设计系统', content: '主导金融 B 端设计系统，覆盖 40+ 业务线，设计交付效率提升 50%' },
      { title: '体验与转化', content: '主导核心交易链路改版，转化率提升 18%，通过 WCAG 2.1 AA 无障碍认证' },
      { title: '团队培养', content: '带教 3 名初级设计师，团队设计质量显著改善' },
    ],
    skills: [
      { name: '设计工具', content: '熟练掌握 Figma / Sketch，深入理解 Adobe XD / PS / AI 高保真产出' },
      { name: '设计系统', content: '熟练掌握组件库搭建，深入理解 Design Token 与规范文档治理' },
      { name: '交互', content: '熟练掌握用户旅程与信息架构，深入理解原型与可用性测试' },
      { name: '协作', content: '熟练掌握与产品 / 研发协作与设计走查，深入理解动效（ProtoPie/Principle）' },
      { name: '方法', content: '熟练掌握用户研究与竞品分析，深入理解 A/B 测试与无障碍设计' },
    ],
    experience: [
      { company: '蚂蚁集团', position: '高级 UI 设计师', dateRange: '2021.07 ~ 至今', description: '• 负责金融 B 端设计系统，覆盖 40+ 业务线，设计交付效率提升 50%\n• 主导核心交易链路改版，转化率提升 18%\n• 建设无障碍设计规范，通过 WCAG 2.1 AA 认证\n• 带教 3 名初级设计师，团队设计质量显著改善' },
      { company: '京东', position: '交互设计师', dateRange: '2020.07 ~ 2021.06', description: '• 负责商城活动页设计，点击率提升 25%\n• 搭建运营设计模板，产出效率提升 3 倍' },
    ],
    projects: [
      { name: '企业级设计系统 AntD-Pro', role: '核心设计', dateRange: '2023.01 ~ 2023.08', description: '技术栈：Figma + Design Token + 主题变量 + 研发协作规范\n• 使用统一 Token 体系，主题切换一键适配，研发还原度 98%\n• 通过组件治理，设计走查问题下降 60%\n• 沉淀设计 / 研发共建流程，跨团队沟通成本下降 40%', link: '' },
      { name: '智能投顾 App 体验设计', role: '主设计师', dateRange: '2022.02 ~ 2022.09', description: '技术栈：Figma + ProtoPie 动效 + 可用性测试\n• 使用用户旅程重构关键流程，转化提升 30%\n• 通过 5 轮可用性测试迭代，任务完成率提升至 92%\n• 获内部体验设计奖，沉淀为 C 端设计范例', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 蚂蚁 2023 设计之星\n• 全国设计大赛一等奖' },
      { title: '🛠 其他', content: '• 熟练 Figma 插件开发（自动化产出）' },
    ],
  },
  { titleStyle: 'grad-pill', fontFamily: "'PingFang SC', sans-serif" },
)

// ══════════════════════════════════════════════════════════════
// 8. 视觉 / 品牌设计
// ══════════════════════════════════════════════════════════════
const design = mk(
  { id: 'tpl_design', name: '视觉 / 品牌设计师', industry: '设计 / Design', icon: '🎭', description: '品牌识别、视觉语言、全链路落地', category: '设计创意' },
  '#9333ea',
  {
    name: '沈墨', position: '视觉 / 品牌设计师', phone: '138-0000-4083', email: 'mo.shen@example.com', location: '上海市静安区',
    summary: '擅长品牌识别、视觉语言与全链路设计落地，服务过多个消费与科技品牌，作品兼具审美与商业转化。',
    education: [
      { school: '广州美术学院', degree: '本科', major: '视觉传达设计', dateRange: '2016.09 ~ 2020.06', description: '• GPA 3.7/4.0\n• 靳埭強设计奖入围\n• 校美术馆策展助理' },
    ],
    strengths: [
      { title: '品牌落地', content: '主导 8 个 IP 系列主视觉，系列首发售罄率 95%+' },
      { title: '商业转化', content: '联动电商大促视觉，GMV 同比提升 40%' },
      { title: '全链路产出', content: '从 KV 到空间视觉的全套设计，单展触达 50 万+ 人次' },
    ],
    skills: [
      { name: '品牌', content: '熟练掌握品牌识别（VI）与 Logo 设计，深入理解视觉语言与品牌指南' },
      { name: '视觉', content: '熟练掌握海报 / 包装 / 插画，深入理解版式与动态视觉' },
      { name: '工具', content: '熟练掌握 Illustrator / Photoshop，深入理解 After Effects / C4D / Blender' },
      { name: '产出', content: '熟练掌握 KV / 主视觉 / 运营物料，深入理解展览视觉' },
      { name: '协作', content: '熟练掌握与营销 / 产品配合，深入理解印刷工艺与供应商对接' },
    ],
    experience: [
      { company: '泡泡玛特', position: '资深视觉设计师', dateRange: '2020.07 ~ 至今', description: '• 负责潮玩品牌视觉，主导 8 个 IP 系列主视觉，系列首发售罄率 95%+\n• 搭建品牌视觉规范，跨渠道一致性显著提升\n• 设计线下展陈视觉，单展触达 50 万+ 人次\n• 联动电商大促视觉，GMV 同比提升 40%' },
      { company: '字节跳动', position: '视觉设计师', dateRange: '2019.07 ~ 2020.06', description: '• 负责教育品牌视觉，活动曝光提升 30%\n• 产出 200+ 套营销物料模板' },
    ],
    projects: [
      { name: '城市漫游主题展', role: '视觉主创', dateRange: '2023.03 ~ 2023.08', description: '技术栈：C4D 主视觉 + 空间装置 + 社媒物料矩阵\n• 使用统一视觉语言贯穿 KV 到空间，社交媒体话题量 2000 万+\n• 通过沉浸式装置设计，现场打卡率提升至 70%\n• 获行业设计奖，沉淀为品牌展览标准' },
      { name: '新消费品牌升级', role: '品牌设计师', dateRange: '2022.01 ~ 2022.07', description: '技术栈：VI 系统 + 包装结构 + 3D 渲染\n• 从 0 搭建 VI 与包装，新包装上架复购率提升 25%\n• 进入 3 家头部渠道，首季度动销超预期 30%' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 靳埭強设计奖入围\n• 泡泡玛特 年度创意奖' },
      { title: '🛠 其他', content: '• 3D（C4D / Blender）全流程产出' },
    ],
  },
  { titleStyle: 'thin-underline' },
)

// ══════════════════════════════════════════════════════════════
// 9. 应届生（校招）
// ══════════════════════════════════════════════════════════════
const freshGrad = mk(
  { id: 'tpl_freshgrad', name: '应届生（校招）', industry: '应届 / 校招', icon: '🌱', description: '项目与实习突出、可塑性强的校招模板', category: '通用' },
  '#0ea5e9',
  {
    name: '李知行', position: '应届毕业生（计算机科学与技术）', phone: '138-0000-1024', email: 'zhixing.li@example.com', location: '南京市栖霞区',
    summary: '计算机专业应届毕业生，扎实的算法与工程基础，两段互联网实习，独立主导过完整项目从设计到上线。',
    education: [
      { school: '东南大学', degree: '本科', major: '计算机科学与技术', dateRange: '2021.09 ~ 2025.06', description: '• GPA 3.6/4.0，专业前 15%\n• 蓝桥杯软件赛省一等奖\n• 校级优秀学生干部' },
    ],
    strengths: [
      { title: '工程落地', content: '独立开发校园二手交易平台，注册用户 800+，获校级创新项目奖' },
      { title: '算法基础', content: 'LSTM 销量预测 MAE 较基线下降 18%，具备扎实建模能力' },
      { title: '实习产出', content: '两段实习独立交付 3 个功能模块，代码评审通过率 95%' },
    ],
    skills: [
      { name: '编程语言', content: '熟练掌握 Java / Python，理解 C++ 与 SQL' },
      { name: '前端', content: '熟悉 HTML/CSS/JS 与 Vue 基础，理解小程序开发' },
      { name: '后端', content: '熟悉 Spring Boot、MySQL 与 Redis 基础' },
      { name: '工具', content: '熟练使用 Git / Linux / Postman / Navicat' },
      { name: '软实力', content: '具备团队协作与文档撰写能力，英语 CET-6' },
    ],
    experience: [
      { company: '某互联网公司', position: '后端开发实习生', dateRange: '2024.06 ~ 2024.09', description: '• 使用 Spring Boot 参与内部工具平台，独立完成 3 个功能模块\n• 修复历史 Bug 40+ 个，代码评审通过率 95%\n• 编写接口文档与单元测试，覆盖率提升至 70%' },
      { company: '某创业公司', position: '全栈开发实习生', dateRange: '2023.07 ~ 2023.09', description: '• 负责官网与管理后台前端页面与部分接口，使用 Vue + Node.js\n• 协助上线活动页，首日 PV 1.2 万+' },
    ],
    projects: [
      { name: '校园二手交易平台', role: '独立开发', dateRange: '2023.10 ~ 2024.03', description: '技术栈：Spring Boot + Vue 3 + MySQL + Redis\n• 使用 Vue + Spring Boot 实现发布 / 搜索 / 私信 / 订单全流程\n• 通过 Redis 缓存热门列表，查询耗时下降 60%\n• 注册用户 800+，获校级创新项目奖\n• 完整撰写技术文档与部署手册', link: 'github.com/example/campus-trade' },
      { name: '基于 LSTM 的销量预测', role: '算法实现', dateRange: '2024.02 ~ 2024.05', description: '技术栈：Python + PyTorch + Pandas\n• 使用 LSTM 构建时序预测模型，MAE 较基线下降 18%\n• 完成特征工程与调参，预测准确率满足业务阈值\n• 撰写完整实验报告并可视化结果', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 蓝桥杯省一等奖\n• 校级一等奖学金 ×2' },
      { title: '📜 证书', content: '• 软件设计师（中级）\n• 英语 CET-6' },
    ],
  },
  { titleStyle: 'thin-underline' },
)

// ══════════════════════════════════════════════════════════════
// 10. 实习生
// ══════════════════════════════════════════════════════════════
const intern = mk(
  { id: 'tpl_intern', name: '实习生', industry: '实习 / 在校', icon: '🐣', description: '在校经历为主、强调学习潜力的实习模板', category: '通用' },
  '#14b8a6',
  {
    name: '陈安安', position: '在读本科生（市场营销）', phone: '138-0000-3366', email: 'anan.chen@example.com', location: '武汉市洪山区',
    summary: '市场营销专业在读，熟悉新媒体运营与基础数据分析，有校园活动与社团组织经验，踏实认真、学习意愿强。',
    education: [
      { school: '华中科技大学', degree: '本科（在读）', major: '市场营销', dateRange: '2022.09 ~ 2026.06', description: '• GPA 3.4/4.0\n• 学生会宣传部长\n• 校新媒体中心编辑' },
    ],
    strengths: [
      { title: '内容创作', content: '单条笔记最高获赞 5000+，具备选题、剪辑与排版全链路能力' },
      { title: '活动组织', content: '统筹迎新宣传覆盖 3000+ 新生，公众号涨粉 1200+' },
      { title: '数据分析', content: '独立完成品牌 campaign 数据部分，小组汇报获课程最高分' },
    ],
    skills: [
      { name: '运营', content: '熟悉公众号 / 小红书运营、内容排版与选题策划' },
      { name: '设计', content: '熟练使用 Canva / 稿定设计，了解基础 PS' },
      { name: '数据', content: '熟悉 Excel 与基础 SQL，能阅读数据看板' },
      { name: '办公', content: '熟练使用 Word / PPT 与会议纪要' },
      { name: '语言', content: '英语 CET-4，可阅读基础资料' },
    ],
    experience: [
      { company: '某MCN机构', position: '新媒体运营实习生', dateRange: '2024.07 ~ 2024.08', description: '• 使用剪映 / 小红书协助运营账号，负责选题与剪辑，单条笔记最高获赞 5000+\n• 整理竞品周报，输出 8 份分析，支撑账号定位调整\n• 参与直播脚本撰写，场观提升 20%' },
    ],
    projects: [
      { name: '校园迎新活动策划', role: '宣传负责人', dateRange: '2023.09 ~ 2023.10', description: '技术栈：公众号 + 海报设计 + 线下物料\n• 统筹线上线下宣传，覆盖 3000+ 新生，公众号涨粉 1200+\n• 协调 6 个社团联动，获评优秀学生活动\n• 沉淀活动 SOP 供下届复用', link: '' },
      { name: '品牌 campaign 分析', role: '小组作业', dateRange: '2024.03 ~ 2024.05', description: '技术栈：Excel 数据透视 + PPT 汇报\n• 对某快消品牌做营销案例分析，独立完成数据部分\n• 使用漏斗拆解转化路径，提出 3 条优化建议\n• 小组汇报获课程最高分', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 优秀学生干部\n• 校园新媒体大赛二等奖' },
      { title: '🤝 社团', content: '• 学生会宣传部部长\n• 摄影协会成员' },
    ],
  },
  { titleStyle: 'grad-underline' },
)

// ══════════════════════════════════════════════════════════════
// 11. 产品经理（互联网）
// ══════════════════════════════════════════════════════════════
const pm = mk(
  { id: 'tpl_pm', name: '产品经理（互联网）', industry: '产品 / PM', icon: '📱', description: '需求拆解、数据驱动、0→1 产品', category: '产品运营' },
  '#f59e0b',
  {
    name: '郑可', position: '高级产品经理', phone: '138-0000-7788', email: 'ke.zheng@example.com', location: '北京市朝阳区',
    summary: '擅长从用户洞察到需求落地，主导过 0→1 产品与核心模块重构，以数据驱动决策、跨团队推动力强。',
    education: [
      { school: '北京邮电大学', degree: '本科', major: '信息管理与信息系统', dateRange: '2015.09 ~ 2019.06', description: '• GPA 3.6/4.0\n• 校产品策划大赛冠军\n• 产品社团创始人' },
    ],
    strengths: [
      { title: '增长结果', content: '主导核心交易链路转化率提升 12%，年增收超 3000 万' },
      { title: '实验体系', content: '搭建 A/B 实验平台，团队实验效率提升 40%' },
      { title: '0→1 能力', content: '从 0 到 1 打造商家 SaaS 工具，内测商家 2000+，NPS 达 52' },
    ],
    skills: [
      { name: '产品方法', content: '熟练掌握用户研究与需求分析，深入理解 PRD、竞品分析与 MVP' },
      { name: '数据', content: '熟练掌握埋点设计与 A/B Test，深入理解漏斗分析与 SQL / 神策' },
      { name: '设计协作', content: '熟练掌握 Figma / Axure，深入理解交互评审与设计走查' },
      { name: '增长', content: '熟练掌握用户分层与留存体系，深入理解转化优化与增长实验' },
      { name: '协作', content: '熟练掌握研发 / 设计 / 运营协同，深入理解 OKR 与项目管理' },
    ],
    experience: [
      { company: '美团', position: '高级产品经理', dateRange: '2020.07 ~ 至今', description: '• 负责本地生活核心交易链路，转化率提升 12%，年增收超 3000 万\n• 主导下单流程重构，平均下单时长缩短 22%\n• 搭建 A/B 实验平台，团队实验效率提升 40%\n• 带教 2 名产品经理，需求返工率下降 35%' },
      { company: '滴滴', position: '产品经理', dateRange: '2019.07 ~ 2020.06', description: '• 负责乘客端运营模块，活动参与率提升 18%\n• 设计会员成长体系雏形' },
    ],
    projects: [
      { name: '智能推荐排序项目', role: '产品负责人', dateRange: '2022.04 ~ 2022.12', description: '技术栈：用户画像 + 个性化推荐 + 实验平台\n• 使用用户画像驱动个性化推荐，点击率提升 16%、GMV 提升 9%\n• 协调算法 / 研发 / 设计 10 人团队，按期交付\n• 建立效果归因看板，策略迭代周期从 2 周缩短至 3 天', link: '' },
      { name: '商家端 SaaS 工具', role: '从 0 到 1', dateRange: '2021.02 ~ 2021.09', description: '技术栈：自助经营后台 + 模板化配置 + 数据看板\n• 面向中小商家从 0 打造自助经营工具，内测商家 2000+\n• 通过模板化降低使用门槛，NPS 达 52，成为标配能力\n• 沉淀需求优先级模型，资源利用率提升 30%', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 美团 2023 最佳产品奖\n• 滴滴 优秀新人' },
      { title: '🌐 其他', content: '• 英语可作为工作语言\n• 人人都是产品经理专栏作者' },
    ],
  },
  { titleStyle: 'leftbar' },
)

// ══════════════════════════════════════════════════════════════
// 12. 数据分析师
// ══════════════════════════════════════════════════════════════
const dataAnalyst = mk(
  { id: 'tpl_data', name: '数据分析师', industry: '数据 / Data', icon: '📊', description: '指标体系、BI 看板、业务洞察', category: '互联网技术' },
  '#6366f1',
  {
    name: '孙沛', position: '数据分析师', phone: '138-0000-2255', email: 'pei.sun@example.com', location: '成都市武侯区',
    summary: '擅长指标体系搭建、SQL 取数与可视化，能将业务问题转化为数据方案，输出可落地的运营策略与增长建议。',
    education: [
      { school: '电子科技大学', degree: '本科', major: '统计学', dateRange: '2018.09 ~ 2022.06', description: '• GPA 3.7/4.0\n• 全国大学生统计建模二等奖\n• 校数学建模队长' },
    ],
    strengths: [
      { title: '指标体系', content: '搭建业务线指标体系，异常定位平均时效提升 50%' },
      { title: '业务增收', content: '输出 30+ 专题分析，推动 5 项策略落地，增收超 2000 万' },
      { title: '效率提升', content: '搭建自动化报表，人工取数工时下降 60%' },
    ],
    skills: [
      { name: '取数与分析', content: '熟练掌握 SQL 复杂查询与窗口函数，深入理解 Python（Pandas/Numpy）' },
      { name: '可视化', content: '熟练掌握 Tableau / Power BI，深入理解 FineBI / Superset 看板' },
      { name: '统计与建模', content: '熟练掌握回归分析与 A/B 检验，深入理解 RFM / 漏斗 / 留存' },
      { name: '数仓', content: '熟悉 Hive 与维度建模，深入理解指标体系（北极星 / 杜邦）' },
      { name: '协作', content: '熟练对接业务 / 产品 / 研发，撰写可落地分析报告' },
    ],
    experience: [
      { company: '拼多多', position: '数据分析师', dateRange: '2022.07 ~ 至今', description: '• 负责某业务线指标体系搭建与日常监控，异常定位平均时效提升 50%\n• 主导大促数据作战室，实时看板支撑决策，GMV 同比 +35%\n• 输出 30+ 份专题分析，推动 5 项策略落地，增收超 2000 万\n• 搭建自动化报表，人工取数工时下降 60%' },
      { company: '蔚来', position: '数据分析专员', dateRange: '2021.07 ~ 2022.06', description: '• 负责用户行为分析，关键转化环节优化 12%\n• 搭建用户分层模型，精准营销 ROI 提升 25%' },
    ],
    projects: [
      { name: '用户流失预警模型', role: '项目负责人', dateRange: '2023.05 ~ 2023.09', description: '技术栈：Python + 随机森林 + 行为特征工程\n• 使用行为特征构建流失预测，提前 14 天预警，召回成本下降 30%\n• 输出可解释特征清单，纳入日常运营 SOP\n• 模型 AUC 达 0.86，显著高于规则基线', link: '' },
      { name: '经营分析自助平台', role: '核心建设', dateRange: '2022.10 ~ 2023.03', description: '技术栈：Superset + 指标字典 + 权限体系\n• 使用拖拽式 BI 看板，业务自助分析覆盖 80%\n• 通过指标口径统一，取数需求积压清零\n• 沉淀指标字典，跨部门口径争议下降 70%', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 拼多多 2023 数据之星\n• 统计建模国二' },
      { title: '📜 证书', content: '• CDMP 数据管理认证\n• Tableau 官方认证' },
    ],
  },
  { titleStyle: 'grad-leftbar' },
)

// ══════════════════════════════════════════════════════════════
// 13. 测试工程师（QA）
// ══════════════════════════════════════════════════════════════
const qa = mk(
  { id: 'tpl_qa', name: '测试开发工程师', industry: '测试 / QA', icon: '🧪', description: '自动化、性能压测、质量保障', category: '互联网技术' },
  '#8b5cf6',
  {
    name: '何雨桐', position: '测试开发工程师', phone: '138-0000-6699', email: 'yutong.he@example.com', location: '苏州市工业园区',
    summary: '擅长自动化测试框架搭建与性能压测，注重质量左移与持续集成，推动团队从手工测试向工程化转型。',
    education: [
      { school: '南京理工大学', degree: '本科', major: '软件工程', dateRange: '2017.09 ~ 2021.06', description: '• GPA 3.5/4.0\n• 校软件测试竞赛一等奖\n• 开源社团成员' },
    ],
    strengths: [
      { title: '自动化提效', content: '主导自动化测试平台，用例维护成本下降 55%' },
      { title: '质量保障', content: '推动质量门禁接入 CI，线上缺陷率下降 40%' },
      { title: '稳定性', content: '搭建全链路压测体系，大促前发现并修复 12 个容量瓶颈' },
    ],
    skills: [
      { name: '自动化', content: '熟练掌握 Pytest / Playwright，深入理解 Selenium / Appium / JUnit' },
      { name: '性能', content: '熟练掌握 JMeter / Locust，深入理解全链路压测与 Gatling' },
      { name: '接口', content: '熟练掌握 Postman / REST Assured，深入理解 Mock 与契约测试' },
      { name: '工程', content: '熟练掌握 CI/CD（Jenkins / GitLab CI）、Docker 与 K8s' },
      { name: '开发', content: '熟悉 Python / Shell 与测试平台前后端开发' },
    ],
    experience: [
      { company: '携程', position: '高级测试开发', dateRange: '2021.07 ~ 至今', description: '• 主导自动化测试平台建设，用例维护成本下降 55%\n• 搭建全链路压测体系，大促前发现并修复 12 个容量瓶颈\n• 推动质量门禁接入 CI，线上缺陷率下降 40%\n• 核心接口自动化覆盖率从 30% 提升至 85%' },
      { company: '同程', position: '测试工程师', dateRange: '2020.07 ~ 2021.06', description: '• 负责机票业务功能 / 接口测试，缺陷逃逸率 <2%\n• 编写自动化脚本 300+，回归效率提升 3 倍' },
    ],
    projects: [
      { name: '一站式质量平台', role: '主开发', dateRange: '2022.06 ~ 2023.02', description: '技术栈：Vue + Spring Boot + Pytest + Jenkins\n• 使用统一用例模型打通管理 / 执行 / 报告，接入 20+ 业务线\n• 通过分布式执行，日均执行用例 5 万+\n• 沉淀测试资产库，新人上手周期缩短一半', link: 'github.com/example/qa-platform' },
      { name: '大促稳定性保障', role: '压测负责人', dateRange: '2023.10 ~ 2023.11', description: '技术栈：JMeter + 全链路压测 + 容量评估\n• 使用梯度压测识别瓶颈并扩容，大促零重大故障\n• 建立容量基线与告警阈值，预案覆盖率 100%\n• 输出压测报告，推动 8 个服务扩容', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 携程 2023 质量之星\n• 同程 优秀员工' },
      { title: '🛠 其他', content: '• 内部测试工具开源，Star 800+' },
    ],
  },
  { titleStyle: 'minimal' },
)

// ══════════════════════════════════════════════════════════════
// 14. 运营 / 新媒体
// ══════════════════════════════════════════════════════════════
const operations = mk(
  { id: 'tpl_operations', name: '运营 / 新媒体', industry: '运营 / Operations', icon: '📣', description: '内容运营、用户增长、活动策划', category: '产品运营' },
  '#ec4899',
  {
    name: '夏沐', position: '内容运营专家', phone: '138-0000-8820', email: 'mu.xia@example.com', location: '长沙市岳麓区',
    summary: '擅长新媒体矩阵运营与活动增长，操盘过百万级粉丝账号与千万级曝光活动，对数据敏感、对内容有手感。',
    education: [
      { school: '湖南大学', degree: '本科', major: '新闻传播学', dateRange: '2017.09 ~ 2021.06', description: '• GPA 3.6/4.0\n• 校融媒体中心主编\n• 全国大学生广告大赛二等奖' },
    ],
    strengths: [
      { title: '矩阵增长', content: '操盘垂类账号矩阵粉丝 300 万+，单篇最高曝光 2000 万' },
      { title: '破圈内容', content: '打造 3 个破圈话题，总阅读 5 亿+，内容转化 GMV 年增 60%' },
      { title: '私域闭环', content: '搭建私域增长体系，私域用户 30 万+，复购率提升 28%' },
    ],
    skills: [
      { name: '内容', content: '熟练掌握选题策划与脚本撰写，深入理解短视频与图文排版' },
      { name: '平台', content: '熟练掌握小红书 / 抖音 / 视频号 / 公众号运营' },
      { name: '增长', content: '熟练掌握活动策划与裂变拉新，深入理解私域运营与社群' },
      { name: '数据', content: '熟练掌握数据复盘与转化漏斗，深入理解 ROI 分析' },
      { name: '工具', content: '熟练使用剪映 / Canva / 飞书 / 有赞' },
    ],
    experience: [
      { company: '小红书', position: '内容运营专家', dateRange: '2021.07 ~ 至今', description: '• 负责垂类内容生态，账号矩阵粉丝 300 万+，单篇最高曝光 2000 万\n• 搭建创作者激励体系，月活创作者提升 45%\n• 打造 3 个破圈话题，总阅读 5 亿+\n• 内容转化 GMV 年增 60%' },
      { company: '网易', position: '新媒体运营', dateRange: '2020.07 ~ 2021.06', description: '• 负责官号日常运营，粉丝从 20 万增至 80 万\n• 策划节日活动，互动率提升 3 倍' },
    ],
    projects: [
      { name: '品牌破圈话题 campaign', role: '项目负责人', dateRange: '2023.04 ~ 2023.07', description: '技术栈：多平台联动 + KOL 矩阵 + 话题运营\n• 使用整合打法联动 5 个平台，总曝光 1.2 亿\n• 通过 KOL + UGC 共创，带动新增粉丝 50 万+\n• 沉淀话题 SOP，复用至 3 个品牌', link: '' },
      { name: '私域增长体系', role: '核心运营', dateRange: '2022.08 ~ 2023.01', description: '技术栈：社群 + 企微 + 小程序闭环\n• 使用分层社群 + 企微 SOP，私域用户 30 万+\n• 通过精准触达，复购率提升 28%\n• 搭建私域数据看板，运营动作可量化', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 小红书 2023 年度内容奖\n• 大广赛二等奖' },
      { title: '🌐 其他', content: '• 英语 CET-6，可对接海外内容' },
    ],
  },
  { titleStyle: 'grad-pill' },
)

// ══════════════════════════════════════════════════════════════
// 15. 财务 / 会计
// ══════════════════════════════════════════════════════════════
const finance = mk(
  { id: 'tpl_finance', name: '财务 / 会计', industry: '财务 / Finance', icon: '🧮', description: '核算、税务、预算与风控', category: '职能支持' },
  '#1e40af',
  {
    name: '钱敏', position: '财务主管', phone: '138-0000-4411', email: 'min.qian@example.com', location: '天津市和平区',
    summary: '熟悉全盘账务、税务筹划与预算管理，主导过 ERP 财务模块上线与内控体系建设，数据严谨、合规意识强。',
    education: [
      { school: '天津财经大学', degree: '本科', major: '会计学', dateRange: '2013.09 ~ 2017.06', description: '• GPA 3.7/4.0\n• 校级优秀毕业生\n• 会计竞赛一等奖' },
    ],
    strengths: [
      { title: '税务筹划', content: '主导税务筹划，年节税 600 万+，合规零风险' },
      { title: '效率提升', content: '牵头 ERP 财务模块上线，凭证自动化率 70%，结账周期减半' },
      { title: '预算管控', content: '搭建预算管控体系，费用偏差率控制在 3% 以内' },
    ],
    skills: [
      { name: '核算', content: '熟练掌握全盘账务与合并报表，深入理解成本会计与费用审核' },
      { name: '税务', content: '熟练掌握增值税 / 企业所得税筹划，深入理解汇算清缴与发票管理' },
      { name: '预算', content: '熟练掌握年度预算编制与滚动预测，深入理解经营分析（FP&A）' },
      { name: '系统', content: '熟练掌握 SAP / 用友 / 金蝶，深入理解 Excel 高级函数与透视' },
      { name: '合规', content: '熟练掌握内控制度与审计配合，深入理解风险管理' },
    ],
    experience: [
      { company: '某制造业集团', position: '财务主管', dateRange: '2019.07 ~ 至今', description: '• 负责集团全盘财务与月度合并报表，结账周期从 8 天缩短至 4 天\n• 主导税务筹划，年节税 600 万+\n• 搭建预算管控体系，费用偏差率控制在 3% 以内\n• 牵头 ERP 财务模块上线，凭证自动化率 70%' },
      { company: '某上市公司', position: '总账会计', dateRange: '2017.07 ~ 2019.06', description: '• 负责总账核算与报表出具，准确率 100%\n• 配合年审，无重大调整事项' },
    ],
    projects: [
      { name: '财务共享中心建设', role: '核心成员', dateRange: '2021.03 ~ 2021.12', description: '技术栈：SAP 共享模块 + 标准化流程 + 审批引擎\n• 使用统一核算标准与流程，效率提升 40%\n• 通过集中审核，差错率下降 60%\n• 沉淀操作手册，新公司接入周期缩短一半', link: '' },
      { name: '成本精细化项目', role: '负责人', dateRange: '2022.05 ~ 2022.10', description: '技术栈：产品级成本核算 + 动因分析 + 看板\n• 使用作业成本法识别浪费环节，降本 8%\n• 输出成本看板支撑定价决策\n• 推动 3 个高成本低效 SKU 优化', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 集团 2023 优秀管理者\n• 年度先进员工' },
      { title: '📜 证书', content: '• 中级会计师\n• CPA（通过 4 科）' },
    ],
  },
  { titleStyle: 'centerline' },
)

// ══════════════════════════════════════════════════════════════
// 16. 人力资源（HR）
// ══════════════════════════════════════════════════════════════
const hr = mk(
  { id: 'tpl_hr', name: '人力资源（HR）', industry: 'HR / 人力', icon: '🤝', description: '招聘、员工关系、组织发展', category: '职能支持' },
  '#c026d3',
  {
    name: '许婧', position: 'HRBP / 人力资源经理', phone: '138-0000-5577', email: 'jing.xu@example.com', location: '重庆市渝中区',
    summary: '覆盖招聘、绩效、员工关系与组织发展，擅长 HRBP 模式，能将人力策略与业务目标对齐。',
    education: [
      { school: '西南大学', degree: '本科', major: '人力资源管理', dateRange: '2015.09 ~ 2019.06', description: '• GPA 3.6/4.0\n• 校优秀学生干部\n• 人力资源沙盘大赛季军' },
    ],
    strengths: [
      { title: '招聘效率', content: '负责 300 人研发团队 HRBP，核心岗位到岗周期缩短 35%' },
      { title: '组织效能', content: '主导绩效体系重构，员工敬业度提升 18 分' },
      { title: '人才梯队', content: '搭建技术人才梯队，关键岗继任覆盖 80%' },
    ],
    skills: [
      { name: '招聘', content: '熟练掌握全渠道招聘与人才地图，深入理解结构化面试与猎头管理' },
      { name: '绩效', content: '熟练掌握 OKR / KPI 设计，深入理解绩效面谈与人才盘点' },
      { name: '员工关系', content: '熟练掌握入离职办理与劳动争议处理，深入理解企业文化活动' },
      { name: '组织发展', content: '熟练掌握岗位体系与晋升通道，深入理解培训体系搭建' },
      { name: '系统', content: '熟练掌握北森 / Moka，深入理解钉钉 / 飞书人事与 Excel' },
    ],
    experience: [
      { company: '某互联网公司', position: 'HRBP 经理', dateRange: '2020.07 ~ 至今', description: '• 负责 300 人研发团队 HRBP，核心岗位到岗周期缩短 35%\n• 主导绩效体系重构，员工敬业度提升 18 分\n• 搭建技术人才梯队，关键岗继任覆盖 80%\n• 组织 2 次架构调整，离职率下降 12%' },
      { company: '某零售集团', position: '招聘主管', dateRange: '2019.07 ~ 2020.06', description: '• 负责门店与职能招聘，年招聘 1500+\n• 优化招聘漏斗，offer 接受率提升 20%' },
    ],
    projects: [
      { name: '技术人才标准项目', role: '负责人', dateRange: '2022.03 ~ 2022.09', description: '技术栈：能力模型 + 分级题库 + 面试校准\n• 使用分级能力模型建立面试题库，面试一致性显著提升\n• 通过校准会机制，误判率下降 30%\n• 沉淀技术人才标准，复用至全公司', link: '' },
      { name: '新员工融入计划', role: '主操盘', dateRange: '2021.04 ~ 2021.08', description: '技术栈：90 天融入地图 + 导师制 + 反馈机制\n• 使用 90 天融入体系，试用期通过率 95%+\n• 通过导师配对，转正留存提升 15%\n• 输出融入手册，覆盖全部新入职', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 公司 2023 最佳 BP\n• 优秀团队管理者' },
      { title: '📜 证书', content: '• 人力资源管理师（一级）\n• SHL 测评认证' },
    ],
  },
  { titleStyle: 'pill' },
)

// ══════════════════════════════════════════════════════════════
// 17. 管理岗 / 总监
// ══════════════════════════════════════════════════════════════
const director = mk(
  { id: 'tpl_director', name: '管理岗 / 总监', industry: '管理 / Management', icon: '👑', description: '团队管理、战略规划、经营结果', category: '通用' },
  '#4338ca',
  {
    name: '韩屹', position: '技术总监 / 研发负责人', phone: '138-0000-1199', email: 'yi.han@example.com', location: '深圳市福田区',
    summary: '12 年研发经验、8 年技术团队管理，从工程师到总监，主导过团队从 10 人到 120 人的规模化建设，擅长技术战略、组织效能与业务落地。',
    education: [
      { school: '华中科技大学', degree: '硕士', major: '计算机科学与技术', dateRange: '2009.09 ~ 2012.06', description: '• 研究方向：分布式系统\n• 校优秀硕士论文\n• 研究生会主席' },
    ],
    strengths: [
      { title: '经营结果', content: '负责 120 人研发团队，年营收从 2 亿增长至 7 亿' },
      { title: '组织效能', content: '主导技术中台建设，研发交付效率提升 50%、运维成本下降 30%' },
      { title: '人才梯队', content: '搭建人才梯队，晋升技术专家 15 人、管理者 8 人' },
    ],
    skills: [
      { name: '技术战略', content: '熟练掌握技术规划与架构治理，深入理解技术债管理与研发效能' },
      { name: '团队管理', content: '熟练掌握组织设计与人才梯队，深入理解绩效激励与跨部门协同' },
      { name: '工程', content: '深入理解微服务、云原生、DevOps 与质量体系' },
      { name: '经营', content: '熟练掌握预算管理、ROI 与降本增效，深入理解商业洞察' },
      { name: '影响力', content: '熟练掌握技术品牌与对外分享，深入理解跨部门推动' },
    ],
    experience: [
      { company: '某头部互联网公司', position: '技术总监', dateRange: '2019.07 ~ 至今', description: '• 负责核心业务研发团队（120 人），年营收从 2 亿增长至 7 亿\n• 主导技术中台建设，研发交付效率提升 50%，运维成本下降 30%\n• 搭建人才梯队，晋升技术专家 15 人、管理者 8 人\n• 推动质量文化建设，线上故障率下降 65%' },
      { company: '某独角兽', position: '研发经理', dateRange: '2015.07 ~ 2019.06', description: '• 从 0 组建 30 人团队，支撑业务 0→1 到规模化\n• 主导架构演进，系统支撑 10 倍流量增长' },
    ],
    projects: [
      { name: '研发效能平台', role: '发起人', dateRange: '2021.01 ~ 2021.12', description: '技术栈：DevOps 流水线 + 度量平台 + 组件市场\n• 使用一站式协作平台，需求交付周期缩短 40%\n• 沉淀 200+ 复用组件，跨团队复用率提升 50%\n• 建立研发度量体系，资源投入更聚焦', link: '' },
      { name: '出海技术体系建设', role: '总负责', dateRange: '2022.06 ~ 2023.06', description: '技术栈：多区域部署 + 合规框架 + 监控告警\n• 使用多区域合规架构，支撑 5 国上线\n• 通过合规前置设计，合规零事故\n• 建立全球容灾方案，可用性达 99.95%', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 公司 2023 卓越管理者\n• 技术品牌贡献奖' },
      { title: '🌐 其他', content: '• 多次行业技术大会演讲嘉宾\n• 内部技术大学讲师' },
    ],
  },
  { titleStyle: 'grad-shadow' },
)

// ══════════════════════════════════════════════════════════════
// 18. 教师 / 教育
// ══════════════════════════════════════════════════════════════
const teacher = mk(
  { id: 'tpl_teacher', name: '教师 / 教育', industry: '教育 / Education', icon: '📚', description: '教学、教研、学生管理与成果', category: '通用' },
  '#15803d',
  {
    name: '柳思齐', position: '高中数学教师', phone: '138-0000-3344', email: 'siqi.liu@example.com', location: '西安市雁塔区',
    summary: '一线教学经验丰富，带过 6 届毕业班，擅长因材施教与班级管理，所带班级成绩名列前茅，注重教研沉淀与学生综合素养培养。',
    education: [
      { school: '陕西师范大学', degree: '本科', major: '数学与应用数学（师范）', dateRange: '2014.09 ~ 2018.06', description: '• GPA 3.7/4.0\n• 校级优秀师范生\n• 教学技能大赛一等奖' },
    ],
    strengths: [
      { title: '教学成绩', content: '连续 6 年带毕业班，班级平均分稳居年级前列，多名学生考入 985 高校' },
      { title: '重本提升', content: '所带班级重本上线率提升 20 个百分点' },
      { title: '教研沉淀', content: '开发校本复习资料 3 套全校推广，获评优秀班主任 3 次' },
    ],
    skills: [
      { name: '教学', content: '熟练掌握教学设计，深入理解课堂管理与分层教学、培优补差' },
      { name: '教研', content: '熟练掌握试题研究与考点梳理，深入理解校本课程开发' },
      { name: '班级', content: '熟练掌握班主任管理与家校沟通，深入理解学生心理辅导' },
      { name: '工具', content: '熟练使用希沃白板 / PPT / Excel 成绩分析 / 班级管理 App' },
      { name: '其他', content: '熟悉数学竞赛辅导与社团指导' },
    ],
    experience: [
      { company: '某重点中学', position: '数学教师 / 班主任', dateRange: '2018.07 ~ 至今', description: '• 连续 6 年带毕业班，班级平均分年级前列，多名学生考入 985 高校\n• 所带班级重本上线率提升 20 个百分点\n• 开发校本复习资料 3 套，全校推广使用\n• 获评校级优秀班主任 3 次' },
      { company: '某培训机构', position: '教研老师', dateRange: '2017.07 ~ 2018.06', description: '• 参与教材研发与师资培训，编写讲义 20 余万字\n• 设计分层练习体系，续班率提升 15%' },
    ],
    projects: [
      { name: '分层作业改革', role: '项目负责人', dateRange: '2021.09 ~ 2022.06', description: '技术栈：能力分层 + 差异化作业 + 数据反馈\n• 使用分层布置与反馈，学困生及格率提升 25%\n• 通过作业数据看板，精准定位薄弱知识点\n• 获教学创新奖，模式在年级推广', link: '' },
      { name: '数学兴趣小组', role: '指导老师', dateRange: '2019.03 ~ 至今', description: '技术栈：竞赛辅导 + 项目式学习 + 校内外赛事\n• 组织竞赛辅导与活动，学生获省级奖项 8 人次\n• 打造学校品牌社团，成员规模增长 3 倍\n• 联动高校资源，开设数学文化讲座', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 市级教学能手\n• 校级优秀班主任 ×3' },
      { title: '📜 证书', content: '• 高级中学教师资格证\n• 普通话一级乙等' },
    ],
  },
  { titleStyle: 'underline' },
)

// ══════════════════════════════════════════════════════════════
// 0. 默认模板（李鱼皮 · 平台示范简历）
// ══════════════════════════════════════════════════════════════
const defaultLiyupi = mk(
  { id: 'tpl_default_liyupi', name: '默认模板（李鱼皮）', industry: '默认 / Default', icon: '🐟', description: '平台默认模板 · 程序员简历范例', category: '通用' },
  '#2D5F7C',
  {
    name: '李鱼皮', position: 'Java 后端 + AI 应用开发｜3 年工作经验', phone: '138xxxx8888', email: 'yupi@codefather.cn', location: '',
    summary: '男｜24岁｜微信：xxxxxx｜个人博客（作品集）：dogyupi.com｜GitHub：github.com/liyupi',
    education: [
      { school: 'XX大学', degree: '本科', major: '软件工程', dateRange: '2019-09 ~ 2023-06', description: '• 排名：前5%，通过 CET-6\n• 上海市挑战杯特等奖\n• 上海市优秀毕业生\n• 国家级创新创业项目负责人\n• 蓝桥杯 Java 组省一等奖\n• 软件设计师认证' },
    ],
    strengths: [
      { title: '大厂匹配度', content: '具备高日活产品（20K+ DAU）的后端架构和性能优化经验，熟悉监控、工程化、跨端、CI/CD 等大厂必备能力' },
      { title: 'AI 应用落地', content: '不只是 demo，而是将 AI 对话、RAG、工具调用、Agent Skills 真正融入业务，产生可量化的业务价值（拦截率 98%、效率提升 50% 等）' },
      { title: '开源影响力', content: 'GitHub 2 万+ Followers，ai-guide 仓库 1 万+ Star，多次上榜 GitHub Trending，具备技术社区认可' },
      { title: '快速学习与输出', content: '持续跟进 Vercel AI SDK、LangChain.js、Copilot Kit 等前沿技术，撰写过 15+ 篇 AI 前端技术文章，累计阅读 30w+' },
    ],
    skills: [
      { name: '开发技术', content: '1. Java8~26 新特性、集合框架、反射、动态代理\n2. Spring Boot3 + MyBatis-Plus、Spring Cloud 微服务\n3. MySQL 数据库设计 / SQL 调优 / 分库分表 / 索引优化 / Druid 监控\n4. Redis 缓存中间件、Caffeine 多级缓存、分布式锁、缓存雪崩/穿透解决方案\n5. Docker 容器化 + Nginx 反向代理部署、Dockerfile 打包、Serverless 上线\n6. Prometheus + Grafana + 阿里云 ARMS 监控告警、JVM 诊断大盘\n7. SEO / 搜索引擎优化 / GEO 生成式引擎优化 / TDK 优化 / AI 推荐排名' },
      { name: 'AI 应用开发', content: '1. Spring AI、LangChain4j、RAG、MCP、多 Agent 协作\n2. Prompt 工程、PGvector 向量数据库、ETL、文档检索增强\n3. Cursor / Claude Code / GitHub Copilot / MCP Server / Agent Skills\n4. Vibe Coding / SDD / Harness Engineering / Spec-Kit / OpenSpec' },
      { name: '前端工程化', content: '1. React 18+：Hooks、Context、Suspense、Error Boundaries、并发特性\n2. Next.js：SSR/SSG/ISR，API Routes，中间件，国际化，Image 优化\n3. 构建工具：Webpack 配置优化、Vite 插件开发、ESBuild 接入\n4. 性能优化：首屏加载时间优化、LCP/FID/CLS 指标监控与治理、虚拟滚动\n5. 跨端与兼容：Taro 小程序开发，响应式设计，多浏览器兼容' },
    ],
    experience: [
      { company: '老鱼公司', position: 'Java 后端 + AI 应用开发', dateRange: '2023-04 ~ 至今', description: '负责产品：编程导航 codefather.cn（日活 20K 的程序员学习社区）、面试鸭 mianshiya.com（日活 15K 的面试刷题平台）\n\n主要工作：\n1. 独立完成从需求分析、技术选型、后端开发到部署上线的全流程，支撑共计日均 PV 35K+ 产品的稳定运行\n2. 基于 Spring Cloud 微服务架构搭建统一支付中心，封装支付宝、微信支付、Apple Pay 等多渠道接口，2 小时内完成接入四端支付\n3. 主导统一搜索服务，基于 ElasticSearch + IK 分词 + 热度权重 + 时间衰减因子，搜索结果点击率提升 35%\n4. 构建知识库体系，支持文字 + 视频教程结构化阅读、学习进度追踪、AI 互动式学习；集成 RAG 知识库问答功能\n5. 搭建三层内容风控审核系统（AI 模型 + 规则引擎 + 人工复审），违规内容拦截率提升至 98%\n6. 搭建 Prometheus + Grafana + 阿里云 ARMS 监控体系，实现分布式链路追踪（TraceID），系统故障发现时间从小时级缩短至分钟级\n7. 使用 ElasticSearch + IK 分词 + 热度权重 + 时间衰减因子构建搜索服务；基于 Redis + Caffeine 多级缓存提升接口响应速度\n8. 主导 AI 方向技术选型和落地，基于 Spring AI + LangChain4j 实现 RAG 知识库问答、AI 互动式学习等功能' },
    ],
    projects: [
      { name: 'AI 超级智能体（AI Agent 项目）', role: '技术负责人 / 核心开发者', dateRange: '', description: '线上访问：codefather.cn｜GitHub 开源：github.com/liyupi/yu-ai-agent\n\n基于 Spring Boot3 + Spring AI + RAG + MCP 的企业级 AI 智能体，支持多轮对话、记忆持久化、RAG 知识库检索、ReAct 模式自主推理与工具调用，能完成联网搜索、资源下载、PDF 生成、自定义规划等任务。\n\n主要工作：\n1. 基于 Spring AI 框架集成通义、Ollama 等 5 种大模型，统一 API 接口实现灵活切换；Ollama 本地部署处理简单对话，API 调用成本降低 60%\n2. 实现多轮对话记忆功能，基于 Spring AI 的 ChatMemory + Advisor 机制，采用 MySQL + Redis + Kryo 高性能序列化存储，重启后对话恢复率 >99%\n3. 基于 Spring AI 构建完整 RAG 知识库，支持 ETL 处理、PGvector 向量存储、元数据自动打标、多路查询扩展和查询重写，问答准确率比纯模型提升 45%\n4. 通过 @Tool 注解实现联网搜索、页面爬取、PDF 生成、资源下载等 6 种工具，单模型部署即可完成复杂任务；ToolContext 参数校验防止工具链无效执行\n5. 开发基于 Stdio + SSE 传输的图搜 MCP 服务，无服务器部署，支持被其他 AI 项目灵活集成\n6. 参考 OpenManus 设计 Human-in-the-Loop 分层架构，包含步数限制、状态管理和死锁检测机制，保障系统稳定运行\n7. 使用 SseEmitter + CompletableFuture 实现异步 SSE 流式接口，实时输出智能思考和执行过程，用户等待时间缩短 80%；自定义 SSE 数据格式避免编码和字符丢失问题', link: 'github.com/liyupi/yu-ai-agent' },
      { name: 'AI 热点监控工具（AI 应用开发项目）', role: '全栈开发 / 独立项目', dateRange: '', description: '线上访问：codefather.cn｜GitHub 开源：github.com/liyupi/yupi-hot-monitor\n\n基于 Express5 + React19 + OpenRouter + Socket.io 的 AI 热点监控工具，支持多源数据聚合、AI 内容审核、WebSocket 实时推送，可复用于 Cursor / GitHub Copilot 等 AI 编程工具。\n\n主要工作：\n1. 使用 GitHub Copilot + MCP + Agent Skills 进行 AI 辅助开发，遵循企业级 AI 工程化开发流程；90%+ 代码由 AI 生成，显著提升开发效率\n2. 实现 Bing、HackerNews、百度等多源爬虫，基于 Axios + Cheerio；接入第三方 API 实现 Twitter 高级搜索；人工标注样本，数据覆盖度提升 5 倍\n3. 集成 OpenRouter 接入 AI 模型，设计结构化分析 Prompt，进行时效性验证、相关性评分、重要性分类和智能摘要；人工标注测试数据，过滤准确率 >90%\n4. 利用 AI 模型扩展关键词（5~15 个语义变体），召回率提升 300%+；本地缓存避免冗余调用，节省 AI API 费用\n5. 基于 Socket.io 实现事件驱动的关键词订阅，新热点采集后毫秒级推送到订阅客户端\n6. 使用 Skill Creator 将热点监控能力封装为标准化 Agent Skills，集成 10+ 主流 AI 工具，无需后端服务即可开放使用', link: 'github.com/liyupi/yupi-hot-monitor' },
    ],
    custom: [
      { title: 'AI 万能视频下载总结器', content: 'Next.js + Stripe + DeepSeek，实现支付 → 下载 → 总结全流程，月活 3000+ 独立用户，支付转化率 5.2%' },
      { title: 'AI 零代码应用生成平台', content: 'React Flow + LangGraph.js，可视化编排多 Agent 工作流，自动生成前后端代码，已生成 200+ 应用' },
      { title: '手写 RPC 框架可视化面板', content: '展示调用链、负载均衡状态、SPI 加载过程，作为技术教程 Demo 被多个高校课程引用' },
    ],
  },
  { titleStyle: 'underline' },
)

export const INDUSTY_TEMPLATES: BuiltInTemplate[] = [
  defaultLiyupi,
  backend,
  frontend,
  agent,
  procurement,
  sales,
  business,
  ui,
  design,
  freshGrad,
  intern,
  pm,
  dataAnalyst,
  qa,
  operations,
  finance,
  hr,
  director,
  teacher,
]
