/**
 * Smart Paste Utility — Auto-converts plain text with numbering/bullets into HTML lists.
 * Inspired by TiPTap / Notion paste behavior.
 */

/** Detect if a line starts with a numbered pattern: "1.", "1)", "1、", "1.", "(1)" etc. */
function isNumberedLine(line: string): boolean {
  return /^\s*[\(（]?\d{1,3}[\)\）]?\s*[.、．。)\）]\s*/.test(line)
}

/** Detect if a line starts with a bullet: "•", "-", "*", "·", "●", "◦" etc. */
function isBulletLine(line: string): boolean {
  return /^\s*[•\-*·●◦▪▸►]\s*/.test(line)
}

/** Strip the leading number/bullet marker from a line */
function stripMarker(line: string): string {
  return line
    .replace(/^\s*[\(（]?\d{1,3}[\)\）]?\s*[.、．。)\）]\s*/, '')
    .replace(/^\s*[•\-*·●◦▪▸►]\s*/, '')
    .trim()
}

/**
 * Smart-paste handler: converts plain text into structured HTML.
 * - Lines starting with numbers → <ol><li>...</li></ol>
 * - Lines starting with bullets → <ul><li>...</li></ul>
 * - Mixed or plain → <div>...</div>
 */
export function smartPasteText(text: string): string | null {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return null // Need at least 2 lines for list conversion

  const numberedCount = lines.filter(isNumberedLine).length
  const bulletCount = lines.filter(isBulletLine).length
  const ratio = Math.max(numberedCount, bulletCount) / lines.length

  // At least 50% of lines should match a pattern
  if (ratio < 0.5) return null

  if (numberedCount >= bulletCount) {
    // Convert to ordered list
    const items = lines.map(l => `<li>${stripMarker(l)}</li>`).join('')
    return `<ol>${items}</ol>`
  } else {
    // Convert to unordered list
    const items = lines.map(l => `<li>${stripMarker(l)}</li>`).join('')
    return `<ul>${items}</ul>`
  }
}

/** Escape HTML special chars so pasted text can never inject markup/styles. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Unified paste handler for ALL contenteditable fields.
 *
 * Strips every external style (font-size / color / background / etc.) by reading
 * ONLY `text/plain` from the clipboard — `text/html` is never touched, so dirty
 * formatting from web pages can never enter the document. Numbered/bulleted text
 * is still converted into clean <ol>/<ul> lists (list item text is HTML-escaped).
 *
 * @param e        the paste event (will be preventDefault'd)
 * @param onAfter  optional callback to sync content back to the store after insert
 */
export function handlePaste(e: ClipboardEvent, onAfter?: () => void): void {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  const html = smartPasteText(text)
  if (html) {
    // escape list content to avoid injecting any markup from pasted text
    const safe = html.replace(/<li>(.*?)<\/li>/gs, (_m, c) => `<li>${escapeHtml(String(c))}</li>`)
    document.execCommand('insertHTML', false, safe)
  } else {
    document.execCommand('insertText', false, text)
  }
  if (onAfter) setTimeout(onAfter, 0)
}

/**
 * Check if the cursor is currently inside a <li> element.
 */
export function isCursorInListItem(): HTMLLIElement | null {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return null
  let node: Node | null = sel.getRangeAt(0).startContainer
  while (node && node !== document.body) {
    if (node instanceof HTMLLIElement) return node
    node = node.parentNode
  }
  return null
}

/**
 * Handle Enter key in contenteditable for list behavior:
 * - Inside <li>: create new <li> below, or exit list if empty
 */
export function handleListEnter(e: KeyboardEvent): boolean {
  const li = isCursorInListItem()
  if (!li) return false

  const parent = li.parentElement // <ul> or <ol>
  if (!parent) return false

  // If the <li> is empty, exit the list
  if (!li.textContent?.trim()) {
    e.preventDefault()
    // Replace <li> with <div><br></div> to exit list
    const p = document.createElement('div')
    p.innerHTML = '<br>'
    parent.after(p)
    li.remove()
    // If the list is now empty, remove it
    if (!parent.children.length) parent.remove()
    // Move cursor to new paragraph
    const range = document.createRange()
    range.setStart(p, 0)
    range.collapse(true)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    return true
  }

  // Otherwise, create a new <li> after current one
  e.preventDefault()
  const newLi = document.createElement('li')
  newLi.innerHTML = '<br>'
  li.after(newLi)

  // Move cursor to new <li>
  const range = document.createRange()
  range.setStart(newLi, 0)
  range.collapse(true)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
  return true
}
