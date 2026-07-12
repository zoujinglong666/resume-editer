<template>
  <div class="version-panel no-print">
    <div class="version-header">
      <span class="version-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        版本历史
      </span>
      <Button class="version-save-btn" @click="saveSnapshot" tip="保存当前快照">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        保存快照
      </Button>
    </div>

    <!-- Auto-save info -->
    <div class="version-auto-info">
      <span class="version-dot" :class="store.saveStatus" />
      <span>{{ saveStatusText }}</span>
    </div>

    <!-- Snapshot List -->
    <div v-if="snapshots.length === 0" class="version-empty">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <p>暂无手动快照</p>
      <p class="version-empty-hint">点击「保存快照」创建版本存档</p>
    </div>

    <div v-else class="version-list">
      <div
        v-for="(snap, idx) in snapshots"
        :key="snap.id"
        class="version-item"
        :class="{ active: selectedSnapshotId === snap.id }"
        @click="selectedSnapshotId = snap.id"
      >
        <div class="version-item-header">
          <span class="version-item-name">{{ snap.name || `快照 #${snapshots.length - idx}` }}</span>
          <span class="version-item-time">{{ formatTime(snap.timestamp) }}</span>
        </div>
        <div class="version-item-meta">
          {{ snap.moduleCount }} 个模块 · {{ snap.charCount }} 字
        </div>
        <div v-if="selectedSnapshotId === snap.id" class="version-item-actions">
          <Button class="version-action-btn" @click.stop="restoreSnapshot(snap.id)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            恢复此版本
          </Button>
          <Button class="version-action-btn version-action-delete" @click.stop="deleteSnapshot(snap.id)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            删除
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from './ui/Button.vue'
import { ref, computed, onMounted } from 'vue'
import { useResumeStore } from '../stores/resume'
import { showToast } from '../utils/toast'

const store = useResumeStore()

interface Snapshot {
  id: string
  name: string
  timestamp: string
  moduleCount: number
  charCount: number
  data: string // JSON stringified ResumeData
}

const SNAPSHOTS_KEY = 'resume-editor-snapshots'
const snapshots = ref<Snapshot[]>([])
const selectedSnapshotId = ref<string | null>(null)

const saveStatusText = computed(() => {
  if (store.saveStatus === 'saved') return `已自动保存 ${formatTime(store.lastSaved)}`
  if (store.saveStatus === 'saving') return '保存中...'
  return '有未保存的更改'
})

function formatTime(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return '刚刚'
    if (diffMin < 60) return `${diffMin} 分钟前`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} 小时前`

    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  } catch {
    return iso
  }
}

function loadSnapshots() {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY)
    if (raw) snapshots.value = JSON.parse(raw)
  } catch {
    snapshots.value = []
  }
}

function persistSnapshots() {
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots.value))
}

function saveSnapshot() {
  const data = store.exportData()
  const charCount = store.charCount
  const snap: Snapshot = {
    id: `snap_${Date.now()}`,
    name: '',
    timestamp: new Date().toISOString(),
    moduleCount: data.modules.length,
    charCount,
    data: JSON.stringify(data),
  }
  snapshots.value.unshift(snap)
  // Keep max 20 snapshots
  if (snapshots.value.length > 20) {
    snapshots.value = snapshots.value.slice(0, 20)
  }
  persistSnapshots()
}

function restoreSnapshot(id: string) {
  const snap = snapshots.value.find(s => s.id === id)
  if (!snap) return
  if (!confirm('确定要恢复到此快照版本？当前未保存的更改将丢失。')) return
  try {
    const data = JSON.parse(snap.data)
    store.importData(data)
  } catch {
    showToast({ type: 'error', title: '恢复失败', description: '数据解析错误' })
  }
}

function deleteSnapshot(id: string) {
  snapshots.value = snapshots.value.filter(s => s.id !== id)
  if (selectedSnapshotId.value === id) selectedSnapshotId.value = null
  persistSnapshots()
}

onMounted(() => {
  loadSnapshots()
})
</script>
