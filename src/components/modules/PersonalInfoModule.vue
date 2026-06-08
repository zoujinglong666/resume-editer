<template>
  <div>
    <div v-for="item in module.items" :key="item.id" class="mb-3">
      <!-- Name -->
      <div
        class="personal-name"
        contenteditable="true"
        :data-placeholder="'你的姓名'"
        @blur="updateField(item.id, 'name', $event)"
        @paste="onPaste"
      >{{ item.name }}</div>

      <!-- Position -->
      <div class="flex items-center gap-3 mb-2">
        <div
          class="personal-position"
          contenteditable="true"
          :data-placeholder="'目标职位'"
          @blur="updateField(item.id, 'position', $event)"
          @paste="onPaste"
        >{{ item.position }}</div>
      </div>

      <!-- Info Row: phone, email, location -->
      <div class="personal-info-row">
        <span v-if="item.phone">
          📱
          <span
            contenteditable="true"
            :data-placeholder="'电话'"
            @blur="updateField(item.id, 'phone', $event)"
            @paste="onPaste"
          >{{ item.phone }}</span>
        </span>
        <span v-else>
          <span
            contenteditable="true"
            :data-placeholder="'📱 电话'"
            @blur="updateField(item.id, 'phone', $event)"
            @paste="onPaste"
          >{{ item.phone }}</span>
        </span>

        <span v-if="item.email">
          ✉️
          <span
            contenteditable="true"
            :data-placeholder="'邮箱'"
            @blur="updateField(item.id, 'email', $event)"
            @paste="onPaste"
          >{{ item.email }}</span>
        </span>
        <span v-else>
          <span
            contenteditable="true"
            :data-placeholder="'✉️ 邮箱'"
            @blur="updateField(item.id, 'email', $event)"
            @paste="onPaste"
          >{{ item.email }}</span>
        </span>

        <span v-if="item.location">
          📍
          <span
            contenteditable="true"
            :data-placeholder="'所在地'"
            @blur="updateField(item.id, 'location', $event)"
            @paste="onPaste"
          >{{ item.location }}</span>
        </span>
        <span v-else>
          <span
            contenteditable="true"
            :data-placeholder="'📍 所在地'"
            @blur="updateField(item.id, 'location', $event)"
            @paste="onPaste"
          >{{ item.location }}</span>
        </span>
      </div>

      <!-- Summary -->
      <div
        class="personal-summary"
        contenteditable="true"
        :data-placeholder="'个人简介，简要介绍你的背景和优势...'"
        @blur="updateField(item.id, 'summary', $event)"
        @paste="onPaste"
      >{{ item.summary }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResumeStore } from '../../stores/resume'
import type { ResumeModule } from '../../types'

const props = defineProps<{ module: ResumeModule }>()
const store = useResumeStore()

function updateField(itemId: string, field: string, e: FocusEvent) {
  const value = (e.target as HTMLElement).innerText
  store.updateItem(props.module.id, itemId, field, value)
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}
</script>
