/**
 * 富文本命令的跨浏览器兼容封装。
 *
 * 主要修复：
 * 1. `hiliteColor`（背景高亮）在 Chromium 下默认不生效，需要开启 styleWithCSS。
 * 2. `foreColor` / `hiliteColor` 用 styleWithCSS 后输出内联 style，导出 PDF 时也能保留。
 * 3. `formatBlock` 在 Chrome 下必须传带尖括号的标签名（如 `<blockquote>`），否则静默失败。
 * 4. 选区保存/恢复：原生颜色选择器等会抢走焦点，需在操作前保存、操作后恢复选区。
 */

let savedRange: Range | null = null

export function saveSelection(): void {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0)
    // 仅当选区在可编辑元素内才保存，避免污染
    if (range.startContainer && getRichEditableRoot()) {
      savedRange = range.cloneRange()
    }
  }
}

export function restoreSelection(): void {
  if (!savedRange) return
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(savedRange)
}

/** 从当前选区向上找到带 .rich-editable 标记的可编辑根元素 */
export function getRichEditableRoot(): HTMLElement | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  let node: Node | null = sel.anchorNode
  while (node && node !== document.body && node !== document.documentElement) {
    if (node instanceof HTMLElement && node.isContentEditable && node.classList.contains('rich-editable')) {
      return node
    }
    node = node.parentNode
  }
  return null
}

export function applyRichCommand(command: string, value?: string): void {
  // 颜色命令需要 styleWithCSS 才能在 Chromium 下可靠生效（尤其 hiliteColor）
  if (command === 'foreColor' || command === 'hiliteColor') {
    try {
      document.execCommand('styleWithCSS', false, 'true')
    } catch {
      /* noop */
    }
  }
  // formatBlock 在 Chrome 下要求标签带尖括号
  if (command === 'formatBlock' && value) {
    if (!/^<[^>]+>$/.test(value)) value = `<${value}>`
  }
  try {
    document.execCommand(command, false, value ?? undefined)
  } catch {
    /* noop */
  }
}

export interface RichState {
  bold: boolean
  italic: boolean
  underline: boolean
  strikeThrough: boolean
  insertUnorderedList: boolean
  insertOrderedList: boolean
  justifyLeft: boolean
  justifyCenter: boolean
  justifyRight: boolean
  foreColor: string
  hiliteColor: string
  formatBlock: string
}

const STATE_KEYS: (keyof RichState)[] = [
  'bold',
  'italic',
  'underline',
  'strikeThrough',
  'insertUnorderedList',
  'insertOrderedList',
  'justifyLeft',
  'justifyCenter',
  'justifyRight',
]

export function queryRichState(): RichState {
  const state: RichState = {
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    foreColor: '',
    hiliteColor: '',
    formatBlock: '',
  }
  try {
    for (const key of STATE_KEYS) {
      ;(state as any)[key] = document.queryCommandState(key as string)
    }
    state.foreColor = document.queryCommandValue('foreColor')
    state.hiliteColor = document.queryCommandValue('hiliteColor')
    const block = document.queryCommandValue('formatBlock')
    state.formatBlock = typeof block === 'string' ? block.toLowerCase().replace(/[<>]/g, '') : ''
  } catch {
    /* noop */
  }
  return state
}
