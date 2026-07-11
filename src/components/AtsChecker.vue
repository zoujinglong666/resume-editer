<template>
  <div class="ats-checker">
    <div class="ats-header">
      <span class="ats-title">🔍 ATS 优化检查</span>
      <button class="ats-check-btn" :disabled="isChecking" @click="runAtsCheck">
        <svg v-if="!isChecking" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56" class="ats-spinner"/></svg>
        {{ isChecking ? '检查中...' : '检查' }}
      </button>
    </div>

    <!-- Target Job Input -->
    <div class="ats-input-section">
      <input
        v-model="targetJob"
        type="text"
        placeholder="输入目标职位（可选）"
        class="ats-input"
      />
    </div>

    <!-- Results -->
    <div v-if="atsResult" class="ats-results">
      <!-- Score Badge -->
      <div class="ats-score-badge" :class="scoreClass">
        <span class="ats-score-label">ATS 兼容性</span>
        <span class="ats-score-value">{{ atsResult.score }}</span>
      </div>

      <!-- Issues List -->
      <div v-if="atsResult.issues.length > 0" class="ats-issues">
        <div class="ats-section-title">需要改进</div>
        <div
          v-for="(issue, idx) in atsResult.issues"
          :key="idx"
          class="ats-issue"
          :class="issue.severity"
        >
          <span class="ats-issue-icon">{{ issue.icon }}</span>
          <span class="ats-issue-text">{{ issue.text }}</span>
        </div>
      </div>

      <!-- Good Points -->
      <div v-if="atsResult.goodPoints.length > 0" class="ats-good-points">
        <div class="ats-section-title">做得好的</div>
        <div
          v-for="(point, idx) in atsResult.goodPoints"
          :key="idx"
          class="ats-good-point"
        >
          <span class="ats-good-icon">✅</span>
          <span class="ats-good-text">{{ point }}</span>
        </div>
      </div>

      <!-- Keyword Match -->
      <div v-if="atsResult.keywordMatch !== null" class="ats-keyword-match">
        <div class="ats-section-title">关键词匹配度</div>
        <div class="ats-keyword-bar">
          <div class="ats-keyword-fill" :style="{ width: `${atsResult.keywordMatch}%` }"></div>
        </div>
        <div class="ats-keyword-text">{{ atsResult.keywordMatch }}%</div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="ats-empty">
      <span>点击「检查」按钮分析简历的 ATS 兼容性</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useResumeStore } from '../stores/resume'

const store = useResumeStore()
const isChecking = ref(false)
const targetJob = ref('')
const atsResult = ref<{
  score: number
  issues: { severity: 'error' | 'warning' | 'info'; icon: string; text: string }[]
  goodPoints: string[]
  keywordMatch: number | null
} | null>(null)

// Common ATS keywords by job type
const jobKeywords: Record<string, string[]> = {
  '前端': ['React', 'Vue', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Webpack', 'Vite', 'ESLint', 'Git'],
  '后端': ['Java', 'Python', 'Go', 'Node.js', 'MySQL', 'Redis', 'MongoDB', 'REST', 'GraphQL', 'Docker'],
  '全栈': ['React', 'Vue', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'MySQL', 'MongoDB', 'Docker', 'AWS'],
  '算法': ['Python', '机器学习', '深度学习', 'TensorFlow', 'PyTorch', 'NLP', '计算机视觉', '算法', '数据结构'],
  '产品': ['Axure', 'Figma', '原型', '需求分析', '用户调研', '数据分析', '产品规划', '项目管理'],
  '设计': ['Figma', 'Sketch', 'Photoshop', 'UI', 'UX', '交互设计', '视觉设计', '设计系统'],
}

function analyzeAtsCompatibility(resumeText: string, targetJob: string) {
  const issues: { severity: 'error' | 'warning' | 'info'; icon: string; text: string }[] = []
  const goodPoints: string[] = []
  let score = 100
  let keywordMatch = 0

  // Check for tables (ATS can't parse well)
  if (resumeText.includes('<table') || resumeText.includes('|---|')) {
    issues.push({ severity: 'error', icon: '❌', text: '避免使用表格，ATS 系统难以解析' })
    score -= 15
  }

  // Check for images (ATS can't read)
  if (resumeText.includes('<img') || resumeText.includes('.png') || resumeText.includes('.jpg')) {
    issues.push({ severity: 'warning', icon: '⚠️', text: '避免使用图片，ATS 系统无法识别' })
    score -= 10
  }

  // Check for special characters
  const specialChars = ['★', '●', '◆', '■', '▲', '▼', '►', '◄', '➤', '➜', '➝', '➞', '➟', '➠', '➡', '📞', '📧', '📍', '🌐', '🔗', '💼', '📱', '✈️', '↗️', '📡']
  const foundSpecialChars = specialChars.filter(char => resumeText.includes(char))
  if (foundSpecialChars.length > 0) {
    issues.push({ severity: 'warning', icon: '⚠️', text: `避免使用特殊符号：${foundSpecialChars.slice(0, 5).join(', ')}` })
    score -= 5
  }

  // Check for headers/sections
  const hasHeaders = ['工作经历', '项目经历', '教育经历', '技能', '个人优势'].some(h => resumeText.includes(h))
  if (hasHeaders) {
    goodPoints.push('包含标准简历模块标题')
    score += 5
  }

  // Check for contact info
  const hasEmail = /\S+@\S+\.\S+/.test(resumeText)
  const hasPhone = /\d{11}/.test(resumeText)
  if (hasEmail) {
    goodPoints.push('包含邮箱地址')
  } else {
    issues.push({ severity: 'error', icon: '❌', text: '缺少邮箱地址' })
    score -= 10
  }
  if (hasPhone) {
    goodPoints.push('包含电话号码')
  } else {
    issues.push({ severity: 'warning', icon: '⚠️', text: '缺少电话号码' })
    score -= 5
  }

  // Check for quantification
  const hasNumbers = /\d+%|\d+万|\d+人|\d+个|\d+项|\d+次|\d+倍/.test(resumeText)
  if (hasNumbers) {
    goodPoints.push('包含量化数据')
  } else {
    issues.push({ severity: 'warning', icon: '⚠️', text: '缺少量化数据，建议添加具体数字' })
    score -= 10
  }

  // Check for action verbs
  const actionVerbs = ['负责', '主导', '设计', '开发', '实现', '优化', '提升', '降低', '减少', '增加', '扩大', '建立', '构建', '创建', '推动', '促进', '协调', '管理', '领导', '指导', '培训', '招聘', '制定', '规划', '分析', '研究', '解决', '处理', '维护', '部署', '集成', '重构', '升级', '改进', '创新', '突破']
  const hasActionVerbs = actionVerbs.some(verb => resumeText.includes(verb))
  if (hasActionVerbs) {
    goodPoints.push('使用了行动动词')
  } else {
    issues.push({ severity: 'info', icon: 'ℹ️', text: '建议使用更多行动动词（如：负责、主导、优化）' })
    score -= 5
  }

  // Check for length
  const charCount = resumeText.replace(/<[^>]*>/g, '').length
  if (charCount < 200) {
    issues.push({ severity: 'warning', icon: '⚠️', text: '内容较简短，建议补充更多细节' })
    score -= 10
  } else if (charCount > 2000) {
    issues.push({ severity: 'warning', icon: '⚠️', text: '内容过长，建议精简至 1-2 页' })
    score -= 5
  }

  // Keyword matching for target job
  if (targetJob) {
    const jobType = Object.keys(jobKeywords).find(key => targetJob.includes(key))
    if (jobType) {
      const keywords = jobKeywords[jobType]
      const matchedKeywords = keywords.filter(k => resumeText.includes(k))
      keywordMatch = Math.round((matchedKeywords.length / keywords.length) * 100)
      
      if (keywordMatch < 50) {
        issues.push({ severity: 'warning', icon: '⚠️', text: `关键词匹配度较低 (${keywordMatch}%)，建议添加：${keywords.filter(k => !resumeText.includes(k)).slice(0, 5).join(', ')}` })
        score -= 10
      } else {
        goodPoints.push(`关键词匹配度良好 (${keywordMatch}%)`)
      }
    }
  }

  // Normalize score
  score = Math.max(0, Math.min(100, score))

  return {
    score,
    issues,
    goodPoints,
    keywordMatch,
  }
}

async function runAtsCheck() {
  isChecking.value = true
  atsResult.value = null

  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 500))

  // Get all resume text
  let resumeText = ''
  store.modules.forEach(module => {
    if (!module.visible) return
    module.items.forEach(item => {
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'personalFields' && typeof value === 'string') {
          resumeText += value + ' '
        }
      })
    })
  })

  atsResult.value = analyzeAtsCompatibility(resumeText, targetJob.value)
  isChecking.value = false
}

const scoreClass = computed(() => {
  if (!atsResult.value) return ''
  const score = atsResult.value.score
  if (score >= 80) return 'score-excellent'
  if (score >= 60) return 'score-good'
  if (score >= 40) return 'score-fair'
  return 'score-poor'
})
</script>

<style scoped>
.ats-checker {
  padding: 12px;
  background: var(--surface-color, #fff);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e4e4ec);
}

.ats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.ats-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
}

.ats-check-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid var(--border-color, #e4e4ec);
  border-radius: 6px;
  background: var(--surface-color, #fff);
  color: var(--text-secondary, #575a6b);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ats-check-btn:hover {
  background: var(--primary-50, #eef2ff);
  color: var(--primary-600, #4f46e5);
  border-color: var(--primary-200, #c7d2fe);
}

.ats-check-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ats-spinner {
  animation: ats-spin 1s linear infinite;
}

@keyframes ats-spin {
  to { transform: rotate(360deg); }
}

.ats-input-section {
  margin-bottom: 12px;
}

.ats-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-color, #e4e4ec);
  border-radius: 6px;
  font-size: 12px;
  outline: none;
  color: var(--text-primary, #333);
  background: var(--bg-color, #fff);
}

.ats-input:focus {
  border-color: var(--primary-400, #818cf8);
}

.ats-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ats-score-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 6px;
}

.ats-score-badge.score-excellent {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.ats-score-badge.score-good {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.ats-score-badge.score-fair {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.ats-score-badge.score-poor {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.ats-score-label {
  font-size: 12px;
  font-weight: 500;
}

.ats-score-value {
  font-size: 18px;
  font-weight: 700;
}

.ats-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #64748b);
  margin-bottom: 8px;
}

.ats-issues {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ats-issue {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.4;
}

.ats-issue.error {
  background: rgba(239, 68, 68, 0.05);
  color: #991b1b;
}

.ats-issue.warning {
  background: rgba(245, 158, 11, 0.05);
  color: #92400e;
}

.ats-issue.info {
  background: rgba(59, 130, 246, 0.05);
  color: #1e40af;
}

.ats-issue-icon {
  flex-shrink: 0;
  font-size: 14px;
}

.ats-issue-text {
  flex: 1;
}

.ats-good-points {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ats-good-point {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.4;
  background: rgba(16, 185, 129, 0.05);
  color: #065f46;
}

.ats-good-icon {
  flex-shrink: 0;
  font-size: 14px;
}

.ats-good-text {
  flex: 1;
}

.ats-keyword-match {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ats-keyword-bar {
  height: 8px;
  background: var(--border-light, #f0f0f5);
  border-radius: 4px;
  overflow: hidden;
}

.ats-keyword-fill {
  height: 100%;
  background: var(--primary-500, #6366f1);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.ats-keyword-text {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  text-align: right;
}

.ats-empty {
  text-align: center;
  padding: 20px 12px;
  color: var(--text-muted, #94a3b8);
  font-size: 12px;
}
</style>
