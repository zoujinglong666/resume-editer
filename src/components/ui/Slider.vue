<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'

const props = withDefaults(
  defineProps<{
    modelValue?: number
    min?: number
    max?: number
    step?: number
    disabled?: boolean
  }>(),
  { modelValue: 12, min: 0, max: 100, step: 1, disabled: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
  /** 拖拽结束（松手）时触发，适合写回 store */
  commit: [value: number]
}>()

function asNum(v: unknown): number {
  const arr = v as number[]
  return Array.isArray(arr) ? (arr[0] ?? props.modelValue) : props.modelValue
}
</script>

<template>
  <SliderRoot
    class="ui-slider"
    :model-value="[modelValue]"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    @update:model-value="(v) => emit('update:modelValue', asNum(v))"
    @value-commit="(v) => emit('commit', asNum(v))"
  >
    <SliderTrack class="ui-slider-track">
      <SliderRange class="ui-slider-range" />
    </SliderTrack>
    <SliderThumb class="ui-slider-thumb" />
  </SliderRoot>
</template>
