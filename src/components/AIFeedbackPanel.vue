<template>
  <div class="ai-feedback-panel">
    <!-- Score Badge -->
    <div class="ai-score-badge" :class="scoreClass">
      <span class="ai-score-label">AI 评分</span>
      <span class="ai-score-value">{{ aiScore }}</span>
    </div>

    <!-- Feedback Items -->
    <div v-if="feedbackItems.length > 0" class="ai-feedback-list">
      <div
        v-for="(item, idx) in feedbackItems"
        :key="idx"
        class="ai-feedback-item"
        :class="item.type"
      >
        <span class="ai-feedback-icon">{{ item.icon }}</span>
        <span class="ai-feedback-text">{{ item.text }}</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="ai-feedback-empty">
      <span>开始编辑以获取 AI 建议</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useResumeStore } from '../stores/resume'

const store = useResumeStore()
const aiScore = ref(0)
const feedbackItems = ref<{ type: 'good' | 'warning' | 'error'; icon: string; text: string }[]>([])

// Action verbs that indicate strong resume writing
const actionVerbs = [
  '负责', '主导', '设计', '开发', '实现', '优化', '提升', '降低', '减少',
  '增加', '扩大', '建立', '构建', '创建', '推动', '促进', '协调', '管理',
  '领导', '指导', '培训', '招聘', '制定', '规划', '分析', '研究', '解决',
  '处理', '维护', '部署', '集成', '重构', '升级', '改进', '创新', '突破',
]

// Keywords that indicate quantification
const quantificationPatterns = [
  /(\d+)%/, // percentages
  /(\d+)万/, // ten thousands
  /(\d+)亿/, // hundred millions
  /(\d+)倍/, // times
  /(\d+)人/, // people
  /(\d+)个/, // items
  /(\d+)项/, // projects
  /(\d+)次/, // times
  /(\d+)台/, // machines
  /(\d+)毫秒?/, // milliseconds
  /(\d+)秒/, // seconds
  /(\d+)分钟/, // minutes
  /(\d+)小时/, // hours
  /(\d+)天/, // days
  /(\d+)周/, // weeks
  /(\d+)月/, // months
  /(\d+)年/, // years
]

function analyzeText(text: string) {
  if (!text || text.length < 10) {
    aiScore.value = 0
    feedbackItems.value = []
    return
  }

  let score = 0
  const feedback: { type: 'good' | 'warning' | 'error'; icon: string; text: string }[] = []

  // Check for action verbs
  const hasActionVerb = actionVerbs.some(verb => text.includes(verb))
  if (hasActionVerb) {
    score += 20
    feedback.push({ type: 'good', icon: '✅', text: '使用了行动动词' })
  } else {
    feedback.push({ type: 'warning', icon: '⚠️', text: '建议使用行动动词（如：负责、主导、优化）' })
  }

  // Check for quantification
  const hasQuantification = quantificationPatterns.some(pattern => pattern.test(text))
  if (hasQuantification) {
    score += 25
    feedback.push({ type: 'good', icon: '✅', text: '包含量化数据' })
  } else {
    feedback.push({ type: 'warning', icon: '⚠️', text: '建议添加量化数据（如：提升30%、服务1000+用户）' })
  }

  // Check for length
  if (text.length > 200) {
    score += 10
    feedback.push({ type: 'good', icon: '✅', text: '内容充实' })
  } else if (text.length < 50) {
    feedback.push({ type: 'warning', icon: '⚠️', text: '内容较简短，建议补充更多细节' })
  }

  // Check for specific technologies/tools
  const techKeywords = ['React', 'Vue', 'Node.js', 'Python', 'Java', 'Go', 'Kubernetes', 'Docker', 'MySQL', 'Redis', 'AWS', 'Azure']
  const hasTech = techKeywords.some(tech => text.includes(tech))
  if (hasTech) {
    score += 15
    feedback.push({ type: 'good', icon: '✅', text: '提及了技术栈' })
  }

  // Check for results/outcomes
  const resultKeywords = ['提升', '降低', '减少', '增加', '扩大', '节省', '缩短', '加速', '提高', '改善']
  const hasResult = resultKeywords.some(keyword => text.includes(keyword))
  if (hasResult) {
    score += 20
    feedback.push({ type: 'good', icon: '✅', text: '描述了成果' })
  }

  // Check for vague language
  const vagueWords = ['很多', '一些', '几个', '大量', '丰富', '广泛', '深入']
  const hasVague = vagueWords.some(word => text.includes(word))
  if (hasVague) {
    score -= 10
    feedback.push({ type: 'warning', icon: '⚠️', text: '避免模糊词汇，使用具体数据' })
  }

  // Normalize score
  aiScore.value = Math.max(0, Math.min(100, score))

  feedbackItems.value = feedback
}

// Watch for changes in the selected module's content
watch(() => store.selectedModule, (newModule) => {
  if (!newModule) {
    aiScore.value = 0
    feedbackItems.value = []
    return
  }

  // Analyze all items in the selected module
  let allText = ''
  newModule.items.forEach(item => {
    if (item.description) allText += item.description + ' '
    if (item.content) allText += item.content + ' '
  })

  analyzeText(allText)
}, { immediate: true })

// Watch for individual item changes
watch(() => store.modules, () => {
  if (store.selectedModule) {
    let allText = ''
    store.selectedModule.items.forEach(item => {
      if (item.description) allText += item.description + ' '
      if (item.content) allText += item.content + ' '
    })
    analyzeText(allText)
  }
}, { deep: true })

const scoreClass = computed(() => {
  if (aiScore.value >= 80) return 'score-excellent'
  if (aiScore.value >= 60) return 'score-good'
  if (aiScore.value >= 40) return 'score-fair'
  return 'score-poor'
})
</script>

<style scoped>
.ai-feedback-panel {
  padding: 12px;
  background: var(--surface-color, #fff);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e4e4ec);
}

.ai-score-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.ai-score-badge.score-excellent {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.ai-score-badge.score-good {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.ai-score-badge.score-fair {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.ai-score-badge.score-poor {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.ai-score-label {
  font-size: 12px;
  font-weight: 500;
}

.ai-score-value {
  font-size: 18px;
  font-weight: 700;
}

.ai-feedback-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-feedback-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.4;
}

.ai-feedback-item.good {
  background: rgba(16, 185, 129, 0.05);
  color: #065f46;
}

.ai-feedback-item.warning {
  background: rgba(245, 158, 11, 0.05);
  color: #92400e;
}

.ai-feedback-item.error {
  background: rgba(239, 68, 68, 0.05);
  color: #991b1b;
}

.ai-feedback-icon {
  flex-shrink: 0;
  font-size: 14px;
}

.ai-feedback-text {
  flex: 1;
}

.ai-feedback-empty {
  text-align: center;
  padding: 20px 12px;
  color: var(--text-muted, #94a3b8);
  font-size: 12px;
}
</style>
