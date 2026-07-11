/**
 * Resume preview HTML builder.
 * The actual PDF export is done via the browser's native print
 * (window.print → "Save as PDF"), which keeps text as vectors.
 */
import type { ResumeModule, AvatarConfig } from '../types'

/** Format plain text description: detect numbered/bulleted lines and convert to HTML lists */
function formatDesc(text: string): string {
  if (!text) return ''
  if (/<[uo]l[\s>]/i.test(text)) return text
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  const lines = html.split(/\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length >= 2) {
    const numberedRe = /^\s*[\(（]?\d{1,3}[\)）]?\s*[.、．。\)）]\s*/
    const bulletRe = /^\s*[•\-*·●◦▪▸►]\s*/
    let listStart = -1
    let listEnd = -1
    let isNumberedList = false
    for (let i = 0; i < lines.length; i++) {
      if (numberedRe.test(lines[i])) {
        if (listStart === -1) listStart = i
        listEnd = i
        isNumberedList = true
      } else if (bulletRe.test(lines[i])) {
        if (listStart === -1) listStart = i
        listEnd = i
      }
    }
    const numCount = lines.filter(l => numberedRe.test(l)).length
    const bulCount = lines.filter(l => bulletRe.test(l)).length
    const listCount = numCount + bulCount
    if (listCount / lines.length >= 0.5) {
      const strip = (l: string) => l.replace(numberedRe, '').replace(bulletRe, '').trim()
      if (numCount >= bulCount) {
        return `<ol>${lines.map(l => `<li>${strip(l)}</li>`).join('')}</ol>`
      } else {
        return `<ul>${lines.map(l => `<li>${strip(l)}</li>`).join('')}</ul>`
      }
    }
    if (listStart !== -1 && listCount >= 2) {
      const introLines = lines.slice(0, listStart)
      const listLines = lines.slice(listStart, listEnd + 1)
      const strip = (l: string) => l.replace(numberedRe, '').replace(bulletRe, '').trim()
      let result = ''
      if (introLines.length > 0) result += `<p>${introLines.join('<br/>')}</p>`
      if (isNumberedList && numCount >= bulCount) {
        result += `<ol>${listLines.map(l => `<li>${strip(l)}</li>`).join('')}</ol>`
      } else {
        result += `<ul>${listLines.map(l => `<li>${strip(l)}</li>`).join('')}</ul>`
      }
      const trailing = lines.slice(listEnd + 1)
      if (trailing.length > 0) result += `<p>${trailing.join('<br/>')}</p>`
      return result
    }
  }
  return html.replace(/\n/g, '<br/>')
}

/** 将描述（可能为列表）压平为单行文本，列表项用 “ | ” 连接 */
export function flattenDescToLine(text: string): string {
  if (!text) return ''
  if (/<[uo]l[\s>]/i.test(text)) {
    const tmp = document.createElement('div')
    tmp.innerHTML = text
    const items = Array.from(tmp.querySelectorAll('li'))
      .map((li) => (li.textContent || '').trim())
      .filter(Boolean)
    if (items.length) return items.join(' | ')
  }
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' | ')
}

export function renderItemHtml(type: string, item: any): string {
  switch (type) {
    case 'personal': {
      let h = ''
      if (item.name || item._avatarHtml) {
        h += `<div class="preview-name-row">`
        h += `<div class="preview-name">${item.name || ''}</div>`
        if (item._avatarHtml) h += `<div class="preview-personal-avatar">${item._avatarHtml}</div>`
        h += `</div>`
      }
      if (item.position) h += `<div class="preview-position">${item.position}</div>`
      const contacts = [item.phone, item.email, item.location, item.link].filter(Boolean)
      if (contacts.length) h += `<div class="preview-contacts">${contacts.join(' | ')}</div>`
      if (item.summary) h += `<div class="preview-summary">${item.summary}</div>`
      return h
    }
    case 'education': {
      let h = '<div class="preview-item">'
      h += `<div class="preview-item-header">`
      h += `<span class="preview-item-title">${item.school || ''}</span>`
      if (item.dateRange) h += `<span class="preview-item-date">${item.dateRange}</span>`
      h += `</div>`
      const sub = [item.degree, item.major].filter(Boolean).join(' · ')
      const descLine = flattenDescToLine(item.description || '')
      const meta = [sub, descLine].filter(Boolean).join(' | ')
      if (meta) h += `<div class="preview-item-sub edu-meta">${meta}</div>`
      return h + '</div>'
    }
    case 'experience': {
      let h = '<div class="preview-item">'
      h += `<div class="preview-item-header">`
      h += `<span class="preview-item-title">${item.company || ''}</span>`
      if (item.dateRange) h += `<span class="preview-item-date">${item.dateRange}</span>`
      h += `</div>`
      if (item.position) h += `<div class="preview-item-sub">${item.position}</div>`
      if (item.description) h += `<div class="preview-item-desc">${formatDesc(item.description)}</div>`
      return h + '</div>'
    }
    case 'project': {
      let h = '<div class="preview-item">'
      h += `<div class="preview-item-header">`
      h += `<span class="preview-item-title">${item.name || ''}</span>`
      if (item.dateRange) h += `<span class="preview-item-date">${item.dateRange}</span>`
      h += `</div>`
      if (item.role) h += `<div class="preview-item-sub">${item.role}</div>`
      if (item.description) h += `<div class="preview-item-desc">${formatDesc(item.description)}</div>`
      if (item.link) h += `<div class="preview-item-link">🔗 ${item.link}</div>`
      return h + '</div>'
    }
    case 'skill': {
      let h = '<div class="preview-item">'
      if (item.name) {
        h += `<span class="preview-skill-name">${item.name}</span>`
        if (item.content) h += `<span class="preview-skill-sep">：</span><span class="preview-skill-content">${formatDesc(item.content)}</span>`
      }
      if (item.level && !item.content) h += `<span class="preview-skill-level">${item.level}</span>`
      return h + '</div>'
    }
    case 'strength': {
      let h = '<div class="preview-item">'
      if (item.title) h += `<strong>${item.title}：</strong>`
      if (item.content) h += `<span>${item.content}</span>`
      return h + '</div>'
    }
    default: {
      let h = '<div class="preview-item">'
      if (item.title) h += `<div class="preview-item-title">${item.title}</div>`
      if (item.content || item.description) h += `<div class="preview-item-desc">${formatDesc(item.content || item.description || '')}</div>`
      return h + '</div>'
    }
  }
}

/** Generate preview HTML from resume data */
export function generatePreviewHtml(
  modules: ResumeModule[],
  avatar: AvatarConfig,
): string {
  const sorted = [...modules].sort((a, b) => a.order - b.order).filter(m => m.visible)
  let html = ''

  for (const mod of sorted) {
    html += `<div class="preview-module-section">`
    html += `<h2 class="preview-module-title">${mod.title}</h2>`
    for (const item of mod.items) {
      // 「专业经历」(project 类型) 复用工作经历的布局渲染
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

/**
 * 导出简历为 PNG 图片：用干净的预览 HTML 离屏渲染，
 * 再用 html2canvas 截图下载。与屏幕编辑器 DOM 解耦，输出无编辑控件。
 */
export async function exportResumeImage(
  modules: ResumeModule[],
  avatar: AvatarConfig,
  config: { fontFamily: string; fontSize: number; lineHeight: number; pageMargin: number; primaryColor: string },
): Promise<void> {
  const html = generatePreviewHtml(modules, avatar)
  // A4 宽度（96dpi ≈ 210mm）
  const pageWidth = 794
  const padding = config.pageMargin

  const wrapper = document.createElement('div')
  wrapper.style.position = 'fixed'
  wrapper.style.left = '-99999px'
  wrapper.style.top = '0'
  wrapper.style.width = `${pageWidth}px`
  wrapper.style.background = '#ffffff'
  wrapper.style.color = 'var(--text-primary)'
  wrapper.style.fontFamily = config.fontFamily
  wrapper.style.fontSize = `${config.fontSize}px`
  wrapper.style.lineHeight = String(config.lineHeight)
  wrapper.style.padding = `${padding}px`
  wrapper.style.boxSizing = 'border-box'
  wrapper.innerHTML = html
  document.body.appendChild(wrapper)

  // 复制主题 CSS 变量，确保主色/描边等正确渲染
  const rootStyles = getComputedStyle(document.documentElement)
  for (const name of ['--primary-color', '--primary-600', '--primary-500', '--primary-400', '--primary-300', '--primary-200', '--text-primary', '--text-secondary', '--border-color', '--border-light', '--font-size-lg', '--module-gap', '--item-gap', '--space-1', '--space-2', '--space-3', '--line-height-relaxed']) {
    const v = rootStyles.getPropertyValue(name)
    if (v) wrapper.style.setProperty(name, v)
  }

  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(wrapper, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    })
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `resume-${new Date().toISOString().slice(0, 10)}.png`
    a.click()
  } finally {
    document.body.removeChild(wrapper)
  }
}
