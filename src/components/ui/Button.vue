<script setup lang="ts">
import { Primitive, TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { computed } from 'vue'

/**
 * 无头 Button —— 全仓按钮统一出口（基于 reka-ui Primitive.button）。
 * - 仅 header 体系提供 variant 语法糖（自动补 header-btn 基础类）。
 * - 其余所有按钮用 class 透传即可（如 <Button class="cmp-close">），外观不变。
 * - 原生按钮的全部 $attrs（type / disabled / @click…）均透传给 Primitive。
 * - 提供 tip 时自带 reka Tooltip；TooltipRoot 不渲染额外 DOM，不影响布局。
 */
const HEADER_VARIANTS: Record<string, string> = {
  primary: 'header-btn header-btn--primary',
  ghost: 'header-btn header-btn--ghost',
  danger: 'header-btn header-btn--danger',
  ai: 'header-btn header-btn--ai',
  agent: 'header-btn header-btn--agent',
  more: 'header-btn header-btn--more',
}

const props = withDefaults(
  defineProps<{
    /** header 体系变体；其余按钮留空，用 class 透传 */
    variant?: string
    /** 激活态（如当前选中的面板开关） */
    active?: boolean
    /** 渲染元素/组件，默认原生 button（headless） */
    as?: string
    /** 悬浮提示文本；提供后按钮自带 reka Tooltip（替代原生 title） */
    tip?: string
    /** 提示气泡方向 */
    tipSide?: 'top' | 'right' | 'bottom' | 'left'
  }>(),
  {
    variant: '',
    active: false,
    as: 'button',
    tip: '',
    tipSide: 'top',
  },
)

const rootClass = computed(() => {
  const v = HEADER_VARIANTS[props.variant ?? '']
  if (v) return [v, { 'is-active': props.active }]
  return [] // 纯无头：靠 class 透传
})
</script>

<template>
  <TooltipRoot v-if="tip" :delay-duration="300">
    <TooltipTrigger as-child>
      <Primitive :as="as" :class="rootClass" v-bind="$attrs">
        <slot />
      </Primitive>
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent class="ui-tip" :side="tipSide" :side-offset="6">
        {{ tip }}
        <TooltipArrow class="ui-tip-arrow" :width="10" :height="5" />
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
  <Primitive v-else :as="as" :class="rootClass" v-bind="$attrs">
    <slot />
  </Primitive>
</template>
