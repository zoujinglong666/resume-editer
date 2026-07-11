// ===== Module Types =====
export type ModuleType = 'personal' | 'education' | 'experience' | 'project' | 'skill' | 'strength' | 'custom'

// ===== Personal Field Config =====
export interface PersonalFieldConfig {
  id: string
  key: string        // field identifier: name, phone, email, custom_xxx
  label: string      // display label
  icon?: string      // lucide icon name, empty = no icon
  visible: boolean   // show/hide
  order: number      // display order
  isBuiltin?: boolean // is it a built-in field (cannot delete key)
}

export interface ModuleItem {
  id: string
  name?: string
  position?: string
  role?: string
  company?: string
  school?: string
  degree?: string
  major?: string
  dateRange?: string
  description?: string
  content?: string
  title?: string
  summary?: string
  phone?: string
  email?: string
  location?: string
  link?: string
  level?: string
  // Dynamic personal info field configs
  personalFields?: PersonalFieldConfig[]
  [key: string]: string | boolean | undefined | PersonalFieldConfig[]
}

export interface ResumeModule {
  id: string
  type: ModuleType
  title: string
  visible: boolean
  order: number
  items: ModuleItem[]
  displayMode?: string
  hideTitle?: boolean  // independently hide this module's title
}

// ===== Avatar =====
export interface AvatarConfig {
  url: string
  shape: 'circle' | 'rounded'
}

// ===== Config =====
export type TitleStyle = 'underline' | 'leftbar' | 'pill' | 'centerline' | 'dots' | 'minimal' | 'grad-underline' | 'grad-leftbar' | 'grad-dual' | 'grad-pill' | 'grad-shadow' | 'grad-fade' | 'thin-underline' | 'thin-double' | 'thin-leftbar' | 'thin-overline' | 'thin-box' | 'thin-framed' | 'thin-corner' | 'thin-bracket' | 'thin-center' | 'thin-underline-soft'

export interface ResumeConfig {
  theme: string
  primaryColor: string
  fontFamily: string
  fontSize: number
  lineHeight: number
  pageMargin: number
  moduleGap: number
  itemGap: number
  titleStyle: TitleStyle
  underlineWidth: number
}

// ===== Meta =====
export interface ResumeMeta {
  version: string
  lastSaved: string
}

// ===== Full Data Model =====
export interface ResumeData {
  meta: ResumeMeta
  config: ResumeConfig
  avatar: AvatarConfig
  modules: ResumeModule[]
}

// ===== Theme Definition =====
export interface ThemePreset {
  name: string
  id: string
  primaryColor: string
  accentColor: string
  bgColor: string
  surfaceColor: string
  textPrimary: string
  textSecondary: string
  borderColor: string
}

// ===== PDF Export Config =====
export interface PdfExportConfig {
  paperSize: 'a4' | 'letter'
  margin: number
  includeBackground: boolean
  filename: string
}

// ============================================================
// Phase 1 新数据模型：文档 → 页面 → 元素
// ============================================================

// 元素类型
export type ElementType =
  // 文本类
  | 'text'
  | 'heading'
  | 'paragraph'
  | 'rich-text'
  // 容器类
  | 'module'
  | 'item'
  | 'row'
  | 'column'
  // 装饰类
  | 'divider'
  | 'shape'
  | 'icon'
  | 'image'
  // 特殊
  | 'avatar'
  | 'skill-bar'

// 元素布局
export interface ElementLayout {
  mode: 'flow' | 'absolute' | 'inline'
  x?: number
  y?: number
  width?: number | 'auto'
  height?: number | 'auto'
  zIndex?: number
  // Flex 容器属性（row / column 使用）
  flexDirection?: 'row' | 'column'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  gap?: number
  // Flex 子项属性
  flexGrow?: number
  flexShrink?: number
  flexBasis?: number | 'auto'
}

// 元素样式（原子化，每个元素独立）
export interface ElementStyle {
  // 字体
  fontFamily?: string
  fontSize?: number
  fontWeight?: number | string
  fontStyle?: 'normal' | 'italic'
  color?: string
  lineHeight?: number
  letterSpacing?: number
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textDecoration?: 'none' | 'underline' | 'line-through'
  // 盒模型
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
  background?: string
  borderRadius?: number
  borderWidth?: number
  borderStyle?: string
  borderColor?: string
  // 特效
  opacity?: number
  boxShadow?: string
}

// 通用元素接口
export interface ResumeElement {
  id: string
  type: ElementType
  parentId: string | null
  order: number
  content?: string
  html?: string
  src?: string
  layout: ElementLayout
  style: ElementStyle
  visible: boolean
  // 模块类型元素的附加字段（兼容旧数据）
  moduleType?: ModuleType
  title?: string
  items?: ModuleItem[]
}

// 图形配置（SVG-based）
export interface ShapeConfig {
  shape: 'rectangle' | 'circle' | 'line' | 'arrow'
  width: number
  height: number
  rx?: number
  radius?: number
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
}

// 页面定义
export interface ResumePage {
  id: string
  elements: ResumeElement[]
  config: {
    width: number
    height: number
    marginTop: number
    marginRight: number
    marginBottom: number
    marginLeft: number
    background?: string
  }
}

// 全局默认样式
export interface GlobalStyle {
  elementDefaults: Partial<Record<ElementType, ElementStyle>>
}

// 主题配置（扩展）
export interface ThemeConfig {
  id: string
  name: string
  primaryColor: string
  accentColor: string
  overrides?: Partial<Record<ElementType, ElementStyle>>
}

// 新文档模型
export interface ResumeDocument {
  meta: ResumeMeta
  pages: ResumePage[]
  theme: ThemeConfig
  globals: GlobalStyle
  // 保留旧字段用于迁移和兼容
  config?: ResumeConfig
  avatar?: AvatarConfig
  // 版本号用于迁移
  schemaVersion: number
}

// Helper: convert old module item to HTML for new model
export function itemToHtml(item: ModuleItem, moduleType: ModuleType): string {
  // Use description if available (most items have this)
  if (item.description) {
    return `<div class="item-desc">${item.description.replace(/\n/g, '<br/>')}</div>`
  }
  if (item.content) {
    return `<div class="item-content">${item.content.replace(/\n/g, '<br/>')}</div>`
  }

  // Build HTML based on item type
  switch (moduleType) {
    case 'personal': {
      const parts = [
        item.name, item.position,
        item.phone, item.email, item.location
      ].filter(Boolean)
      return `<div class="personal-info">${parts.join(' | ')}</div>`
    }
    case 'education': {
      const header = [item.school, item.degree, item.major].filter(Boolean).join(' · ')
      const date = item.dateRange ? `<span class="date">${item.dateRange}</span>` : ''
      return `<div class="education-item"><div class="header">${header} ${date}</div></div>`
    }
    case 'experience':
    case 'project': {
      const header = [item.company || item.name, item.position || item.role].filter(Boolean).join(' · ')
      const date = item.dateRange ? `<span class="date">${item.dateRange}</span>` : ''
      return `<div class="exp-item"><div class="header">${header} ${date}</div></div>`
    }
    case 'skill': {
      if (item.content) {
        return `<div class="skill-list-row"><strong>${item.name || ''}：</strong>${item.content}</div>`
      }
      return `<div class="skill-item">${item.name || ''}</div>`
    }
    case 'strength': {
      return `<div class="strength-row"><strong>${item.title || ''}：</strong>${item.content || ''}</div>`
    }
    case 'custom': {
      const title = item.title ? `<div class="custom-title">${item.title}</div>` : ''
      const content = item.content ? `<div class="custom-content">${item.content.replace(/\n/g, '<br/>')}</div>` : ''
      return `<div class="custom-item">${title}${content}</div>`
    }
    default:
      return ''
  }
}

// 迁移辅助：旧数据 → 新文档（需在调用处传入 themePresets）
export function migrateResumeDataToDocument(
  old: ResumeData,
  themePresets: ThemePreset[]
): ResumeDocument {
  const defaultPage: ResumePage = {
    id: 'page-1',
    elements: [],
    config: {
      width: 210,
      height: 297,
      marginTop: old.config.pageMargin ?? 12,
      marginRight: old.config.pageMargin ?? 12,
      marginBottom: old.config.pageMargin ?? 12,
      marginLeft: old.config.pageMargin ?? 12,
      background: '#ffffff',
    },
  }

  const sortedModules = [...old.modules].sort((a, b) => a.order - b.order)
  let order = 0

  for (const mod of sortedModules) {
    if (!mod.visible) continue
    const moduleEl: ResumeElement = {
      id: mod.id,
      type: 'module',
      parentId: null,
      order: order++,
      content: mod.title,
      title: mod.title,
      moduleType: mod.type,
      visible: true,
      layout: { mode: 'flow' },
      style: {},
      items: mod.items,
    }
    defaultPage.elements.push(moduleEl)
    // Items are kept inside the module element, not as separate top-level elements
    // This maintains visual consistency with the old module-based rendering
  }

  const themePreset = themePresets.find(t => t.id === old.config.theme)
  const theme: ThemeConfig = {
    id: old.config.theme ?? 'indigo',
    name: themePreset?.name ?? 'Indigo',
    primaryColor: old.config.primaryColor ?? '#4F46E5',
    accentColor: themePreset?.accentColor ?? '#6366F1',
  }

  return {
    meta: old.meta,
    pages: [defaultPage],
    theme,
    globals: {
      elementDefaults: {},
    },
    config: old.config,
    avatar: old.avatar,
    schemaVersion: 2,
  }
}

// ===== Template =====
export interface ResumeTemplate {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  data: ResumeData
}

// ===== Resume Version (multi-resume per job) =====
export interface ResumeVersion {
  id: string
  name: string
  data: ResumeData
  createdAt: string
  updatedAt: string
}

// 需要在类型文件中引用 THEME_PRESETS，这里只做类型声明
// 实际值在 store 中定义
