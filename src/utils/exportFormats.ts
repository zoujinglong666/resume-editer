/**
 * Multi-format Export Utility
 * 支持 Markdown / HTML / DOCX 格式导出
 */

import type { ResumeModule, AvatarConfig, ResumeConfig } from '../types'

// ===== Markdown Export =====

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|li|ol|ul|h[1-6])[^^>]*>/gi, '')
    .replace(/<li>/gi, '- ')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function formatDescription(text: string): string {
  if (!text) return ''
  // If it contains HTML, strip it
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return stripHtml(text)
  }
  return text
}

export function exportToMarkdown(modules: ResumeModule[], _avatar?: AvatarConfig): string {
  const lines: string[] = []

  modules.filter(m => m.visible).sort((a, b) => a.order - b.order).forEach(mod => {
    // Module title
    lines.push(`## ${mod.title}\n`)

    mod.items.forEach(item => {
      switch (mod.type) {
        case 'personal': {
          if (item.name) lines.push(`# ${item.name}\n`)
          if (item.position) lines.push(`**${item.position}**\n`)
          const contacts = [item.phone, item.email, item.location, item.link].filter(Boolean)
          if (contacts.length) lines.push(contacts.join(' | ') + '\n')
          if (item.summary) lines.push(`${item.summary}\n`)
          break
        }
        case 'education': {
          const header = [item.school, item.degree, item.major].filter(Boolean).join(' · ')
          lines.push(`### ${header}`)
          if (item.dateRange) lines.push(`*${item.dateRange}*\n`)
          if (item.description) lines.push(formatDescription(item.description) + '\n')
          break
        }
        case 'experience': {
          const header = [item.company, item.position].filter(Boolean).join(' · ')
          lines.push(`### ${header}`)
          if (item.dateRange) lines.push(`*${item.dateRange}*\n`)
          if (item.description) lines.push(formatDescription(item.description) + '\n')
          break
        }
        case 'project': {
          const header = item.name || '项目'
          lines.push(`### ${header}`)
          const sub = [item.role, item.link].filter(Boolean).join(' · ')
          if (sub) lines.push(`*${sub}*`)
          if (item.dateRange) lines.push(`*${item.dateRange}*\n`)
          if (item.description) lines.push(formatDescription(item.description) + '\n')
          break
        }
        case 'skill': {
          if (item.name && item.content) {
            lines.push(`**${item.name}：**${item.content}\n`)
          } else if (item.name) {
            lines.push(`- ${item.name}${item.level ? ` — ${item.level}` : ''}`)
          }
          break
        }
        case 'strength': {
          if (item.title && item.content) {
            lines.push(`**${item.title}：**${item.content}\n`)
          }
          break
        }
        case 'custom': {
          if (item.title) lines.push(`### ${item.title}`)
          if (item.content) lines.push(`${item.content}\n`)
          break
        }
      }
    })

    lines.push('---\n')
  })

  return lines.join('\n')
}

// ===== HTML Export =====

export function exportToHtml(modules: ResumeModule[], config?: ResumeConfig): string {
  const fontFamily = config?.fontFamily || 'system-ui, -apple-system, sans-serif'
  const fontSize = config?.fontSize || 14
  const lineHeight = config?.lineHeight || 1.6
  const primaryColor = config?.primaryColor || '#2D5F7C'

  let bodyHtml = ''

  modules.filter(m => m.visible).sort((a, b) => a.order - b.order).forEach(mod => {
    bodyHtml += `<section class="resume-section">`
    bodyHtml += `<h2 class="section-title">${mod.title}</h2>`

    mod.items.forEach(item => {
      switch (mod.type) {
        case 'personal': {
          if (item.name) bodyHtml += `<h1 class="name">${item.name}</h1>`
          if (item.position) bodyHtml += `<p class="position">${item.position}</p>`
          const contacts = [item.phone, item.email, item.location, item.link].filter(Boolean)
          if (contacts.length) bodyHtml += `<p class="contacts">${contacts.join(' | ')}</p>`
          if (item.summary) bodyHtml += `<p class="summary">${item.summary}</p>`
          break
        }
        case 'education': {
          bodyHtml += `<div class="item">`
          bodyHtml += `<div class="item-header">`
          bodyHtml += `<span class="item-title">${[item.school, item.degree, item.major].filter(Boolean).join(' · ')}</span>`
          if (item.dateRange) bodyHtml += `<span class="item-date">${item.dateRange}</span>`
          bodyHtml += `</div>`
          if (item.description) bodyHtml += `<div class="item-desc">${formatDescription(item.description).replace(/\n/g, '<br/>')}</div>`
          bodyHtml += `</div>`
          break
        }
        case 'experience': {
          bodyHtml += `<div class="item">`
          bodyHtml += `<div class="item-header">`
          bodyHtml += `<span class="item-title">${[item.company, item.position].filter(Boolean).join(' · ')}</span>`
          if (item.dateRange) bodyHtml += `<span class="item-date">${item.dateRange}</span>`
          bodyHtml += `</div>`
          if (item.description) bodyHtml += `<div class="item-desc">${formatDescription(item.description).replace(/\n/g, '<br/>')}</div>`
          bodyHtml += `</div>`
          break
        }
        case 'project': {
          bodyHtml += `<div class="item">`
          bodyHtml += `<div class="item-header">`
          bodyHtml += `<span class="item-title">${item.name || ''}</span>`
          if (item.dateRange) bodyHtml += `<span class="item-date">${item.dateRange}</span>`
          bodyHtml += `</div>`
          if (item.role) bodyHtml += `<div class="item-sub">${item.role}</div>`
          if (item.description) bodyHtml += `<div class="item-desc">${formatDescription(item.description).replace(/\n/g, '<br/>')}</div>`
          bodyHtml += `</div>`
          break
        }
        case 'skill': {
          if (item.name && item.content) {
            bodyHtml += `<div class="skill-row"><strong>${item.name}：</strong>${item.content}</div>`
          } else if (item.name) {
            bodyHtml += `<div class="skill-bar-row"><span>${item.name}</span><span>${item.level || ''}</span></div>`
          }
          break
        }
        case 'strength': {
          if (item.title && item.content) {
            bodyHtml += `<div class="strength-row"><strong>${item.title}：</strong>${item.content}</div>`
          }
          break
        }
        case 'custom': {
          if (item.title) bodyHtml += `<h3>${item.title}</h3>`
          if (item.content) bodyHtml += `<p>${item.content}</p>`
          break
        }
      }
    })

    bodyHtml += `</section>`
  })

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>简历</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .resume-section { margin-bottom: 20px; }
    .section-title {
      font-size: 18px;
      color: ${primaryColor};
      border-bottom: 2px solid ${primaryColor};
      padding-bottom: 4px;
      margin-bottom: 12px;
    }
    .name { font-size: 28px; color: #1a1a2e; margin-bottom: 4px; }
    .position { font-size: 16px; color: ${primaryColor}; margin-bottom: 8px; }
    .contacts { font-size: 13px; color: #666; margin-bottom: 12px; }
    .summary { font-size: 14px; color: #444; margin-bottom: 8px; }
    .item { margin-bottom: 14px; }
    .item-header { display: flex; justify-content: space-between; align-items: baseline; }
    .item-title { font-weight: 600; font-size: 15px; color: #1a1a2e; }
    .item-date { font-size: 12px; color: #888; }
    .item-sub { font-size: 13px; color: #6366f1; margin: 2px 0; }
    .item-desc { font-size: 13px; color: #444; line-height: 1.7; margin-top: 6px; }
    .skill-row { font-size: 13px; margin-bottom: 4px; color: #444; }
    .strength-row { font-size: 13px; margin-bottom: 4px; color: #444; }
    h3 { font-size: 15px; color: #1a1a2e; margin-bottom: 4px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

// ===== DOCX Export =====

export async function exportToDocx(modules: ResumeModule[], config?: ResumeConfig): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = await import('docx')

  const primaryColor = (config?.primaryColor || '#2D5F7C').replace('#', '')

  const children: InstanceType<typeof Paragraph>[] = []

  modules.filter(m => m.visible).sort((a, b) => a.order - b.order).forEach(mod => {
    // Section heading
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: primaryColor },
        },
        children: [
          new TextRun({
            text: mod.title,
            bold: true,
            size: 28,
            color: primaryColor,
          }),
        ],
      }),
    )

    mod.items.forEach(item => {
      switch (mod.type) {
        case 'personal': {
          if (item.name) {
            children.push(
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: item.name, bold: true, size: 56 })],
              }),
            )
          }
          if (item.position) {
            children.push(
              new Paragraph({
                spacing: { after: 80 },
                children: [new TextRun({ text: item.position, size: 28, color: primaryColor })],
              }),
            )
          }
          const contacts = [item.phone, item.email, item.location, item.link].filter(Boolean)
          if (contacts.length) {
            children.push(
              new Paragraph({
                spacing: { after: 120 },
                children: [new TextRun({ text: contacts.join(' | '), size: 22, color: '666666' })],
              }),
            )
          }
          if (item.summary) {
            children.push(
              new Paragraph({
                spacing: { after: 100 },
                children: [new TextRun({ text: item.summary, size: 24 })],
              }),
            )
          }
          break
        }
        case 'education':
        case 'experience': {
          const title = mod.type === 'education'
            ? [item.school, item.degree, item.major].filter(Boolean).join(' · ')
            : [item.company, item.position].filter(Boolean).join(' · ')

          children.push(
            new Paragraph({
              spacing: { before: 120, after: 40 },
              children: [
                new TextRun({ text: title, bold: true, size: 26 }),
                ...(item.dateRange ? [new TextRun({ text: `    ${item.dateRange}`, size: 20, color: '888888' })] : []),
              ],
            }),
          )

          if (item.description) {
            const descLines = formatDescription(item.description).split('\n').filter(l => l.trim())
            descLines.forEach(line => {
              children.push(
                new Paragraph({
                  spacing: { after: 40 },
                  indent: { left: 360 },
                  children: [new TextRun({ text: line.replace(/^[•\-*]\s*/, ''), size: 22 })],
                  bullet: { level: 0 },
                }),
              )
            })
          }
          break
        }
        case 'project': {
          children.push(
            new Paragraph({
              spacing: { before: 120, after: 40 },
              children: [
                new TextRun({ text: item.name || '', bold: true, size: 26 }),
                ...(item.dateRange ? [new TextRun({ text: `    ${item.dateRange}`, size: 20, color: '888888' })] : []),
              ],
            }),
          )
          if (item.role) {
            children.push(
              new Paragraph({
                spacing: { after: 40 },
                children: [new TextRun({ text: item.role, size: 22, color: '6366F1' })],
              }),
            )
          }
          if (item.description) {
            const descLines = formatDescription(item.description).split('\n').filter(l => l.trim())
            descLines.forEach(line => {
              children.push(
                new Paragraph({
                  spacing: { after: 40 },
                  indent: { left: 360 },
                  children: [new TextRun({ text: line.replace(/^[•\-*]\s*/, ''), size: 22 })],
                  bullet: { level: 0 },
                }),
              )
            })
          }
          break
        }
        case 'skill': {
          if (item.name && item.content) {
            children.push(
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: `${item.name}：`, bold: true, size: 24 }),
                  new TextRun({ text: item.content, size: 24 }),
                ],
              }),
            )
          } else if (item.name) {
            children.push(
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({ text: item.name, bold: true, size: 24 }),
                  ...(item.level ? [new TextRun({ text: ` — ${item.level}`, size: 22, color: '666666' })] : []),
                ],
              }),
            )
          }
          break
        }
        case 'strength': {
          if (item.title && item.content) {
            children.push(
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: `${item.title}：`, bold: true, size: 24 }),
                  new TextRun({ text: item.content, size: 24 }),
                ],
              }),
            )
          }
          break
        }
        case 'custom': {
          if (item.title) {
            children.push(
              new Paragraph({
                spacing: { before: 80, after: 40 },
                children: [new TextRun({ text: item.title, bold: true, size: 26 })],
              }),
            )
          }
          if (item.content) {
            children.push(
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: item.content, size: 24 })],
              }),
            )
          }
          break
        }
      }
    })
  })

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  })

  return Packer.toBlob(doc)
}
