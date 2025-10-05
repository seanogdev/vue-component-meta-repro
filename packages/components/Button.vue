<script setup lang="ts">
import type { PropType } from 'vue';

defineProps({
  /** The button label */
  label: {
    type: String,
    required: true,
  },
  /** Whether the button is disabled */
  disabled: {
    type: Boolean,
    default: false,
  },
  /** Button size */
  size: {
    type: String as PropType<'sm' | 'md' | 'lg'>,
    default: 'md',
  },
});

const count = defineModel<number>({
  type: Number,
  default: 0,
});
</script>

<template>
  <button :disabled="disabled">
    {{ label }} - {{ count }}
  </button>
</template>
