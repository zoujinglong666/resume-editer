# Resume Editor 技术架构方案 v2.0

> 版本：2026-06-08  
> 目标：融合 AI 能力 + 元素级自由编辑，构建下一代智能简历编辑器

---

## 一、当前架构诊断

### 1.1 现有架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        App.vue (三栏布局)                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ GuidePanel│  │    Canvas    │  │ EditorPanel  │          │
│  │ (左/引导) │  │  (A4画布预览) │  │ (右/表单编辑) │          │
│  └──────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────┘
         ↓                      ↓
    Pinia Store (resume.ts)  vuedraggable
         ↓
   6 个模块组件 (personal/edu/exp/project/skill/custom)
```

**技术栈**：Vue 3 + TypeScript + Vite + Tailwind CSS v4 + Pinia + vuedraggable + html2canvas + jsPDF

### 1.2 核心痛点分析

| 维度 | 现状 | 问题 |
|------|------|------|
| **数据流** | 模块 → 条目 → 字段，三级树形 | 字段级样式无法独立控制，所有同类型字段外观一致 |
| **渲染层** | 预定义模块组件 + CSS 类名 | 无法插入自定义图形、自由文本框、分割线等原子元素 |
| **编辑模式** | 右侧面板表单 + Canvas contenteditable | 双轨编辑造成认知负担，表单与画布状态易不同步 |
| **AI 集成** | 无 | 用户需手动撰写全部内容，无智能辅助 |
| **导出** | html2canvas → 图片 / jsPDF → PDF | 复杂布局时偶有截断，依赖 DOM 渲染一致性 |
| **样式系统** | CSS 变量 + 主题预设 | 变量命名存在不一致，部分配置未实际生效 |

### 1.3 关键约束

- **导出必须可靠**：最终产物是 A4 PDF/图片，任何画布上的元素必须可被 html2canvas 完整捕获
- **数据可迁移**：用户数据需支持 JSON 导入导出，版本向前兼容
- **性能底线**：画布内 50+ 元素时，交互帧率保持 60fps

---

## 二、UX 架构重设计

### 2.1 核心交互范式转变

从「表单驱动」转向 **「画布直接操作 (Direct Manipulation)」**，右侧面板仅作为「属性检查器 (Inspector)」存在。

```
旧范式：用户在右侧面板填写表单 → 左侧画布被动预览
新范式：用户在画布上直接编辑 → 右侧面板实时反映当前选中元素的属性
```

### 2.2 三阶段工作流（保留并强化）

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   1. 填写   │ ──→ │   2. 美化   │ ──→ │   3. 导出   │
│   FILL      │     │   STYLE     │     │   EXPORT    │
└─────────────┘     └─────────────┘     └─────────────┘
     │                    │                    │
     ▼                    ▼                    ▼
  • 内容录入/AI生成    • 布局微调           • 格式选择
  • 模块增删排序       • 颜色/字体/间距      • 预览确认
  • 基础信息完善       • 元素级精细调整      • 下载/分享
```

**阶段切换逻辑优化**：
- **填写阶段**：画布显示可编辑的 contenteditable 区域，高亮未填字段，显示 AI 辅助入口
- **美化阶段**：画布进入「设计模式」，显示元素边界框、对齐辅助线、网格吸附
- **导出阶段**：只读预览，提供多格式导出（PDF/PNG/JPG）和打印优化

### 2.3 画布交互模式状态机

```
                    ┌─────────────┐
         ┌─────────→│   浏览模式   │←─────────┐
         │          │  (Hover高亮) │          │
         │          └─────────────┘          │
    单击元素│                ↑ESC/点击空白     │完成编辑
         │                │                 │
         ↓                │                 │
    ┌─────────┐     ┌────┴────┐      ┌──────┴──────┐
    │ 文本编辑 │←──→│ 选中模式 │←──→│  元素属性面板  │
    │(contenteditable)│(显示操作柄) │      │  (右侧面板)   │
    └─────────┘     └────┬────┘      └─────────────┘
                         │
              右键/工具栏 │
                         ↓
                   ┌─────────┐
                   │ 插入模式 │ ← 从工具栏拖入新元素
                   │(图形/线条)│
                   └─────────┘
```

### 2.4 右键菜单扩展

当前右键菜单仅支持模块级操作，需扩展至 **元素级**：

```typescript
interface ElementContextMenuItem {
  label: string
  icon: string
  action: 'edit' | 'duplicate' | 'delete' | 'move' | 'style' | 'ai-rewrite'
  shortcut?: string
}

// 文本元素右键
['编辑文本', 'AI 润色', '复制', '删除', '字体样式...', '颜色...']

// 容器/模块右键
['重命名', '添加条目', '隐藏/显示', '上移/下移', '删除模块']

// 空白处右键
['粘贴', '插入文本框', '插入分割线', '插入形状', '插入图标']
```

---

## 三、自定义编辑系统架构

### 3.1 核心数据模型重构

从「模块-条目-字段」三层结构升级为 **「文档 → 页面 → 元素」** 的通用文档模型：

```typescript
// ===== 新数据模型 =====

// 元素类型枚举（开放扩展）
type ElementType =
  // 文本类
  | 'text'           // 自由文本框
  | 'heading'        // 标题
  | 'paragraph'      // 段落
  | 'rich-text'      // 富文本（加粗/斜体/下划线/链接）
  // 容器类
  | 'module'         // 模块容器（教育/经历等）
  | 'item'           // 条目容器
  | 'row'            // 水平布局行
  | 'column'         // 垂直布局列
  // 装饰类
  | 'divider'        // 分割线
  | 'shape'          // 几何图形（矩形/圆形/线条）
  | 'icon'           // 图标
  | 'image'          // 图片
  // 特殊
  | 'avatar'         // 头像
  | 'skill-bar'      // 技能条
  | 'progress-ring'  // 进度环

// 通用元素接口
interface ResumeElement {
  id: string
  type: ElementType
  parentId: string | null       // 父元素 ID，支持嵌套
  order: number

  // 内容
  content?: string              // 文本内容
  html?: string                 // 富文本 HTML
  src?: string                  // 图片/图标源

  // 布局（绝对/相对定位系统）
  layout: {
    mode: 'flow' | 'absolute'   // flow: 文档流, absolute: 自由定位
    x?: number                  // absolute 模式下的 x (mm)
    y?: number                  // absolute 模式下的 y (mm)
    width?: number | 'auto'     // 宽度 (mm 或 auto)
    height?: number | 'auto'    // 高度
    zIndex?: number
  }

  // 样式（原子化，每个元素独立）
  style: ElementStyle

  // 可见性
  visible: boolean
}

// 元素样式（完整独立）
interface ElementStyle {
  // 字体
  fontFamily?: string
  fontSize?: number            // px
  fontWeight?: number | string
  fontStyle?: 'normal' | 'italic'
  color?: string               // 文字颜色
  lineHeight?: number
  letterSpacing?: number       // px
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textDecoration?: 'none' | 'underline' | 'line-through'

  // 盒模型
  padding?: { top:number; right:number; bottom:number; left:number }
  margin?: { top:number; right:number; bottom:number; left:number }
  background?: string
  borderRadius?: number         // px
  border?: {
    width: number; style: string; color: string
  }

  // 特效
  opacity?: number              // 0-1
  transform?: string            // CSS transform
  boxShadow?: string
}

// 页面定义
interface ResumePage {
  id: string
  elements: ResumeElement[]
  config: {
    width: number               // mm, 默认 210 (A4)
    height: number              // mm, 默认 297 (A4)
    margin: { top:number; right:number; bottom:number; left:number }
    background?: string
  }
}

// 完整文档
interface ResumeDocument {
  meta: ResumeMeta
  pages: ResumePage[]           // 支持多页
  theme: ThemeConfig
  globals: GlobalStyle          // 全局默认样式
}
```

### 3.2 样式继承与覆盖机制

采用 **CSS-in-JS 风格的原子样式 + 三层继承体系**：

```
全局默认样式 (globals)  →  主题预设样式 (theme)  →  元素独立样式 (element.style)
         ↑ 优先级最低                              ↑ 优先级最高
```

渲染时通过 `getComputedStyle(element)` 合并三层样式：

```typescript
function getComputedElementStyle(element: ResumeElement, doc: ResumeDocument): ElementStyle {
  return {
    // 从全局默认值开始
    ...doc.globals.elementDefaults[element.type],
    // 主题覆盖
    ...doc.theme.overrides?.[element.type],
    // 元素自身样式最高优先级
    ...element.style
  }
}
```

### 3.3 渲染引擎架构

```
┌─────────────────────────────────────────────┐
│           Canvas Renderer (Vue)              │
├─────────────────────────────────────────────┤
│  1. 遍历当前 page.elements (按 order 排序)    │
│  2. 根据 element.type 映射到对应 RenderNode   │
│  3. 计算 mergedStyle (继承 + 自身)           │
│  4. 输出 <div> / <span> / <svg> 等 DOM       │
│  5. 绑定事件处理器 (click/dblclick/drag)     │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│           RenderNode Registry                │
├─────────────────────────────────────────────┤
│  'text'        → TextRenderNode              │
│  'heading'     → TextRenderNode (加粗默认)    │
│  'module'      → ModuleRenderNode            │
│  'divider'     → DividerRenderNode           │
│  'shape'       → ShapeRenderNode (SVG)       │
│  'skill-bar'   → SkillBarRenderNode          │
│  'image'       → ImageRenderNode             │
│  ... 可注册自定义                             │
└─────────────────────────────────────────────┘
```

### 3.4 元素插入与编辑流程

```
用户操作                          系统响应
─────────────────────────────────────────────────────────
点击工具栏「插入分割线」    →   store.addElement({ type:'divider', ... })
                                    ↓
                           Canvas 渲染新元素（默认居中）
                                    ↓
                           自动进入「选中模式」，显示拖拽手柄
                                    ↓
用户拖拽调整位置/大小       →   实时更新 element.layout.x/y/width/height
                                    ↓
用户点击「颜色」按钮        →   打开颜色选择器
                                    ↓
选择颜色 #FF6B6B           →   更新 element.style.color
                                    ↓
                           Vue 响应式更新，画布即时重绘
```

### 3.5 自定义图形系统

```typescript
// 图形定义（SVG-based，保证导出兼容性）
interface ShapeConfig {
  type: 'rectangle' | 'circle' | 'line' | 'arrow'
  // 矩形
  width: number
  height: number
  rx?: number   // 圆角
  // 圆形
  radius?: number
  // 线条
  x1: number; y1: number; x2: number; y2: number
  // 样式
  fill?: string
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string   // 虚线模式
}
```

图形通过 SVG 渲染，确保 html2canvas 能正确捕获。提供 **图形编辑器浮层**：
- 线型：实线 / 虚线 / 点线
- 端点：无 / 圆角 / 箭头
- 填充：纯色 / 渐变 / 透明

---

## 四、AI 融合架构

### 4.1 AI 能力矩阵

| 能力域 | 功能 | 触发时机 | UI 入口 |
|--------|------|----------|---------|
| **内容生成** | 根据职位描述生成工作经历 | 新建条目时 | 「✨ AI 生成」按钮 |
| **内容润色** | 优化措辞、量化成果、去口语化 | 选中文字右键 | 右键菜单「AI 润色」 |
| **智能补全** | 根据已填内容推断缺失字段 | 输入时实时 | 幽灵文字 (Ghost Text) |
| **排版建议** | 检测内容溢出，建议分页/缩略 | 编辑完成后 | 底部状态栏提示 |
| **模板推荐** | 根据行业/职位推荐模块组合 | 首次创建 | 欢迎弹窗 |
| **简历评分** | ATS 兼容性、关键词匹配度 | 导出前 | 「AI 诊断」面板 |
| **多语言翻译** | 中英互译、本地化表达 | 选中文字右键 | 右键菜单「翻译」 |

### 4.2 AI 服务层架构

```typescript
// AI 服务抽象层（支持多提供商切换）
interface AIService {
  name: string
  generateWorkExperience(prompt: string): Promise<string>
  polishText(text: string, tone: 'professional' | 'concise' | 'creative'): Promise<string>
  suggestCompletion(context: string, partial: string): Promise<string[]>
  analyzeResume(resumeText: string): Promise<ResumeAnalysis>
  translate(text: string, targetLang: string): Promise<string>
}

// 具体实现
class OpenAIService implements AIService { /* ... */ }
class DeepSeekService implements AIService { /* ... */ }
class SiliconFlowService implements AIService { /* ... */ }  // 国内兜底

// 工厂 + 配置
const aiProvider = ref<'openai' | 'deepseek' | 'siliconflow'>('deepseek')
```

### 4.3 AI 提示词工程（Prompt Engineering）

```typescript
// 工作经历生成 Prompt
const WORK_EXPERIENCE_PROMPT = `
你是一位资深 HR 和简历优化专家。请根据以下信息生成一段专业的工作经历描述：

职位：{position}
公司：{company}
时间段：{dateRange}
关键职责（简要）：{briefDescription}

要求：
1. 使用 STAR 法则组织内容（情境-任务-行动-结果）
2. 每句话都必须包含量化数据（百分比、金额、用户数等）
3. 使用强动词开头（主导、设计、实现、优化、推动等）
4. 控制在 3-5 个 bullet points
5. 总字数不超过 200 字
6. 语言风格：专业、简洁、有冲击力

请直接输出 bullet points，不需要任何解释。
`

// 文本润色 Prompt
const POLISH_PROMPT = `
请优化以下简历文本，要求：
1. 去除口语化表达
2. 增加量化成果
3. 使用行业专业术语
4. 保持原有信息不丢失
5. 语气：{tone}

原文：
{text}

请只输出优化后的文本，不要添加解释。
`
```

### 4.4 AI 交互 UI 组件

```
┌────────────────────────────────────────┐
│         AI Assistant FloatBar           │
├────────────────────────────────────────┤
│  [✨ 生成]  [💎 润色]  [🔮 补全]  [🌐 翻译]  │
└────────────────────────────────────────┘

// 选中文字时，在选区附近弹出 mini toolbar
// 按 Ctrl+J 快速触发 AI 补全
// 右侧固定面板显示「AI 诊断」评分
```

### 4.5 AI 生成内容的工作流

```
用户点击「AI 生成」
     ↓
收集上下文（当前模块类型、已有内容、用户偏好）
     ↓
显示加载状态（骨架屏 + 流光效果）
     ↓
调用 AI Service → 获取生成结果
     ↓
显示「AI 建议」浮动卡片（非直接覆盖，让用户选择）
     ↓
用户操作：
   • [采纳] → 填充到对应字段
   • [再试一次] → 重新生成（携带 feedback）
   • [调整] → 打开微调面板（语气/长度/侧重点）
   • [忽略] → 关闭卡片
```

---

## 五、工程实施路线图

### Phase 1：基础架构重构（2 周）

**目标**：建立元素级数据模型，不破坏现有功能

| 任务 | 工作量 | 说明 |
|------|--------|------|
| 数据模型迁移 | 3d | 新 ResumeDocument 模型，兼容旧数据导入 |
| 渲染引擎抽离 | 4d | RenderNode 注册表，支持自定义扩展 |
| 样式系统统一 | 2d | 修复 CSS 变量名不一致，实现元素级样式覆盖 |
| 元素插入系统 | 3d | 工具栏 + 拖拽插入 + 基础图形支持 |
| 回归测试 | 2d | 确保导出、打印、JSON 导入导出正常 |

**交付物**：
- 画布可插入文本框、分割线、矩形
- 每个元素可独立修改颜色/字号/边距
- 旧模板 100% 兼容

### Phase 2：AI 功能集成（2 周）

**目标**：AI 辅助内容生成与优化

| 任务 | 工作量 | 说明 |
|------|--------|------|
| AI 服务层 | 3d | 抽象接口 + DeepSeek/SiliconFlow 实现 |
| 内容生成 | 3d | 工作经历/项目描述一键生成 |
| 文本润色 | 2d | 选中文字右键润色 |
| 智能补全 | 2d | Ghost Text 实时提示 |
| AI 诊断面板 | 2d | 简历评分 + ATS 检测 |

**交付物**：
- 新建条目时可 AI 生成内容
- 右键菜单支持 AI 润色
- 导出前 AI 诊断提示优化建议

### Phase 3：高级自定义编辑（2 周）

**目标**：完整的自由设计能力

| 任务 | 工作量 | 说明 |
|------|--------|------|
| 自由定位系统 | 3d | absolute 布局模式，网格吸附，对齐辅助线 |
| 图形编辑器 | 3d | SVG 形状库，线条样式，箭头，渐变填充 |
| 图标系统 | 2d | 集成 Iconify，支持搜索和插入 |
| 模板市场 | 2d | 预设模板 + 用户保存自定义模板 |
| 多页支持 | 2d | 分页逻辑，跨页元素处理 |

**交付物**：
- 可自由拖拽任意元素
- 丰富的图形和图标库
- 模板保存与复用

### Phase 4：性能优化与打磨（1 周）

| 任务 | 说明 |
|------|------|
| 虚拟滚动 | 长简历性能优化 |
| 导出引擎升级 | 探索 Puppeteer/Playwright 替代 html2canvas 提升质量 |
| 动画与过渡 | 元素操作时的微动效 |
| 移动端适配 | 平板端可用性优化 |

---

## 六、关键技术决策

### 决策 1：是否引入 Canvas 2D / SVG 渲染替代 DOM？

**结论**：保留 DOM 渲染，原因：
1. html2canvas 依赖 DOM，换渲染层需重写导出逻辑
2. Vue 的响应式系统与 DOM 深度绑定，迁移成本高
3. 当前 DOM 方案在 100 个元素内性能足够

**优化方向**：对大量图形元素使用 SVG，文本保持 DOM

### 决策 2：AI 调用是前端直连还是通过后端代理？

**结论**：前端直连 + CORS 代理（可选），原因：
1. 项目当前是纯前端应用，无后端服务
2. API Key 可通过用户自行配置输入（存储在 localStorage）
3. 提供可选的代理配置，应对 CORS 限制

```typescript
// 用户配置界面
interface AIConfig {
  provider: 'openai' | 'deepseek' | 'siliconflow'
  apiKey: string
  baseUrl?: string       // 自定义代理地址
  model?: string         // 自定义模型
  temperature?: number   // 生成温度
}
```

### 决策 3：自定义元素的数据如何保持可导出？

**结论**：所有元素数据扁平化存储于 JSON，渲染时重建：

```json
{
  "pages": [{
    "elements": [
      { "type": "shape", "layout": {...}, "style": {...}, "shapeConfig": {...} },
      { "type": "text", "content": "自由文本", "layout": {...}, "style": {...} }
    ]
  }]
}
```

导出时，渲染引擎按相同规则重建 DOM，html2canvas 捕获即可。

---

## 七、风险与应对

| 风险 | 影响 | 应对策略 |
|------|------|----------|
| 数据模型迁移导致旧数据不兼容 | 高 | 编写数据迁移脚本，版本号检测，自动升级 |
| html2canvas 对复杂 SVG/图形渲染异常 | 高 | 建立渲染测试用例集，每个新图形类型需通过导出测试 |
| AI 生成内容质量不稳定 | 中 | 提供「再试一次」和「手动调整」路径，不强制使用 |
| 自由布局导致打印分页断裂 | 中 | 实现分页预览模式，标记跨页风险元素 |
| 元素过多导致画布卡顿 | 中 | 虚拟滚动 + 渲染节流 + 性能监控面板 |

---

## 八、附录：当前样式变量修复清单

已发现的不一致问题：

| Store 注入变量 | CSS 实际使用 | 状态 |
|----------------|-------------|------|
| `--font-family` | `--font-sans` | **已修复**：改为 `var(--font-family, var(--font-sans))` |
| `--font-size` | `--font-size-base` | **已修复**：改为 `var(--font-size, var(--font-size-base))` |
| `--line-height` | `--line-height-normal` | **已修复**：改为 `var(--line-height, var(--line-height-normal))` |
| `--page-margin` | `--page-margin` | ✅ 正常 |

---

*文档结束。下一步：确认方案后进入 Phase 1 实施。*
