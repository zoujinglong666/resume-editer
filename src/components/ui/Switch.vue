<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    disabled?: boolean
    id?: string
  }>(),
  { modelValue: false, disabled: false, id: undefined },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function onUpdate(v: unknown) {
  emit('update:modelValue', Boolean(v))
}
</script>

<template>
  <SwitchRoot
    :model-value="modelValue"
    :disabled="disabled"
    :id="id"
    class="ui-switch"
    @update:model-value="onUpdate"
  >
    <SwitchThumb class="ui-switch-thumb" />
  </SwitchRoot>
</template>
