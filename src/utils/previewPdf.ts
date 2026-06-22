/**
 * Preview-style PDF export utility.
 * Generates clean preview HTML from store data and exports as A4 PDF.
 */
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import type { ResumeModule, AvatarConfig, ResumeConfig } from '../types'

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

function renderItemHtml(type: string, item: any): string {
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
      let h = '<div class="preview-item preview-edu-item">'
      h += `<div class="preview-item-header">`
      h += `<span class="preview-item-title preview-edu-school">${item.school || ''}</span>`
      const sub = [item.degree, item.major].filter(Boolean).join(' · ')
      if (sub) h += `<span class="preview-edu-inline-meta"> · ${sub}</span>`
      if (item.dateRange) h += `<span class="preview-item-date">${item.dateRange}</span>`
      h += `</div>`
      if (item.description) h += `<div class="preview-item-desc preview-edu-desc">${formatDesc(item.description)}</div>`
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
      let h = '<div class="preview-item preview-skill-row">'
      if (item.name && item.content) {
        h += `<div class="preview-skill-line"><strong class="preview-skill-name">${item.name}</strong><span class="preview-skill-sep">：</span><span class="preview-skill-content">${formatDesc(item.content)}</span></div>`
      } else if (item.name) {
        h += `<div class="preview-skill-line"><strong class="preview-skill-name">${item.name}</strong></div>`
        if (item.content) h += `<div class="preview-skill-content">${formatDesc(item.content)}</div>`
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
      if (mod.type === 'personal' && avatar.url) {
        const shape = avatar.shape === 'circle' ? 'border-radius:50%' : 'border-radius:8px'
        html += renderItemHtml(mod.type, {
          ...item,
          _avatarHtml: `<img src="${avatar.url}" style="width:80px;height:80px;object-fit:cover;${shape};box-shadow:0 2px 8px rgba(0,0,0,0.1);" />`,
        })
      } else {
        html += renderItemHtml(mod.type, item)
      }
    }
    html += `</div>`
  }

  return html
}

/** Export resume preview as PDF directly (no dialog needed) */
export async function exportPreviewPdf(
  modules: ResumeModule[],
  avatar: AvatarConfig,
  config: ResumeConfig,
): Promise<void> {
  // Create temporary off-screen element matching resume-preview-page
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;background:#fff;'

  const page = document.createElement('div')
  page.className = 'resume-preview-page'
  page.style.cssText = `
    width: 210mm;
    min-height: 297mm;
    background: #fff;
    box-shadow: none;
  `

  const canvas = document.createElement('div')
  canvas.className = 'resume-canvas-preview'
  canvas.style.cssText = `
    padding: ${config.pageMargin}px;
    font-family: ${config.fontFamily};
    font-size: ${config.fontSize}px;
    line-height: ${config.lineHeight};
    color: #333;
  `
  canvas.innerHTML = generatePreviewHtml(modules, avatar)

  page.appendChild(canvas)
  container.appendChild(page)
  document.body.appendChild(container)

  try {
    await document.fonts.ready
    await new Promise(r => requestAnimationFrame(r))
    await new Promise(r => setTimeout(r, 100))

    const capturedCanvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
    })

    const imgData = capturedCanvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageW = 210
    const pageH = 297
    const contentW = pageW
    const imgAspect = capturedCanvas.width / capturedCanvas.height
    const imgW = contentW
    const imgH = imgW / imgAspect

    if (imgH <= pageH) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH)
    } else {
      // Multi-page
      const pages = Math.ceil(imgH / pageH)
      for (let i = 0; i < pages; i++) {
        if (i > 0) pdf.addPage()
        const srcY = (i * pageH / imgH) * capturedCanvas.height
        const srcH = Math.min((pageH / imgH) * capturedCanvas.height, capturedCanvas.height - srcY)
        const tmp = document.createElement('canvas')
        tmp.width = capturedCanvas.width
        tmp.height = srcH
        const ctx = tmp.getContext('2d')!
        ctx.drawImage(capturedCanvas, 0, srcY, capturedCanvas.width, srcH, 0, 0, capturedCanvas.width, srcH)
        const pageImg = tmp.toDataURL('image/png')
        const pageImgH = (srcH / capturedCanvas.width) * contentW
        pdf.addImage(pageImg, 'PNG', 0, 0, contentW, pageImgH)
      }
    }

    const name = modules.find(m => m.type === 'personal')?.items[0]?.name || 'resume'
    pdf.save(`${name}-resume.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}
