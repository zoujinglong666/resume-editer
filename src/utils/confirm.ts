import { createApp, h } from 'vue'
import AppConfirm from '../components/AppConfirm.vue'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  defaultValue?: string
  placeholder?: string
}

/**
 * 命令式挂载一个基于 reka-ui AlertDialog 的确认/提示弹窗。
 * 返回 Promise，在用户点击「确定 / 取消」或关闭弹窗时 resolve。
 */
function mount(opts: ConfirmOptions & { mode: 'alert' | 'confirm' | 'prompt' }) {
  return new Promise<string | null | boolean>((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    let settled = false
    const finish = (result: string | null | boolean) => {
      if (settled) return
      settled = true
      app.unmount()
      container.remove()
      resolve(result)
    }

    const app = createApp({
      render() {
        return h(AppConfirm, {
          open: true,
          mode: opts.mode,
          title: opts.title,
          description: opts.description,
          confirmText: opts.confirmText,
          cancelText: opts.cancelText,
          defaultValue: opts.defaultValue,
          placeholder: opts.placeholder,
          'onUpdate:open': (v: boolean) => {
            if (!v) finish(opts.mode === 'prompt' ? null : false)
          },
          onConfirm: (val: string | null) => finish(opts.mode === 'prompt' ? val : true),
          onCancel: () => finish(opts.mode === 'prompt' ? null : false),
        })
      },
    })
    app.mount(container)
  })
}

/** 确认框：返回 true / false */
export function showConfirm(opts: ConfirmOptions): Promise<boolean> {
  return mount({ ...opts, mode: 'confirm' }) as Promise<boolean>
}

/** 提示框（仅「确定」）：resolve 即表示已确认 */
export function showAlert(opts: Omit<ConfirmOptions, 'cancelText'>): Promise<void> {
  return mount({ ...opts, mode: 'alert' }).then(() => {})
}

/** 输入框：返回输入的字符串或 null（取消） */
export function showPrompt(opts: ConfirmOptions): Promise<string | null> {
  return mount({ ...opts, mode: 'prompt' }) as Promise<string | null>
}
