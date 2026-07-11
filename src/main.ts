import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import './style.css'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app.use(pinia)

/**
 * Format plain text to HTML: convert \n to <br>, detect numbered/bulleted lists.
 * If already contains HTML tags, returns as-is.
 */
function formatTextForHtml(text: string): string {
  if (!text) return ''
  // Already HTML? return as-is
  if (/<[a-z][\s\S]*>/i.test(text)) return text
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  const lines = html.split(/\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length >= 2) {
    const numberedRe = /^\s*[\(（]?\d{1,3}[\)）]?\s*[.、．。\)）]\s*/
    const bulletRe = /^\s*[•\-*·●◦▪▸►]\s*/
    let listStart = -1
    let listEnd = -1
    let isNumbered = false
    for (let i = 0; i < lines.length; i++) {
      if (numberedRe.test(lines[i])) {
        if (listStart === -1) listStart = i
        listEnd = i
        isNumbered = true
      } else if (bulletRe.test(lines[i])) {
        if (listStart === -1) listStart = i
        listEnd = i
      }
    }
    const numCount = lines.filter(l => numberedRe.test(l)).length
    const bulCount = lines.filter(l => bulletRe.test(l)).length
    const listCount = numCount + bulCount
    const strip = (l: string) => l.replace(numberedRe, '').replace(bulletRe, '').trim()
    // All list
    if (listCount / lines.length >= 0.5) {
      if (numCount >= bulCount) {
        return `<ol>${lines.map(l => `<li>${strip(l)}</li>`).join('')}</ol>`
      } else {
        return `<ul>${lines.map(l => `<li>${strip(l)}</li>`).join('')}</ul>`
      }
    }
    // Mixed: intro + list
    if (listStart !== -1 && listCount >= 2) {
      const intro = lines.slice(0, listStart)
      const list = lines.slice(listStart, listEnd + 1)
      let result = ''
      if (intro.length) result += `<p>${intro.join('<br/>')}</p>`
      if (isNumbered && numCount >= bulCount) {
        result += `<ol>${list.map(l => `<li>${strip(l)}</li>`).join('')}</ol>`
      } else {
        result += `<ul>${list.map(l => `<li>${strip(l)}</li>`).join('')}</ul>`
      }
      const trailing = lines.slice(listEnd + 1)
      if (trailing.length) result += `<p>${trailing.join('<br/>')}</p>`
      return result
    }
  }
  return html.replace(/\n/g, '<br/>')
}

/**
 * v-sync-html directive
 * Like v-html but also syncs when the bound value changes from outside,
 * even on contenteditable elements (where Vue normally skips DOM updates).
 * Skips update if the element currently has focus to avoid cursor jumps.
 * Automatically formats plain text (with \n) into proper HTML lists.
 */
app.directive('sync-html', {
  mounted(el: HTMLElement, binding) {
    // 标记为富文本可编辑区域，供浮动工具栏识别（仅对 description/summary/content 生效）
    el.classList.add('rich-editable')
    el.innerHTML = formatTextForHtml(binding.value ?? '')
  },
  updated(el: HTMLElement, binding) {
    if (binding.value === binding.oldValue) return
    // Don't override if user is actively editing this exact element
    if (document.activeElement === el) return
    const newVal = formatTextForHtml(binding.value ?? '')
    if (el.innerHTML !== newVal) {
      el.innerHTML = newVal
    }
  }
})

app.mount('#app')
