<template>
  <div>
    <!-- Avatar Preview -->
    <div v-if="store.avatar.url" class="flex items-center" style="margin-bottom: var(--normal-gap); gap: var(--normal-gap);">
      <div
        class="avatar-container"
        :class="store.avatar.shape === 'circle' ? 'avatar-circle' : 'avatar-rounded'"
        style="width: 64px; height: 64px;"
      >
        <img :src="store.avatar.url" alt="头像" style="width:100%;height:100%;" />
      </div>
      <button @click="removeAvatar" class="text-xs text-[var(--color-error)] hover:underline">移除</button>
    </div>

    <!-- Upload Button -->
    <label class="block w-full">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="onFileChange"
      />
      <div class="avatar-upload-zone">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span>{{ store.avatar.url ? '更换头像' : '点击上传头像' }}</span>
        <span class="avatar-upload-hint">JPG / PNG, ≤2MB</span>
      </div>
    </label>

    <!-- Shape Toggle -->
    <div v-if="store.avatar.url" class="flex items-center" style="margin-top: var(--space-2_5); gap: var(--tight-gap);">
      <span class="avatar-shape-label">形状</span>
      <button
        @click="setShape('circle')"
        class="avatar-shape-btn"
        :class="{ active: store.avatar.shape === 'circle' }"
      >圆形</button>
      <button
        @click="setShape('rounded')"
        class="avatar-shape-btn"
        :class="{ active: store.avatar.shape === 'rounded' }"
      >圆角矩形</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResumeStore } from '../stores/resume'

const store = useResumeStore()

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Validate size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过 2MB')
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    compressAndStore(reader.result as string, file.type)
  }
  reader.readAsDataURL(file)
}

function compressAndStore(dataUrl: string, mimeType: string) {
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const MAX_WIDTH = 400
    let { width, height } = img

    if (width > MAX_WIDTH) {
      height = (height * MAX_WIDTH) / width
      width = MAX_WIDTH
    }

    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, width, height)

    const compressed = canvas.toDataURL(mimeType === 'image/png' ? 'image/webp' : 'image/jpeg', 0.8)
    store.setAvatar(compressed, store.avatar.shape || 'circle')
  }
  img.src = dataUrl
}

function setShape(shape: 'circle' | 'rounded') {
  if (store.avatar.url) {
    store.setAvatar(store.avatar.url, shape)
  }
}

function removeAvatar() {
  store.setAvatar('', 'circle')
}
</script>
