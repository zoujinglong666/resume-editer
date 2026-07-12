<template>
  <div v-if="open" class="ai-opt-overlay" @click.self="close">
    <div class="ai-opt-modal" role="dialog" aria-modal="true">
      <div class="ai-opt-header">
        <div class="ai-opt-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L19 9.2l-4.3 2.4L13.8 16 12 20l-1.8-4-4.3-2.4L13 9.2z"/><path d="M19 14l.7 1.8L21.5 16.5 19.7 17.2 19 19l-.7-1.8L16.5 16.5 18.3 15.8z" transform="translate(-2 -1)"/></svg>
          AI 优化简历
        </div>
        <Button class="ai-opt-close" @click="close" aria-label="关闭">&times;</Button>
      </div>

      <div class="ai-opt-body">
        <p class="ai-opt-intro">
          本编辑器已<strong>预留 AI 优化入口</strong>。当前内置的 AI 助手需要 API Key，
          而更推荐的做法是：把简历交给外部 AI Agent（如已安装
          <code>dev-resume-opt</code> 技能的 智语 / OpenClaw / Claude Code / Cursor）来诊断与优化。
        </p>

        <ol class="ai-opt-steps">
          <li>点击下方按钮，复制「简历 + 优化指令」。</li>
          <li>在终端运行你的 AI Agent，粘贴并发送即可。</li>
          <li>把优化后的简历粘回本编辑器（导入 JSON / 直接替换）。</li>
        </ol>

        <div class="ai-opt-preview-label">将复制的内容预览：</div>
        <textarea class="ai-opt-preview" :value="fullPrompt" readonly rows="10" />

        <div class="ai-opt-actions">
          <Button class="ai-opt-btn ai-opt-btn--primary" @click="copyFull">
            {{ copiedFull ? '已复制 ✓' : '复制「简历 + 优化指令」' }}
          </Button>
          <Button class="ai-opt-btn" @click="copyResume">
            {{ copiedResume ? '已复制 ✓' : '仅复制简历（Markdown）' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from './ui/Button.vue'
import { ref, computed } from 'vue'
import { useResumeStore } from '../stores/resume'
import { buildMarkdown } from '../utils/exportResume'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()
const store = useResumeStore()

const copiedFull = ref(false)
const copiedResume = ref(false)

const STANDARD = `你是一名资深简历优化顾问，请遵循「程序员简历优化规范」诊断并优化下面这份简历，输出优化后的完整简历（Markdown）：

1. 个人信息：职位写强标题（如「高级前端工程师」），去掉「N 年经验」这类可由毕业时间推断的信息；
2. 新增「个人优势」模块：真实、客观、具体、非人人都具备，每条带量化事实；
3. 专业技能：按维度（语言 / 框架 / 工程化 / 协议 / AI 编程等）展开，用「熟练掌握 / 深入理解」，删掉空话；
4. 工作经历：用「动词 + 技术 + 成果」格式重写，带量化指标；
5. 项目经历：补充「担任角色」与「技术栈」，职责 4~7 条，格式「使用 xxx，实现 xxx，解决 xxx，达到 xxx」，结果量化；
6. 删除空泛的「个人总结」（如「乐观开朗」），个人优势已能体现特质；
7. 保留原有真实信息，只做表达与结构的优化，不编造经历。`

const resumeMd = computed(() => buildMarkdown(store.modules))

const fullPrompt = computed(() =>
  `${STANDARD}\n\n===== 我的简历 =====\n${resumeMd.value}\n`
)

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 兜底：execCommand
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { ok = false }
    document.body.removeChild(ta)
    return ok
  }
}

async function copyFull() {
  const ok = await copy(fullPrompt.value)
  copiedFull.value = ok
  if (ok) setTimeout(() => (copiedFull.value = false), 2000)
}

async function copyResume() {
  const ok = await copy(resumeMd.value)
  copiedResume.value = ok
  if (ok) setTimeout(() => (copiedResume.value = false), 2000)
}

function close() {
  emit('update:open', false)
}
</script>
