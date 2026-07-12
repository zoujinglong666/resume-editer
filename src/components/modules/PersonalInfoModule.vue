<template>
  <div class="flex items-start gap-4">
    <div class="flex-1 min-w-0">
      <div v-for="item in module.items" :key="item.id">
        <!-- Name (always rendered as heading) -->
        <div
          v-if="isFieldVisible(item, 'name')"
          class="personal-name"
          contenteditable="true"
          :data-placeholder="'你的姓名'"
          @blur="updateField(item.id, 'name', $event)"
          @paste="onPaste"
        >{{ item.name }}</div>

        <!-- Position -->
        <div
          v-if="isFieldVisible(item, 'position')"
          class="flex items-center"
          style="gap: var(--normal-gap); margin-bottom: var(--space-1);"
        >
          <component
            v-if="getFieldIcon(item, 'position')"
            :is="getLucideIcon(getFieldIcon(item, 'position'))"
            class="personal-field-icon"
          />
          <div
            class="personal-position"
            contenteditable="true"
            :data-placeholder="'目标职位'"
            @blur="updateField(item.id, 'position', $event)"
            @paste="onPaste"
          >{{ item.position }}</div>
        </div>

        <!-- Dynamic Info Row: only show fields that have a value -->
        <div v-if="visibleContactFields(item).length > 0" class="personal-info-row">
          <template v-for="field in visibleContactFields(item)" :key="field.id">
            <span v-if="item[field.key]" class="personal-info-item has-value">
              <component
                v-if="field.icon"
                :is="getLucideIcon(field.icon)"
                class="personal-field-icon"
              />
              <span
                contenteditable="true"
                :data-placeholder="field.label"
                @blur="updateField(item.id, field.key, $event)"
                @paste="onPaste"
              >{{ item[field.key] }}</span>
              <!-- Hover Delete Button (edit mode only) -->
              <button
                class="personal-field-delete-btn no-print"
                @click.stop="clearField(item.id, field.key)"
                :title="'清除' + field.label"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </span>
          </template>
        </div>

        <!-- Custom Fields (non-builtin, non-contact, displayed as individual rows) -->
        <div
          v-for="field in visibleCustomRowFields(item)"
          :key="field.id"
          class="personal-custom-row"
        >
          <component
            v-if="field.icon"
            :is="getLucideIcon(field.icon)"
            class="personal-field-icon"
          />
          <span class="personal-custom-label">{{ field.label }}：</span>
          <span
            contenteditable="true"
            :data-placeholder="field.label"
            @blur="updateField(item.id, field.key, $event)"
            @paste="onPaste"
          >{{ item[field.key] }}</span>
          <!-- Hover Delete Button for custom fields -->
          <button
            v-if="item[field.key]"
            class="personal-field-delete-btn no-print"
            @click.stop="clearField(item.id, field.key)"
            :title="'清除' + field.label"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Summary -->
        <div
          v-if="isFieldVisible(item, 'summary')"
          class="personal-summary"
          contenteditable="true"
          :data-placeholder="'个人简介，简要介绍你的背景和优势...'"
          @blur="updateField(item.id, 'summary', $event)"
          @paste="onPaste"
          v-sync-html="item.summary"
        ></div>
      </div>
    </div>

    <!-- Avatar Upload -->
    <div class="shrink-0 no-print">
      <input ref="avatarInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onAvatarChange" />
      <div
        class="personal-avatar-wrapper cursor-pointer"
        :class="store.avatar.shape === 'circle' ? 'avatar-circle' : 'avatar-rounded'"
        @click="avatarInput?.click()"
        :title="store.avatar.url ? '点击更换头像' : '点击上传头像'"
      >
        <img v-if="store.avatar.url" :src="store.avatar.url" class="personal-avatar-img" />
        <div v-else class="personal-avatar-placeholder">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
      </div>
      <div v-if="store.avatar.url" class="flex items-center justify-center" style="gap: 4px; margin-top: 4px;">
        <button class="avatar-shape-btn text-xs" :class="{ active: store.avatar.shape === 'circle' }" @click="setShape('circle')">圆</button>
        <button class="avatar-shape-btn text-xs" :class="{ active: store.avatar.shape === 'rounded' }" @click="setShape('rounded')">方</button>
        <button class="avatar-shape-btn text-xs text-[var(--color-error)]" @click="removeAvatar">删</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useResumeStore } from '../../stores/resume'
import { showAlert } from '../../utils/confirm'
import type { ResumeModule, ModuleItem, PersonalFieldConfig } from '../../types'
import { handlePaste } from '../../utils/smartPaste'
import {
  Phone, Mail, MapPin, Globe, Link, Briefcase, User, MessageCircle,
  Github, Linkedin, Calendar, Heart, Star, Award, BookOpen, Code,
  Monitor, Smartphone, Send, AtSign, Hash, Rss, ExternalLink,
  type LucideIcon
} from 'lucide-vue-next'

// Icon name → component mapping
const ICON_MAP: Record<string, LucideIcon> = {
  Phone, Mail, MapPin, Globe, Link, Briefcase, User, MessageCircle,
  Github, Linkedin, Calendar, Heart, Star, Award, BookOpen, Code,
  Monitor, Smartphone, Send, AtSign, Hash, Rss, ExternalLink,
}

function getLucideIcon(name?: string): LucideIcon | null {
  if (!name) return null
  return ICON_MAP[name] || null
}

const props = defineProps<{ module: ResumeModule }>()
const store = useResumeStore()
const avatarInput = ref<HTMLInputElement | null>(null)

const RICH_FIELDS = ['description', 'summary', 'content']

// Fields that appear in the contact info row (not displayed as separate rows)
const CONTACT_ROW_KEYS = ['phone', 'email', 'location', 'link']

function normalizeHtml(html: string): string {
  if (!html || html === '<br>' || html === '<div><br></div>' || html === '<p><br></p>') return ''
  return html
}

function getFieldsConfig(item: ModuleItem): PersonalFieldConfig[] {
  if (item.personalFields && Array.isArray(item.personalFields)) {
    return [...item.personalFields].sort((a, b) => a.order - b.order)
  }
  // Fallback: create default fields if not present
  return [
    { id: 'pf_name', key: 'name', label: '姓名', icon: '', visible: true, order: 0, isBuiltin: true },
    { id: 'pf_position', key: 'position', label: '职位', icon: 'Briefcase', visible: true, order: 1, isBuiltin: true },
    { id: 'pf_phone', key: 'phone', label: '电话', icon: 'Phone', visible: true, order: 2, isBuiltin: true },
    { id: 'pf_email', key: 'email', label: '邮箱', icon: 'Mail', visible: true, order: 3, isBuiltin: true },
    { id: 'pf_location', key: 'location', label: '所在地', icon: 'MapPin', visible: true, order: 4, isBuiltin: false },
    { id: 'pf_link', key: 'link', label: '个人网站', icon: 'Globe', visible: true, order: 5, isBuiltin: false },
    { id: 'pf_summary', key: 'summary', label: '个人简介', icon: '', visible: true, order: 6, isBuiltin: true },
  ]
}

function isFieldVisible(item: ModuleItem, key: string): boolean {
  const fields = getFieldsConfig(item)
  const field = fields.find(f => f.key === key)
  if (!field) return true // If not configured, show by default
  return field.visible
}

function getFieldIcon(item: ModuleItem, key: string): string | undefined {
  const fields = getFieldsConfig(item)
  const field = fields.find(f => f.key === key)
  return field?.icon
}

function visibleContactFields(item: ModuleItem): PersonalFieldConfig[] {
  const fields = getFieldsConfig(item)
  return fields.filter(f =>
    CONTACT_ROW_KEYS.includes(f.key) &&
    f.visible &&
    f.key !== 'name' && f.key !== 'position' && f.key !== 'summary'
  )
}

function visibleCustomRowFields(item: ModuleItem): PersonalFieldConfig[] {
  const fields = getFieldsConfig(item)
  return fields.filter(f =>
    !CONTACT_ROW_KEYS.includes(f.key) &&
    f.key !== 'name' && f.key !== 'position' && f.key !== 'summary' &&
    f.visible &&
    !f.isBuiltin
  )
}

function updateField(itemId: string, field: string, e: FocusEvent) {
  const target = e.target as HTMLElement
  const isRich = RICH_FIELDS.includes(field)
  const raw = isRich ? target.innerHTML : target.innerText
  const value = isRich ? normalizeHtml(raw) : raw
  store.updateItem(props.module.id, itemId, field, value)
}

function clearField(itemId: string, fieldKey: string) {
  store.updateItem(props.module.id, itemId, fieldKey, '')
}

function onPaste(e: ClipboardEvent) {
  handlePaste(e)
}

async function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    await showAlert({ title: '图片过大', description: '图片大小不能超过 2MB。' })
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    compressAndStore(dataUrl, file.type)
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

<style scoped>
.personal-field-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--primary-500);
  margin-right: 4px;
}

.personal-info-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--editor-personal-row-gap-y) var(--editor-personal-row-gap-x);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: 12px;
  padding: var(--editor-personal-row-py) var(--editor-personal-row-px);
  border-radius: var(--editor-card-br);
}

.personal-info-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  position: relative;
  padding: var(--editor-field-py) var(--editor-field-px);
  border-radius: var(--editor-field-br);
  transition: background 0.2s ease;
}

.personal-info-item:hover {
  background: rgba(99, 102, 241, 0.06);
}

.personal-info-item.has-value:hover .personal-field-delete-btn {
  opacity: 1;
  visibility: visible;
}

.personal-field-delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  margin-left: 2px;
  border: none;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.personal-field-delete-btn:hover {
  background: #ef4444;
  color: #fff;
  transform: scale(1.1);
}

.personal-name {
  font-size: 22px;
  font-weight: 800;
  color: var(--primary-700, #4338ca);
  line-height: 1.25;
  margin-bottom: 8px;
  letter-spacing: -0.3px;
  padding: 2px 4px;
  border-radius: 4px;
  outline: none;
  transition: background 0.2s ease;
}

.personal-name:hover {
  background: rgba(99, 102, 241, 0.06);
}

.personal-name:focus {
  background: var(--primary-50, #eef2ff);
  box-shadow: 0 0 0 2px var(--primary-200, #c7d2fe);
}

.personal-position {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary-500, #6366f1);
  margin-bottom: 10px;
  padding: 2px 4px;
  border-radius: 4px;
  outline: none;
  transition: background 0.2s ease;
}

.personal-position:hover {
  background: rgba(99, 102, 241, 0.06);
}

.personal-position:focus {
  background: var(--primary-50, #eef2ff);
  box-shadow: 0 0 0 2px var(--primary-200, #c7d2fe);
}

.personal-summary {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.65;
  margin-top: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  outline: none;
}

.personal-summary:hover {
  background: rgba(99, 102, 241, 0.04);
}

.personal-summary:focus {
  background: var(--primary-50, #eef2ff);
  box-shadow: 0 0 0 2px var(--primary-200, #c7d2fe);
  border-color: var(--primary-200);
}

.personal-custom-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: 6px;
  line-height: var(--line-height-relaxed);
  position: relative;
  padding: var(--editor-field-py) 6px;
  border-radius: var(--editor-field-br);
  transition: background 0.2s ease;
}

.personal-custom-row:hover {
  background: rgba(99, 102, 241, 0.04);
}

.personal-custom-row:hover .personal-field-delete-btn {
  opacity: 1;
  visibility: visible;
}

.personal-custom-label {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.personal-avatar-wrapper {
  width: 72px;
  height: 72px;
  border: 2px dashed var(--border-color);
  background: var(--bg-color);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s ease;
}
.personal-avatar-wrapper:hover {
  border-color: var(--primary-color);
}
.personal-avatar-wrapper.avatar-circle {
  border-radius: 50%;
}
.personal-avatar-wrapper.avatar-rounded {
  border-radius: 8px;
}
.personal-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.personal-avatar-placeholder {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-shape-btn {
  padding: 1px 4px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary);
}
.avatar-shape-btn.active {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}
</style>
