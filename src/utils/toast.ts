import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  type: ToastType
  title: string
  description?: string
  /** 自动关闭毫秒数；reka-ui 控制倒计时与关闭动画 */
  duration: number
  /** 由 reka-ui ToastRoot 控制的可见状态 */
  open: boolean
}

// 全局单例的 toast 列表（与 confirm.ts 的命令式弹窗互补）
const toasts = ref<ToastItem[]>([])
let seq = 0

export interface ShowToastOptions {
  type?: ToastType
  title: string
  description?: string
  /** 自动关闭毫秒数；传 0 表示不自动关闭，需手动点 × */
  duration?: number
}

export function showToast(opts: ShowToastOptions): number {
  const id = ++seq
  toasts.value.push({
    id,
    type: opts.type ?? 'info',
    title: opts.title,
    description: opts.description,
    duration: opts.duration ?? 3000,
    open: true,
  })
  return id
}

/** 请求关闭某条 toast（设置 open=false，交 reka-ui 播放关闭动画） */
export function removeToast(id: number): void {
  const t = toasts.value.find((x) => x.id === id)
  if (t) t.open = false
}

/** 真正从列表移除（在关闭动画结束后调用） */
function dismiss(id: number): void {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

/** 便捷方法 */
export const toast = {
  success: (title: string, description?: string) => showToast({ type: 'success', title, description }),
  error: (title: string, description?: string) => showToast({ type: 'error', title, description }),
  info: (title: string, description?: string) => showToast({ type: 'info', title, description }),
  warning: (title: string, description?: string) => showToast({ type: 'warning', title, description }),
}

export function useToasts() {
  return { toasts, showToast, removeToast, dismiss }
}
