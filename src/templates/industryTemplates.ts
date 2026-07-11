import type { ResumeData, ResumeModule, ResumeConfig } from '../types'

/**
 * 分行业专业简历模板
 * 每个模板都是一份完整的 ResumeData，可通过 store.importData() 直接套用。
 * 描述字段使用纯文本格式（与现有导入路径一致）：
 *   • 项目符号列表，数字编号列表，**加粗**，换行 \n。
 */

export interface BuiltInTemplate {
  id: string
  name: string
  industry: string // 行业标签
  icon: string // emoji 图标
  color: string // 主题色（与 config.primaryColor 一致）
  description: string // 一句话亮点
  data: ResumeData
}

// ── id 生成（避免多模板 id 冲突） ──
let _uid = 0
const nid = (p: string) => `${p}_${Date.now().toString(36)}_${(_uid++).toString(36)}`

interface Edu { school: string; degree: string; major: string; dateRange: string; description: string }
interface Exp { company: string; position: string; dateRange: string; description: string }
interface Proj { name: string; role: string; dateRange: string; description: string; link?: string }
interface Skill { name: string; content: string }
interface Custom { title: string; content: string }

interface TplInput {
  name: string
  position: string
  phone: string
  email: string
  location: string
  summary: string
  education: Edu[]
  experience: Exp[]
  projects: Proj[]
  skills: Skill[]
  custom: Custom[]
}

function buildData(input: TplInput, color: string, config: Partial<ResumeConfig> = {}): ResumeData {
  const cfg: ResumeConfig = {
    theme: 'custom',
    primaryColor: color,
    fontFamily: config.fontFamily ?? 'system-ui, -apple-system, sans-serif',
    fontSize: config.fontSize ?? 14,
    lineHeight: config.lineHeight ?? 1.6,
    pageMargin: config.pageMargin ?? 20,
    titleStyle: (config.titleStyle ?? 'underline') as ResumeConfig['titleStyle'],
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
      id: nid('mod'), type: 'skill', title: '专业技能', visible: true, order: 2, displayMode: 'list',
      items: input.skills.map(s => ({ id: nid('item'), name: s.name, content: s.content })),
    },
    {
      id: nid('mod'), type: 'experience', title: '工作经历', visible: true, order: 3,
      items: input.experience.map(e => ({ id: nid('item'), ...e })),
    },
    {
      id: nid('mod'), type: 'project', title: '项目经历', visible: true, order: 4,
      items: input.projects.map(p => ({ id: nid('item'), ...p })),
    },
    {
      id: nid('mod'), type: 'custom', title: '荣誉奖项 & 其他', visible: true, order: 5,
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
  meta: { id: string; name: string; industry: string; icon: string; description: string },
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
    data: buildData(input, color, config),
  }
}

// ══════════════════════════════════════════════════════════════
// 1. 后端开发
// ══════════════════════════════════════════════════════════════
const backend = mk(
  { id: 'tpl_backend', name: '后端开发工程师', industry: '后端 / Backend', icon: '💻', description: '高并发、分布式、微服务架构' },
  '#2563eb',
  {
    name: '陈思源', position: 'Java 后端开发工程师｜4 年经验', phone: '138-0000-8866', email: 'siyuan.chen@example.com', location: '杭州市余杭区',
    summary: '4 年后端开发经验，擅长高并发、分布式系统与微服务架构。主导过日活百万级系统的性能优化，熟悉 Spring Cloud、MySQL、Redis、消息队列等技术栈，注重代码质量与系统稳定性。',
    education: [
      { school: '浙江大学', degree: '本科', major: '软件工程', dateRange: '2018.09 ~ 2022.06', description: '• GPA 3.7/4.0，专业排名前 10%\n• ACM 校赛金奖\n• 毕业设计：基于 Redis 的分布式锁中间件' },
    ],
    skills: [
      { name: '后端框架', content: 'Spring Boot、Spring Cloud、MyBatis-Plus、Dubbo' },
      { name: '数据库', content: 'MySQL（索引优化 / 分库分表）、Redis、MongoDB、Elasticsearch' },
      { name: '中间件', content: 'RocketMQ、Kafka、RabbitMQ、Nacos、Sentinel' },
      { name: '工程与运维', content: 'Docker、Kubernetes、Jenkins、Maven、Git、JVM 调优' },
      { name: '其他', content: 'Linux、TCP/IP & HTTP、分布式事务（Seata）' },
    ],
    experience: [
      { company: '字节跳动', position: '高级后端工程师', dateRange: '2022.07 ~ 至今', description: '• 负责推荐系统后端服务，**日均处理请求 20 亿+**，P99 延迟从 120ms 降至 45ms\n• 主导服务拆分与微服务治理，基于 Spring Cloud + Dubbo 重构单体架构，发布效率提升 3 倍\n• 设计多级缓存（Redis + Caffeine）方案，核心接口 QPS 提升 5 倍，数据库压力下降 70%\n• 搭建全链路压测与监控体系（Prometheus + Grafana），大促期间零故障' },
      { company: '美团', position: '后端开发工程师', dateRange: '2021.07 ~ 2022.06', description: '• 负责外卖商家端服务，支撑**日均千万级订单**稳定写入\n• 优化慢 SQL 200+ 条，核心查询耗时从 800ms 降至 80ms\n• 引入 Kafka 削峰填谷，峰值吞吐能力提升 4 倍' },
    ],
    projects: [
      { name: '分布式秒杀系统', role: '技术负责人', dateRange: '2023.03 ~ 2023.08', description: '基于 Redis + Lua + RocketMQ 的秒杀架构，支撑单场活动 100 万 QPS。\n• 设计库存预热与令牌桶限流，超卖率为 0\n• 通过本地缓存 + 异步扣减，下单成功率 99.99%', link: 'github.com/example/seckill' },
      { name: '统一鉴权网关', role: '核心开发者', dateRange: '2022.10 ~ 2023.02', description: '基于 Spring Cloud Gateway 的统一认证与限流网关。\n• 集成 JWT + OAuth2，支撑 30+ 微服务统一鉴权\n• 基于 Sentinel 实现热点参数限流，拦截恶意请求 99%', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 字节跳动 2023 年度技术之星\n• 美团 优秀新人奖\n• 开源项目 Star 2k+' },
      { title: '🌐 其他', content: '• 英语 CET-6，可流畅阅读英文技术文档\n• 技术博客累计阅读 10w+' },
    ],
  },
  { titleStyle: 'underline' },
)

// ══════════════════════════════════════════════════════════════
// 2. 前端开发
// ══════════════════════════════════════════════════════════════
const frontend = mk(
  { id: 'tpl_frontend', name: '前端开发工程师', industry: '前端 / Frontend', icon: '🎨', description: '工程化、性能优化、可视化' },
  '#0891b2',
  {
    name: '林晚', position: '高级前端工程师｜5 年经验', phone: '138-0000-5521', email: 'wan.lin@example.com', location: '上海市徐汇区',
    summary: '5 年前端经验，精通 React / Vue 生态与前端工程化。擅长性能优化、可视化与跨端开发，主导过日活百万级 Web 应用的架构升级与体验优化。',
    education: [
      { school: '南京大学', degree: '本科', major: '计算机科学与技术', dateRange: '2017.09 ~ 2021.06', description: '• GPA 3.8/4.0\n• 校前端开源社区发起人\n• 毕业设计：基于 WebGL 的数据可视化引擎' },
    ],
    skills: [
      { name: '框架', content: 'React 18、Vue 3、Next.js、Nuxt、TypeScript' },
      { name: '工程化', content: 'Vite、Webpack、Rollup、Monorepo（pnpm/turborepo）、CI/CD' },
      { name: '可视化', content: 'ECharts、D3.js、WebGL、Three.js、Canvas' },
      { name: '性能优化', content: '首屏优化、LCP/FID/CLS 治理、虚拟列表、骨架屏、SSR/SSG' },
      { name: '跨端', content: 'Taro、React Native、Electron、小程序' },
    ],
    experience: [
      { company: '阿里巴巴', position: '高级前端工程师', dateRange: '2021.07 ~ 至今', description: '• 负责电商中台前端，**支撑双十一峰值 50 万 QPS**，首屏加载从 3.2s 优化至 1.1s\n• 主导微前端架构（qiankun），整合 12 个业务线，发布效率提升 40%\n• 建设组件库与 CLI 脚手架，重复开发工作量减少 60%\n• 落地前端监控与灰度发布体系，线上故障率下降 50%' },
      { company: '小红书', position: '前端开发工程师', dateRange: '2020.07 ~ 2021.06', description: '• 负责社区信息流前端，LCP 指标优化 35%\n• 搭建可视化搭建平台，运营活动页产出效率提升 5 倍' },
    ],
    projects: [
      { name: '数据可视化大屏', role: '技术负责人', dateRange: '2023.01 ~ 2023.06', description: '基于 React + ECharts + WebSocket 的实时大屏。\n• 万级数据点流畅渲染，帧率稳定 60fps\n• 支持多主题与自适应布局', link: 'github.com/example/dashboard' },
      { name: '低代码搭建平台', role: '核心开发者', dateRange: '2022.03 ~ 2022.10', description: '拖拽式页面搭建引擎，Schema 驱动渲染。\n• 沉淀 80+ 业务组件，活动页开发从 3 天缩短至 2 小时', link: '' },
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
  { id: 'tpl_agent', name: 'AI Agent 工程师', industry: 'AI / Agent', icon: '🤖', description: '大模型应用、RAG、多 Agent 编排' },
  '#7c3aed',
  {
    name: '苏明哲', position: 'AI Agent 应用工程师｜3 年经验', phone: '138-0000-3120', email: 'mingzhe.su@example.com', location: '深圳市南山区',
    summary: '专注大模型应用与 Agent 系统落地，擅长 RAG、Tool Use、多 Agent 编排。主导过企业知识库问答与 AI 编程助手，追求「让 AI 真正可用」的产品体验。',
    education: [
      { school: '上海交通大学', degree: '硕士', major: '计算机科学与技术（NLP）', dateRange: '2020.09 ~ 2023.06', description: '• 研究方向：检索增强生成（RAG）\n• 发表 ACL 论文 1 篇\n• 国家奖学金' },
    ],
    skills: [
      { name: '大模型 & Agent', content: 'Prompt Engineering、RAG、Function Calling、Multi-Agent' },
      { name: '框架', content: 'LangChain、LangGraph、LlamaIndex、CrewAI、Dify' },
      { name: '后端', content: 'Python、FastAPI、Node.js、Go' },
      { name: '向量与检索', content: 'Milvus、Pinecone、Elasticsearch、pgvector' },
      { name: '工程', content: 'Docker、Kubernetes、vLLM、模型微调（LoRA/SFT）' },
    ],
    experience: [
      { company: '腾讯', position: '高级 AI 工程师', dateRange: '2023.07 ~ 至今', description: '• 主导企业级 **AI 知识库问答平台**，服务 8 万+ 内部员工，问答准确率 92%\n• 设计 Multi-Agent 协作框架，复杂任务完成率从 45% 提升至 80%\n• 自研 RAG 管线（Hybrid Retrieval + Re-ranking），幻觉率降至 <3%\n• 落地 AI 编程助手，研发人效提升约 30%' },
      { company: '百度', position: '算法工程师', dateRange: '2022.07 ~ 2023.06', description: '• 参与文心大模型应用适配与评测体系搭建\n• 构建 SFT 数据流水线，处理 50 万+ 高质量样本' },
    ],
    projects: [
      { name: '企业知识库问答 DocQA', role: '项目负责人', dateRange: '2024.01 ~ 至今', description: '基于 RAG 的企业文档智能问答。\n• 自适应分块策略，检索召回率提升 28%\n• 多租户隔离，已服务 6 家企业', link: 'github.com/example/docqa' },
      { name: 'AgentBench 评测框架', role: '核心贡献者', dateRange: '2023.06 ~ 2023.09', description: '开源 LLM Agent 能力基准，GitHub Star 3k+。\n• 覆盖 Tool Use、Code、Web 等 8 个维度', link: 'github.com/example/agentbench' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 腾讯 2024 优秀项目奖\n• ACL 论文一作\n• 开源 Star 3k+' },
      { title: '🌐 其他', content: '• 英语 CET-6（580+），可阅读论文与技术文档' },
    ],
  },
  { titleStyle: 'grad-underline' },
)

// ══════════════════════════════════════════════════════════════
// 4. 采购
// ══════════════════════════════════════════════════════════════
const procurement = mk(
  { id: 'tpl_procurement', name: '采购经理', industry: '采购 / Procurement', icon: '🛒', description: '战略寻源、供应商管理、降本增效' },
  '#059669',
  {
    name: '王慧', position: '采购经理｜8 年经验', phone: '138-0000-7742', email: 'hui.wang@example.com', location: '北京市海淀区',
    summary: '8 年采购与供应链管理经验，熟悉战略寻源、供应商管理与成本优化。主导过亿元级品类的降本增效，建立标准化供应商准入与风控体系。',
    education: [
      { school: '中央财经大学', degree: '本科', major: '供应链管理', dateRange: '2014.09 ~ 2018.06', description: '• GPA 3.6/4.0\n• 全国供应链大赛二等奖\n• 学生会外联部长' },
    ],
    skills: [
      { name: '寻源与谈判', content: '战略寻源（RFX）、商务谈判、招投标、合同管理' },
      { name: '供应商管理', content: '供应商开发 / 准入 / 考核、SRM 系统、风险评估' },
      { name: '成本与品类', content: 'TCO 分析、品类管理、VA/VE 降本、价格趋势分析' },
      { name: '系统与工具', content: 'ERP（SAP）、SRM、Excel 高级分析、Power BI' },
      { name: '合规', content: '采购合规、反舞弊、ISO 9001 / 14001' },
    ],
    experience: [
      { company: '华为', position: '采购经理', dateRange: '2019.07 ~ 至今', description: '• 负责电子元器件品类，**年采购额 12 亿元**，综合降本 8.6%\n• 建立多级供应商体系，关键物料备货周期缩短 30%\n• 主导国产化替代项目，供应风险下降 50%\n• 搭建供应商绩效考核模型，淘汰低效供应商 23 家' },
      { company: '美的', position: '采购专员', dateRange: '2018.07 ~ 2019.06', description: '• 负责包装与结构件采购，年降本 5%\n• 推动 VA/VE 项目，单品成本下降 12%' },
    ],
    projects: [
      { name: '战略供应商协同平台', role: '项目负责人', dateRange: '2022.03 ~ 2022.12', description: '基于 SRM 的供应商协同系统。\n• 在线招投标覆盖率提升至 90%\n• 采购周期缩短 25%', link: '' },
      { name: '国产化替代专项', role: '核心成员', dateRange: '2021.01 ~ 2021.12', description: '关键芯片国产替代寻源。\n• 引入 6 家合格备选供应商\n• 规避断供风险，保障交付', link: '' },
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
  { id: 'tpl_sales', name: '大客户销售经理', industry: '销售 / Sales', icon: '📈', description: '大客户经营、解决方案式销售' },
  '#ea580c',
  {
    name: '赵锐', position: '大客户销售经理｜6 年经验', phone: '138-0000-9938', email: 'rui.zhao@example.com', location: '广州市天河区',
    summary: '6 年 B 端大客户销售经验，擅长从 0 到 1 开拓与存量深耕。累计签单超 1.2 亿元，擅长解决方案式销售与复杂客户关系经营。',
    education: [
      { school: '武汉大学', degree: '本科', major: '市场营销', dateRange: '2016.09 ~ 2020.06', description: '• GPA 3.5/4.0\n• 校园创业大赛冠军\n• 市场营销协会会长' },
    ],
    skills: [
      { name: '销售方法', content: 'SPIN、顾问式销售、解决方案销售、MEDDIC' },
      { name: '客户经营', content: '大客户（KA）管理、客情维护、招投标、商务谈判' },
      { name: '流程', content: '线索到回款（L2C）、CRM 运营、销售预测' },
      { name: '行业', content: 'SaaS、企业软件、云计算、制造业' },
      { name: '工具', content: 'Salesforce、飞书 CRM、Excel、PPT 方案' },
    ],
    experience: [
      { company: '字节跳动', position: '大客户销售经理', dateRange: '2020.07 ~ 至今', description: '• 负责华南区 KA 客户，**年签单 6000 万+**，连续 3 季度超额完成（达成率 130%+）\n• 从 0 开拓 30+ 头部客户，并建立年度续约率 95% 的客情体系\n• 主导标杆案例打造，驱动老客户增购，NRR 达 140%\n• 搭建行业解决方案打法，团队人均产能提升 35%' },
      { company: '用友', position: '销售代表', dateRange: '2019.07 ~ 2020.06', description: '• 负责中小企业市场，年签单 800 万\n• 新客开拓占比 60%，回款周期缩短 20%' },
    ],
    projects: [
      { name: '某零售集团数字化项目', role: '项目销售负责人', dateRange: '2023.02 ~ 2023.10', description: '千万级 SaaS 私有化部署。\n• 协调售前 / 交付 / 法务，3 个月完成签约与启动\n• 成为行业标杆案例', link: '' },
      { name: '渠道伙伴共建计划', role: '发起人', dateRange: '2022.01 ~ 2022.12', description: '发展区域代理 15 家。\n• 渠道贡献业绩占比从 10% 提升至 35%', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 字节 2023 Top Sales\n• 用友 新人王' },
      { title: '🌐 其他', content: '• 英语 CET-6，可商务沟通' },
    ],
  },
  { titleStyle: 'centerline' },
)

// ══════════════════════════════════════════════════════════════
// 6. 业务
// ══════════════════════════════════════════════════════════════
const business = mk(
  { id: 'tpl_business', name: '业务负责人 / 产品经理', industry: '业务 / Business', icon: '🧭', description: '业务操盘、增长策略、数据驱动' },
  '#0d9488',
  {
    name: '周岚', position: '业务负责人 / 产品经理｜7 年经验', phone: '138-0000-6614', email: 'lan.zhou@example.com', location: '成都市高新区',
    summary: '7 年互联网业务操盘经验，擅长从战略到落地的全链路经营。主导过 0→1 产品与 1→100 业务增长，数据驱动决策，结果导向。',
    education: [
      { school: '中山大学', degree: '本科', major: '工商管理', dateRange: '2015.09 ~ 2019.06', description: '• GPA 3.7/4.0\n• 创业大赛金奖\n• 校辩论队队长' },
    ],
    skills: [
      { name: '业务经营', content: '商业模式设计、增长策略、ROI 分析、OKR 管理' },
      { name: '产品', content: '需求分析、PRD、数据埋点、A/B 实验、用户研究' },
      { name: '增长', content: '漏斗优化、留存体系、私域运营、渠道投放' },
      { name: '协作', content: '跨部门项目管理、研发 / 运营 / 市场协同' },
      { name: '工具', content: 'SQL、Axure、Figma、神策 / GA、Excel' },
    ],
    experience: [
      { company: '美团', position: '业务负责人', dateRange: '2019.07 ~ 至今', description: '• 负责本地生活某业务线，**年 GMV 从 3 亿增长至 11 亿**，年复合增长 54%\n• 设计分层运营策略，核心用户留存提升 22 个百分点\n• 主导供给侧改革，商户活跃度提升 40%\n• 搭建业务数据看板与预警机制，决策效率显著提升' },
      { company: '滴滴', position: '产品经理', dateRange: '2018.07 ~ 2019.06', description: '• 负责司机端体验优化，完单率提升 8%\n• 设计新手引导，次日留存提升 15%' },
    ],
    projects: [
      { name: '会员增长体系', role: '项目负责人', dateRange: '2022.03 ~ 2022.11', description: '积分 + 等级 + 权益一体化。\n• 付费会员渗透率从 6% 提升至 18%\n• 会员年贡献 GMV 占比 35%', link: '' },
      { name: '新城市拓展模型', role: '主操盘', dateRange: '2021.01 ~ 2021.09', description: '标准化开城 SOP。\n• 单城盈亏平衡周期缩短 30 天\n• 复制至 12 个城市', link: '' },
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
  { id: 'tpl_ui', name: 'UI / 交互设计师', industry: 'UI / 设计', icon: '✨', description: '设计系统、交互体验、B/C 端' },
  '#db2777',
  {
    name: '顾清', position: 'UI / 交互设计师｜5 年经验', phone: '138-0000-2257', email: 'qing.gu@example.com', location: '杭州市西湖区',
    summary: '5 年 UI 与交互设计经验，专注 B 端复杂系统与 C 端体验设计。主导过设计系统建设，擅长以用户为中心的设计方法与高保真原型。',
    education: [
      { school: '中国传媒大学', degree: '本科', major: '视觉传达设计', dateRange: '2017.09 ~ 2021.06', description: '• GPA 3.8/4.0\n• 全国大学生设计大赛一等奖\n• 校设计工作室负责人' },
    ],
    skills: [
      { name: '设计工具', content: 'Figma、Sketch、Adobe XD、Photoshop、Illustrator' },
      { name: '设计系统', content: '组件库搭建、Design Token、规范文档、图标库' },
      { name: '交互', content: '用户旅程、信息架构、原型、可用性测试' },
      { name: '协作', content: '与产品 / 研发协作、设计走查、动效（ProtoPie/Principle）' },
      { name: '方法', content: '用户研究、竞品分析、A/B 测试、无障碍设计' },
    ],
    experience: [
      { company: '蚂蚁集团', position: '高级 UI 设计师', dateRange: '2021.07 ~ 至今', description: '• 负责金融 B 端设计系统，**覆盖 40+ 业务线**，设计交付效率提升 50%\n• 主导核心交易链路改版，转化率提升 18%\n• 建设无障碍设计规范，通过 WCAG 2.1 AA 认证\n• 带教 3 名初级设计师，团队设计质量显著改善' },
      { company: '京东', position: '交互设计师', dateRange: '2020.07 ~ 2021.06', description: '• 负责商城活动页设计，点击率提升 25%\n• 搭建运营设计模板，产出效率提升 3 倍' },
    ],
    projects: [
      { name: '企业级设计系统 AntD-Pro', role: '核心设计', dateRange: '2023.01 ~ 2023.08', description: '统一组件与 Token 体系。\n• 主题切换一键适配，研发还原度 98%\n• 设计走查问题下降 60%', link: '' },
      { name: '智能投顾 App 体验设计', role: '主设计师', dateRange: '2022.02 ~ 2022.09', description: '从 0 到 1 的理财 App。\n• 关键流程转化提升 30%\n• 获内部体验设计奖', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 蚂蚁 2023 设计之星\n• 全国设计大赛一等奖' },
      { title: '🛠 其他', content: '• 熟练 Figma 插件开发（自动化产出）' },
    ],
  },
  { titleStyle: 'grad-pill', fontFamily: "'PingFang SC', sans-serif" },
)

// ══════════════════════════════════════════════════════════════
// 8. 设计（视觉 / 品牌）
// ══════════════════════════════════════════════════════════════
const design = mk(
  { id: 'tpl_design', name: '视觉 / 品牌设计师', industry: '设计 / Design', icon: '🎭', description: '品牌识别、视觉语言、全链路落地' },
  '#9333ea',
  {
    name: '沈墨', position: '视觉 / 品牌设计师｜6 年经验', phone: '138-0000-4083', email: 'mo.shen@example.com', location: '上海市静安区',
    summary: '6 年品牌与视觉设计经验，擅长品牌识别、视觉语言与全链路设计落地。服务过多个消费与科技品牌，作品兼具审美与商业转化。',
    education: [
      { school: '广州美术学院', degree: '本科', major: '视觉传达设计', dateRange: '2016.09 ~ 2020.06', description: '• GPA 3.7/4.0\n• 靳埭強设计奖入围\n• 校美术馆策展助理' },
    ],
    skills: [
      { name: '品牌', content: '品牌识别（VI）、Logo、视觉语言、品牌指南' },
      { name: '视觉', content: '海报、包装、插画、版式、动态视觉' },
      { name: '工具', content: 'Illustrator、Photoshop、After Effects、C4D、Blender' },
      { name: '产出', content: 'KV、主视觉、运营物料、展览视觉' },
      { name: '协作', content: '与营销 / 产品配合、印刷工艺、供应商对接' },
    ],
    experience: [
      { company: '泡泡玛特', position: '资深视觉设计师', dateRange: '2020.07 ~ 至今', description: '• 负责潮玩品牌视觉，**主导 8 个 IP 系列主视觉**，系列首发售罄率 95%+\n• 搭建品牌视觉规范，跨渠道一致性显著提升\n• 设计线下展陈视觉，单展触达 50 万+ 人次\n• 联动电商大促视觉，GMV 同比提升 40%' },
      { company: '字节跳动', position: '视觉设计师', dateRange: '2019.07 ~ 2020.06', description: '• 负责教育品牌视觉，活动曝光提升 30%\n• 产出 200+ 套营销物料模板' },
    ],
    projects: [
      { name: '城市漫游主题展', role: '视觉主创', dateRange: '2023.03 ~ 2023.08', description: '从 KV 到空间视觉的全套设计。\n• 社交媒体话题量 2000 万+\n• 获行业设计奖', link: '' },
      { name: '新消费品牌升级', role: '品牌设计师', dateRange: '2022.01 ~ 2022.07', description: '从 0 搭建 VI 与包装。\n• 新包装上架复购率提升 25%\n• 进入 3 家头部渠道', link: '' },
    ],
    custom: [
      { title: '🏆 荣誉奖项', content: '• 靳埭強设计奖入围\n• 泡泡玛特 年度创意奖' },
      { title: '🛠 其他', content: '• 3D（C4D / Blender）全流程产出' },
    ],
  },
  { titleStyle: 'thin-underline' },
)

export const INDUSTY_TEMPLATES: BuiltInTemplate[] = [
  backend,
  frontend,
  agent,
  procurement,
  sales,
  business,
  ui,
  design,
]
