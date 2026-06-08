// ===== Module Types =====
export type ModuleType = 'personal' | 'education' | 'experience' | 'project' | 'skill' | 'custom'

export interface ModuleItem {
  id: string
  [key: string]: string | boolean
}

export interface ResumeModule {
  id: string
  type: ModuleType
  title: string
  visible: boolean
  order: number
  items: ModuleItem[]
}

// ===== Avatar =====
export interface AvatarConfig {
  url: string
  shape: 'circle' | 'rounded'
}

// ===== Config =====
export type TitleStyle = 'underline' | 'leftbar' | 'pill' | 'centerline' | 'dots' | 'minimal'

export interface ResumeConfig {
  theme: string
  primaryColor: string
  fontFamily: string
  fontSize: number
  lineHeight: number
  pageMargin: number
  titleStyle: TitleStyle
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
