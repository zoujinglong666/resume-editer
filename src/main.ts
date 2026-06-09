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
 * v-sync-html directive
 * Like v-html but also syncs when the bound value changes from outside,
 * even on contenteditable elements (where Vue normally skips DOM updates).
 * Skips update if the element currently has focus to avoid cursor jumps.
 */
app.directive('sync-html', {
  mounted(el: HTMLElement, binding) {
    el.innerHTML = binding.value ?? ''
  },
  updated(el: HTMLElement, binding) {
    if (binding.value === binding.oldValue) return
    // Don't override if user is actively editing this exact element
    if (document.activeElement === el) return
    const newVal = binding.value ?? ''
    if (el.innerHTML !== newVal) {
      el.innerHTML = newVal
    }
  }
})

app.mount('#app')
