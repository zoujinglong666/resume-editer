/**
 * 简历导出工具：HTML / Word(.doc) / Markdown(.md)
 * - HTML：自包含单文件，内嵌样式，打开即用。
 * - Word：以 Word 兼容 HTML 形式保存为 .doc，Word/WPS 直接打开。
 * - Markdown：纯文本，便于二次编辑或粘贴到各类平台。
 */
import type { ResumeModule, AvatarConfig } from '../types'
import { renderItemHtml, flattenDescToLine } from './previewPdf'

export interface ExportConfig {
  fontFamily: string
  fontSize: number
  lineHeight: number
  pageMargin: number
  primaryColor: string
  titleStyle: string
}

// ——— 颜色工具：根据主色明暗派生 600/500/400/300/200 档 ———
function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const num = parseInt(h, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => clamp(x).toString(16).padStart(2, '0')).join('')
}
/** percent>0 变亮，<0 变暗 */
function shade(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex)
  const t = percent < 0 ? 0 : 255
  const p = Math.abs(percent)
  return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p)
}

function fileName(prefix: string): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `${prefix}-${ymd}`
}

function triggerDownload(content: string, name: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ——— 生成模块主体 HTML（含标题样式修饰类） ———
function buildBodyHtml(modules: ResumeModule[], avatar: AvatarConfig, cfg: ExportConfig): string {
  const sorted = [...modules].sort((a, b) => a.order - b.order).filter((m) => m.visible)
  const ts = cfg.titleStyle || 'underline'
  let html = ''

  for (const mod of sorted) {
    html += `<div class="module title-style-${ts}">`
    html += `<h2 class="preview-module-title"><span>${mod.title}</span></h2>`
    for (const item of mod.items) {
      let effectiveType = mod.type
      let renderItem: any = item
      if (mod.type === 'project' && mod.title === '专业经历') {
        effectiveType = 'experience'
        renderItem = { ...item, company: item.name, position: item.role }
      }
      if (mod.type === 'personal' && avatar.url) {
        const shape = avatar.shape === 'circle' ? 'border-radius:50%' : 'border-radius:8px'
        html += renderItemHtml(effectiveType, {
          ...renderItem,
          _avatarHtml: `<img src="${avatar.url}" style="width:80px;height:80px;object-fit:cover;${shape};box-shadow:0 2px 8px rgba(0,0,0,0.1);" />`,
        })
      } else {
        html += renderItemHtml(effectiveType, renderItem)
      }
    }
    html += `</div>`
  }
  return html
}

// ——— 自包含样式表 ———
function buildCss(cfg: ExportConfig): string {
  const pc = cfg.primaryColor || '#2D5F7C'
  const p600 = shade(pc, -0.12)
  const p500 = shade(pc, -0.06)
  const p400 = shade(pc, 0.16)
  const p300 = shade(pc, 0.32)
  const p200 = shade(pc, 0.52)
  const vars = `--pc:${pc};--pc600:${p600};--pc500:${p500};--pc400:${p400};--pc300:${p300};--pc200:${p200};`

  return `
:root{${vars}}
* { box-sizing: border-box; }
body { margin:0; background:#eef2f7; padding:24px 0; font-family:${cfg.fontFamily}; }
.resume-doc {
  max-width:794px; margin:0 auto; background:#fff;
  padding:${cfg.pageMargin}px; color:#1e293b;
  font-size:${cfg.fontSize}px; line-height:${cfg.lineHeight};
  box-shadow:0 4px 24px rgba(15,23,42,0.12);
}
.module { margin-bottom:20px; }
.module:last-child { margin-bottom:0; }
.preview-module-title {
  font-size:16px; font-weight:700; color:var(--pc);
  margin:0 0 12px; padding-bottom:0;
}
/* 标题样式修饰 */
.title-style-underline .preview-module-title { border-bottom:2px solid var(--pc500); padding-bottom:6px; }
.title-style-leftbar .preview-module-title { border-left:3px solid var(--pc500); padding-left:10px; }
.title-style-pill .preview-module-title { display:inline-block; padding:0; }
.title-style-pill .preview-module-title span { background:var(--pc600); color:#fff; padding:2px 10px; border-radius:5px; display:inline-block; }
.title-style-centerline .preview-module-title { display:flex; align-items:center; gap:8px; text-align:center; }
.title-style-centerline .preview-module-title::before,
.title-style-centerline .preview-module-title::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,transparent,var(--pc400)); }
.title-style-centerline .preview-module-title::after { background:linear-gradient(90deg,var(--pc400),transparent); }
.title-style-dots .preview-module-title { position:relative; border-bottom:2px solid var(--pc500); padding-bottom:6px; text-align:center; }
.title-style-dots .preview-module-title span { position:relative; }
.title-style-dots .preview-module-title span::after { content:''; position:absolute; left:50%; bottom:-13px; transform:translateX(-50%); width:4px; height:4px; background:var(--pc500); border-radius:50%; }
.title-style-minimal .preview-module-title { border-bottom:1px solid var(--pc300); padding-bottom:4px; color:var(--pc); }
.title-style-grad-underline .preview-module-title { border-bottom:2px solid transparent; border-image:linear-gradient(90deg,var(--pc500),var(--pc300)) 1; padding-bottom:6px; }
.title-style-grad-leftbar .preview-module-title { border-left:3px solid transparent; border-image:linear-gradient(180deg,var(--pc500),var(--pc300)) 1; padding-left:10px; }
.title-style-grad-dual .preview-module-title { position:relative; padding-bottom:8px; }
.title-style-grad-dual .preview-module-title::after { content:''; position:absolute; left:0; bottom:0; width:60%; height:2px; border-radius:1px; background:linear-gradient(90deg,var(--pc600),var(--pc400)); }
.title-style-grad-pill .preview-module-title { display:inline-block; padding:0; }
.title-style-grad-pill .preview-module-title span { background:linear-gradient(135deg,var(--pc600),var(--pc400)); color:#fff; padding:2px 10px; border-radius:8px; display:inline-block; }
.title-style-grad-shadow .preview-module-title { position:relative; padding-bottom:8px; border-bottom:2px solid var(--pc300); }
.title-style-grad-shadow .preview-module-title::after { content:''; position:absolute; left:0; bottom:-3px; width:100%; height:4px; border-radius:2px; background:linear-gradient(90deg,var(--pc200),transparent); opacity:0.8; }
.title-style-grad-fade .preview-module-title span { background:linear-gradient(90deg,var(--pc500),var(--pc300)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; }
.title-style-thin-underline .preview-module-title { border-bottom:1px solid var(--pc400); padding-bottom:4px; }
.title-style-thin-double .preview-module-title { border-bottom:1px double var(--pc400); padding-bottom:4px; }
.title-style-thin-leftbar .preview-module-title { border-left:2px solid var(--pc400); padding-left:10px; }
.title-style-thin-overline .preview-module-title { border-top:1px solid var(--pc400); padding-top:4px; }
.title-style-thin-box .preview-module-title { display:inline-block; }
.title-style-thin-box .preview-module-title span { border:1px solid var(--pc400); border-radius:4px; padding:1px 8px; display:inline-block; }
.title-style-thin-framed .preview-module-title { display:inline-block; }
.title-style-thin-framed .preview-module-title span { border:1px solid rgba(120,120,120,0.4); border-left:3px solid var(--pc400); border-radius:3px; padding:1px 8px; display:inline-block; }
.title-style-thin-corner .preview-module-title { display:inline-block; }
.title-style-thin-corner .preview-module-title span { position:relative; padding:1px 6px; display:inline-block; }
.title-style-thin-corner .preview-module-title span::before { content:''; position:absolute; left:0; bottom:-4px; width:7px; height:7px; border-left:1px solid var(--pc400); border-bottom:1px solid var(--pc400); }
.title-style-thin-bracket .preview-module-title { display:inline-block; }
.title-style-thin-bracket .preview-module-title span { border-left:1px solid var(--pc400); border-right:1px solid var(--pc400); border-radius:2px; padding:1px 8px; display:inline-block; }
.title-style-thin-center .preview-module-title { display:flex; align-items:center; gap:8px; text-align:center; }
.title-style-thin-center .preview-module-title::before,
.title-style-thin-center .preview-module-title::after { content:''; flex:1; height:1px; background:var(--pc400); opacity:0.5; }
.title-style-thin-underline-soft .preview-module-title { border-bottom:1px solid var(--pc300); padding-bottom:4px; }

/* 基本信息 */
.preview-name-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
.preview-personal-avatar { flex-shrink:0; }
.preview-personal-avatar img { display:block; }
.preview-name { font-size:22px; font-weight:700; color:#1e293b; margin-bottom:2px; }
.preview-position { font-size:14px; color:#64748b; margin-bottom:6px; }
.preview-contacts { font-size:13px; color:#64748b; margin-bottom:8px; }
.preview-summary { font-size:13px; color:#64748b; line-height:1.6; }

/* 条目 */
.preview-item { margin-bottom:10px; }
.preview-item-header { display:flex; justify-content:space-between; align-items:baseline; }
.preview-item-title { font-size:14px; font-weight:600; color:#1e293b; }
.preview-item-date { font-size:12px; color:#8a9099; flex-shrink:0; }
.preview-item-sub { font-size:13px; color:#64748b; margin-top:2px; }
.preview-item-sub.edu-meta { white-space:nowrap; }
.preview-item-desc { font-size:13px; color:#64748b; margin-top:4px; line-height:1.6; }
.preview-item-desc ul, .preview-item-desc ol { margin:4px 0; padding-left:1.4em; }
.preview-item-desc li { margin-bottom:3px; line-height:1.6; }
.preview-item-desc li:last-child { margin-bottom:0; }
.preview-item-desc ul > li::marker { color:var(--pc); }
.preview-item-desc ol > li::marker { color:var(--pc); font-weight:600; }
.preview-item-desc p { margin:4px 0 8px; line-height:1.6; }
.preview-item-link { font-size:12px; color:var(--pc); margin-top:4px; }
.preview-skill-name { font-size:13px; font-weight:500; color:#1e293b; }
.preview-skill-sep { font-size:13px; color:#1e293b; }
.preview-skill-content { font-size:13px; color:#64748b; }
.preview-skill-level { font-size:13px; color:#64748b; }
`
}

function buildStandaloneHtml(modules: ResumeModule[], avatar: AvatarConfig, cfg: ExportConfig): string {
  const body = buildBodyHtml(modules, avatar, cfg)
  const css = buildCss(cfg)
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>简历</title>
<style>${css}</style>
</head>
<body>
<div class="resume-doc">${body}</div>
</body>
</html>`
}

// ——— Markdown ———
function descToMd(text: string): string {
  if (!text) return ''
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const out: string[] = []
  for (const raw of lines) {
    const m = raw.match(/^\s*([•\-*·●◦▪▸►])\s*(.*)$/)
    if (m) {
      out.push(`- ${m[2]}`)
    } else {
      out.push(raw)
    }
  }
  return out.join('\n')
}

function itemToMd(type: string, item: any): string {
  switch (type) {
    case 'personal': {
      let s = ''
      if (item.name) s += `# ${item.name}\n\n`
      if (item.position) s += `${item.position}\n\n`
      const contacts = [item.phone, item.email, item.location, item.link].filter(Boolean)
      if (contacts.length) s += `${contacts.join('  |  ')}\n\n`
      if (item.summary) s += `${item.summary}\n\n`
      return s
    }
    case 'education': {
      const sub = [item.degree, item.major].filter(Boolean).join(' · ')
      const descLine = item.description ? flattenDescToLine(item.description) : ''
      const meta = [sub, descLine].filter(Boolean).join(' | ')
      let s = `- **${item.school || ''}**${item.dateRange ? `　${item.dateRange}` : ''}`
      if (meta) s += `　${meta}`
      return s + '\n\n'
    }
    case 'experience': {
      let s = `- **${item.company || ''}**${item.dateRange ? `　${item.dateRange}` : ''}\n`
      if (item.position) s += `  - ${item.position}\n`
      if (item.description) s += `\n${descToMd(item.description)}\n`
      return s + '\n'
    }
    case 'project': {
      let s = `- **${item.name || ''}**${item.dateRange ? `　${item.dateRange}` : ''}\n`
      if (item.role) s += `  - ${item.role}\n`
      if (item.description) s += `\n${descToMd(item.description)}\n`
      if (item.link) s += `\n  🔗 ${item.link}\n`
      return s + '\n'
    }
    case 'skill': {
      let s = `- **${item.name || ''}**`
      if (item.content) s += `：${item.content}`
      else if (item.level) s += `　${item.level}`
      return s + '\n\n'
    }
    case 'strength': {
      let s = `- **${item.title || ''}**：${item.content || ''}\n\n`
      return s
    }
    default: {
      let s = `- **${item.title || ''}**\n`
      if (item.content || item.description) s += `\n${descToMd(item.content || item.description)}\n\n`
      return s
    }
  }
}

export function buildMarkdown(modules: ResumeModule[]): string {
  const sorted = [...modules].sort((a, b) => a.order - b.order).filter((m) => m.visible)
  let md = ''
  for (const mod of sorted) {
    const firstType = mod.type
    if (firstType === 'personal' && mod.items[0]) {
      md += itemToMd('personal', mod.items[0])
      continue
    }
    md += `## ${mod.title}\n\n`
    for (const item of mod.items) {
      md += itemToMd(mod.type, item)
    }
  }
  return md.trim() + '\n'
}

// ——— 对外导出函数 ———
export function exportResumeHtml(
  modules: ResumeModule[],
  avatar: AvatarConfig,
  cfg: ExportConfig,
): void {
  const html = buildStandaloneHtml(modules, avatar, cfg)
  triggerDownload(html, `${fileName('简历')}.html`, 'text/html')
}

export function exportResumeWord(
  modules: ResumeModule[],
  avatar: AvatarConfig,
  cfg: ExportConfig,
): void {
  const body = buildBodyHtml(modules, avatar, cfg)
  const css = buildCss(cfg)
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
</w:WordDocument>
</xml>
<![endif]-->
<title>简历</title>
<style>${css}</style>
</head>
<body>
<div class="resume-doc">${body}</div>
</body>
</html>`
  triggerDownload(html, `${fileName('简历')}.doc`, 'application/msword')
}

export function exportResumeMarkdown(modules: ResumeModule[]): void {
  const md = buildMarkdown(modules)
  triggerDownload(md, `${fileName('简历')}.md`, 'text/markdown')
}
