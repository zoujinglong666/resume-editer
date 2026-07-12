<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'

withDefaults(
  defineProps<{
    /** 提示文本；也可用 #content 插槽自定义富文本 */
    text?: string
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    /** 悬停多久后显示（ms） */
    delay?: number
  }>(),
  {
    text: '',
    side: 'top',
    align: 'center',
    delay: 300,
  },
)
</script>

<template>
  <TooltipRoot :delay-duration="delay">
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent class="ui-tip" :side="side" :align="align" :side-offset="6">
        <slot name="content">{{ text }}</slot>
        <TooltipArrow class="ui-tip-arrow" :width="10" :height="5" />
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
