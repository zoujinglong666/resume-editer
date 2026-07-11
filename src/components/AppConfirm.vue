<template>
  <AlertDialogRoot :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogPortal>
      <AlertDialogOverlay class="app-confirm-overlay" />
      <AlertDialogContent class="app-confirm-dialog" @open-auto-focus.prevent>
        <AlertDialogTitle class="app-confirm-title">{{ title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="description" class="app-confirm-desc">
          {{ description }}
        </AlertDialogDescription>

        <input
          v-if="mode === 'prompt'"
          ref="inputRef"
          class="app-confirm-input"
          :value="modelValue"
          :placeholder="placeholder"
          @input="onInput"
          @keyup.enter="onConfirm"
        />

        <div class="app-confirm-actions">
          <button
            v-if="mode !== 'alert'"
            type="button"
            class="app-confirm-btn app-confirm-btn--ghost"
            @click="onCancel"
          >{{ cancelText }}</button>
          <button
            type="button"
            class="app-confirm-btn app-confirm-btn--primary"
            @click="onConfirm"
          >{{ confirmText }}</button>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import {
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from 'reka-ui'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  mode?: 'alert' | 'confirm' | 'prompt'
  confirmText?: string
  cancelText?: string
  defaultValue?: string
  placeholder?: string
}>(), {
  mode: 'confirm',
  confirmText: '确定',
  cancelText: '取消',
  defaultValue: '',
  placeholder: '',
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm', value: string | null): void
  (e: 'cancel'): void
}>()

const modelValue = ref(props.defaultValue)
const inputRef = ref<HTMLInputElement | null>(null)

watch(() => props.open, (v) => {
  if (v) {
    modelValue.value = props.defaultValue ?? ''
    if (props.mode === 'prompt') {
      nextTick(() => inputRef.value?.focus())
    }
  }
})

function onInput(e: Event) {
  modelValue.value = (e.target as HTMLInputElement).value
}

function onConfirm() {
  emit('confirm', props.mode === 'prompt' ? modelValue.value : null)
}
function onCancel() {
  emit('cancel')
}
</script>
