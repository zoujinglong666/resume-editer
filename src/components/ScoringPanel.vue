<template>
  <div class="scoring-panel no-print">
    <div class="scoring-header">
      <span class="scoring-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        简历评分
      </span>
      <Button class="scoring-refresh-btn" @click="recalculate" tip="重新评分">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </Button>
    </div>

    <!-- Score Circle -->
    <div class="scoring-circle-wrap">
      <div class="scoring-circle" :style="{ '--score-color': gradeColor, '--score-pct': `${result.total}%` }">
        <div class="scoring-circle-inner">
          <span class="scoring-score-num" :style="{ color: gradeColor }">{{ result.total }}</span>
          <span class="scoring-score-unit">分</span>
        </div>
      </div>
      <div class="scoring-grade" :style="{ color: gradeColor }">
        {{ gradeLabel }} ({{ result.grade }})
      </div>
    </div>

    <!-- Breakdown -->
    <div class="scoring-breakdown">
      <div v-for="(dim, key) in result.breakdown" :key="key" class="scoring-dim">
        <div class="scoring-dim-header">
          <span class="scoring-dim-name">{{ dimLabels[key] }}</span>
          <span class="scoring-dim-score">{{ dim.score }}/{{ dim.max }}</span>
        </div>
        <div class="scoring-dim-bar">
          <div
            class="scoring-dim-fill"
            :style="{
              width: `${(dim.score / dim.max) * 100}%`,
              background: getBarColor(dim.score / dim.max),
            }"
          />
        </div>
        <div v-if="dim.feedback" class="scoring-dim-feedback">{{ dim.feedback }}</div>
      </div>
    </div>

    <!-- Strengths -->
    <div v-if="result.strengths.length" class="scoring-section">
      <div class="scoring-section-title scoring-strength-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        亮点
      </div>
      <ul class="scoring-list">
        <li v-for="(s, i) in result.strengths" :key="i" class="scoring-list-item scoring-list-good">{{ s }}</li>
      </ul>
    </div>

    <!-- Suggestions -->
    <div v-if="result.suggestions.length" class="scoring-section">
      <div class="scoring-section-title scoring-suggest-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        改进建议
      </div>
      <ul class="scoring-list">
        <li v-for="(s, i) in result.suggestions" :key="i" class="scoring-list-item scoring-list-warn">{{ s }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from './ui/Button.vue'
import { computed } from 'vue'
import { useResumeStore } from '../stores/resume'
import { scoreResume, getGradeColor, getGradeLabel } from '../utils/resumeScorer'

const store = useResumeStore()

const dimLabels: Record<string, string> = {
  completeness: '内容完整性',
  professionalism: '专业度',
  quantification: '量化成果',
  keywords: '关键词匹配',
  format: '格式规范',
}

const result = computed(() => scoreResume(store.modules))
const gradeColor = computed(() => getGradeColor(result.value.grade))
const gradeLabel = computed(() => getGradeLabel(result.value.grade))

function getBarColor(ratio: number): string {
  if (ratio >= 0.8) return '#10b981'
  if (ratio >= 0.6) return '#3b82f6'
  if (ratio >= 0.4) return '#f59e0b'
  return '#ef4444'
}

function recalculate() {
  // Force reactivity refresh
  store.markSaving()
}
</script>
