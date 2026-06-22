<template>
  <div class="account-panel no-print">
    <div class="account-header">
      <span class="account-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        云端同步
      </span>
    </div>

    <!-- Login State -->
    <template v-if="!isLoggedIn">
      <div class="account-login">
        <div class="account-avatar-placeholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <p class="account-login-hint">登录后可云端保存简历，多设备同步</p>

        <!-- Mock Login Form -->
        <div class="account-form">
          <input
            v-model="loginForm.email"
            class="ai-input"
            type="email"
            placeholder="邮箱地址"
          />
          <input
            v-model="loginForm.password"
            class="ai-input"
            type="password"
            placeholder="密码"
          />
          <button class="account-login-btn" @click="handleLogin">登录</button>
          <button class="account-register-btn" @click="handleRegister">注册新账号</button>
        </div>

        <div class="account-divider">
          <span>或</span>
        </div>

        <!-- Quick Sync Options -->
        <div class="account-quick-sync">
          <button class="account-sync-btn" @click="exportToFile">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            导出备份文件
          </button>
          <button class="account-sync-btn" @click="importFromFile">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            导入备份文件
          </button>
        </div>
      </div>
    </template>

    <!-- Logged In State -->
    <template v-else>
      <div class="account-user">
        <div class="account-user-avatar">
          {{ user.name?.charAt(0) || '?' }}
        </div>
        <div class="account-user-info">
          <span class="account-user-name">{{ user.name }}</span>
          <span class="account-user-email">{{ user.email }}</span>
        </div>
        <button class="account-logout-btn" @click="handleLogout">退出</button>
      </div>

      <!-- Cloud Status -->
      <div class="account-cloud-status">
        <div class="account-cloud-item">
          <span class="account-cloud-label">云端状态</span>
          <span class="account-cloud-value" :style="{ color: cloudStatus === 'synced' ? '#10b981' : cloudStatus === 'syncing' ? '#3b82f6' : '#f59e0b' }">
            {{ cloudStatusText }}
          </span>
        </div>
        <div class="account-cloud-item">
          <span class="account-cloud-label">上次同步</span>
          <span class="account-cloud-value">{{ lastSyncText }}</span>
        </div>
        <button class="account-sync-now-btn" @click="syncNow" :disabled="cloudStatus === 'syncing'">
          {{ cloudStatus === 'syncing' ? '同步中...' : '立即同步' }}
        </button>
      </div>

      <!-- Cloud Storage List -->
      <div class="account-storage">
        <div class="account-storage-title">云端简历</div>
        <div v-if="cloudResumes.length === 0" class="account-storage-empty">
          暂无云端简历
        </div>
        <div v-else class="account-storage-list">
          <div v-for="r in cloudResumes" :key="r.id" class="account-storage-item">
            <div class="account-storage-info">
              <span class="account-storage-name">{{ r.name }}</span>
              <span class="account-storage-time">{{ r.updatedAt }}</span>
            </div>
            <button class="account-storage-load" @click="loadCloudResume(r.id)">加载</button>
          </div>
        </div>
      </div>
    </template>

    <!-- Hidden file input -->
    <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="onFileSelected" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useResumeStore } from '../stores/resume'

const store = useResumeStore()
const fileInputRef = ref<HTMLInputElement | null>(null)

// ---- Mock User State (localStorage-based) ----
const USER_KEY = 'resume-editor-user'
const isLoggedIn = ref(false)
const user = reactive({ name: '', email: '' })
const cloudStatus = ref<'synced' | 'syncing' | 'pending'>('pending')
const lastSyncTime = ref<string>('')

const loginForm = reactive({ email: '', password: '' })

interface CloudResume {
  id: string
  name: string
  updatedAt: string
  data: string
}

const cloudResumes = ref<CloudResume[]>([])
const CLOUD_KEY = 'resume-editor-cloud'

const cloudStatusText = computed(() => {
  if (cloudStatus.value === 'synced') return '已同步'
  if (cloudStatus.value === 'syncing') return '同步中...'
  return '未同步'
})

const lastSyncText = computed(() => {
  if (!lastSyncTime.value) return '从未同步'
  try {
    const d = new Date(lastSyncTime.value)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  } catch {
    return lastSyncTime.value
  }
})

onMounted(() => {
  // Restore login state
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      user.name = data.name
      user.email = data.email
      isLoggedIn.value = true
      loadCloudResumes()
    }
  } catch { /* ignore */ }
})

function handleLogin() {
  if (!loginForm.email || !loginForm.password) {
    alert('请输入邮箱和密码')
    return
  }
  // Mock login
  user.name = loginForm.email.split('@')[0]
  user.email = loginForm.email
  isLoggedIn.value = true
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  loadCloudResumes()
}

function handleRegister() {
  if (!loginForm.email || !loginForm.password) {
    alert('请输入邮箱和密码')
    return
  }
  // Mock register = login
  handleLogin()
}

function handleLogout() {
  isLoggedIn.value = false
  user.name = ''
  user.email = ''
  localStorage.removeItem(USER_KEY)
}

function loadCloudResumes() {
  try {
    const raw = localStorage.getItem(CLOUD_KEY)
    if (raw) cloudResumes.value = JSON.parse(raw)
  } catch { /* ignore */ }
}

function persistCloudResumes() {
  localStorage.setItem(CLOUD_KEY, JSON.stringify(cloudResumes.value))
}

function syncNow() {
  cloudStatus.value = 'syncing'
  // Save current resume to cloud
  const data = store.exportData()
  const existing = cloudResumes.value.find(r => r.name === '我的简历')
  if (existing) {
    existing.data = JSON.stringify(data)
    existing.updatedAt = new Date().toISOString()
  } else {
    cloudResumes.value.unshift({
      id: `cloud_${Date.now()}`,
      name: '我的简历',
      updatedAt: new Date().toISOString(),
      data: JSON.stringify(data),
    })
  }
  persistCloudResumes()
  setTimeout(() => {
    cloudStatus.value = 'synced'
    lastSyncTime.value = new Date().toISOString()
  }, 800)
}

function loadCloudResume(id: string) {
  const r = cloudResumes.value.find(x => x.id === id)
  if (!r) return
  try {
    const data = JSON.parse(r.data)
    store.importData(data)
  } catch {
    alert('加载失败')
  }
}

function exportToFile() {
  const data = store.exportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `resume-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importFromFile() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string)
      store.importData(data)
    } catch {
      alert('文件格式错误，请选择有效的 JSON 文件')
    }
  }
  reader.readAsText(file)
  input.value = ''
}
</script>
